import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class WebAudioRecorder extends EventEmitter {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private startTime?: Date;
  private stream: MediaStream | null = null;

  constructor(private sampleRate: number = 16000) {
    super();
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.log('Já está gravando...');
      return;
    }

    try {
      console.log('Solicitando acesso ao microfone...');
      
      // Obter stream do microfone
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Criar MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      };

      // Fallback para outros formatos se webm não for suportado
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
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
      this.startTime = new Date();

      // Event listeners
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        try {
          await this.processRecording();
        } catch (error) {
          console.error('Erro ao processar gravação:', error);
          this.emit('error', error);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('Erro no MediaRecorder:', event);
        this.isRecording = false;
        this.emit('error', new Error('Erro na gravação de áudio'));
      };

      // Iniciar gravação
      this.mediaRecorder.start(100); // Coletar dados a cada 100ms
      
      console.log('Gravação iniciada com Web Audio API');
      this.emit('recording-started');

    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      this.isRecording = false;
      
      let errorMessage = 'Erro ao acessar microfone';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permissão negada para acessar o microfone';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Nenhum microfone encontrado';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microfone está sendo usado por outro aplicativo';
        }
      }
      
      this.emit('error', new Error(errorMessage));
    }
  }

  async stopRecording(): Promise<{ audioFile: string; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        reject(new Error('Não está gravando'));
        return;
      }

      console.log('Parando gravação...');
      
      const duration = this.startTime ? (Date.now() - this.startTime.getTime()) / 1000 : 0;
      
      // Configurar callback para quando a gravação parar
      const originalOnStop = this.mediaRecorder.onstop;
      this.mediaRecorder.onstop = async (event) => {
        try {
          const audioFile = await this.processRecording();
          resolve({ audioFile, duration });
        } catch (error) {
          reject(error);
        } finally {
          this.mediaRecorder!.onstop = originalOnStop;
        }
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
      
      // Parar todas as tracks do stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      this.emit('recording-stopped', { duration });
    });
  }

  private async processRecording(): Promise<string> {
    if (this.audioChunks.length === 0) {
      throw new Error('Nenhum áudio foi gravado');
    }

    // Combinar chunks em um blob
    const audioBlob = new Blob(this.audioChunks, { 
      type: this.audioChunks[0].type || 'audio/webm' 
    });

    // Converter para buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Salvar em arquivo temporário
    const tempFilePath = path.join(__dirname, `temp_audio_${uuidv4()}.webm`);
    
    await fs.promises.writeFile(tempFilePath, buffer);
    
    console.log(`Áudio salvo: ${tempFilePath} (${buffer.length} bytes)`);
    return tempFilePath;
  }

  getRecordingState(): { isRecording: boolean } {
    return { isRecording: this.isRecording };
  }

  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error('Erro ao listar dispositivos:', error);
      return [];
    }
  }

  cleanup(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.isRecording = false;
    this.audioChunks = [];
  }
}
