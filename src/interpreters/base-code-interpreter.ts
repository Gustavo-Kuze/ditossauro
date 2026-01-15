import { LLMProvider } from '../providers/llm-provider.interface';
import { ChatMessage } from '../types';

export abstract class BaseCodeInterpreter {
  protected provider: LLMProvider;
  protected completionOptions: {
    model: string;
    temperature: number;
    maxTokens: number;
  };

  constructor(
    provider: LLMProvider,
    completionOptions: { model: string; temperature: number; maxTokens: number }
  ) {
    this.provider = provider;
    this.completionOptions = completionOptions;
  }

  protected abstract getSystemPrompt(): string;

  /**
   * Strips markdown code block formatting from the result
   * Removes ```language and ``` wrappers
   */
  protected stripMarkdownCodeBlocks(text: string): string {
    if (!text) return text;

    // Remove opening code block with language identifier (e.g., ```javascript)
    let cleaned = text.replace(/^```\w*\s*\n?/gm, '');

    // Remove closing code block (```)
    cleaned = cleaned.replace(/\n?```\s*$/gm, '');

    // Also handle inline code blocks (single backticks) if the entire response is wrapped
    if (cleaned.startsWith('`') && cleaned.endsWith('`') && !cleaned.includes('\n')) {
      cleaned = cleaned.slice(1, -1);
    }

    return cleaned.trim();
  }

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  async interpretCode(transcribedText: string): Promise<string> {
    if (!this.provider.isConfigured()) {
      throw new Error('Code generation provider not configured. Please set your API key.');
    }

    if (!transcribedText || transcribedText.trim() === '') {
      return '';
    }

    try {
      console.log(`🤖 Interpreting code: "${transcribedText}"`);

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: transcribedText
        }
      ];

      const rawResult = await this.provider.createChatCompletion(messages, {
        ...this.completionOptions,
        stream: false
      });

      const result = this.stripMarkdownCodeBlocks(rawResult);
      console.log(`✅ Code interpretation result: "${result}"`);

      return result.trim();
    } catch (error: any) {
      console.error('❌ Code interpretation error:', error);
      throw error; // Provider handles specific error messages
    }
  }

  async interpretCodeStreaming(
    transcribedText: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    if (!this.provider.isConfigured()) {
      throw new Error('Code generation provider not configured. Please set your API key.');
    }

    if (!transcribedText || transcribedText.trim() === '') {
      return '';
    }

    try {
      console.log(`🤖 Interpreting code (streaming): "${transcribedText}"`);

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: transcribedText
        }
      ];

      const fullContent = await this.provider.createChatCompletionStream(
        messages,
        {
          ...this.completionOptions,
          stream: true
        },
        onChunk
      );

      const result = this.stripMarkdownCodeBlocks(fullContent);
      console.log(`✅ Code interpretation result: "${result}"`);

      return result.trim();
    } catch (error: any) {
      console.error('❌ Code interpretation error (streaming):', error);
      throw error;
    }
  }
}
