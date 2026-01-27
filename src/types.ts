export interface TranscriptionSession {
  id: string;
  timestamp: Date;
  audioFile?: Buffer;
  transcription: string;
  duration: number;
  language: string;
  confidence: number;
  context?: string; // Selected text captured from focused application
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
    showFloatingWindow: boolean; // Show or hide the floating window
    notifyOnTranscription: boolean; // Show notifications when transcriptions are completed
    launchAtStartup: boolean; // Launch application on OS startup
  };
  contextCapture: {
    enabled: boolean; // Global toggle for context capture feature
    bash: boolean; // Enable context for bash commands
    javascript: boolean; // Enable context for JavaScript code
    typescript: boolean; // Enable context for TypeScript code
    python: boolean; // Enable context for Python code
    translate: boolean; // Enable context for translations
    dito: boolean; // Enable context for dito assistant
    // hotkeys is always false - not configurable
  };
}

export interface RecordingState {
  isRecording: boolean;
  startTime?: Date;
  audioBuffer?: Buffer[];
  isCanceled?: boolean; // Flag para indicar cancelamento
}

export type CodeLanguage = 'bash' | 'javascript' | 'typescript' | 'python' | 'hotkeys' | 'translate' | 'dito';

export interface VoiceCommandResult {
  language: CodeLanguage;
  strippedTranscription: string;
  detectedKeyword?: string;
}

// AssemblyAIResponse removed - now using official SDK types
