import { AIProvider, AIMessage, AIRequestOptions } from './types';
import { MetaProvider } from './meta';
import { GroqProvider } from './groq';
import { GeminiProvider } from './gemini';

export function getPrimaryProvider(): AIProvider {
  if (process.env.META_API_KEY || process.env.LLM_API_KEY || process.env.META_MODEL_API_KEY) {
    return new MetaProvider();
  }
  if (process.env.GROQ_API_KEY) {
    return new GroqProvider();
  }
  return new GeminiProvider();
}

export function getFallbackProvider(): AIProvider {
  // If primary was Meta, fallback to Groq if available, then Gemini
  if (process.env.META_API_KEY || process.env.LLM_API_KEY || process.env.META_MODEL_API_KEY) {
    if (process.env.GROQ_API_KEY) {
      return new GroqProvider();
    }
  }
  return new GeminiProvider();
}

export async function* streamChatWithFallback(
  messages: AIMessage[],
  options?: AIRequestOptions
): AsyncGenerator<string, void, unknown> {
  const primaryProvider = getPrimaryProvider();
  const fallbackProvider = getFallbackProvider();

  let startedStreaming = false;

  try {
    const stream = primaryProvider.streamChat(messages, options);
    for await (const chunk of stream) {
      startedStreaming = true;
      yield chunk;
    }
  } catch (primaryError: any) {
    console.warn(`[Vidyaaraa AI] ${primaryProvider.name} primary provider failed:`, primaryError?.message || primaryError);

    if (startedStreaming) {
      // Stream already partially sent, output error message gracefully
      yield '\n\n[Vidyaaraa AI Stream interrupted]';
      return;
    }

    try {
      console.log(`[Vidyaaraa AI] Executing ${fallbackProvider.name} fallback...`);
      const fallbackStream = fallbackProvider.streamChat(messages, options);
      for await (const chunk of fallbackStream) {
        yield chunk;
      }
    } catch (fallbackError: any) {
      console.error(`[Vidyaaraa AI] ${fallbackProvider.name} fallback also failed:`, fallbackError?.message || fallbackError);
      throw new Error('Vidyaaraa AI is temporarily unavailable. Please try again.');
    }
  }
}
