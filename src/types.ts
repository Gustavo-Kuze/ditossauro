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
  hotkeys: {
    startStop: HotkeyConfig;
    cancel: string; // Mantido como string para compatibilidade
  };
  audio: {
    deviceId: string;
    sampleRate: number;
  };
  api: {
    assemblyAiKey: string;
    language: string;
  };
  transcription: {
    provider: 'assemblyai' | 'faster-whisper';
    fasterWhisper: {
      modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'large-v2' | 'large-v3';
      device: 'cpu' | 'cuda';
      computeType: 'int8' | 'int8_float16' | 'int16' | 'float16' | 'float32';
      pythonPath: string;
    };
  };
  behavior: {
    autoInsert: boolean;
    showConfirmation: boolean;
    useClipboard: boolean; // Usar clipboard para inserção rápida ou digitação tradicional
    startMinimized: boolean;
  };
}

export interface RecordingState {
  isRecording: boolean;
  startTime?: Date;
  audioBuffer?: Buffer[];
}

// AssemblyAIResponse removido - agora usando tipos do SDK oficial
