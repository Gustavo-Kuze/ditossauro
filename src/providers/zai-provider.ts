import { LLMProvider, LLMProviderConfig } from './llm-provider.interface';
import { ChatMessage, ChatCompletionOptions } from '../types';

/**
 * Z AI GLM provider implementation for code generation
 * Uses Z AI's Coding Plan API (OpenAI-compatible)
 */
export class ZAIProvider implements LLMProvider {
  private apiKey: string;
  private readonly apiEndpoint = 'https://api.z.ai/api/coding/paas/v4';

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey || '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async createChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Z AI API key not configured. Please set your API key.');
    }

    try {
      console.log(`🤖 Calling Z AI API with model: ${options.model}`);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: options.model,
          messages: messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Z AI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('❌ Z AI API error:', error);
      this.handleZAIError(error);
      throw error;
    }
  }

  async createChatCompletionStream(
    messages: ChatMessage[],
    options: ChatCompletionOptions,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Z AI API key not configured. Please set your API key.');
    }

    try {
      console.log(`🤖 Calling Z AI API (streaming) with model: ${options.model}`);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: options.model,
          messages: messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Z AI API error (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response stream reader');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Parse SSE format: data: {...}\n\n
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              // Skip malformed JSON chunks
              console.warn('Failed to parse Z AI stream chunk:', e);
            }
          }
        }
      }

      return fullContent;
    } catch (error: any) {
      console.error('❌ Z AI API error (streaming):', error);
      this.handleZAIError(error);
      throw error;
    }
  }

  private handleZAIError(error: any): void {
    if (error.message?.includes('401')) {
      throw new Error('Invalid Z AI API key. Please check your credentials.');
    } else if (error.message?.includes('429')) {
      throw new Error('Z AI API rate limit exceeded. Please try again later.');
    } else if (error?.message) {
      throw new Error(`Z AI API error: ${error.message}`);
    } else {
      throw new Error('Unknown error occurred during Z AI API call');
    }
  }
}
