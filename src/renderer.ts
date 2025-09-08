import './index.css';

class OpenWisprUI {
  private currentTab = 'home';
  private settings: any = null;
  private recordingState = { isRecording: false };
  private transcriptionHistory: any[] = [];

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
    const app = document.getElementById('app')!;
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
            <div class="card-header"><h3 class="card-title">🌐 API</h3></div>
            <div class="form-group">
              <label class="form-label">Chave API AssemblyAI</label>
              <input type="password" class="form-input" id="apiKey" placeholder="Sua chave da API">
            </div>
            <div class="form-group">
              <label class="form-label">Idioma</label>
              <select class="form-select" id="language">
                <option value="pt">Português Brasileiro</option>
                <option value="en">Inglês</option>
              </select>
            </div>
          </div>

          <div class="text-center">
            <button class="btn btn-primary" id="saveSettingsBtn">💾 Salvar</button>
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
        const tabName = (e.target as HTMLElement).dataset.tab!;
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

    window.electronAPI.onRecordingStarted(() => {
      this.recordingState.isRecording = true;
      this.updateRecordingStatus();
    });

    window.electronAPI.onRecordingStopped(() => {
      this.recordingState.isRecording = false;
      this.updateRecordingStatus();
    });

    window.electronAPI.onTranscriptionCompleted((session: any) => {
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
    
    const apiKey = document.getElementById('apiKey') as HTMLInputElement;
    const language = document.getElementById('language') as HTMLSelectElement;
    
    if (apiKey) apiKey.value = this.settings.api.assemblyAiKey;
    if (language) language.value = this.settings.api.language;

    this.updateHistoryUI();
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
      const apiKey = (document.getElementById('apiKey') as HTMLInputElement)?.value;
      const language = (document.getElementById('language') as HTMLSelectElement)?.value;

      await window.electronAPI.updateSettings('api', {
        assemblyAiKey: apiKey,
        language: language,
      });

      alert('✅ Configurações salvas!');
    } catch (error) {
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
}

document.addEventListener('DOMContentLoaded', () => {
  new OpenWisprUI();
});
