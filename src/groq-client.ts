import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { ITranscriptionProvider, GroqConfig } from './transcription-provider';

export class GroqClient implements ITranscriptionProvider {
  private client: Groq | null = null;
  private apiKey: string;
  private language: string;
  private modelName: 'whisper-large-v3' | 'whisper-large-v3-turbo';

  constructor(config: GroqConfig) {
    this.apiKey = config.apiKey || '';
    this.language = config.language || ''; // Empty string for auto-detect
    this.modelName = config.modelName || 'whisper-large-v3';

    if (this.apiKey) {
      this.client = new Groq({
        apiKey: this.apiKey,
      });
    }
  }

  getProviderName(): string {
    return 'Groq (Whisper Large V3)';
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey.length > 0;
  }

  setConfig(config: Record<string, unknown>): void {
    if (config.apiKey) {
      this.apiKey = config.apiKey as string;
      this.client = new Groq({ apiKey: this.apiKey });
    }
    if (config.modelName) {
      this.modelName = config.modelName as 'whisper-large-v3' | 'whisper-large-v3-turbo';
    }
    if (config.language !== undefined) {
      this.language = config.language as string;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      console.error('Groq client not configured');
      return false;
    }

    try {
      // Create a minimal test audio file (silent WAV)
      const testAudioPath = path.join(process.cwd(), 'test-groq-audio.wav');

      // Create a minimal valid WAV file (1 second of silence at 16kHz)
      const sampleRate = 16000;
      const duration = 1; // 1 second
      const numSamples = sampleRate * duration;
      const numChannels = 1;
      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
      const blockAlign = numChannels * (bitsPerSample / 8);
      const dataSize = numSamples * numChannels * (bitsPerSample / 8);

      const buffer = Buffer.alloc(44 + dataSize);

      // WAV header
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + dataSize, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16); // fmt chunk size
      buffer.writeUInt16LE(1, 20); // audio format (PCM)
      buffer.writeUInt16LE(numChannels, 22);
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(byteRate, 28);
      buffer.writeUInt16LE(blockAlign, 32);
      buffer.writeUInt16LE(bitsPerSample, 34);
      buffer.write('data', 36);
      buffer.writeUInt32LE(dataSize, 40);
      // Audio data is already zero-filled (silence)

      fs.writeFileSync(testAudioPath, buffer);

      // Test transcription - build request object
      const testRequest: any = {
        file: fs.createReadStream(testAudioPath),
        model: this.modelName,
        response_format: 'json',
        temperature: 0,
      };

      // Only add language if it's specified (not empty string)
      if (this.language && this.language.trim() !== '') {
        testRequest.language = this.language;
      }

      const transcription = await this.client.audio.transcriptions.create(testRequest);

      // Clean up test file
      if (fs.existsSync(testAudioPath)) {
        fs.unlinkSync(testAudioPath);
      }

      console.log('✅ Groq connection test successful:', transcription);
      return true;
    } catch (error) {
      console.error('❌ Groq connection test failed:', error);

      // Clean up test file on error
      const testAudioPath = path.join(process.cwd(), 'test-groq-audio.wav');
      if (fs.existsSync(testAudioPath)) {
        fs.unlinkSync(testAudioPath);
      }

      return false;
    }
  }

  async transcribeAudio(audioFilePath: string, language?: string): Promise<import('./transcription-provider').TranscriptionResult> {
    if (language) {
      this.language = language;
    }
    return this.transcribe(audioFilePath);
  }

  private async transcribe(audioFilePath: string): Promise<import('./transcription-provider').TranscriptionResult> {
    if (!this.client) {
      throw new Error('Groq client not configured. Please set your API key.');
    }

    try {
      console.log(`🎤 Transcribing with Groq ${this.modelName}...`);
      console.log(`📁 Audio file: ${audioFilePath}`);

      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      // Get file stats
      const stats = fs.statSync(audioFilePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      console.log(`📦 File size: ${fileSizeMB.toFixed(2)} MB`);

      // Check file size limits
      if (fileSizeMB > 25) {
        throw new Error('File size exceeds Groq limit of 25 MB');
      }

      const startTime = Date.now();

      // Create transcription request
      const transcriptionRequest: any = {
        file: fs.createReadStream(audioFilePath),
        model: this.modelName,
        response_format: 'verbose_json',
        temperature: 0,
      };

      // Only add language if it's specified (not empty string)
      // Empty string means auto-detect
      if (this.language && this.language.trim() !== '') {
        transcriptionRequest.language = this.language;
        console.log(`🌐 Using language: ${this.language}`);
      } else {
        console.log('🌐 Using auto-detect language');
      }

      // Create transcription
      const transcription = await this.client.audio.transcriptions.create(transcriptionRequest);

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Transcription completed in ${elapsedTime}s`);

      if (!transcription.text || transcription.text.trim() === '') {
        console.warn('⚠️ Empty transcription received from Groq');
        return {
          text: '',
          language: this.language || 'en',
          confidence: 0,
          duration: 0,
        };
      }

      console.log(`📝 Transcription: ${transcription.text}`);

      // Extract metadata
      const detectedLanguage = ('language' in transcription && transcription.language) ? transcription.language as string : (this.language || 'en');
      const duration = ('duration' in transcription && transcription.duration) ? transcription.duration as number : 0;

      // Log additional metadata if available
      if (duration > 0) {
        console.log(`⏱️ Audio duration: ${duration}s`);
      }
      console.log(`🌐 Detected language: ${detectedLanguage}`);

      return {
        text: transcription.text.trim(),
        language: detectedLanguage,
        confidence: 0.95, // Groq doesn't provide confidence, use default
        duration: duration,
      };
    } catch (error: any) {
      console.error('❌ Groq transcription error:', error);

      // Handle specific Groq API errors
      if (error?.status === 401) {
        throw new Error('Invalid Groq API key. Please check your credentials.');
      } else if (error?.status === 429) {
        throw new Error('Groq API rate limit exceeded. Please try again later.');
      } else if (error?.status === 413) {
        throw new Error('Audio file too large. Maximum size is 25 MB.');
      } else if (error?.message) {
        throw new Error(`Groq API error: ${error.message}`);
      } else {
        throw new Error('Unknown error occurred during Groq transcription');
      }
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for Groq client
    console.log('🧹 Groq client cleanup complete');
  }
}
