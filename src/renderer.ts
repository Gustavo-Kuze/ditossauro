import './index.css';
import { AppSettings, TranscriptionSession } from './types';

class OpenWisprUI {
  private settings: AppSettings | null = null;
  private recordingState = { isRecording: false };
  private transcriptionHistory: TranscriptionSession[] = [];

  // Helper method to create SVG icons
  private createIcon(name: string, size = 24): string {
    const icons: { [key: string]: string } = {
      'home': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      'settings': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
      'history': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`,
      'info': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
      'mic': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
      'square': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>`,
      'save': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
      'trash': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
      'test': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2"/><path d="M8.5 2h7"/><path d="M14.5 16h-5"/></svg>`
    };
    return icons[name] || '';
  }

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
        <div class="logo">
          <span class="logo-icon" id="logoIcon"></span>
          <h1>OpenWispr</h1>
        </div>
      </div>

      <nav class="nav-tabs">
        <button class="nav-tab active" data-tab="home">
          <span class="tab-icon" id="homeIcon"></span>
          <span>Início</span>
        </button>
        <button class="nav-tab" data-tab="settings">
          <span class="tab-icon" id="settingsIcon"></span>
          <span>Configurações</span>
        </button>
        <button class="nav-tab" data-tab="history">
          <span class="tab-icon" id="historyIcon"></span>
          <span>Histórico</span>
        </button>
        <button class="nav-tab" data-tab="about">
          <span class="tab-icon" id="aboutIcon"></span>
          <span>Sobre</span>
        </button>
      </nav>

      <main class="content">
        <div id="homeTab" class="tab-content">
          <div class="recording-section">
            <h2>Transcrição de Voz</h2>
            <p class="text-muted" id="hotkeyHint">Pressione <strong>Ctrl + Win</strong> para gravar</p>
            
            <div class="recording-controls">
              <button class="record-btn start" id="startRecordBtn">
                <span class="record-icon" id="startIcon"></span>
              </button>
              <button class="record-btn stop hidden" id="stopRecordBtn">
                <span class="record-icon" id="stopIcon"></span>
              </button>
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
              <label class="form-label">Modo de Gravação</label>
              <select class="form-select" id="hotkeyMode">
                <option value="toggle">Toggle - Pressione uma vez para gravar, pressione novamente para parar</option>
                <option value="push-to-talk">Push-to-Talk - Mantenha pressionado para gravar, solte para parar</option>
              </select>
              <small class="form-help">Push-to-Talk é ideal para gravações rápidas. Segure as teclas para gravar e solte para transcrever automaticamente.</small>
            </div>

            <div class="form-group">
              <label class="form-label">Combinação de Teclas</label>
              <div id="hotkeyKeysContainer" style="margin-bottom: 10px;">
                <!-- As teclas selecionadas aparecerão aqui -->
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 5px;">
                  <input type="checkbox" class="hotkey-modifier" value="Control"> Ctrl
                </label>
                <label style="display: flex; align-items: center; gap: 5px;">
                  <input type="checkbox" class="hotkey-modifier" value="Shift"> Shift
                </label>
                <label style="display: flex; align-items: center; gap: 5px;">
                  <input type="checkbox" class="hotkey-modifier" value="Alt"> Alt
                </label>
                <label style="display: flex; align-items: center; gap: 5px;">
                  <input type="checkbox" class="hotkey-modifier" value="Meta"> Win/Cmd
                </label>
              </div>
              <div style="margin-top: 10px;">
                <label class="form-label">Tecla Adicional (Opcional)</label>
                <select class="form-select" id="hotkeyExtraKey">
                  <option value="">Nenhuma (apenas modificadores)</option>
                  <option value="Space">Espaço</option>
                  <option value="F1">F1</option>
                  <option value="F2">F2</option>
                  <option value="F3">F3</option>
                  <option value="F4">F4</option>
                  <option value="F5">F5</option>
                  <option value="F6">F6</option>
                  <option value="F7">F7</option>
                  <option value="F8">F8</option>
                  <option value="F9">F9</option>
                  <option value="F10">F10</option>
                  <option value="F11">F11</option>
                  <option value="F12">F12</option>
                </select>
              </div>
              <small class="form-help">
                <strong>Configuração Atual:</strong> <span id="currentHotkeyDisplay">Control + Meta</span><br>
                Exemplo: Para gravar com Ctrl+Win, marque "Ctrl" e "Win/Cmd"
              </small>
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
                <option value="groq">Groq (Nuvem - Ultra Rápido) ⚡</option>
                <option value="assemblyai">AssemblyAI (Nuvem)</option>
                <option value="faster-whisper">Faster Whisper (Local)</option>
              </select>
              <small class="form-help">Groq oferece transcrição ultra-rápida com Whisper Large V3. AssemblyAI tem alta precisão. Faster Whisper roda localmente.</small>
            </div>
          </div>

