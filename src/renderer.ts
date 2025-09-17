import './index.css';
import { AppSettings, TranscriptionSession } from './types';

class OpenWisprUI {
  private settings: AppSettings | null = null;
  private recordingState = { isRecording: false };
  private transcriptionHistory: TranscriptionSession[] = [];

  constructor() {
    this.init();
  }

  async init() {
    try {
      this.settings = await window.electronAPI.getSettings();
      this.transcriptionHistory = await window.electronAPI.getHistory();
      this.recordingState = await window.electronAPI.getRecordingState();

      this.setupUI();
      this.setupEventListeners();
      this.updateRecordingStatus();
      console.log('✅ OpenWispr inicializado');
    } catch (error) {
      console.error('❌ Erro:', error);
      alert('Erro ao inicializar aplicativo');
    }
  }

  setupUI() {
    const app = document.getElementById('app');
    if (!app) {
      throw new Error('App element not found');
    }
    app.innerHTML = `
      <div class="header">
        <div class="logo"><h1>🎤 OpenWispr</h1></div>
        <div class="header-controls">
          <div class="status-indicator" id="globalStatus">
            <span>Pronto</span>
          </div>
        </div>
      </div>

      <nav class="nav-tabs">
        <button class="nav-tab active" data-tab="home">🏠 Início</button>
        <button class="nav-tab" data-tab="settings">⚙️ Configurações</button>
        <button class="nav-tab" data-tab="history">📋 Histórico</button>
        <button class="nav-tab" data-tab="about">ℹ️ Sobre</button>
      </nav>

      <main class="content">
        <div id="homeTab" class="tab-content">
          <div class="recording-section">
            <h2>Transcrição de Voz</h2>
            <p class="text-muted">Pressione <strong>F2</strong> para gravar</p>
            
            <div class="recording-controls">
              <button class="record-btn start" id="startRecordBtn">🎤</button>
              <button class="record-btn stop hidden" id="stopRecordBtn">⏹️</button>
            </div>

            <div class="recording-status">
              <div class="status-indicator idle" id="recordingStatus">
                <span>Pronto para gravar</span>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h3 class="card-title">Última Transcrição</h3></div>
              <div id="lastTranscription" class="text-muted">Nenhuma transcrição ainda</div>
            </div>
          </div>
        </div>

        <div id="settingsTab" class="tab-content hidden">
          <div class="card">
            <div class="card-header"><h3 class="card-title">⌨️ Hotkeys</h3></div>
            <div class="form-group">
              <label class="form-label">Iniciar/Parar Gravação</label>
              <input type="text" class="form-input" id="hotkeyStartStop" value="F2">
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">🎯 Provedor de Transcrição</h3>
              <div id="providerStatus" class="provider-status"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Escolha o provedor</label>
              <select class="form-select" id="transcriptionProvider">
                <option value="assemblyai">AssemblyAI (Nuvem)</option>
                <option value="faster-whisper">Faster Whisper (Local)</option>
              </select>
              <small class="form-help">AssemblyAI requer internet e chave API. Faster Whisper roda localmente.</small>
            </div>
          </div>

          <div class="card" id="assemblyaiConfig">
            <div class="card-header"><h3 class="card-title">🌐 Configurações AssemblyAI</h3></div>
            <div class="form-group">
              <label class="form-label">Chave API AssemblyAI</label>
              <input type="password" class="form-input" id="apiKey" placeholder="Sua chave da API">
              <small class="form-help">Obtenha sua chave em <a href="https://www.assemblyai.com/" target="_blank">assemblyai.com</a></small>
            </div>
            <div class="form-group">
              <label class="form-label">Idioma</label>
              <select class="form-select" id="language">
                <option value="pt">Português Brasileiro</option>
                <option value="en">Inglês</option>
              </select>
            </div>
            <div class="form-group">
              <button class="btn btn-secondary" id="testAssemblyBtn">🧪 Testar Conexão</button>
            </div>
          </div>

          <div class="card hidden" id="whisperConfig">
            <div class="card-header"><h3 class="card-title">🤖 Configurações Faster Whisper</h3></div>
            <div class="form-group">
              <label class="form-label">Tamanho do Modelo</label>
              <select class="form-select" id="whisperModelSize">
                <option value="tiny">Tiny (~39 MB) - Mais rápido</option>
                <option value="base">Base (~74 MB) - Recomendado</option>
                <option value="small">Small (~244 MB) - Boa qualidade</option>
                <option value="medium">Medium (~769 MB) - Alta qualidade</option>
                <option value="large">Large (~1550 MB) - Máxima qualidade</option>
                <option value="large-v2">Large-v2 (~1550 MB) - Melhorado</option>
                <option value="large-v3">Large-v3 (~1550 MB) - Mais recente</option>
              </select>
              <small class="form-help">Modelos maiores têm melhor qualidade mas são mais lentos</small>
            </div>
            <div class="form-group">
              <label class="form-label">Dispositivo</label>
              <select class="form-select" id="whisperDevice">
                <option value="cpu">CPU - Compatível com qualquer sistema</option>
                <option value="cuda">CUDA - GPU NVIDIA (requer CUDA instalado)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tipo de Computação</label>
              <select class="form-select" id="whisperComputeType">
                <option value="int8">INT8 - Mais rápido, menor memória</option>
                <option value="int8_float16">INT8 + Float16 - Balanceado</option>
                <option value="float16">Float16 - Melhor qualidade (GPU)</option>
                <option value="float32">Float32 - Máxima qualidade</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Caminho do Python</label>
              <input type="text" class="form-input" id="whisperPythonPath" value="python" placeholder="python">
              <small class="form-help">Comando para executar Python (ex: python, python3, C:\\Python\\python.exe)</small>
            </div>
            <div class="form-group">
              <button class="btn btn-secondary" id="testWhisperBtn">🧪 Testar Whisper</button>
            </div>
            <div class="alert alert-info">
              <strong>📋 Requisitos:</strong><br>
              • Python 3.8+ instalado<br>
              • Execute: <code>pip install faster-whisper</code><br>
              • Para GPU: CUDA Toolkit instalado
            </div>
          </div>

          <div class="text-center">
            <button class="btn btn-primary" id="saveSettingsBtn">💾 Salvar Configurações</button>
          </div>
        </div>

        <div id="historyTab" class="tab-content hidden">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">📋 Histórico</h3>
              <button class="btn btn-danger" id="clearHistoryBtn">🗑️ Limpar</button>
            </div>
            <div id="historyList"></div>
          </div>
        </div>

        <div id="aboutTab" class="tab-content hidden">
          <div class="card text-center">
            <h2>🎤 OpenWispr</h2>
            <p>Alternativa open source para transcrição de voz</p>
            <p><strong>Versão:</strong> 1.0.0</p>
          </div>
        </div>
      </main>
    `;

    this.updateUI();
  }

