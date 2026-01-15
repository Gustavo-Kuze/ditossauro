import Groq from 'groq-sdk';
import { LLMProvider, LLMProviderConfig } from './llm-provider.interface';
import { ChatMessage, ChatCompletionOptions } from '../types';

/**
 * Groq LLM provider implementation for code generation
 */
export class GroqProvider implements LLMProvider {
  private client: Groq | null = null;
  private apiKey: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey || '';
    if (this.apiKey) {
      this.client = new Groq({ apiKey: this.apiKey });
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey.length > 0;
  }

  async createChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Groq client not configured. Please set your API key.');
    }

    try {
      console.log(`🤖 Calling Groq API with model: ${options.model}`);

      const chatCompletion = await this.client.chat.completions.create({
        messages: messages as any, // Groq SDK types are compatible
        model: options.model,
        temperature: options.temperature,
        max_completion_tokens: options.maxTokens,
        top_p: 1,
        stream: false,
        stop: null
      });

      return chatCompletion.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('❌ Groq API error:', error);
      this.handleGroqError(error);
      throw error;
    }
  }

  async createChatCompletionStream(
    messages: ChatMessage[],
    options: ChatCompletionOptions,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Groq client not configured. Please set your API key.');
    }

    try {
      console.log(`🤖 Calling Groq API (streaming) with model: ${options.model}`);

      const chatCompletion = await this.client.chat.completions.create({
        messages: messages as any,
        model: options.model,
        temperature: options.temperature,
        max_completion_tokens: options.maxTokens,
        top_p: 1,
        stream: true,
        stop: null
      });

      let fullContent = '';
      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      }

      return fullContent;
    } catch (error: any) {
      console.error('❌ Groq API error (streaming):', error);
      this.handleGroqError(error);
      throw error;
    }
  }

  private handleGroqError(error: any): void {
    if (error?.status === 401) {
      throw new Error('Invalid Groq API key. Please check your credentials.');
    } else if (error?.status === 429) {
      throw new Error('Groq API rate limit exceeded. Please try again later.');
    } else if (error?.message) {
      throw new Error(`Groq API error: ${error.message}`);
    } else {
      throw new Error('Unknown error occurred during Groq API call');
    }
  }
}
