"use client";

import {
  FormEvent,
  KeyboardEvent,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Camera,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Send,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
};

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_DATA_URL_CHARS = 3_600_000;

const SUGGESTIONS = [
  "Explain ACID properties in DBMS briefly with examples",
  "Solve this numerical VTU question step by step",
  "What is Dijkstra's algorithm and how does it work?",
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Compress a selected photo before base64 transport.
 * The original file limit is 4 MB, but the outgoing payload
 * is kept smaller to accommodate base64 + JSON overhead.
 */
async function imageToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image must be 4 MB or smaller.");
  }

  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }

  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image could not be opened. Try another photo.");
  }

  try {
    const maxDimension = 1600;
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height)
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Image processing is unavailable in this browser.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    // Target ~2.6 MB binary, leaving room for base64 and JSON.
    for (const quality of [0.86, 0.76, 0.66, 0.56, 0.46]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);

      if (dataUrl.length <= MAX_DATA_URL_CHARS) {
        return dataUrl;
      }
    }

    throw new Error(
      "This image is too detailed to upload. Try a smaller photo."
    );
  } finally {
    bitmap.close();
  }
}

export default function VidyaaraaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleFile(file?: File) {
    if (!file) return;

    if (isStreaming || isProcessingImage) return;

    setError(null);
    setIsProcessingImage(true);

    try {
      const dataUrl = await imageToDataUrl(file);
      setImage(dataUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not process this image."
      );
    } finally {
      setIsProcessingImage(false);

      if (cameraRef.current) cameraRef.current.value = "";
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();

    const question = input.trim();

    if (
      isStreaming ||
      isProcessingImage ||
      (!question && !image)
    ) {
      return;
    }

    const attachedImage = image;
    const userText = question || "Solve the question in this image.";
    const userId = makeId();
    const assistantId = makeId();

    const previousMessages = messages
      .filter((item) => item.content.trim().length > 0)
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    const userMessage: ChatMessage = {
      id: userId,
      role: "user",
      content: userText,
      image: attachedImage ?? undefined,
    };

    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((current) => [
      ...current,
      userMessage,
      assistantMessage,
    ]);

    setInput("");
    setImage(null);
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: question,
          messages: previousMessages,
          image: attachedImage,
        }),
      });

      if (!response.ok) {
        let message = `Request failed (${response.status}).`;

        try {
          const data = await response.json();
          if (typeof data.error === "string") {
            message = data.error;
          }
        } catch {
          // Keep fallback message
        }

        throw new Error(message);
      }

      if (!response.body) {
        throw new Error("Streaming is not supported by this response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamFailed = false;
      let receivedText = false;

      const appendText = (text: string) => {
        receivedText = true;

        setMessages((current) =>
          current.map((item) =>
            item.id === assistantId
              ? { ...item, content: item.content + text }
              : item
          )
        );

        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: "auto" });
        });
      };

      const handleEvent = (block: string) => {
        let eventName = "message";
        const dataLines: string[] = [];

        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart());
          }
        }

        if (dataLines.length === 0) return;

        try {
          const data = JSON.parse(dataLines.join("\n"));

          if (eventName === "delta" && typeof data.text === "string") {
            appendText(data.text);
          } else if (eventName === "error") {
            streamFailed = true;
            setError(data.message || "The response was interrupted.");
          }
        } catch {
          streamFailed = true;
          setError("Could not read the AI response stream.");
        }
      };

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");

        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          if (block.trim()) handleEvent(block);
        }
      }

      buffer += decoder.decode();

      if (buffer.trim()) {
        handleEvent(buffer);
      }

      if (streamFailed) {
        // Keep any text already received
      } else if (!receivedText) {
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantId
              ? {
                  ...item,
                  content: "I couldn't generate a response. Please try again.",
                }
              : item
          )
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      setError(message);

      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId && !item.content
            ? { ...item, content: "I couldn't complete that request." }
            : item
        )
      );
    } finally {
      setIsStreaming(false);
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <main className="flex h-[100dvh] min-h-[480px] flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Sparkles size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-semibold tracking-tight text-base sm:text-lg text-slate-900 dark:text-slate-100">
            Vidyaaraa AI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your VTU engineering academic copilot · gpt-4o-mini
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
          Text + Photo
        </span>
      </header>

      {/* Conversation */}
      <section
        aria-label="Chat messages"
        aria-live="polite"
        className="flex-1 overflow-y-auto"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
          {messages.length === 0 && (
            <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <MessageCircle size={32} />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Learn smarter with Vidyaaraa AI
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Ask an engineering question or photograph a handwritten notebook problem. Get structured, step-by-step solutions.
              </p>

              <div className="mt-6 grid w-full max-w-lg gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex min-w-0 gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm">
                  V
                </div>
              )}

              <div
                className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-[80%] ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attached question"
                    className="mb-3 max-h-64 max-w-full rounded-lg object-contain bg-black/10 dark:bg-white/5 p-1"
                  />
                )}

                {message.role === "assistant" ? (
                  message.content ? (
                    <div className="prose prose-sm max-w-none break-words dark:prose-invert prose-pre:overflow-x-auto prose-pre:rounded-lg prose-code:break-words prose-table:block prose-table:overflow-x-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : isStreaming ? (
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <LoaderCircle size={16} className="animate-spin text-indigo-500" />
                      Thinking...
                    </span>
                  ) : null
                ) : (
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
              </div>
            </article>
          ))}

          <div ref={bottomRef} />
        </div>
      </section>

      {/* Composer */}
      <footer className="shrink-0 border-t border-slate-200 bg-white px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {image && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
              <img
                src={image}
                alt="Image attachment preview"
                className="h-16 w-16 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Photo attached</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  One image · Low detail mode (~85 tokens) · Ready to send
                </p>
              </div>

              <button
                type="button"
                aria-label="Remove attached image"
                disabled={isStreaming}
                onClick={() => setImage(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-50 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900"
            >
              <span className="flex-1">{error}</span>
              <button
                type="button"
                aria-label="Dismiss error"
                onClick={() => setError(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 transition-colors"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Vidyaaraa AI anything or photograph a question..."
              aria-label="Your question"
              rows={2}
              maxLength={4000}
              disabled={isStreaming}
              className="max-h-36 min-h-[52px] w-full resize-y bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400 disabled:opacity-60 text-slate-900 dark:text-slate-100"
            />

            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <div className="flex items-center gap-1">
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-label="Capture a photo"
                  className="hidden"
                  onChange={(event) => void handleFile(event.target.files?.[0])}
                />

                <input
                  ref={uploadRef}
                  type="file"
                  accept="image/*"
                  aria-label="Choose an image"
                  className="hidden"
                  onChange={(event) => void handleFile(event.target.files?.[0])}
                />

                <button
                  type="button"
                  title="Take a photo with camera"
                  aria-label="Take a photo of a question"
                  disabled={isStreaming || isProcessingImage}
                  onClick={() => cameraRef.current?.click()}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Camera size={20} />
                </button>

                <button
                  type="button"
                  title="Upload an image"
                  aria-label="Upload an image"
                  disabled={isStreaming || isProcessingImage}
                  onClick={() => uploadRef.current?.click()}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {isProcessingImage ? (
                    <LoaderCircle size={20} className="animate-spin text-indigo-500" />
                  ) : (
                    <ImagePlus size={20} />
                  )}
                </button>

                {image && (
                  <button
                    type="button"
                    title="Delete attached photo"
                    aria-label="Delete attached photo"
                    disabled={isStreaming}
                    onClick={() => setImage(null)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                <span className="hidden text-xs text-slate-400 sm:inline ml-1 font-mono">
                  1 photo · Max 4 MB
                </span>
              </div>

              <button
                type="submit"
                disabled={
                  isStreaming ||
                  isProcessingImage ||
                  (!input.trim() && !image)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
              >
                {isStreaming ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    <span>Thinking</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-2 text-center text-[11px] text-slate-400">
            Verify academic formulas and answers. Built for VTU engineering students.
          </p>
        </div>
      </footer>
    </main>
  );
}
