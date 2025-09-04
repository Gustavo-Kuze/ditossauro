import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { AssemblyAIResponse } from './types';

export class AssemblyAIClient {
  private apiKey: string;
  private baseURL = 'https://api.assemblyai.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribeAudio(audioFilePath: string, language: string = 'pt'): Promise<string> {
    try {
      console.log('Iniciando transcrição com AssemblyAI...');
      
      // Primeiro, fazer upload do arquivo de áudio
      const uploadUrl = await this.uploadAudio(audioFilePath);
      
      // Depois, solicitar a transcrição
      const transcriptionId = await this.requestTranscription(uploadUrl, language);
      
      // Aguardar e obter o resultado
      const result = await this.waitForTranscription(transcriptionId);
      
      return result.text || '';
    } catch (error) {
      console.error('Erro na transcrição:', error);
      throw error;
    }
  }

  private async uploadAudio(audioFilePath: string): Promise<string> {
    const form = new FormData();
    form.append('audio', fs.createReadStream(audioFilePath));

    const response = await axios.post(`${this.baseURL}/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'authorization': this.apiKey,
      },
    });

    if (response.data && response.data.upload_url) {
      console.log('Upload do áudio concluído');
      return response.data.upload_url;
    } else {
      throw new Error('Falha no upload do áudio');
    }
  }

  private async requestTranscription(audioUrl: string, language: string): Promise<string> {
    const data = {
      audio_url: audioUrl,
      language_code: language === 'pt' ? 'pt' : 'en',
      punctuate: true,
      format_text: true,
    };

    const response = await axios.post(`${this.baseURL}/transcript`, data, {
      headers: {
        'authorization': this.apiKey,
        'content-type': 'application/json',
      },
    });

    if (response.data && response.data.id) {
      console.log('Transcrição solicitada, ID:', response.data.id);
      return response.data.id;
    } else {
      throw new Error('Falha ao solicitar transcrição');
    }
  }

  private async waitForTranscription(transcriptionId: string): Promise<AssemblyAIResponse> {
    const maxAttempts = 60; // 5 minutos máximo
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await axios.get(`${this.baseURL}/transcript/${transcriptionId}`, {
        headers: {
          'authorization': this.apiKey,
        },
      });

      const result = response.data as AssemblyAIResponse;
      
      console.log(`Status da transcrição: ${result.status}`);

      if (result.status === 'completed') {
        console.log('Transcrição concluída!');
        return result;
      } else if (result.status === 'error') {
        throw new Error(`Erro na transcrição: ${result.error}`);
      }

      // Aguardar 5 segundos antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Timeout aguardando transcrição');
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}
