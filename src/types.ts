export interface TranscriptionSession {
  id: string;
  timestamp: Date;
  audioFile?: Buffer;
  transcription: string;
  duration: number;
  language: string;
  confidence: number;
}

export type HotkeyMode = 'toggle' | 'push-to-talk';

export interface HotkeyConfig {
  keys: string[]; // Array de teclas (ex: ['Control', 'Meta'] para Ctrl+Windows)
  mode: HotkeyMode; // 'toggle' para alternar com uma pressão, 'push-to-talk' para gravar enquanto pressionado
}

export interface AppSettings {
  locale: string; // Language locale (e.g., 'pt-BR', 'en')
  hotkeys: {
    startStop: HotkeyConfig;
    codeSnippet: HotkeyConfig;
    cancel: string; // Kept as string for compatibility
  };
  audio: {
    deviceId: string;
    sampleRate: number;
  };
  api: {
    assemblyAiKey: string;
    groqApiKey: string;
    language: string;
  };
  transcription: {
    provider: 'assemblyai' | 'faster-whisper' | 'groq';
    fasterWhisper: {
      modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'large-v2' | 'large-v3';
      device: 'cpu' | 'cuda';
      computeType: 'int8' | 'int8_float16' | 'int16' | 'float16' | 'float32';
      pythonPath: string;
    };
    groq: {
      modelName: 'whisper-large-v3' | 'whisper-large-v3-turbo';
      language: string; // Empty string for auto-detect, or ISO code like 'pt', 'en'
    };
  };
  behavior: {
    autoInsert: boolean;
    showConfirmation: boolean;
    useClipboard: boolean; // Use clipboard for quick insertion or traditional typing
    startMinimized: boolean;
  };
}

export interface RecordingState {
  isRecording: boolean;
  startTime?: Date;
  audioBuffer?: Buffer[];
}

export type CodeLanguage = 'bash' | 'javascript' | 'typescript' | 'python';

export interface VoiceCommandResult {
  language: CodeLanguage;
  strippedTranscription: string;
  detectedKeyword?: string;
}

// AssemblyAIResponse removed - now using official SDK types
