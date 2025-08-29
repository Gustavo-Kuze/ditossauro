import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration management
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config: any) => ipcRenderer.invoke('update-config', config),
  
  // Backend communication
  backendRequest: (method: string, endpoint: string, data?: any) => 
    ipcRenderer.invoke('backend-request', method, endpoint, data),
  
  // Overlay management
  showOverlay: () => ipcRenderer.invoke('show-overlay'),
  hideOverlay: () => ipcRenderer.invoke('hide-overlay'),
  updateOverlay: (status: string) => ipcRenderer.invoke('update-overlay', status),
  
  // Window management
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  showMainWindow: () => ipcRenderer.invoke('show-main-window'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // Event listeners
  onStatusUpdate: (callback: (status: string) => void) => {
    ipcRenderer.on('status-update', (event, status) => callback(status));
  },
  
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<any>;
      updateConfig: (config: any) => Promise<any>;
      backendRequest: (method: string, endpoint: string, data?: any) => Promise<any>;
      showOverlay: () => Promise<void>;
      hideOverlay: () => Promise<void>;
      updateOverlay: (status: string) => Promise<void>;
      minimizeToTray: () => Promise<void>;
      showMainWindow: () => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      onStatusUpdate: (callback: (status: string) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}