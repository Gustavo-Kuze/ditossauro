import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { app } from 'electron';

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
      console.log('Already recording...');
      return;
    }

    try {
      console.log('Requesting microphone access...');

      // Get microphone stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      };

      // Fallback to other formats if webm is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType || '')) {
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
          console.error('Error processing recording:', error);
          this.emit('error', error);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('Error in MediaRecorder:', event);
        this.isRecording = false;
        this.emit('error', new Error('Error in audio recording'));
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms

      console.log('Recording started with Web Audio API');
      this.emit('recording-started');

    } catch (error) {
      console.error('Error starting recording:', error);
      this.isRecording = false;

      let errorMessage = 'Error accessing microphone';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permission denied to access microphone';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is being used by another application';
        }
      }

      this.emit('error', new Error(errorMessage));
    }
  }

  async stopRecording(): Promise<{ audioFile: string; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        reject(new Error('Not recording'));
        return;
      }

      console.log('Stopping recording...');

      const duration = this.startTime ? (Date.now() - this.startTime.getTime()) / 1000 : 0;

      // Configure callback when recording stops
      const originalOnStop = this.mediaRecorder.onstop;
      this.mediaRecorder.onstop = async () => {
        try {
          const audioFile = await this.processRecording();
          resolve({ audioFile, duration });
        } catch (error) {
          reject(error);
        } finally {
          if (this.mediaRecorder) {
            this.mediaRecorder.onstop = originalOnStop;
          }
        }
      };

      this.mediaRecorder.stop();
      this.isRecording = false;

      // Stop all tracks from the stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      this.emit('recording-stopped', { duration });
    });
  }

  private async processRecording(): Promise<string> {
    if (this.audioChunks.length === 0) {
      throw new Error('No audio was recorded');
    }

    // Combine chunks into a blob
    const audioBlob = new Blob(this.audioChunks, {
      type: this.audioChunks[0].type || 'audio/webm'
    });

    // Convert to buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to temporary file
    const tempFilePath = path.join(app.getPath('temp'), `temp_audio_${uuidv4()}.webm`);

    await fs.promises.writeFile(tempFilePath, buffer);

    console.log(`Audio saved: ${tempFilePath} (${buffer.length} bytes)`);
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
      console.error('Error listing devices:', error);
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
