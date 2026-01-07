import { EventEmitter } from 'events';
import { WebAudioRecorder } from './web-audio-recorder';
import { ipcMain, BrowserWindow } from 'electron';

export class AudioManager extends EventEmitter {
  private recorder: WebAudioRecorder | null = null;
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    super();
    this.mainWindow = mainWindow;
    this.setupIpcHandlers();
  }

  private setupIpcHandlers(): void {
    // Handler to start recording
    ipcMain.handle('audio-start-recording', async () => {
      try {
        // Send command to renderer process to execute recording
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          return await this.mainWindow.webContents.executeJavaScript(`
            window.audioRecorder.startRecording()
          `);
        }
        throw new Error('Window not available');
      } catch (error) {
        console.error('Error starting recording:', error);
        throw error;
      }
    });

    // Handler to stop recording
    ipcMain.handle('audio-stop-recording', async () => {
      try {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          return await this.mainWindow.webContents.executeJavaScript(`
            window.audioRecorder.stopRecording()
          `);
        }
        throw new Error('Window not available');
      } catch (error) {
        console.error('Error stopping recording:', error);
        throw error;
      }
    });

    // Handler to get recording state
    ipcMain.handle('audio-get-recording-state', async () => {
      try {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          return await this.mainWindow.webContents.executeJavaScript(`
            window.audioRecorder.getRecordingState()
          `);
        }
        return { isRecording: false };
      } catch (error) {
        console.error('Error getting state:', error);
        return { isRecording: false };
      }
    });

    // Handler to list audio devices
    ipcMain.handle('audio-get-devices', async () => {
      try {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          return await this.mainWindow.webContents.executeJavaScript(`
            window.audioRecorder.getAudioDevices()
          `);
        }
        return [];
      } catch (error) {
        console.error('Error listing devices:', error);
        return [];
      }
    });
  }

  // Method to inject recorder into renderer
  injectAudioRecorder(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    // Inject WebAudioRecorder code into renderer
    this.mainWindow.webContents.executeJavaScript(`
      class WebAudioRecorderRenderer {
        constructor() {
          this.mediaRecorder = null;
          this.audioChunks = [];
          this.isRecording = false;
          this.startTime = null;
          this.stream = null;
        }

        async startRecording() {
          if (this.isRecording) {
            console.log('Already recording...');
            return;
          }

          try {
            console.log('Starting recording with Web Audio API...');
            
            this.stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            });

            const options = { mimeType: 'audio/webm;codecs=opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
              if (MediaRecorder.isTypeSupported('audio/wav')) {
                options.mimeType = 'audio/wav';
              } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options.mimeType = 'audio/mp4';
              } else {
                delete options.mimeType;
              }
            }

            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];
            this.isRecording = true;
            this.startTime = Date.now();

            this.mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                this.audioChunks.push(event.data);
              }
            };

            this.mediaRecorder.start(100);
            
            // Notify the main process
            window.electronAPI.sendAudioEvent('recording-started');
            
            return true;
          } catch (error) {
            this.isRecording = false;
            let errorMessage = 'Error accessing microphone';
            if (error.name === 'NotAllowedError') {
              errorMessage = 'Permission denied to access microphone. Click the microphone icon in the address bar and allow access.';
            } else if (error.name === 'NotFoundError') {
              errorMessage = 'No microphone found';
            }
            window.electronAPI.sendAudioEvent('error', errorMessage);
            throw new Error(errorMessage);
          }
        }

        async stopRecording() {
          if (!this.isRecording || !this.mediaRecorder) {
            throw new Error('Not recording');
          }

          return new Promise((resolve, reject) => {
            const duration = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
            
            this.mediaRecorder.onstop = async () => {
              try {
                const audioBlob = new Blob(this.audioChunks, { 
                  type: this.audioChunks[0]?.type || 'audio/webm' 
                });
                
                const arrayBuffer = await audioBlob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                
                // Send data to the main process
                const result = await window.electronAPI.processAudioData(Array.from(uint8Array), duration);
                resolve(result);
              } catch (error) {
                reject(error);
              }
            };

            this.mediaRecorder.stop();
            this.isRecording = false;
            
            if (this.stream) {
              this.stream.getTracks().forEach(track => track.stop());
              this.stream = null;
            }
            
            window.electronAPI.sendAudioEvent('recording-stopped', { duration });
          });
        }

        getRecordingState() {
          return { isRecording: this.isRecording };
        }

        async getAudioDevices() {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'audioinput');
          } catch (error) {
            return [];
          }
        }
      }

      window.audioRecorder = new WebAudioRecorderRenderer();
      console.log('WebAudioRecorder injected successfully');
    `);
  }
}
