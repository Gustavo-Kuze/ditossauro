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
  behavior: {
    autoInsert: boolean;
    showConfirmation: boolean;
    useClipboard: boolean; // Usar clipboard para inserção rápida ou digitação tradicional
  };
}

export interface RecordingState {
  isRecording: boolean;
  startTime?: Date;
  audioBuffer?: Buffer[];
}

// AssemblyAIResponse removido - agora usando tipos do SDK oficial
