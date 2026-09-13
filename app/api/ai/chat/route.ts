import { NextRequest, NextResponse } from 'next/server';
import { streamChatWithFallback } from '@/lib/ai/factory';
import { AIMessage } from '@/lib/ai/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMessages: AIMessage[] = body.messages || [];

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Context limit: keep system messages and max last 10 non-system messages to prevent token explosion
    const systemMessages = rawMessages.filter((m) => m.role === 'system');
    const recentMessages = rawMessages.filter((m) => m.role !== 'system').slice(-10);
    const messages = [...systemMessages, ...recentMessages];

    const textEncoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamChatWithFallback(messages);
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
        'Content-Type': 'text/event-stream; charset=utf-8',
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