          <div class="card" id="groqConfig">
            <div class="card-header"><h3 class="card-title">⚡ Configurações Groq</h3></div>
            <div class="form-group">
              <label class="form-label">Chave API Groq</label>
              <input type="password" class="form-input" id="groqApiKey" placeholder="Sua chave da API Groq">
              <small class="form-help">Obtenha sua chave em <a href="https://console.groq.com/keys" target="_blank">console.groq.com/keys</a></small>
            </div>
            <div class="form-group">
              <label class="form-label">Modelo</label>
              <select class="form-select" id="groqModelName">
                <option value="whisper-large-v3">Whisper Large V3 - Melhor qualidade (10.3% WER)</option>
                <option value="whisper-large-v3-turbo">Whisper Large V3 Turbo - Mais rápido (12% WER)</option>
              </select>
              <small class="form-help">V3 tem melhor precisão. Turbo é mais rápido e econômico.</small>
            </div>
            <div class="form-group">
              <label class="form-label">Idioma</label>
              <select class="form-select" id="groqLanguage">
                <option value="">Auto - Detectar automaticamente</option>
                <option value="pt">Português</option>
                <option value="en">English</option>
              </select>
              <small class="form-help">Auto deixa o Whisper detectar o idioma automaticamente. Selecionar o idioma pode melhorar a precisão.</small>
            </div>
            <div class="form-group">
              <button class="btn btn-secondary" id="testGroqBtn">
                <span class="btn-icon" id="testGroqIcon"></span>
                <span>Testar Conexão</span>
              </button>
            </div>
            <div class="alert alert-info">
              <strong>💡 Groq Info:</strong><br>
              • Transcrição ultra-rápida em nuvem<br>
              • Usa Whisper Large V3 da OpenAI<br>
              • Suporta detecção automática de idioma<br>
              • Limite: 25 MB por arquivo (grátis)<br>
              • Suporta múltiplos formatos de áudio
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
              <button class="btn btn-secondary" id="testAssemblyBtn">
                <span class="btn-icon" id="testAssemblyIcon"></span>
                <span>Testar Conexão</span>
              </button>
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
              <button class="btn btn-secondary" id="testWhisperBtn">
                <span class="btn-icon" id="testWhisperIcon"></span>
                <span>Testar Whisper</span>
              </button>
            </div>
            <div class="alert alert-info">
              <strong>📋 Requisitos:</strong><br>
              • Python 3.8+ instalado<br>
              • Execute: <code>pip install faster-whisper</code><br>
              • Para GPU: CUDA Toolkit instalado
            </div>
          </div>

          <div class="text-center">
            <button class="btn btn-primary" id="saveSettingsBtn">
              <span class="btn-icon" id="saveIcon"></span>
              <span>Salvar Configurações</span>
            </button>
          </div>
        </div>

        <div id="historyTab" class="tab-content hidden">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Histórico</h3>
              <button class="btn btn-danger" id="clearHistoryBtn">
                <span class="btn-icon" id="clearIcon"></span>
                <span>Limpar</span>
              </button>
            </div>
            <div id="historyList"></div>
          </div>
        </div>