  setupEventListeners() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = (e.target as HTMLElement).dataset.tab;
        if (!tabName) return;
        this.switchTab(tabName);
      });
    });

    document.getElementById('startRecordBtn')?.addEventListener('click', () => {
      this.startRecording();
    });

    document.getElementById('stopRecordBtn')?.addEventListener('click', () => {
      this.stopRecording();
    });

    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
      this.clearHistory();
    });

    // Event listeners para configurações de transcrição
    document.getElementById('transcriptionProvider')?.addEventListener('change', (e) => {
      const provider = (e.target as HTMLSelectElement).value;
      this.toggleProviderConfig(provider);
    });

    document.getElementById('testAssemblyBtn')?.addEventListener('click', () => {
      this.testAssemblyAI();
    });

    document.getElementById('testWhisperBtn')?.addEventListener('click', () => {
      this.testFasterWhisper();
    });

    window.electronAPI.onRecordingStarted(() => {
      this.recordingState.isRecording = true;
      this.updateRecordingStatus();
    });

    window.electronAPI.onRecordingStopped(() => {
      this.recordingState.isRecording = false;
      this.updateRecordingStatus();
    });

    window.electronAPI.onTranscriptionCompleted((session: TranscriptionSession) => {
      this.transcriptionHistory.unshift(session);
      this.updateLastTranscription(session.transcription);
      this.updateHistoryUI();
    });

    window.electronAPI.onError((error: string) => {
      alert('❌ Erro: ' + error);
    });
  }

  switchTab(tabName: string) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    document.getElementById(`${tabName}Tab`)?.classList.remove('hidden');
  }

  async startRecording() {
    try {
      await window.electronAPI.startRecording();
    } catch (error) {
      alert('Erro ao iniciar gravação');
    }
  }

  async stopRecording() {
    try {
      await window.electronAPI.stopRecording();
    } catch (error) {
      alert('Erro ao parar gravação');
    }
  }

  updateRecordingStatus() {
    const startBtn = document.getElementById('startRecordBtn');
    const stopBtn = document.getElementById('stopRecordBtn');
    const status = document.getElementById('recordingStatus');

    if (this.recordingState.isRecording) {
      startBtn?.classList.add('hidden');
      stopBtn?.classList.remove('hidden');
      if (status) status.innerHTML = '<div class="pulse"></div><span>🎤 Gravando...</span>';
    } else {
      startBtn?.classList.remove('hidden');
      stopBtn?.classList.add('hidden');
      if (status) status.innerHTML = '<span>Pronto para gravar</span>';
    }
  }

  updateLastTranscription(text: string) {
    const element = document.getElementById('lastTranscription');
    if (element) {
      element.textContent = text;
      element.classList.remove('text-muted');
    }
  }

  updateUI() {
    if (!this.settings) return;
    
    // Configurações da API
    const apiKey = document.getElementById('apiKey') as HTMLInputElement;
    const language = document.getElementById('language') as HTMLSelectElement;
    
    if (apiKey) apiKey.value = this.settings.api.assemblyAiKey;
    if (language) language.value = this.settings.api.language;

    // Configurações de transcrição
    const providerSelect = document.getElementById('transcriptionProvider') as HTMLSelectElement;
    if (providerSelect) {
      providerSelect.value = this.settings.transcription.provider;
      this.toggleProviderConfig(this.settings.transcription.provider);
    }

    // Configurações do Faster Whisper
    const whisperModelSize = document.getElementById('whisperModelSize') as HTMLSelectElement;
    const whisperDevice = document.getElementById('whisperDevice') as HTMLSelectElement;
    const whisperComputeType = document.getElementById('whisperComputeType') as HTMLSelectElement;
    const whisperPythonPath = document.getElementById('whisperPythonPath') as HTMLInputElement;

    if (whisperModelSize) whisperModelSize.value = this.settings.transcription.fasterWhisper.modelSize;
    if (whisperDevice) whisperDevice.value = this.settings.transcription.fasterWhisper.device;
    if (whisperComputeType) whisperComputeType.value = this.settings.transcription.fasterWhisper.computeType;
    if (whisperPythonPath) whisperPythonPath.value = this.settings.transcription.fasterWhisper.pythonPath;

    this.updateHistoryUI();
    this.updateProviderStatus();
  }

  updateHistoryUI() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    if (this.transcriptionHistory.length === 0) {
      historyList.innerHTML = '<p class="text-muted text-center">Nenhuma transcrição</p>';
      return;
    }

    historyList.innerHTML = this.transcriptionHistory.map(session => `
      <div class="history-item">
        <div class="history-meta">
          <span>${new Date(session.timestamp).toLocaleString('pt-BR')}</span>
          <span>${session.duration?.toFixed(1)}s</span>
        </div>
        <div class="history-text">${session.transcription}</div>
      </div>
    `).join('');
  }

  async saveSettings() {
    try {
      // Configurações da API
      const apiKey = (document.getElementById('apiKey') as HTMLInputElement)?.value;
      const language = (document.getElementById('language') as HTMLSelectElement)?.value;

      await window.electronAPI.updateSettings('api', {
        assemblyAiKey: apiKey,
        language: language,
      });

      // Configurações de transcrição
      const provider = (document.getElementById('transcriptionProvider') as HTMLSelectElement)?.value;
      const whisperModelSize = (document.getElementById('whisperModelSize') as HTMLSelectElement)?.value;
      const whisperDevice = (document.getElementById('whisperDevice') as HTMLSelectElement)?.value;
      const whisperComputeType = (document.getElementById('whisperComputeType') as HTMLSelectElement)?.value;
      const whisperPythonPath = (document.getElementById('whisperPythonPath') as HTMLInputElement)?.value;

      await window.electronAPI.updateSettings('transcription', {
        provider: provider,
        fasterWhisper: {
          modelSize: whisperModelSize,
          device: whisperDevice,
          computeType: whisperComputeType,
          pythonPath: whisperPythonPath
        }
      });

      // Atualizar configurações locais
      this.settings = await window.electronAPI.getSettings();
      this.updateProviderStatus();

      alert('✅ Configurações salvas!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    }
  }

  async clearHistory() {
    if (confirm('Limpar histórico?')) {
      try {
        await window.electronAPI.clearHistory();
        this.transcriptionHistory = [];
        this.updateHistoryUI();
        alert('✅ Histórico limpo!');
      } catch (error) {
        alert('Erro ao limpar histórico');
      }
    }
  }

  toggleProviderConfig(provider: string) {
    const assemblyConfig = document.getElementById('assemblyaiConfig');
    const whisperConfig = document.getElementById('whisperConfig');

    if (provider === 'assemblyai') {
      assemblyConfig?.classList.remove('hidden');
      whisperConfig?.classList.add('hidden');
    } else if (provider === 'faster-whisper') {
      assemblyConfig?.classList.add('hidden');
      whisperConfig?.classList.remove('hidden');
    }
  }

  async updateProviderStatus() {
    try {
      const providerInfo = await window.electronAPI.getCurrentProvider();
      const statusElement = document.getElementById('providerStatus');
      
      if (statusElement && providerInfo) {
        const statusClass = providerInfo.isConfigured ? 'status-ok' : 'status-error';
        const statusIcon = providerInfo.isConfigured ? '✅' : '❌';
        statusElement.innerHTML = `
          <span class="${statusClass}">
            ${statusIcon} ${providerInfo.name} ${providerInfo.isConfigured ? '(Configurado)' : '(Não configurado)'}
          </span>
        `;
      }
    } catch (error) {
      console.error('Erro ao obter status do provedor:', error);
    }
  }

  async testAssemblyAI() {
    const button = document.getElementById('testAssemblyBtn') as HTMLButtonElement;
    const originalText = button.textContent;
    
    try {
      button.textContent = '🔄 Testando...';
      button.disabled = true;

      const result = await window.electronAPI.testAPI();
      
      if (result) {
        alert('✅ Conexão com AssemblyAI funcionando!');
      } else {
        alert('❌ Falha na conexão com AssemblyAI. Verifique sua chave API.');
      }
    } catch (error) {
      console.error('Erro ao testar AssemblyAI:', error);
      alert('❌ Erro ao testar AssemblyAI: ' + error);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  async testFasterWhisper() {
    const button = document.getElementById('testWhisperBtn') as HTMLButtonElement;
    const originalText = button.textContent;
    
    try {
      button.textContent = '🔄 Testando...';
      button.disabled = true;

      // Primeiro, salvar as configurações atuais do Whisper
      const whisperModelSize = (document.getElementById('whisperModelSize') as HTMLSelectElement)?.value;
      const whisperDevice = (document.getElementById('whisperDevice') as HTMLSelectElement)?.value;
      const whisperComputeType = (document.getElementById('whisperComputeType') as HTMLSelectElement)?.value;
      const whisperPythonPath = (document.getElementById('whisperPythonPath') as HTMLInputElement)?.value;

      await window.electronAPI.updateSettings('transcription', {
        provider: 'faster-whisper',
        fasterWhisper: {
          modelSize: whisperModelSize,
          device: whisperDevice,
          computeType: whisperComputeType,
          pythonPath: whisperPythonPath
        }
      });

      const result = await window.electronAPI.testAPI();
      
      if (result) {
        alert('✅ Faster Whisper funcionando!\n\nPython encontrado e biblioteca faster-whisper disponível.');
      } else {
        alert('❌ Faster Whisper não está funcionando.\n\nVerifique:\n• Python está instalado\n• Execute: pip install faster-whisper\n• Caminho do Python está correto');
      }
    } catch (error) {
      console.error('Erro ao testar Faster Whisper:', error);
      alert('❌ Erro ao testar Faster Whisper: ' + error);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OpenWisprUI();
});
