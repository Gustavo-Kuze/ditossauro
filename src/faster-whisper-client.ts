import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { ITranscriptionProvider, FasterWhisperConfig, TranscriptionResult } from './transcription-provider';

export class FasterWhisperClient implements ITranscriptionProvider {
  private config: FasterWhisperConfig;

  constructor(config: Partial<FasterWhisperConfig> = {}) {
    this.config = {
      modelSize: 'base',
      device: 'cpu',
      computeType: 'int8',
      pythonPath: 'python',
      scriptPath: path.join(__dirname, '..', 'whisper_transcribe.py'),
      ...config
    };
  }

  getProviderName(): string {
    return 'Faster Whisper (Local)';
  }

  async transcribeAudio(audioFilePath: string, language = 'pt'): Promise<string> {
    try {
      console.log('🚀 Iniciando transcrição com Faster Whisper...');
      console.log(`📁 Arquivo: ${audioFilePath}`);
      console.log(`🌍 Idioma: ${language}`);
      console.log(`🤖 Modelo: ${this.config.modelSize}`);
      console.log(`💻 Dispositivo: ${this.config.device}`);

      // Verificar se o arquivo de áudio existe
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Arquivo de áudio não encontrado: ${audioFilePath}`);
      }

      // Verificar se o script Python existe
      if (!fs.existsSync(this.config.scriptPath!)) {
        throw new Error(`Script Python não encontrado: ${this.config.scriptPath}`);
      }

      // Criar script Python temporário com as configurações
      const tempScriptPath = await this.createTempScript(audioFilePath, language);

      try {
        // Executar o script Python
        const result = await this.executePythonScript(tempScriptPath);

        // Limpar script temporário
        this.cleanupTempFile(tempScriptPath);

        if (!result.text.trim()) {
          throw new Error('Nenhum texto foi transcrito. Verifique se há fala no áudio.');
        }

        console.log('✅ Transcrição concluída com sucesso!');
        console.log(`📝 Texto (${result.text.length} caracteres): ${result.text.substring(0, 100)}...`);
        console.log(`🌍 Idioma detectado: ${result.language}`);
        console.log(`📊 Confiança: ${result.confidence ? (result.confidence * 100).toFixed(1) : 'N/A'}%`);

        return result.text;

      } catch (error) {
        this.cleanupTempFile(tempScriptPath);
        throw error;
      }

    } catch (error) {
      console.error('❌ Erro durante transcrição com Faster Whisper:', error);

      // Melhorar mensagens de erro
      if (error instanceof Error) {
        if (error.message.includes('python')) {
          throw new Error('Python não encontrado. Verifique se o Python está instalado e no PATH.');
        } else if (error.message.includes('faster_whisper')) {
          throw new Error('Biblioteca faster_whisper não encontrada. Execute: pip install faster-whisper');
        } else if (error.message.includes('CUDA')) {
          throw new Error('Erro CUDA. Tentando novamente com CPU...');
        }
      }

      throw error;
    }
  }

  private async createTempScript(audioFilePath: string, language: string): Promise<string> {
    const tempScriptPath = path.join(__dirname, `temp_whisper_${Date.now()}.py`);

    // Mapear idioma para código Whisper se necessário
    const whisperLanguage = this.mapLanguageCode(language);

    const scriptContent = `#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import json
import os
from faster_whisper import WhisperModel
import warnings
warnings.filterwarnings("ignore")

# Configurar encoding UTF-8
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

try:
    # Configuração do modelo
    model_size = "${this.config.modelSize}"
    device = "${this.config.device}"
    compute_type = "${this.config.computeType}"
    
    # Inicializar modelo
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    
    # Transcrever áudio
    audio_file = "${audioFilePath.replace(/\\/g, '\\\\')}"
    segments, info = model.transcribe(audio_file, language="${whisperLanguage}", beam_size=5)
    
    # Coletar todos os segmentos
    all_segments = []
    full_text = ""
    
    for segment in segments:
        segment_data = {
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip()
        }
        all_segments.append(segment_data)
        full_text += segment.text.strip() + " "
    
    # Resultado final
    result = {
        "success": True,
        "text": full_text.strip(),
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "segments": all_segments
    }
    
    print(json.dumps(result, ensure_ascii=False))
    
except Exception as e:
    error_result = {
        "success": False,
        "error": str(e),
        "error_type": type(e).__name__
    }
    print(json.dumps(error_result, ensure_ascii=False))
    sys.exit(1)
`;

    await fs.promises.writeFile(tempScriptPath, scriptContent.trim(), { encoding: 'utf8' });
    return tempScriptPath;
  }

  private async executePythonScript(scriptPath: string): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.config.pythonPath!, [scriptPath],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: 'utf-8',
            PYTHONUTF8: '1'
          }
        }
      );

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString('utf8');
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString('utf8');
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('❌ Erro no script Python:', stderr);
          reject(new Error(`Script Python falhou: ${stderr}`));
          return;
        }

        try {
          // Extrair apenas a última linha JSON válida
          const lines = stdout.trim().split('\n');
          let jsonResult = '';

          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
              jsonResult = line;
              break;
            }
          }

          if (!jsonResult) {
            throw new Error('Nenhum resultado JSON válido encontrado na saída');
          }

          const result = JSON.parse(jsonResult);

          if (!result.success) {
            throw new Error(result.error || 'Erro desconhecido na transcrição');
          }

          resolve({
            text: result.text,
            language: result.language,
            confidence: result.language_probability,
            duration: result.duration,
            segments: result.segments
          });

        } catch (error) {
          console.error('❌ Erro ao processar resultado:', error);
          console.error('Saída completa:', stdout);
          reject(new Error(`Erro ao processar resultado da transcrição: ${error}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Erro ao executar Python: ${error.message}`));
      });
    });
  }

  private mapLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      'pt': 'pt',
      'en': 'en',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'ja': 'ja',
      'ko': 'ko',
      'zh': 'zh',
      'ru': 'ru'
    };

    return languageMap[language] || 'auto';
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testando Faster Whisper...');

      // Verificar se Python está disponível
      const pythonVersion = await this.checkPythonVersion();
      console.log(`🐍 Python encontrado: ${pythonVersion}`);

      // Verificar se faster_whisper está instalado
      const hasWhisper = await this.checkWhisperInstallation();
      if (!hasWhisper) {
        console.error('❌ faster_whisper não está instalado');
        return false;
      }

      console.log('✅ Faster Whisper está configurado corretamente!');
      return true;

    } catch (error) {
      console.error('❌ Erro ao testar Faster Whisper:', error);
      return false;
    }
  }

  private async checkPythonVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.config.pythonPath!, ['--version'],
        {
          stdio: 'pipe',
          shell: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: 'utf-8',
            PYTHONUTF8: '1'
          }
        }
      );

      let output = '';
      pythonProcess.stdout.on('data', (data) => output += data.toString('utf8'));
      pythonProcess.stderr.on('data', (data) => output += data.toString('utf8'));

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error('Python não encontrado'));
        }
      });
    });
  }

  private async checkWhisperInstallation(): Promise<boolean> {
    return new Promise((resolve) => {
      const pythonProcess = spawn(this.config.pythonPath!, ['-c', 'import faster_whisper; print("OK")'], {
        stdio: 'pipe',
        shell: true,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1'
        }
      });

      pythonProcess.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }

  setConfig(config: Partial<FasterWhisperConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): FasterWhisperConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    console.log('🔍 Verificando configuração do Faster Whisper...');
    console.log(`📁 Script: ${this.config.scriptPath}`);
    console.log(`🐍 Python: ${this.config.pythonPath}`);
    const theReturn = fs.existsSync(this.config.scriptPath!) && this.config.pythonPath !== '';
    console.log(`🔍 Resultado: ${theReturn}`);
    return theReturn;
  }

  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Arquivo temporário removido:', filePath);
      }
    } catch (err) {
      console.error('Erro ao remover arquivo temporário:', err);
    }
  }
}