        <div id="aboutTab" class="tab-content hidden">
          <div class="card text-center">
            <div class="about-logo" id="aboutLogo"></div>
            <h2>OpenWispr</h2>
            <p>Alternativa open source para transcrição de voz</p>
            <p><strong>Versão:</strong> 1.0.0</p>
          </div>
        </div>
      </main>
    `;

    this.initializeIcons();
    this.updateUI();
  }

  initializeIcons() {
    // Logo icon
    const logoIcon = document.getElementById('logoIcon');
    if (logoIcon) logoIcon.innerHTML = this.createIcon('mic', 24);

    // Navigation icons
    const homeIcon = document.getElementById('homeIcon');
    if (homeIcon) homeIcon.innerHTML = this.createIcon('home', 18);

    const settingsIcon = document.getElementById('settingsIcon');
    if (settingsIcon) settingsIcon.innerHTML = this.createIcon('settings', 18);

    const historyIcon = document.getElementById('historyIcon');
    if (historyIcon) historyIcon.innerHTML = this.createIcon('history', 18);

    const aboutIcon = document.getElementById('aboutIcon');
    if (aboutIcon) aboutIcon.innerHTML = this.createIcon('info', 18);

    // Recording buttons
    const startIcon = document.getElementById('startIcon');
    if (startIcon) startIcon.innerHTML = this.createIcon('mic', 48);

    const stopIcon = document.getElementById('stopIcon');
    if (stopIcon) stopIcon.innerHTML = this.createIcon('square', 48);

    // Test buttons
    const testGroqIcon = document.getElementById('testGroqIcon');
    if (testGroqIcon) testGroqIcon.innerHTML = this.createIcon('test', 16);

    const testAssemblyIcon = document.getElementById('testAssemblyIcon');
    if (testAssemblyIcon) testAssemblyIcon.innerHTML = this.createIcon('test', 16);

    const testWhisperIcon = document.getElementById('testWhisperIcon');
    if (testWhisperIcon) testWhisperIcon.innerHTML = this.createIcon('test', 16);

    // Save button
    const saveIcon = document.getElementById('saveIcon');
    if (saveIcon) saveIcon.innerHTML = this.createIcon('save', 16);

    // Clear button
    const clearIcon = document.getElementById('clearIcon');
    if (clearIcon) clearIcon.innerHTML = this.createIcon('trash', 16);

    // About logo
    const aboutLogo = document.getElementById('aboutLogo');
    if (aboutLogo) aboutLogo.innerHTML = this.createIcon('mic', 64);
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

    document.getElementById('testGroqBtn')?.addEventListener('click', () => {
      this.testGroq();
    });

    // Event listeners para hotkey modifiers
    document.querySelectorAll('.hotkey-modifier').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateHotkeyDisplay();
      });
    });

    document.getElementById('hotkeyExtraKey')?.addEventListener('change', () => {
      this.updateHotkeyDisplay();
    });

    document.getElementById('hotkeyMode')?.addEventListener('change', () => {
      this.updateHotkeyModeInfo();
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

    // Configurações de API
    const groqApiKey = document.getElementById('groqApiKey') as HTMLInputElement;
    if (groqApiKey) groqApiKey.value = this.settings.api.groqApiKey;

    // Configurações de Hotkeys
    const hotkeyMode = document.getElementById('hotkeyMode') as HTMLSelectElement;
    if (hotkeyMode) {
      hotkeyMode.value = this.settings.hotkeys.startStop.mode;
    }

    // Marcar os modificadores corretos
    const keys = this.settings.hotkeys.startStop.keys;
    document.querySelectorAll('.hotkey-modifier').forEach(checkbox => {
      const input = checkbox as HTMLInputElement;
      input.checked = keys.includes(input.value);
    });

    // Selecionar tecla extra se houver
    const extraKeySelect = document.getElementById('hotkeyExtraKey') as HTMLSelectElement;
    if (extraKeySelect) {
      const extraKey = keys.find(k => !['Control', 'Shift', 'Alt', 'Meta'].includes(k));
      extraKeySelect.value = extraKey || '';
    }

    this.updateHotkeyDisplay();

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

    // Configurações do Groq
    const groqModelName = document.getElementById('groqModelName') as HTMLSelectElement;
    const groqLanguage = document.getElementById('groqLanguage') as HTMLSelectElement;
    if (groqModelName) groqModelName.value = this.settings.transcription.groq.modelName;
    if (groqLanguage) groqLanguage.value = this.settings.transcription.groq.language;

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
    this.updateHotkeyHint();
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
      // Configurações de Hotkeys
      const hotkeyMode = (document.getElementById('hotkeyMode') as HTMLSelectElement)?.value as 'toggle' | 'push-to-talk';

      const selectedKeys: string[] = [];
      document.querySelectorAll('.hotkey-modifier:checked').forEach(checkbox => {
        selectedKeys.push((checkbox as HTMLInputElement).value);
      });

      const extraKey = (document.getElementById('hotkeyExtraKey') as HTMLSelectElement)?.value;
      if (extraKey) {
        selectedKeys.push(extraKey);
      }

      if (selectedKeys.length === 0) {
        alert('⚠️ Selecione pelo menos uma tecla para a gravação!');
        return;
      }

      await window.electronAPI.updateSettings('hotkeys', {
        startStop: {
          keys: selectedKeys,
          mode: hotkeyMode
        },
        cancel: 'Escape'
      });

      // Notificar que as hotkeys foram atualizadas
      window.electronAPI.notifyHotkeysUpdated();

      // Configurações da API
      const apiKey = (document.getElementById('apiKey') as HTMLInputElement)?.value;
      const groqApiKey = (document.getElementById('groqApiKey') as HTMLInputElement)?.value;
      const language = (document.getElementById('language') as HTMLSelectElement)?.value;

      await window.electronAPI.updateSettings('api', {
        assemblyAiKey: apiKey,
        groqApiKey: groqApiKey,
        language: language,
      });

      // Configurações de transcrição
      const provider = (document.getElementById('transcriptionProvider') as HTMLSelectElement)?.value;
      const groqModelName = (document.getElementById('groqModelName') as HTMLSelectElement)?.value;
      const groqLanguage = (document.getElementById('groqLanguage') as HTMLSelectElement)?.value;
      const whisperModelSize = (document.getElementById('whisperModelSize') as HTMLSelectElement)?.value;
      const whisperDevice = (document.getElementById('whisperDevice') as HTMLSelectElement)?.value;
      const whisperComputeType = (document.getElementById('whisperComputeType') as HTMLSelectElement)?.value;
      const whisperPythonPath = (document.getElementById('whisperPythonPath') as HTMLInputElement)?.value;

      await window.electronAPI.updateSettings('transcription', {
        provider: provider,
        groq: {
          modelName: groqModelName,
          language: groqLanguage
        },
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
    const groqConfig = document.getElementById('groqConfig');
    const assemblyConfig = document.getElementById('assemblyaiConfig');
    const whisperConfig = document.getElementById('whisperConfig');

    // Hide all first
    groqConfig?.classList.add('hidden');
    assemblyConfig?.classList.add('hidden');
    whisperConfig?.classList.add('hidden');

    // Show the selected one
    if (provider === 'groq') {
      groqConfig?.classList.remove('hidden');
    } else if (provider === 'assemblyai') {
      assemblyConfig?.classList.remove('hidden');
    } else if (provider === 'faster-whisper') {
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

  async testGroq() {
    const button = document.getElementById('testGroqBtn') as HTMLButtonElement;
    const originalText = button.textContent;

    try {
      button.textContent = '🔄 Testando...';
      button.disabled = true;

      // Salvar configurações do Groq
      const groqApiKey = (document.getElementById('groqApiKey') as HTMLInputElement)?.value;
      const groqModelName = (document.getElementById('groqModelName') as HTMLSelectElement)?.value;
      const groqLanguage = (document.getElementById('groqLanguage') as HTMLSelectElement)?.value;

      await window.electronAPI.updateSettings('api', {
        assemblyAiKey: this.settings?.api.assemblyAiKey || '',
        groqApiKey: groqApiKey,
        language: this.settings?.api.language || 'pt'
      });

      await window.electronAPI.updateSettings('transcription', {
        provider: 'groq',
        groq: {
          modelName: groqModelName,
          language: groqLanguage
        },
        fasterWhisper: this.settings?.transcription.fasterWhisper || {}
      });

      const result = await window.electronAPI.testAPI();

      if (result) {
        alert('✅ Groq funcionando!\n\nConexão estabelecida e modelo pronto para transcrição.');
      } else {
        alert('❌ Groq não está funcionando.\n\nVerifique:\n• Chave API está correta\n• Você tem acesso à API Groq\n• Internet está funcionando');
      }
    } catch (error) {
      console.error('Erro ao testar Groq:', error);
      alert('❌ Erro ao testar Groq: ' + error);
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

  updateHotkeyDisplay() {
    const selectedKeys: string[] = [];
    document.querySelectorAll('.hotkey-modifier:checked').forEach(checkbox => {
      selectedKeys.push((checkbox as HTMLInputElement).value);
    });

    const extraKey = (document.getElementById('hotkeyExtraKey') as HTMLSelectElement)?.value;
    if (extraKey) {
      selectedKeys.push(extraKey);
    }

    const displayElement = document.getElementById('currentHotkeyDisplay');
    if (displayElement) {
      if (selectedKeys.length === 0) {
        displayElement.textContent = 'Nenhuma tecla selecionada';
        displayElement.style.color = 'red';
      } else {
        const keyNames = selectedKeys.map(key => {
          switch(key) {
            case 'Control': return 'Ctrl';
            case 'Meta': return 'Win';
            case 'Space': return 'Espaço';
            default: return key;
          }
        });
        displayElement.textContent = keyNames.join(' + ');
        displayElement.style.color = '#4CAF50';
      }
    }
  }

  updateHotkeyModeInfo() {
    this.updateHotkeyHint();
  }

  updateHotkeyHint() {
    const homeHint = document.getElementById('hotkeyHint');

    if (homeHint && this.settings) {
      const keys = this.settings.hotkeys.startStop.keys;
      const mode = this.settings.hotkeys.startStop.mode;

      const keyNames = keys.map(key => {
        switch(key) {
          case 'Control': return 'Ctrl';
          case 'Meta': return 'Win';
          case 'Space': return 'Espaço';
          default: return key;
        }
      });
      const keysDisplay = keyNames.join(' + ');

      if (mode === 'push-to-talk') {
        homeHint.innerHTML = `Mantenha <strong>${keysDisplay}</strong> pressionado para gravar, solte para transcrever`;
      } else {
        homeHint.innerHTML = `Pressione <strong>${keysDisplay}</strong> para gravar`;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OpenWisprUI();
});
