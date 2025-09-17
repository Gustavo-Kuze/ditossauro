export interface TranscriptionSession {
  id: string;
  timestamp: Date;
  audioFile?: Buffer;
  transcription: string;
  duration: number;
  language: string;
  confidence: number;
}

export interface AppSettings {
  hotkeys: {
    startStop: string;
    cancel: string;
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
