import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { streamChatWithFallback } from '@/lib/ai/factory';
import { AIMessage } from '@/lib/ai/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Vidyaaraa AI, a direct academic copilot for VTU engineering students.
Deliver structured, step-by-step solutions for VTU engineering subjects, formulas, coding, and exam questions.
Keep answers concise, clear, and formatted using clean markdown headings, bold terms, and numbered steps. Eliminate unnecessary conversational filler.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMessages: AIMessage[] = body.messages || [];

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Context limit: keep system messages and max last 8 non-system messages to prevent latency & token bloat
    const systemMessages = rawMessages.filter((m) => m.role === 'system');
    const recentMessages = rawMessages.filter((m) => m.role !== 'system').slice(-8);

    const formattedMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (systemMessages.length > 0) {
      formattedMessages.push({ role: 'system', content: systemMessages[0].content });
    } else {
      formattedMessages.push({ role: 'system', content: SYSTEM_PROMPT });
    }

    for (const m of recentMessages) {
      formattedMessages.push({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      });
    }

    const textEncoder = new TextEncoder();
    const apiKey = process.env.OPENAI_API_KEY;

    // 1. FAST PATH: OpenAI gpt-4o-mini (Sub-300ms first token, high reliability)
    if (apiKey && apiKey.startsWith('sk-')) {
      const openai = new OpenAI({ apiKey, timeout: 30_000 });

      try {
        const streamResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: formattedMessages,
          stream: true,
          max_tokens: 800,
          temperature: 0.3,
        });

        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of streamResponse) {
                const text = chunk.choices[0]?.delta?.content || '';
                if (text) {
                  controller.enqueue(textEncoder.encode(text));
                }
              }
              controller.close();
            } catch (streamErr: any) {
              console.error('[OpenAI Stream Error]:', streamErr?.message || streamErr);
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          },
        });
      } catch (openAiErr: any) {
        console.warn('[OpenAI gpt-4o-mini Error, falling back]:', openAiErr?.message || openAiErr);
      }
    }

    // 2. FALLBACK PATH: Existing factory provider (Groq / Gemini)
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamChatWithFallback(rawMessages);
          for await (const chunk of generator) {
            controller.enqueue(textEncoder.encode(chunk));
          }
          controller.close();
        } catch (err: any) {
          console.error('[API /api/ai/chat] Streaming error:', err?.message || err);
          const safeMessage = 'Vidyaaraa AI is temporarily unavailable. Please try again.';
          controller.enqueue(textEncoder.encode(`\n\n${safeMessage}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[API /api/ai/chat] Request failed:', error?.message || error);
    return NextResponse.json(
      { error: 'Vidyaaraa AI is temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
