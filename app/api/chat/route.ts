import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_CHARS = 4_000;
const MAX_HISTORY_MESSAGES = 6; // Three user/assistant turns
const MAX_IMAGE_BASE64_CHARS = 3_600_000;
const MAX_BODY_BYTES = 4_300_000;

const SYSTEM_PROMPT = `You are Vidyaaraa AI, a direct academic copilot for VTU engineering students.

When an image of a question, notebook page, or diagram is provided, identify the core problem and deliver a structured, step-by-step solution.

Keep answers concise, clear, and formatted using clean markdown headings and numbered steps. Eliminate unnecessary conversational filler.

For numerical problems, show the relevant formula, substitutions, calculation, units, and final answer. For circuit diagrams, explain the visible connections and state any assumptions. If an image is unclear, explicitly say what cannot be read rather than inventing information.

Answer educational questions accurately. If a question depends on missing information, ask only for the essential clarification.`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-build-evaluation",
  maxRetries: 1,
  timeout: 45_000,
});

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  message: string;
  messages?: HistoryMessage[];
  image?: string | null; // Complete image data URL
};

const encoder = new TextEncoder();

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseImage(dataUrl: unknown) {
  if (dataUrl == null) return null;

  if (
    typeof dataUrl !== "string" ||
    dataUrl.length > MAX_IMAGE_BASE64_CHARS
  ) {
    throw new Error("Image payload is too large.");
  }

  const match = dataUrl.match(
    /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]*={0,2})$/
  );

  if (!match || !match[2]) {
    throw new Error("Upload a valid JPEG, PNG, WebP, or GIF image.");
  }

  const [, mimeType, base64] = match;

  // Reject malformed base64 before sending upstream
  if (
    base64.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      base64
    )
  ) {
    throw new Error("The image encoding is invalid.");
  }

  const estimatedBytes = Math.floor((base64.length * 3) / 4);

  if (estimatedBytes > 2_700_000) {
    throw new Error("The compressed image exceeds the request limit.");
  }

  return { mimeType, base64 };
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return jsonError("The AI service is not configured. Missing OPENAI_API_KEY.", 500);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > MAX_BODY_BYTES) {
    return jsonError("Request too large. Please use a smaller image.", 413);
  }

  let payload: ChatRequest;

  try {
    const raw: unknown = await request.json();

    if (!isRecord(raw)) {
      return jsonError("Invalid request body.", 400);
    }

    if (
      typeof raw.message !== "string" ||
      raw.message.length > MAX_MESSAGE_CHARS ||
      (raw.message.trim().length === 0 && raw.image == null)
    ) {
      return jsonError(
        "Enter a question or attach an image. Messages must be at most 4,000 characters.",
        400
      );
    }

    if (
      raw.messages !== undefined &&
      (!Array.isArray(raw.messages) || raw.messages.length > 100)
    ) {
      return jsonError("Invalid conversation history.", 400);
    }

    payload = {
      message: raw.message,
      messages: (raw.messages ?? []) as HistoryMessage[],
      image: (raw.image ?? null) as string | null,
    };
  } catch {
    return jsonError("Invalid JSON request.", 400);
  }

  let image: ReturnType<typeof parseImage>;

  try {
    image = parseImage(payload.image);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Invalid image.",
      400
    );
  }

  // Only allow plain-text user and assistant messages in history
  const history = payload.messages ?? [];

  for (const item of history) {
    if (
      !isRecord(item) ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      item.content.length > MAX_MESSAGE_CHARS
    ) {
      return jsonError("Invalid conversation history.", 400);
    }
  }

  // Keep the last three prior turns (6 messages). Current message is separate.
  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...recentHistory.map((item) => ({
      role: item.role,
      content: item.content,
    })),
    {
      role: "user",
      content: image
        ? [
            {
              type: "text" as const,
              text: payload.message.trim() || "Solve the question in this image.",
            },
            {
              type: "image_url" as const,
              image_url: {
                url: `data:${image.mimeType};base64,${image.base64}`,
                detail: "low" as const,
              },
            },
          ]
        : payload.message.trim(),
    },
  ];

  let upstream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

  try {
    upstream = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages,
        stream: true,
        max_tokens: 800,
        temperature: 0.3,
        n: 1,
      },
      { signal: request.signal }
    );
  } catch (error) {
    if (request.signal.aborted) {
      return new Response(null, { status: 499 });
    }

    console.error(
      "Vidyaaraa AI upstream request failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return jsonError("Vidyaaraa AI could not start a response. Please retry.", 502);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          )
        );
      };

      try {
        for await (const chunk of upstream) {
          if (request.signal.aborted) break;

          const text = chunk.choices[0]?.delta?.content;

          if (typeof text === "string" && text.length > 0) {
            send("delta", { text });
          }
        }

        if (!request.signal.aborted) {
          send("done", { ok: true });
          controller.close();
        }
      } catch (error) {
        if (!request.signal.aborted) {
          console.error(
            "Vidyaaraa AI stream failed:",
            error instanceof Error ? error.message : "Unknown error"
          );

          send("error", {
            message: "The response was interrupted. Please try again.",
          });

          controller.close();
        }
      }
    },
    cancel() {
      // The client disconnected
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
