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
    // Handler para iniciar gravação
    ipcMain.handle('audio-start-recording', async () => {
      try {
        // Enviar comando para o renderer process executar a gravação
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          return await this.mainWindow.webContents.executeJavaScript(`
            window.audioRecorder.startRecording()
          `);
        }
        throw new Error('Janela não disponível');
      } catch (error) {
        console.error('Erro ao iniciar gravação:', error);
        throw error;
      }
    });

    // Handler para parar gravação
    ipcMain.handle('audio-stop-recording', async () => {
      try {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          return await this.mainWindow.webContents.executeJavaScript(`
            window.audioRecorder.stopRecording()
          `);
        }
        throw new Error('Janela não disponível');
      } catch (error) {
        console.error('Erro ao parar gravação:', error);
        throw error;
      }
    });

    // Handler para obter estado da gravação
    ipcMain.handle('audio-get-recording-state', async () => {
      try {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          return await this.mainWindow.webContents.executeJavaScript(`
            window.audioRecorder.getRecordingState()
          `);
        }
        return { isRecording: false };
      } catch (error) {
        console.error('Erro ao obter estado:', error);
        return { isRecording: false };
      }
    });

    // Handler para listar dispositivos de áudio
    ipcMain.handle('audio-get-devices', async () => {
      try {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          return await this.mainWindow.webContents.executeJavaScript(`
            window.audioRecorder.getAudioDevices()
          `);
        }
        return [];
      } catch (error) {
        console.error('Erro ao listar dispositivos:', error);
        return [];
      }
    });
  }

  // Método para injetar o recorder no renderer
  injectAudioRecorder(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    // Injetar código do WebAudioRecorder no renderer
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
            console.log('Já está gravando...');
            return;
          }

          try {
            console.log('Iniciando gravação com Web Audio API...');
            
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
            
            // Notificar o main process
            window.electronAPI.sendAudioEvent('recording-started');
            
            return true;
          } catch (error) {
            this.isRecording = false;
            let errorMessage = 'Erro ao acessar microfone';
            if (error.name === 'NotAllowedError') {
              errorMessage = 'Permissão negada para acessar o microfone. Clique no ícone de microfone na barra de endereço e permita o acesso.';
            } else if (error.name === 'NotFoundError') {
              errorMessage = 'Nenhum microfone encontrado';
            }
            window.electronAPI.sendAudioEvent('error', errorMessage);
            throw new Error(errorMessage);
          }
        }

        async stopRecording() {
          if (!this.isRecording || !this.mediaRecorder) {
            throw new Error('Não está gravando');
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
                
                // Enviar dados para o main process
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
      console.log('WebAudioRecorder injetado com sucesso');
    `);
  }
}
