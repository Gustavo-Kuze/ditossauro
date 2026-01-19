import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, TranscriptionSession, RecordingState } from './types';

// Expose secure API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),
  updateSettings: (category: keyof AppSettings, setting: Record<string, unknown>): Promise<boolean> => 
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
  testAPI: (): Promise<boolean> => ipcRenderer.invoke('test-api'),

  // Transcription providers
  getAvailableProviders: () => ipcRenderer.invoke('get-available-providers'),
  getCurrentProvider: () => ipcRenderer.invoke('get-current-provider'),

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  getAuthor: () => ipcRenderer.invoke('get-author'),
  getAppIconPath: () => ipcRenderer.invoke('get-app-icon-path'),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (downloadUrl: string) => ipcRenderer.invoke('download-update', downloadUrl),

  // Audio processing
  processAudioData: (audioData: number[], duration: number): Promise<{ audioFile: string; duration: number }> =>
    ipcRenderer.invoke('process-audio-data', audioData, duration),
  sendAudioEvent: (eventType: string, data?: unknown): void =>
    ipcRenderer.send('audio-event', eventType, data),

  // Hotkeys
  notifyHotkeysUpdated: (): void => ipcRenderer.send('hotkeys-updated'),

  // Floating window
  sendFloatingCommand: (command: string): void => ipcRenderer.send('floating-command', command),
  onFloatingEvent: (callback: (event: string, data?: unknown) => void) => {
    const wrappedCallback = (_: Electron.IpcRendererEvent, event: string, data?: unknown) => callback(event, data);
    ipcRenderer.on('recording-started', () => callback('recording-started'));
    ipcRenderer.on('recording-stopped', () => callback('recording-stopped'));
    return () => {
      ipcRenderer.removeListener('recording-started', wrappedCallback);
      ipcRenderer.removeListener('recording-stopped', wrappedCallback);
    };
  },

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
    const wrappedCallback = (_: Electron.IpcRendererEvent, session: TranscriptionSession) => callback(session);
    ipcRenderer.on('transcription-completed', wrappedCallback);
    return () => ipcRenderer.removeListener('transcription-completed', wrappedCallback);
  },
  onTextInserted: (callback: (text: string) => void) => {
    const wrappedCallback = (_: Electron.IpcRendererEvent, text: string) => callback(text);
    ipcRenderer.on('text-inserted', wrappedCallback);
    return () => ipcRenderer.removeListener('text-inserted', wrappedCallback);
  },
  onError: (callback: (error: string) => void) => {
    const wrappedCallback = (_: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on('error', wrappedCallback);
    return () => ipcRenderer.removeListener('error', wrappedCallback);
  },
  onNavigateTo: (callback: (page: string) => void) => {
    const wrappedCallback = (_: Electron.IpcRendererEvent, page: string) => callback(page);
    ipcRenderer.on('navigate-to', wrappedCallback);
    return () => ipcRenderer.removeListener('navigate-to', wrappedCallback);
  },
});

// Tipos para TypeScript
export interface ElectronAPI {
  getSettings(): Promise<AppSettings>;
  updateSettings(category: keyof AppSettings, setting: Record<string, unknown>): Promise<boolean>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  getRecordingState(): Promise<RecordingState>;
  getHistory(): Promise<TranscriptionSession[]>;
  clearHistory(): Promise<void>;
  insertText(text: string): Promise<void>;
  testAPI(): Promise<boolean>;
  getAvailableProviders(): Promise<{ type: string; name: string; description: string }[]>;
  getCurrentProvider(): Promise<{ name: string; isConfigured: boolean }>;
  getVersion(): Promise<string>;
  getAuthor(): Promise<string>;
  getAppIconPath(): Promise<string>;
  checkForUpdates(): Promise<{
    updateAvailable: boolean;
    currentVersion: string;
    latestVersion?: string;
    downloadUrl?: string;
    releaseNotes?: string;
    releaseName?: string;
    releaseUrl?: string;
    error?: string;
  }>;
  downloadUpdate(downloadUrl: string): Promise<{ success: boolean; error?: string }>;
  processAudioData(audioData: number[], duration: number): Promise<{ audioFile: string; duration: number }>;
  sendAudioEvent(eventType: string, data?: unknown): void;
  notifyHotkeysUpdated(): void;
  sendFloatingCommand(command: string): void;
  onFloatingEvent(callback: (event: string, data?: unknown) => void): () => void;
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
      stopRecording(): Promise<{ audioFile: string; duration: number }>;
      getRecordingState(): { isRecording: boolean };
      getAudioDevices(): Promise<MediaDeviceInfo[]>;
    };
  }
}
