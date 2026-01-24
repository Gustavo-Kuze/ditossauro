import './index.css';
import { AppSettings, TranscriptionSession } from './types';
import { i18n } from './i18n';

class DitossauroUI {
  private settings: AppSettings | null = null;
  private recordingState = { isRecording: false };
  private transcriptionHistory: TranscriptionSession[] = [];
  private lastTranscriptionText = '';
  private appVersion = '1.0.0';
  private appAuthor = 'Unknown';
  private appIconPath = '';
  private copyTimers = new WeakMap<HTMLElement, number>();
  private toastContainer: HTMLElement | null = null;

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
      'test': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2"/><path d="M8.5 2h7"/><path d="M14.5 16h-5"/></svg>`,
      'target': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
      'zap': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
      'lightbulb': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
      'keyboard': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/></svg>`,
      'globe': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
      'cpu': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
      'clipboard': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`,
      'copy': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
      'check': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      'refresh': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>`,
      'download': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
      'sliders': `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="-7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-5 7.5e-6"/></svg>`,
    };
    return icons[name] || '';
  }

  // Toast notification icons
  private getToastIcon(type: 'success' | 'error' | 'warning' | 'info'): SVGElement {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    switch (type) {
      case 'success': {
        const path1 = document.createElementNS(svgNS, 'path');
        path1.setAttribute('d', 'M22 11.08V12a10 10 0 1 1-5.93-9.14');
        const polyline1 = document.createElementNS(svgNS, 'polyline');
        polyline1.setAttribute('points', '22 4 12 14.01 9 11.01');
        svg.appendChild(path1);
        svg.appendChild(polyline1);
        break;
      }
      case 'error': {
        const circle1 = document.createElementNS(svgNS, 'circle');
        circle1.setAttribute('cx', '12');
        circle1.setAttribute('cy', '12');
        circle1.setAttribute('r', '10');
        const line1 = document.createElementNS(svgNS, 'line');
        line1.setAttribute('x1', '15');
        line1.setAttribute('y1', '9');
        line1.setAttribute('x2', '9');
        line1.setAttribute('y2', '15');
        const line2 = document.createElementNS(svgNS, 'line');
        line2.setAttribute('x1', '9');
        line2.setAttribute('y1', '9');
        line2.setAttribute('x2', '15');
        line2.setAttribute('y2', '15');
        svg.appendChild(circle1);
        svg.appendChild(line1);
        svg.appendChild(line2);
        break;
      }
      case 'warning': {
        const path2 = document.createElementNS(svgNS, 'path');
        path2.setAttribute('d', 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z');
        const line3 = document.createElementNS(svgNS, 'line');
        line3.setAttribute('x1', '12');
        line3.setAttribute('y1', '9');
        line3.setAttribute('x2', '12');
        line3.setAttribute('y2', '13');
        const line4 = document.createElementNS(svgNS, 'line');
        line4.setAttribute('x1', '12');
        line4.setAttribute('y1', '17');
        line4.setAttribute('x2', '12.01');
        line4.setAttribute('y2', '17');
        svg.appendChild(path2);
        svg.appendChild(line3);
        svg.appendChild(line4);
        break;
      }
      case 'info': {
        const circle2 = document.createElementNS(svgNS, 'circle');
        circle2.setAttribute('cx', '12');
        circle2.setAttribute('cy', '12');
        circle2.setAttribute('r', '10');
        const line5 = document.createElementNS(svgNS, 'line');
        line5.setAttribute('x1', '12');
        line5.setAttribute('y1', '16');
        line5.setAttribute('x2', '12');
        line5.setAttribute('y2', '12');
        const line6 = document.createElementNS(svgNS, 'line');
        line6.setAttribute('x1', '12');
        line6.setAttribute('y1', '8');
        line6.setAttribute('x2', '12.01');
        line6.setAttribute('y2', '8');
        svg.appendChild(circle2);
        svg.appendChild(line5);
        svg.appendChild(line6);
        break;
      }
    }

    return svg;
  }

  // Create toast container if it doesn't exist
  private ensureToastContainer(): HTMLElement {
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.className = 'toast-container';
      document.body.appendChild(this.toastContainer);
    }
    return this.toastContainer;
  }

  // Show a toast notification
  private showToast(type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string, duration = 5000): void {
    const container = this.ensureToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Create icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'toast-icon';
    iconContainer.appendChild(this.getToastIcon(type));

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'toast-content';

    const titleElement = document.createElement('div');
    titleElement.className = 'toast-title';
    titleElement.textContent = title;
    contentContainer.appendChild(titleElement);

    if (message) {
      const messageElement = document.createElement('div');
      messageElement.className = 'toast-message';
      messageElement.textContent = message;
      contentContainer.appendChild(messageElement);
    }

    // Create close button with SVG
    const svgNS = 'http://www.w3.org/2000/svg';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Close');
    
    const closeSvg = document.createElementNS(svgNS, 'svg');
    closeSvg.setAttribute('width', '16');
    closeSvg.setAttribute('height', '16');
    closeSvg.setAttribute('viewBox', '0 0 24 24');
    closeSvg.setAttribute('fill', 'none');
    closeSvg.setAttribute('stroke', 'currentColor');
    closeSvg.setAttribute('stroke-width', '2');
    closeSvg.setAttribute('stroke-linecap', 'round');
    closeSvg.setAttribute('stroke-linejoin', 'round');

    const line1 = document.createElementNS(svgNS, 'line');
    line1.setAttribute('x1', '18');
    line1.setAttribute('y1', '6');
    line1.setAttribute('x2', '6');
    line1.setAttribute('y2', '18');
    
    const line2 = document.createElementNS(svgNS, 'line');
    line2.setAttribute('x1', '6');
    line2.setAttribute('y1', '6');
    line2.setAttribute('x2', '18');
    line2.setAttribute('y2', '18');
    
    closeSvg.appendChild(line1);
    closeSvg.appendChild(line2);
    closeBtn.appendChild(closeSvg);

    // Append all children to toast
    toast.appendChild(iconContainer);
    toast.appendChild(contentContainer);
    toast.appendChild(closeBtn);

    // Handle close button click
    closeBtn.addEventListener('click', () => this.dismissToast(toast));

    container.appendChild(toast);

    // Auto-dismiss after duration
    setTimeout(() => this.dismissToast(toast), duration);
  }

  // Dismiss a toast with animation
  private dismissToast(toast: HTMLElement): void {
    if (toast.classList.contains('toast-exit')) return; // Already dismissing

    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => {
      toast.remove();
    }, { once: true });
  }

  constructor() {
    this.init();
  }

  async init() {
    try {
      this.settings = await window.electronAPI.getSettings();
      this.appVersion = await window.electronAPI.getVersion();
      this.appAuthor = await window.electronAPI.getAuthor();
      this.appIconPath = await window.electronAPI.getAppIconPath();

      // Initialize i18n with user's locale
      await i18n.init(this.settings.locale || 'pt-BR');

      this.transcriptionHistory = await window.electronAPI.getHistory();
      this.recordingState = await window.electronAPI.getRecordingState();

      this.setupUI();
      this.setupIPCListeners();
      this.attachDOMListeners();
      this.updateRecordingStatus();

      // Show last transcription if history exists
      if (this.transcriptionHistory.length > 0) {
        this.updateLastTranscription(this.transcriptionHistory[0].transcription);
      }

      console.log('✅ Ditossauro initialized');
    } catch (error) {
      console.error('❌ Error:', error);
      this.showToast('error', i18n.t('errors.error'), i18n.t('errors.initError'));
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
          <h1>Ditossauro</h1>
        </div>
      </div>

      <nav class="nav-tabs">
        <button class="nav-tab active" data-tab="home">
          <span class="tab-icon" id="homeIcon"></span>
          <span>${i18n.t('navigation.home')}</span>
        </button>
        <button class="nav-tab" data-tab="settings">
          <span class="tab-icon" id="settingsIcon"></span>
          <span>${i18n.t('navigation.settings')}</span>
        </button>
        <button class="nav-tab" data-tab="history">
          <span class="tab-icon" id="historyIcon"></span>
          <span>${i18n.t('navigation.history')}</span>
        </button>
        <button class="nav-tab" data-tab="about">
          <span class="tab-icon" id="aboutIcon"></span>
          <span>${i18n.t('navigation.about')}</span>
        </button>
      </nav>

      <main class="content">
        <div id="homeTab" class="tab-content">
          <div class="recording-section">
            <h2>${i18n.t('recording.title')}</h2>
            <p class="text-muted" id="hotkeyHint"></p>
            
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
                <span>${i18n.t('recording.readyToRecord')}</span>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3 class="card-title">${i18n.t('recording.lastTranscription')}</h3>
                <button class="history-copy-btn hidden" id="copyLastTranscriptionBtn" aria-label="${i18n.t('history.copy')}" title="${i18n.t('history.copy')}">
                  <span class="copy-icon" id="copyLastIcon"></span>
                </button>
              </div>
              <div id="lastTranscription" class="text-muted">${i18n.t('recording.noTranscription')}</div>
            </div>
          </div>
        </div>

        <div id="settingsTab" class="tab-content hidden">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">
                <span class="title-icon" id="languageTitleIcon"></span>
                <span>${i18n.t('settings.language.title')}</span>
              </h3>
            </div>
            <div class="form-group">
              <label class="form-label">${i18n.t('settings.language.label')}</label>
              <select class="form-select" id="languageSelect">
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
              </select>
              <small class="form-help">${i18n.t('settings.language.help')}</small>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">
                <span class="title-icon" id="hotkeysTitleIcon"></span>
                <span>${i18n.t('settings.hotkeys.title')}</span>
              </h3>
            </div>

            <div class="form-group">
              <label class="form-label">${i18n.t('settings.hotkeys.recordingMode')}</label>
              <select class="form-select" id="hotkeyMode">
                <option value="toggle">${i18n.t('settings.hotkeys.toggle')}</option>
                <option value="push-to-talk">${i18n.t('settings.hotkeys.pushToTalk')}</option>
              </select>
              <small class="form-help">${i18n.t('settings.hotkeys.pushToTalkHelp')}</small>
            </div>

            <div class="form-group">
              <label class="form-label">${i18n.t('settings.hotkeys.keyCombination')}</label>
              <div id="hotkeyKeysContainer" style="margin-bottom: 10px;">
                <!-- Selected keys will appear here -->
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
                <label class="form-label">${i18n.t('settings.hotkeys.extraKey')}</label>
                <select class="form-select" id="hotkeyExtraKey">
                  <option value="">${i18n.t('settings.hotkeys.noExtraKey')}</option>
                  <option value="Space">${i18n.t('common.space')}</option>
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
                <strong>${i18n.t('settings.hotkeys.currentConfig')}</strong> <span id="currentHotkeyDisplay">Control + Meta</span><br>
                ${i18n.t('settings.hotkeys.example')}
              </small>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">
                <span class="title-icon" id="providerTitleIcon"></span>
                <span>${i18n.t('settings.provider.title')}</span>
              </h3>
              <div id="providerStatus" class="provider-status"></div>
            </div>
            <div class="form-group">
              <label class="form-label">${i18n.t('settings.provider.choose')}</label>
              <select class="form-select" id="transcriptionProvider">
                <option value="groq">${i18n.t('settings.provider.groq')}</option>
                <option value="assemblyai">${i18n.t('settings.provider.assemblyai')}</option>
                <option value="faster-whisper">${i18n.t('settings.provider.fasterWhisper')}</option>
              </select>
              <small class="form-help">${i18n.t('settings.provider.groqHelp')}</small>
            </div>
          </div>

          <div class="card" id="groqConfig">
            <div class="card-header">
              <h3 class="card-title">
                <span class="title-icon" id="groqTitleIcon"></span>
                <span>${i18n.t('settings.groq.title')}</span>
              </h3>
            </div>
            <div class="form-group">
              <label class="form-label">${i18n.t('settings.groq.apiKey')}</label>
              <input type="password" class="form-input" id="groqApiKey" placeholder="${i18n.t('settings.groq.apiKeyPlaceholder')}">
              <small class="form-help">${i18n.t('settings.groq.apiKeyHelp')} <a href="https://console.groq.com/keys" target="_blank">console.groq.com/keys</a></small>
            </div>
            <div class="form-group">
              <label class="form-label">${i18n.t('settings.groq.model')}</label>
              <select class="form-select" id="groqModelName">
                <option value="whisper-large-v3">${i18n.t('settings.groq.modelLargeV3')}</option>
                <option value="whisper-large-v3-turbo">${i18n.t('settings.groq.modelLargeV3Turbo')}</option>
              </select>
              <small class="form-help">${i18n.t('settings.groq.modelHelp')}</small>
            </div>
            <div class="form-group">
              <label class="form-label">${i18n.t('settings.groq.language')}</label>
              <select class="form-select" id="groqLanguage">
                <option value="">${i18n.t('settings.groq.languageAuto')}</option>
                <option value="pt">${i18n.t('settings.groq.languagePortuguese')}</option>
                <option value="en">${i18n.t('settings.groq.languageEnglish')}</option>
              </select>
              <small class="form-help">${i18n.t('settings.groq.languageHelp')}</small>
            </div>
            <div class="form-group">
              <button class="btn btn-secondary" id="testGroqBtn">
                <span class="btn-icon" id="testGroqIcon"></span>
                <span>${i18n.t('settings.groq.testConnection')}</span>
              </button>
            </div>
            <div class="alert alert-info">
              <strong>
                <span class="inline-icon" id="groqInfoIcon"></span>
                ${i18n.t('settings.groq.info.title')}
              </strong><br>
              • ${i18n.t('settings.groq.info.line1')}<br>
              • ${i18n.t('settings.groq.info.line2')}<br>
              • ${i18n.t('settings.groq.info.line3')}<br>
              • ${i18n.t('settings.groq.info.line4')}<br>
              • ${i18n.t('settings.groq.info.line5')}
            </div>
          </div>

          <div class="card" id="assemblyaiConfig">
            <div class="card-header">
              <h3 class="card-title">
                <span class="title-icon" id="assemblyaiTitleIcon"></span>
                <span>${i18n.t('settings.assemblyai.title')}</span>
              </h3>
            </div>
            <div class="form-group">
              <label class="form-label">${i18n.t('settings.assemblyai.apiKey')}</label>
              <input type="password" class="form-input" id="apiKey" placeholder="${i18n.t('settings.assemblyai.apiKeyPlaceholder')}">
              <small class="form-help">${i18n.t('settings.assemblyai.apiKeyHelp')} <a href="https://www.assemblyai.com/" target="_blank">assemblyai.com</a></small>
            </div>
            <div class="form-group">
              <label class="form-label">${i18n.t('settings.assemblyai.language')}</label>
              <select class="form-select" id="language">
                <option value="pt">${i18n.t('settings.assemblyai.languagePortuguese')}</option>
                <option value="en">${i18n.t('settings.assemblyai.languageEnglish')}</option>
              </select>
            </div>
            <div class="form-group">
              <button class="btn btn-secondary" id="testAssemblyBtn">
                <span class="btn-icon" id="testAssemblyIcon"></span>
                <span>${i18n.t('settings.assemblyai.testConnection')}</span>
              </button>
            </div>
          </div>

          <div class="card hidden" id="whisperConfig">
            <div class="card-header">
              <h3 class="card-title">
                <span class="title-icon" id="whisperTitleIcon"></span>
                <span>${i18n.t('settings.whisper.title')}</span>
              </h3>
            </div>
            <div class="form-group">
              <label class="form-label">${i18n.t('settings.whisper.modelSize')}</label>
              <select class="form-select" id="whisperModelSize">
                <option value="tiny">${i18n.t('settings.whisper.modelTiny')}</option>
                <option value="base">${i18n.t('settings.whisper.modelBase')}</option>
                <option value="small">${i18n.t('settings.whisper.modelSmall')}</option>
                <option value="medium">${i18n.t('settings.whisper.modelMedium')}</option>
                <option value="large">${i18n.t('settings.whisper.modelLarge')}</option>
                <option value="large-v2">${i18n.t('settings.whisper.modelLargeV2')}</option>
                <option value="large-v3">${i18n.t('settings.whisper.modelLargeV3')}</option>
              </select>
              <small class="form-help">${i18n.t('settings.whisper.modelHelp')}</small>
            </div>
            <div class="form-group">
              <label class="form-label">${i18n.t('settings.whisper.device')}</label>
              <select class="form-select" id="whisperDevice">
                <option value="cpu">${i18n.t('settings.whisper.deviceCPU')}</option>
                <option value="cuda">${i18n.t('settings.whisper.deviceCUDA')}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">${i18n.t('settings.whisper.computeType')}</label>
              <select class="form-select" id="whisperComputeType">
                <option value="int8">${i18n.t('settings.whisper.computeInt8')}</option>
                <option value="int8_float16">${i18n.t('settings.whisper.computeInt8Float16')}</option>
                <option value="float16">${i18n.t('settings.whisper.computeFloat16')}</option>
                <option value="float32">${i18n.t('settings.whisper.computeFloat32')}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">${i18n.t('settings.whisper.pythonPath')}</label>
              <input type="text" class="form-input" id="whisperPythonPath" value="python" placeholder="${i18n.t('settings.whisper.pythonPathPlaceholder')}">
              <small class="form-help">${i18n.t('settings.whisper.pythonPathHelp')}</small>
            </div>
            <div class="form-group">
              <button class="btn btn-secondary" id="testWhisperBtn">
                <span class="btn-icon" id="testWhisperIcon"></span>
                <span>${i18n.t('settings.whisper.testWhisper')}</span>
              </button>
            </div>
            <div class="alert alert-info">
              <strong>
                <span class="inline-icon" id="whisperReqIcon"></span>
                ${i18n.t('settings.whisper.requirements.title')}
              </strong><br>
              • ${i18n.t('settings.whisper.requirements.line1')}<br>
              • ${i18n.t('settings.whisper.requirements.line2')} <code>pip install faster-whisper</code><br>
              • ${i18n.t('settings.whisper.requirements.line3')}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">
                <span class="title-icon" id="behaviorTitleIcon"></span>
                <span>${i18n.t('settings.behavior.title')}</span>
              </h3>
            </div>
            <div class="form-group">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="showFloatingWindow" checked>
                <span>${i18n.t('settings.behavior.showFloatingWindow')}</span>
              </label>
              <small class="form-help">${i18n.t('settings.behavior.showFloatingWindowHelp')}</small>
              <label class="toggle">
                <input type="checkbox" id="notifyOnTranscription">
                <span class="toggle-slider"></span>
                <span class="toggle-label">${i18n.t('settings.behavior.notifyOnTranscription')}</span>
              </label>
              <small class="form-help">${i18n.t('settings.behavior.notifyOnTranscriptionHelp')}</small>
              <label class="toggle">
                <input type="checkbox" id="launchAtStartup">
                <span class="toggle-slider"></span>
                <span class="toggle-label">${i18n.t('settings.behavior.launchAtStartup')}</span>
              </label>
              <small class="form-help">${i18n.t('settings.behavior.launchAtStartupHelp')}</small>
            </div>
          </div>

          <div class="text-center">
            <button class="btn btn-primary" id="saveSettingsBtn">
              <span class="btn-icon" id="saveIcon"></span>
              <span>${i18n.t('settings.save')}</span>
            </button>
          </div>
        </div>

        <div id="historyTab" class="tab-content hidden">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">${i18n.t('history.title')}</h3>
              <button class="btn btn-danger" id="clearHistoryBtn">
                <span class="btn-icon" id="clearIcon"></span>
                <span>${i18n.t('history.clear')}</span>
              </button>
            </div>
            <div id="historyList"></div>
          </div>
        </div>

        <div id="aboutTab" class="tab-content hidden">
          <div class="card text-center">
            <div class="about-logo" id="aboutLogo"></div>
            <h2>Ditossauro</h2>
            <p>${i18n.t('about.description')}</p>
            <p><strong>${i18n.t('app.version')}:</strong> ${this.appVersion}</p>
            <p><strong>Author:</strong> ${this.appAuthor}</p>
            <div style="margin-top: 24px;">
              <button class="btn btn-primary" id="checkForUpdatesBtn">
                <span class="btn-icon" id="updateIcon"></span>
                <span>${i18n.t('about.checkForUpdates')}</span>
              </button>
              <div id="updateStatus" style="margin-top: 16px;"></div>
            </div>
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

    // Copy last transcription button
    const copyLastIcon = document.getElementById('copyLastIcon');
    if (copyLastIcon) copyLastIcon.innerHTML = this.createIcon('copy', 16);

    // Update button
    const updateIcon = document.getElementById('updateIcon');
    if (updateIcon) updateIcon.innerHTML = this.createIcon('refresh', 16);

    // About logo
    const aboutLogo = document.getElementById('aboutLogo');
    if (aboutLogo && this.appIconPath) {
      aboutLogo.innerHTML = `<img src="${this.appIconPath}" width="64" height="64" alt="Ditossauro" />`;
    }

    // Settings section title icons
    const languageTitleIcon = document.getElementById('languageTitleIcon');
    if (languageTitleIcon) languageTitleIcon.innerHTML = this.createIcon('globe', 20);

    const hotkeysTitleIcon = document.getElementById('hotkeysTitleIcon');
    if (hotkeysTitleIcon) hotkeysTitleIcon.innerHTML = this.createIcon('keyboard', 20);

    const providerTitleIcon = document.getElementById('providerTitleIcon');
    if (providerTitleIcon) providerTitleIcon.innerHTML = this.createIcon('target', 20);

    const groqTitleIcon = document.getElementById('groqTitleIcon');
    if (groqTitleIcon) groqTitleIcon.innerHTML = this.createIcon('zap', 20);

    const assemblyaiTitleIcon = document.getElementById('assemblyaiTitleIcon');
    if (assemblyaiTitleIcon) assemblyaiTitleIcon.innerHTML = this.createIcon('globe', 20);

    const whisperTitleIcon = document.getElementById('whisperTitleIcon');
    if (whisperTitleIcon) whisperTitleIcon.innerHTML = this.createIcon('cpu', 20);

    const behaviorTitleIcon = document.getElementById('behaviorTitleIcon');
    if (behaviorTitleIcon) behaviorTitleIcon.innerHTML = this.createIcon('sliders', 20);

    // Inline info icons
    const groqInfoIcon = document.getElementById('groqInfoIcon');
    if (groqInfoIcon) groqInfoIcon.innerHTML = this.createIcon('lightbulb', 16);

    const whisperReqIcon = document.getElementById('whisperReqIcon');
    if (whisperReqIcon) whisperReqIcon.innerHTML = this.createIcon('clipboard', 16);
  }

  setupIPCListeners() {
    window.electronAPI.onRecordingStarted(() => {
      this.recordingState.isRecording = true;
      this.updateRecordingStatus();
    });

    window.electronAPI.onRecordingStopped(() => {
      this.recordingState.isRecording = false;
      this.updateRecordingStatus();
    });

    window.electronAPI.onRecordingCanceled(() => {
      this.recordingState.isRecording = false;
      this.updateRecordingStatus();
    });

    window.electronAPI.onTranscriptionCompleted((session: TranscriptionSession) => {
      this.transcriptionHistory.unshift(session);
      this.updateLastTranscription(session.transcription);
      this.updateHistoryUI();
    });

    window.electronAPI.onError((error: string) => {
      this.showToast('error', i18n.t('errors.error'), error);
    });

    // Listen for navigation requests from tray menu
    window.electronAPI.onNavigateTo((page: string) => {
      this.switchTab(page);
    });
  }

  attachDOMListeners() {
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

    document.getElementById('languageSelect')?.addEventListener('change', async (e) => {
      const newLocale = (e.target as HTMLSelectElement).value;
      await window.electronAPI.updateSettings('locale', { locale: newLocale });

      if (this.settings) {
        this.settings.locale = newLocale;
      }

      i18n.setLocale(newLocale);
      this.setupUI();
      // Re-initialize icons because setupUI destroys and recreates elements
      this.initializeIcons();
      this.updateUI();
      this.updateRecordingStatus();
      this.updateHotkeyHint();
      // Reload history to format dates in new locale
      this.updateHistoryUI();
      // Re-attach DOM listeners to new elements
      this.attachDOMListeners();
    });

    document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
      this.clearHistory();
    });

    document.getElementById('copyLastTranscriptionBtn')?.addEventListener('click', async () => {
      await this.copyLastTranscription();
    });

    document.getElementById('checkForUpdatesBtn')?.addEventListener('click', async () => {
      await this.checkForUpdates();
    });

    // Event listeners for transcription settings
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

    // Event listeners for hotkey modifiers
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
      this.showToast('error', i18n.t('errors.error'), i18n.t('errors.startRecordingError'));
    }
  }

  async stopRecording() {
    try {
      await window.electronAPI.stopRecording();
    } catch (error) {
      this.showToast('error', i18n.t('errors.error'), i18n.t('errors.stopRecordingError'));
    }
  }

  updateRecordingStatus() {
    const startBtn = document.getElementById('startRecordBtn');
    const stopBtn = document.getElementById('stopRecordBtn');
    const status = document.getElementById('recordingStatus');

    if (this.recordingState.isRecording) {
      startBtn?.classList.add('hidden');
      stopBtn?.classList.remove('hidden');
      if (status) status.innerHTML = `<div class="pulse"></div><span>🎤 ${i18n.t('recording.recording')}</span>`;
    } else {
      startBtn?.classList.remove('hidden');
      stopBtn?.classList.add('hidden');
      if (status) status.innerHTML = `<span>${i18n.t('recording.readyToRecord')}</span>`;
    }
  }

  updateLastTranscription(text: string) {
    const element = document.getElementById('lastTranscription');
    const copyBtn = document.getElementById('copyLastTranscriptionBtn');

    if (element) {
      element.textContent = text;
      element.classList.remove('text-muted');
    }

    // Store the text for copying
    this.lastTranscriptionText = text;

    // Show the copy button if there's text, hide it otherwise
    if (copyBtn) {
      if (text && text !== i18n.t('recording.noTranscription')) {
        copyBtn.classList.remove('hidden');
      } else {
        copyBtn.classList.add('hidden');
      }
    }
  }

  updateUI() {
    if (!this.settings) return;

    // Language Settings
    const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement;
    if (languageSelect) {
      languageSelect.value = this.settings.locale || 'pt-BR';
    }

    // API Settings
    const groqApiKey = document.getElementById('groqApiKey') as HTMLInputElement;
    if (groqApiKey) groqApiKey.value = this.settings.api.groqApiKey;

    // Configurações de Hotkeys
    const hotkeyMode = document.getElementById('hotkeyMode') as HTMLSelectElement;
    if (hotkeyMode) {
      hotkeyMode.value = this.settings.hotkeys.startStop.mode;
    }

    // Mark the correct modifiers
    const keys = this.settings.hotkeys.startStop.keys;
    document.querySelectorAll('.hotkey-modifier').forEach(checkbox => {
      const input = checkbox as HTMLInputElement;
      input.checked = keys.includes(input.value);
    });

    // Select extra key if any
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

    // Transcription Settings
    const providerSelect = document.getElementById('transcriptionProvider') as HTMLSelectElement;
    if (providerSelect) {
      providerSelect.value = this.settings.transcription.provider;
      this.toggleProviderConfig(this.settings.transcription.provider);
    }

    // Groq Settings
    const groqModelName = document.getElementById('groqModelName') as HTMLSelectElement;
    const groqLanguage = document.getElementById('groqLanguage') as HTMLSelectElement;
    if (groqModelName) groqModelName.value = this.settings.transcription.groq.modelName;
    if (groqLanguage) groqLanguage.value = this.settings.transcription.groq.language;

    // Faster Whisper Settings
    const whisperModelSize = document.getElementById('whisperModelSize') as HTMLSelectElement;
    const whisperDevice = document.getElementById('whisperDevice') as HTMLSelectElement;
    const whisperComputeType = document.getElementById('whisperComputeType') as HTMLSelectElement;
    const whisperPythonPath = document.getElementById('whisperPythonPath') as HTMLInputElement;

    if (whisperModelSize) whisperModelSize.value = this.settings.transcription.fasterWhisper.modelSize;
    if (whisperDevice) whisperDevice.value = this.settings.transcription.fasterWhisper.device;
    if (whisperComputeType) whisperComputeType.value = this.settings.transcription.fasterWhisper.computeType;
    if (whisperPythonPath) whisperPythonPath.value = this.settings.transcription.fasterWhisper.pythonPath;

    // Behavior Settings
    const showFloatingWindowCheckbox = document.getElementById('showFloatingWindow') as HTMLInputElement;
    if (showFloatingWindowCheckbox) {
      showFloatingWindowCheckbox.checked = this.settings.behavior?.showFloatingWindow ?? true;
    }
    const notifyOnTranscription = document.getElementById('notifyOnTranscription') as HTMLInputElement;
    if (notifyOnTranscription) notifyOnTranscription.checked = this.settings.behavior.notifyOnTranscription;
    const launchAtStartup = document.getElementById('launchAtStartup') as HTMLInputElement;
    if (launchAtStartup) launchAtStartup.checked = this.settings.behavior.launchAtStartup;

    this.updateHistoryUI();
    this.updateProviderStatus();
    this.updateHotkeyHint();
  }

  updateHistoryUI() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    // Clear existing content
    historyList.innerHTML = '';

    if (this.transcriptionHistory.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'text-muted text-center';
      emptyMessage.textContent = i18n.t('history.noTranscriptions');
      historyList.appendChild(emptyMessage);
      return;
    }

    // Create history items using DOM manipulation to prevent XSS
    this.transcriptionHistory.forEach(session => {
      // Create main history item container
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';

      // Create history-meta container
      const historyMeta = document.createElement('div');
      historyMeta.className = 'history-meta';

      // Create history-meta-info container
      const historyMetaInfo = document.createElement('div');
      historyMetaInfo.className = 'history-meta-info';

      // Create timestamp span
      const timestampSpan = document.createElement('span');
      timestampSpan.textContent = new Date(session.timestamp).toLocaleString(i18n.getLocale());
      historyMetaInfo.appendChild(timestampSpan);

      // Create duration span (only if duration is a valid number)
      if (typeof session.duration === 'number' && !isNaN(session.duration)) {
        const durationSpan = document.createElement('span');
        durationSpan.textContent = `${session.duration.toFixed(1)}s`;
        historyMetaInfo.appendChild(durationSpan);
      }

      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'history-copy-btn';
      copyButton.dataset.transcriptionId = session.id;
      copyButton.setAttribute('aria-label', i18n.t('history.copy'));
      copyButton.setAttribute('title', i18n.t('history.copy'));

      // Create copy icon span
      const copyIconSpan = document.createElement('span');
      copyIconSpan.className = 'copy-icon';
      copyIconSpan.innerHTML = this.createIcon('copy', 16);
      copyButton.appendChild(copyIconSpan);

      // Append to history-meta
      historyMeta.appendChild(historyMetaInfo);
      historyMeta.appendChild(copyButton);

      // Create history-text container (using textContent to prevent XSS)
      const historyText = document.createElement('div');
      historyText.className = 'history-text';
      historyText.textContent = session.transcription;

      // Assemble the history item
      historyItem.appendChild(historyMeta);
      historyItem.appendChild(historyText);

      // Append to history list
      historyList.appendChild(historyItem);
    });

    // Attach click handlers to copy buttons
    this.attachHistoryCopyListeners();
  }

  attachHistoryCopyListeners() {
    const copyButtons = document.querySelectorAll('.history-copy-btn');
    copyButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLElement;
        const transcriptionId = target.dataset.transcriptionId;

        if (!transcriptionId) return;

        // Find the transcription session
        const session = this.transcriptionHistory.find(s => s.id === transcriptionId);
        if (!session) return;

        // Copy to clipboard
        await this.copyTranscriptionToClipboard(session.transcription, target);
      });
    });
  }

  async copyTranscriptionToClipboard(text: string, buttonElement: HTMLElement) {
    try {
      // Use Electron's clipboard API through the window API
      await navigator.clipboard.writeText(text);

      // Visual feedback: change icon to checkmark
      const iconSpan = buttonElement.querySelector('.copy-icon');
      if (iconSpan) {
        // Clear any existing timer for this button and reset to base state
        const existingTimer = this.copyTimers.get(buttonElement);
        if (existingTimer) {
          clearTimeout(existingTimer);
          iconSpan.innerHTML = this.createIcon('copy', 16);
          buttonElement.classList.remove('copied');
          buttonElement.setAttribute('title', i18n.t('history.copy'));
          buttonElement.setAttribute('aria-label', i18n.t('history.copy'));
        }

        // Set the copied state
        iconSpan.innerHTML = this.createIcon('check', 16);
        buttonElement.classList.add('copied');
        buttonElement.setAttribute('title', i18n.t('history.copied'));
        buttonElement.setAttribute('aria-label', i18n.t('history.copied'));

        // Schedule reset after 2 seconds
        const timerId = window.setTimeout(() => {
          iconSpan.innerHTML = this.createIcon('copy', 16);
          buttonElement.classList.remove('copied');
          buttonElement.setAttribute('title', i18n.t('history.copy'));
          buttonElement.setAttribute('aria-label', i18n.t('history.copy'));
          this.copyTimers.delete(buttonElement);
        }, 2000);

        // Store the timer ID
        this.copyTimers.set(buttonElement, timerId);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showToast('error', i18n.t('errors.error'), i18n.t('errors.copyToClipboard'));
    }
  }

  async copyLastTranscription() {
    if (!this.lastTranscriptionText) return;

    const copyBtn = document.getElementById('copyLastTranscriptionBtn');
    if (!copyBtn) return;

    // Use the same method as history copy buttons
    await this.copyTranscriptionToClipboard(this.lastTranscriptionText, copyBtn);
  }

  async saveSettings() {
    try {
      // Hotkey Settings
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
        this.showToast('warning', i18n.t('settings.hotkeys.selectAtLeastOne'));
        return;
      }

      await window.electronAPI.updateSettings('hotkeys', {
        startStop: {
          keys: selectedKeys,
          mode: hotkeyMode
        }
      });

      // Notify that hotkeys have been updated
      window.electronAPI.notifyHotkeysUpdated();

      // API Settings
      const apiKey = (document.getElementById('apiKey') as HTMLInputElement)?.value;
      const groqApiKey = (document.getElementById('groqApiKey') as HTMLInputElement)?.value;
      const language = (document.getElementById('language') as HTMLSelectElement)?.value;

      await window.electronAPI.updateSettings('api', {
        assemblyAiKey: apiKey,
        groqApiKey: groqApiKey,
        language: language,
      });

      // Transcription Settings
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

      // Behavior Settings
      const showFloatingWindow = (document.getElementById('showFloatingWindow') as HTMLInputElement)?.checked;

      const notifyOnTranscription = (document.getElementById('notifyOnTranscription') as HTMLInputElement)?.checked;

      const launchAtStartup = (document.getElementById('launchAtStartup') as HTMLInputElement)?.checked;

      await window.electronAPI.updateSettings('behavior', {
        showFloatingWindow: showFloatingWindow,
        notifyOnTranscription: notifyOnTranscription,
        launchAtStartup: launchAtStartup
      });

      // Update local settings
      this.settings = await window.electronAPI.getSettings();
      this.updateProviderStatus();

      this.showToast('success', i18n.t('settings.saved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showToast('error', i18n.t('errors.error'), i18n.t('settings.saveError'));
    }
  }

  async clearHistory() {
    if (confirm(i18n.t('history.confirmClear'))) {
      try {
        await window.electronAPI.clearHistory();
        this.transcriptionHistory = [];
        this.updateHistoryUI();
        this.showToast('success', i18n.t('history.cleared'));
      } catch (error) {
        this.showToast('error', i18n.t('errors.error'), i18n.t('history.clearError'));
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
        const statusText = providerInfo.isConfigured ? i18n.t('settings.provider.configured') : i18n.t('settings.provider.notConfigured');
        statusElement.innerHTML = `
          <span class="${statusClass}">
            ${statusIcon} ${providerInfo.name} (${statusText})
          </span>
        `;
      }
    } catch (error) {
      console.error('Error getting provider status:', error);
    }
  }

  async testAssemblyAI() {
    const button = document.getElementById('testAssemblyBtn') as HTMLButtonElement;
    const originalText = button.textContent;

    try {
      button.textContent = '🔄 ' + i18n.t('settings.assemblyai.testing');
      button.disabled = true;

      const result = await window.electronAPI.testAPI();

      if (result) {
        this.showToast('success', i18n.t('settings.assemblyai.testSuccess'));
      } else {
        this.showToast('error', i18n.t('settings.assemblyai.testError'));
      }
    } catch (error) {
      console.error('Error testing AssemblyAI:', error);
      this.showToast('error', i18n.t('settings.assemblyai.testError'));
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  async testGroq() {
    const button = document.getElementById('testGroqBtn') as HTMLButtonElement;
    const originalText = button.textContent;

    try {
      button.textContent = '🔄 ' + i18n.t('settings.groq.testing');
      button.disabled = true;

      // Save Groq settings
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
        this.showToast('success', i18n.t('settings.groq.testSuccess'));
      } else {
        this.showToast('error', i18n.t('settings.groq.testError'));
      }
    } catch (error) {
      console.error('Error testing Groq:', error);
      this.showToast('error', i18n.t('settings.groq.testError'));
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  async testFasterWhisper() {
    const button = document.getElementById('testWhisperBtn') as HTMLButtonElement;
    const originalText = button.textContent;

    try {
      button.textContent = '🔄 ' + i18n.t('settings.whisper.testing');
      button.disabled = true;

      // First, save the current Whisper settings
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
        this.showToast('success', i18n.t('settings.whisper.testSuccess'));
      } else {
        this.showToast('error', i18n.t('settings.whisper.testError'));
      }
    } catch (error) {
      console.error('Error testing Faster Whisper:', error);
      this.showToast('error', i18n.t('settings.whisper.testError'));
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  async checkForUpdates() {
    const button = document.getElementById('checkForUpdatesBtn') as HTMLButtonElement;
    const statusDiv = document.getElementById('updateStatus');

    if (!button || !statusDiv) return;

    const originalText = button.textContent;
    button.textContent = i18n.t('about.checking');
    button.disabled = true;
    statusDiv.innerHTML = '';

    try {
      const updateInfo = await window.electronAPI.checkForUpdates();

      if (updateInfo.error) {
        statusDiv.innerHTML = `<p style="color: #ef4444; margin-top: 16px;">${i18n.t('about.checkError')}: ${updateInfo.error}</p>`;
      } else if (updateInfo.updateAvailable && updateInfo.latestVersion && updateInfo.downloadUrl) {
        statusDiv.innerHTML = `
          <div style="padding: 20px; background: #1C1F24; border: 1px solid rgba(139, 207, 62, 0.3); border-radius: 8px; margin-top: 16px;">
            <p style="color: #8BCF3E; font-weight: bold; font-size: 16px; margin-bottom: 12px;">
              ${i18n.t('about.updateAvailable')}
            </p>
            <p style="margin: 8px 0; color: #DADADA;">
              <strong style="color: #ffffff;">${i18n.t('about.latestVersion')}:</strong> ${updateInfo.latestVersion}
            </p>
            <button
              id="downloadUpdateBtn"
              class="btn btn-info"
              style="margin-top: 16px;"
            >
              <span class="btn-icon">${this.createIcon('download', 16)}</span>
              <span>${i18n.t('about.downloadUpdate')}</span>
            </button>
          </div>
        `;

        document.getElementById('downloadUpdateBtn')?.addEventListener('click', async () => {
          if (updateInfo.downloadUrl) {
            await window.electronAPI.downloadUpdate(updateInfo.downloadUrl);
          }
        });
      } else {
        statusDiv.innerHTML = `
          <p style="color: #10b981; margin-top: 16px; font-weight: 500;">
            ${i18n.t('about.upToDate')} (${updateInfo.currentVersion})
          </p>
        `;
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      statusDiv.innerHTML = `<p style="color: #ef4444; margin-top: 16px;">${i18n.t('about.checkError')}</p>`;
    } finally {
      button.textContent = originalText || i18n.t('about.checkForUpdates');
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
        displayElement.textContent = 'No key selected';
        displayElement.style.color = 'red';
      } else {
        const keyNames = selectedKeys.map(key => {
          switch (key) {
            case 'Control': return 'Ctrl';
            case 'Meta': return 'Win';
            case 'Space': return 'Space';
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
        switch (key) {
          case 'Control': return 'Ctrl';
          case 'Meta': return 'Win';
          case 'Space': return i18n.t('common.space');
          default: return key;
        }
      });
      const keysDisplay = keyNames.join(' + ');

      if (mode === 'push-to-talk') {
        homeHint.innerHTML = i18n.t('recording.hotkeyHint', { hotkey: keysDisplay });
      } else {
        homeHint.innerHTML = i18n.t('recording.hotkeyHint', { hotkey: keysDisplay });
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DitossauroUI();
});
