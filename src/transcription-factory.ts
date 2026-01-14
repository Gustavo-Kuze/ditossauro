import { ITranscriptionProvider, TranscriptionProviderType, AssemblyAIConfig, GroqConfig } from './transcription-provider';
import { AssemblyAIClient } from './assemblyai-client';
import { GroqClient } from './groq-client';

/**
 * Factory to create transcription provider instances
 */
export class TranscriptionFactory {
  /**
   * Creates a transcription provider based on the specified type
   */
  static createProvider(
    type: TranscriptionProviderType,
    config?: AssemblyAIConfig | GroqConfig
  ): ITranscriptionProvider {
    switch (type) {
      case 'assemblyai': {
        const assemblyConfig = config as AssemblyAIConfig;
        return new AssemblyAIClient(assemblyConfig?.apiKey || '');
      }

      case 'groq': {
        const groqConfig = config as GroqConfig;
        return new GroqClient(groqConfig);
      }

      default:
        throw new Error(`Transcription provider not supported: ${type}`);
    }
  }

  /**
   * Lists all available providers
   */
  static getAvailableProviders(): { type: TranscriptionProviderType; name: string; description: string }[] {
    return [
      {
        type: 'groq',
        name: 'Groq',
        description: 'Transcrição em nuvem ultra-rápida usando Whisper Large V3'
      },
      {
        type: 'assemblyai',
        name: 'AssemblyAI',
        description: 'Serviço de transcrição em nuvem com alta precisão'
      }
    ];
  }

  /**
   * Returns the default settings for a provider
   */
  static getDefaultConfig(type: TranscriptionProviderType): AssemblyAIConfig | GroqConfig {
    switch (type) {
      case 'assemblyai': {
        return {
          apiKey: ''
        } as AssemblyAIConfig;
      }

      case 'groq': {
        return {
          apiKey: '',
          modelName: 'whisper-large-v3',
          language: '' // Empty for auto-detect
        } as GroqConfig;
      }

      default:
        throw new Error(`Provider not supported: ${type}`);
    }
  }
}
