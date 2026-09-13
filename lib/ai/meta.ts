import { AIProvider, AIMessage, AIRequestOptions } from './types';
import { VIDYAARAA_SYSTEM_PROMPT } from './systemPrompt';

function getMetaApiKey(): string | null {
  const direct =
    process.env.META_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.META_MODEL_API_KEY ||
    process.env.API_KEY;
  if (direct) {
    return direct.replace(/^["']|["']$/g, '').trim();
  }
  for (const [_, val] of Object.entries(process.env)) {
    if (typeof val === 'string') {
      const clean = val.replace(/^["']|["']$/g, '').trim();
      if (clean.startsWith('LLM_')) return clean;
    }
  }
  return 'LLM_1794481081565778_uuxsQeTFe-rinarlgNRE143e3x4';
}

export class MetaProvider implements AIProvider {
  name = 'Meta';
  private apiKey: string | null = null;
  private baseUrl: string;

  constructor() {
    this.apiKey = getMetaApiKey();
    this.baseUrl = process.env.META_BASE_URL || 'https://api.meta.ai/v1';
  }

  async *streamChat(
    messages: AIMessage[],
    options?: AIRequestOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      throw new Error('META_API_KEY or LLM_API_KEY is missing');
    }

    const model = options?.model || process.env.META_MODEL || 'muse-spark-1.3';

    const formattedMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
    if (!messages.some((m) => m.role === 'system')) {
      formattedMessages.push({ role: 'system', content: VIDYAARAA_SYSTEM_PROMPT });
    }

    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: true,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Meta API error (${response.status}): ${errorText || response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received from Meta API');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') return;

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Ignore partial parse errors
          }
        }
      }
    }

    if (buffer.trim().startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
      try {
        const data = JSON.parse(buffer.trim().slice(6));
        const content = data.choices?.[0]?.delta?.content;
        if (content) {
          yield content;
        }
      } catch {
        // Ignore
      }
    }
  }
}
