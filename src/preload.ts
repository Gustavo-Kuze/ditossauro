import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, TranscriptionSession, RecordingState } from './types';

// Expor API segura para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),
  updateSettings: (category: keyof AppSettings, setting: any): Promise<boolean> => 
    ipcRenderer.invoke('update-settings', category, setting),

  // Recording
  startRecording: (): Promise<void> => ipcRenderer.invoke('start-recording'),
  stopRecording: (): Promise<void> => ipcRenderer.invoke('stop-recording'),
  getRecordingState: (): Promise<RecordingState> => ipcRenderer.invoke('get-recording-state'),

  // History
  getHistory: (): Promise<TranscriptionSession[]> => ipcRenderer.invoke('get-history'),
  clearHistory: (): Promise<void> => ipcRenderer.invoke('clear-history'),

  // Text insertion
  insertText: (text: string): Promise<void> => ipcRenderer.invoke('insert-text', text),

  // API test
  testApi: (): Promise<boolean> => ipcRenderer.invoke('test-api'),

  // Audio processing
  processAudioData: (audioData: number[], duration: number): Promise<any> => 
    ipcRenderer.invoke('process-audio-data', audioData, duration),
  sendAudioEvent: (eventType: string, data?: any): void => 
    ipcRenderer.send('audio-event', eventType, data),

  // Event listeners
  onRecordingStarted: (callback: () => void) => {
    ipcRenderer.on('recording-started', callback);
    return () => ipcRenderer.removeListener('recording-started', callback);
  },
  onRecordingStopped: (callback: () => void) => {
    ipcRenderer.on('recording-stopped', callback);
    return () => ipcRenderer.removeListener('recording-stopped', callback);
  },
  onProcessingStarted: (callback: () => void) => {
    ipcRenderer.on('processing-started', callback);
    return () => ipcRenderer.removeListener('processing-started', callback);
  },
  onTranscriptionCompleted: (callback: (session: TranscriptionSession) => void) => {
    ipcRenderer.on('transcription-completed', (_, session) => callback(session));
    return () => ipcRenderer.removeListener('transcription-completed', callback);
  },
  onTextInserted: (callback: (text: string) => void) => {
    ipcRenderer.on('text-inserted', (_, text) => callback(text));
    return () => ipcRenderer.removeListener('text-inserted', callback);
  },
  onError: (callback: (error: string) => void) => {
    ipcRenderer.on('error', (_, error) => callback(error));
    return () => ipcRenderer.removeListener('error', callback);
  },
  onNavigateTo: (callback: (page: string) => void) => {
    ipcRenderer.on('navigate-to', (_, page) => callback(page));
    return () => ipcRenderer.removeListener('navigate-to', callback);
  },
});

// Tipos para TypeScript
export interface ElectronAPI {
  getSettings(): Promise<AppSettings>;
  updateSettings(category: keyof AppSettings, setting: any): Promise<boolean>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  getRecordingState(): Promise<RecordingState>;
  getHistory(): Promise<TranscriptionSession[]>;
  clearHistory(): Promise<void>;
  insertText(text: string): Promise<void>;
  testApi(): Promise<boolean>;
  processAudioData(audioData: number[], duration: number): Promise<any>;
  sendAudioEvent(eventType: string, data?: any): void;
  onRecordingStarted(callback: () => void): () => void;
  onRecordingStopped(callback: () => void): () => void;
  onProcessingStarted(callback: () => void): () => void;
  onTranscriptionCompleted(callback: (session: TranscriptionSession) => void): () => void;
  onTextInserted(callback: (text: string) => void): () => void;
  onError(callback: (error: string) => void): () => void;
  onNavigateTo(callback: (page: string) => void): () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    audioRecorder: {
      startRecording(): Promise<boolean>;
      stopRecording(): Promise<any>;
      getRecordingState(): { isRecording: boolean };
      getAudioDevices(): Promise<MediaDeviceInfo[]>;
    };
  }
}
