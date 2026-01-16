import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { ITranscriptionProvider, FasterWhisperConfig, TranscriptionResult } from './transcription-provider';

export class FasterWhisperClient implements ITranscriptionProvider {
  private config: FasterWhisperConfig;

  constructor(config: Partial<FasterWhisperConfig> = {}) {
    this.config = {
      modelSize: 'base',
      device: 'cpu',
      computeType: 'int8',
      pythonPath: 'python',
      ...config
    };
  }

  getProviderName(): string {
    return 'Faster Whisper (Local)';
  }

  async transcribeAudio(audioFilePath: string, language = 'pt'): Promise<import('./transcription-provider').TranscriptionResult> {
    try {
      console.log('🚀 Starting transcription with Faster Whisper...');
      console.log(`📁 File: ${audioFilePath}`);
      console.log(`🌍 Language: ${language}`);
      console.log(`🤖 Model: ${this.config.modelSize}`);
      console.log(`💻 Device: ${this.config.device}`);

      // Check if the audio file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }


      // Create temporary Python script with configurations
      const tempScriptPath = await this.createTempScript(audioFilePath, language);

      try {
        // Execute the Python script
        const result = await this.executePythonScript(tempScriptPath);

        // Clean up temporary script
        this.cleanupTempFile(tempScriptPath);

        if (!result.text.trim()) {
          throw new Error('No text was transcribed. Check if there is speech in the audio.');
        }

        console.log('✅ Transcription completed successfully!');
        console.log(`📝 Text (${result.text.length} characters): ${result.text.substring(0, 100)}...`);
        console.log(`🌍 Detected language: ${result.language}`);
        console.log(`📊 Confidence: ${result.confidence ? (result.confidence * 100).toFixed(1) : 'N/A'}%`);

        return {
          text: result.text,
          language: result.language || language || 'en',
          confidence: result.confidence || 0.9,
          duration: 0, // Faster Whisper doesn't provide duration easily
        };

      } catch (error) {
        this.cleanupTempFile(tempScriptPath);
        throw error;
      }

    } catch (error) {
      console.error('❌ Error during transcription with Faster Whisper:', error);

      // Improve error messages
      if (error instanceof Error) {
        if (error.message.includes('python')) {
          throw new Error('Python not found. Check if Python is installed and in PATH.');
        } else if (error.message.includes('faster_whisper')) {
          throw new Error('faster_whisper library not found. Run: pip install faster-whisper');
        } else if (error.message.includes('CUDA')) {
          throw new Error('CUDA error. Trying again with CPU...');
        }
      }

      throw error;
    }
  }

  private async createTempScript(audioFilePath: string, language: string): Promise<string> {
    const tempScriptPath = path.join(app.getPath('temp'), `temp_whisper_${Date.now()}.py`);

    // Map language to Whisper code if necessary
    const whisperLanguage = this.mapLanguageCode(language);

    const scriptContent = `#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import json
import os
from faster_whisper import WhisperModel
import warnings
warnings.filterwarnings("ignore")

# Configure UTF-8 encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

try:
    # Model configuration
    model_size = "${this.config.modelSize}"
    device = "${this.config.device}"
    compute_type = "${this.config.computeType}"
    
    # Initialize model
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    
    # Transcribe audio
    audio_file = "${audioFilePath.replace(/\\/g, '\\\\')}"
    segments, info = model.transcribe(audio_file, language="${whisperLanguage}", beam_size=5)
    
    # Collect all segments
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
    
    # Final result
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
      const pythonPath = this.config.pythonPath || 'python';
      const pythonProcess = spawn(pythonPath, [scriptPath],
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
          console.error('❌ Error in Python script:', stderr);
          reject(new Error(`Python script failed: ${stderr}`));
          return;
        }

        try {
          // Extract only the last valid JSON line
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
            throw new Error('No valid JSON result found in output');
          }

          const result = JSON.parse(jsonResult);

          if (!result.success) {
            throw new Error(result.error || 'Unknown error in transcription');
          }

          resolve({
            text: result.text,
            language: result.language,
            confidence: result.language_probability,
            duration: result.duration,
            segments: result.segments
          });

        } catch (error) {
          console.error('❌ Error processing result:', error);
          console.error('Full output:', stdout);
          reject(new Error(`Error processing transcription result: ${error}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Error executing Python: ${error.message}`));
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
      console.log('🧪 Testing Faster Whisper...');

      // Check if Python is available
      const pythonVersion = await this.checkPythonVersion();
      console.log(`🐍 Python found: ${pythonVersion}`);

      // Check if faster_whisper is installed
      const hasWhisper = await this.checkWhisperInstallation();
      if (!hasWhisper) {
        console.error('❌ faster_whisper is not installed');
        return false;
      }

      console.log('✅ Faster Whisper is configured correctly!');
      return true;

    } catch (error) {
      console.error('❌ Error testing Faster Whisper:', error);
      return false;
    }
  }

  private async checkPythonVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const pythonPath = this.config.pythonPath || 'python';
      const pythonProcess = spawn(pythonPath, ['--version'],
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
          reject(new Error('Python not found'));
        }
      });
    });
  }

  private async checkWhisperInstallation(): Promise<boolean> {
    return new Promise((resolve) => {
      const pythonPath = this.config.pythonPath || 'python';
      const pythonProcess = spawn(pythonPath, ['-c', 'import faster_whisper; print("OK")'], {
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
    console.log('🔍 Checking Faster Whisper configuration...');
    console.log(`🐍 Python: ${this.config.pythonPath}`);
    const theReturn = this.config.pythonPath !== '';
    console.log(`🔍 Result: ${theReturn}`);
    return theReturn;
  }

  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Temporary file removed:', filePath);
      }
    } catch (err) {
      console.error('Error removing temporary file:', err);
    }
  }
}
