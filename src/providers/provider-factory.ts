import { AppSettings } from '../types';
import { LLMProvider } from './llm-provider.interface';
import { GroqProvider } from './groq-provider';
import { ZAIProvider } from './zai-provider';

/**
 * Factory for creating LLM providers based on app settings
 */
export class ProviderFactory {
  /**
   * Creates an LLM provider based on app settings
   */
  static createProvider(settings: AppSettings): LLMProvider {
    const provider = settings.codeGeneration?.provider || 'groq'; // Default to groq for backwards compatibility

    switch (provider) {
      case 'groq': {
        return new GroqProvider({
          apiKey: settings.api.groqApiKey
        });
      }

      case 'zai': {
        return new ZAIProvider({
          apiKey: settings.api.zaiApiKey
        });
      }

      default:
        throw new Error(`Unsupported code generation provider: ${provider}`);
    }
  }

  /**
   * Get chat completion options from settings based on selected provider
   */
  static getCompletionOptions(settings: AppSettings): {
    model: string;
    temperature: number;
    maxTokens: number;
  } {
    const provider = settings.codeGeneration?.provider || 'groq';

    if (provider === 'groq') {
      return {
        model: settings.codeGeneration?.groq?.model || 'moonshotai/kimi-k2-instruct-0905',
        temperature: 0.6,
        maxTokens: 4096
      };
    } else if (provider === 'zai') {
      return {
        model: settings.codeGeneration?.zai?.model || 'GLM-4.7',
        temperature: settings.codeGeneration?.zai?.temperature || 1.0,
        maxTokens: settings.codeGeneration?.zai?.maxTokens || 4096
      };
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }
}
