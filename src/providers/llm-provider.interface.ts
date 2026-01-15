import { ChatMessage, ChatCompletionOptions } from '../types';

/**
 * Interface for LLM providers used in code generation
 */
export interface LLMProvider {
  /**
   * Check if the provider is properly configured with API keys
   */
  isConfigured(): boolean;

  /**
   * Create a chat completion (non-streaming)
   * @param messages - Array of chat messages (system, user, assistant)
   * @param options - Completion options (model, temperature, etc.)
   * @returns The generated text content
   */
  createChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<string>;

  /**
   * Create a streaming chat completion
   * @param messages - Array of chat messages (system, user, assistant)
   * @param options - Completion options (model, temperature, etc.)
   * @param onChunk - Callback for each chunk of generated text
   * @returns The complete generated text content
   */
  createChatCompletionStream(
    messages: ChatMessage[],
    options: ChatCompletionOptions,
    onChunk: (chunk: string) => void
  ): Promise<string>;
}

/**
 * Configuration for LLM providers
 */
export interface LLMProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
