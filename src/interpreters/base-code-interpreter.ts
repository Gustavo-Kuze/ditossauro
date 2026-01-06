import Groq from 'groq-sdk';

export abstract class BaseCodeInterpreter {
  protected client: Groq | null = null;
  protected apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey || '';

    if (this.apiKey) {
      this.client = new Groq({
        apiKey: this.apiKey,
      });
    }
  }

  protected abstract getSystemPrompt(): string;

  isConfigured(): boolean {
    return this.client !== null && this.apiKey.length > 0;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    if (this.apiKey) {
      this.client = new Groq({ apiKey: this.apiKey });
    }
  }

  async interpretCode(transcribedText: string): Promise<string> {
    if (!this.client) {
      throw new Error('Groq client not configured. Please set your API key.');
    }

    if (!transcribedText || transcribedText.trim() === '') {
      return '';
    }

    try {
      console.log(`🤖 Interpreting code with Groq: "${transcribedText}"`);

      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: transcribedText
          }
        ],
        model: 'moonshotai/kimi-k2-instruct-0905',
        temperature: 0.6,
        max_completion_tokens: 4096,
        top_p: 1,
        stream: false,
        stop: null
      });

      const result = chatCompletion.choices[0]?.message?.content || transcribedText;
      console.log(`✅ Code interpretation result: "${result}"`);

      return result.trim();
    } catch (error: any) {
      console.error('❌ Groq code interpretation error:', error);

      // Handle specific Groq API errors
      if (error?.status === 401) {
        throw new Error('Invalid Groq API key. Please check your credentials.');
      } else if (error?.status === 429) {
        throw new Error('Groq API rate limit exceeded. Please try again later.');
      } else if (error?.message) {
        throw new Error(`Groq API error: ${error.message}`);
      } else {
        throw new Error('Unknown error occurred during Groq code interpretation');
      }
    }
  }

  async interpretCodeStreaming(
    transcribedText: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Groq client not configured. Please set your API key.');
    }

    if (!transcribedText || transcribedText.trim() === '') {
      return '';
    }

    try {
      console.log(`🤖 Interpreting code with Groq (streaming): "${transcribedText}"`);

      const chatCompletion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: transcribedText
          }
        ],
        model: 'moonshotai/kimi-k2-instruct-0905',
        temperature: 0.6,
        max_completion_tokens: 4096,
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

      console.log(`✅ Code interpretation result: "${fullContent}"`);
      return fullContent.trim();
    } catch (error: any) {
      console.error('❌ Groq code interpretation error:', error);

      // Handle specific Groq API errors
      if (error?.status === 401) {
        throw new Error('Invalid Groq API key. Please check your credentials.');
      } else if (error?.status === 429) {
        throw new Error('Groq API rate limit exceeded. Please try again later.');
      } else if (error?.message) {
        throw new Error(`Groq API error: ${error.message}`);
      } else {
        throw new Error('Unknown error occurred during Groq code interpretation');
      }
    }
  }
}
