/**
 * Abstract interface for transcription providers
 */
export interface ITranscriptionProvider {
  /**
   * Transcribes an audio file
   * @param audioFilePath Path to the audio file
   * @param language Language code (optional)
   * @returns Transcription result with text and detected language
   */
  transcribeAudio(audioFilePath: string, language?: string): Promise<TranscriptionResult>;

  /**
   * Tests the provider's connection/configuration
   * @returns true if the provider is working
   */
  testConnection(): Promise<boolean>;

  /**
   * Defines provider-specific settings
   * @param config Provider settings
   */
  setConfig(config: Record<string, unknown>): void;

  /**
   * Checks if the provider is configured correctly
   * @returns true if configured
   */
  isConfigured(): boolean;

  /**
   * Returns the provider name
   */
  getProviderName(): string;
}

/**
 * Detailed transcription result
 */
export interface TranscriptionResult {
  text: string;
  language: string;
  confidence?: number;
  duration?: number;
  segments?: TranscriptionSegment[];
}

/**
 * Individual transcription segment
 */
export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

/**
 * Settings for AssemblyAI
 */
export interface AssemblyAIConfig {
  apiKey: string;
}

/**
 * Settings for Groq
 */
export interface GroqConfig {
  apiKey: string;
  modelName?: 'whisper-large-v3' | 'whisper-large-v3-turbo';
  language?: string; // Empty string or undefined for auto-detect
}

/**
 * Types of available providers
 */
export type TranscriptionProviderType = 'assemblyai' | 'groq';
