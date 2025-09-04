const recorder = require('node-record-lpcm16');
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class AudioRecorder extends EventEmitter {
  private recording: any = null;
  private isRecording = false;
  private audioBuffer: Buffer[] = [];
  private startTime?: Date;
  private tempFilePath?: string;

  constructor(private sampleRate: number = 16000, private deviceId?: string) {
    super();
  }

  startRecording(): void {
    if (this.isRecording) {
      console.log('Já está gravando...');
      return;
    }

    this.isRecording = true;
    this.startTime = new Date();
    this.audioBuffer = [];
    
    // Criar arquivo temporário
    this.tempFilePath = path.join(__dirname, `temp_audio_${uuidv4()}.wav`);

    console.log('Iniciando gravação...');
    
    const recordingOptions: any = {
      sampleRateHertz: this.sampleRate,
      threshold: 0,
      verbose: false,
      recordProgram: process.platform === 'darwin' ? 'sox' : 'rec',
      silence: '1.0',
    };

    // Configurar dispositivo se especificado
    if (this.deviceId) {
      recordingOptions.device = this.deviceId;
    }

    this.recording = recorder.record(recordingOptions);
    
    // Stream para arquivo temporário
    const fileStream = fs.createWriteStream(this.tempFilePath);
    this.recording.stream().pipe(fileStream);
    
    // Também capturar em buffer para processamento
    this.recording.stream().on('data', (chunk: Buffer) => {
      this.audioBuffer.push(chunk);
    });

    this.recording.stream().on('error', (err: Error) => {
      console.error('Erro na gravação:', err);
      this.emit('error', err);
    });

    this.emit('recording-started');
  }

  stopRecording(): Promise<{ audioFile: string; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.recording) {
        reject(new Error('Não está gravando'));
        return;
      }

      console.log('Parando gravação...');
      
      this.recording.stop();
      this.isRecording = false;
      
      const duration = this.startTime ? (Date.now() - this.startTime.getTime()) / 1000 : 0;
      
      // Dar um tempo para o arquivo ser finalizado
      setTimeout(() => {
        if (this.tempFilePath && fs.existsSync(this.tempFilePath)) {
          resolve({
            audioFile: this.tempFilePath,
            duration: duration
          });
        } else {
          reject(new Error('Arquivo de áudio não foi criado'));
        }
        
        this.emit('recording-stopped', { duration });
      }, 100);
    });
  }

  getAudioDevices(): Promise<string[]> {
    // Esta função seria implementada para listar dispositivos disponíveis
    // Por simplicidade, retornamos uma lista padrão
    return Promise.resolve(['default', 'microphone']);
  }

  cleanup(): void {
    if (this.tempFilePath && fs.existsSync(this.tempFilePath)) {
      try {
        fs.unlinkSync(this.tempFilePath);
        console.log('Arquivo temporário removido:', this.tempFilePath);
      } catch (err) {
        console.error('Erro ao remover arquivo temporário:', err);
      }
    }
  }
}
