import './floating-window.css';

interface RecordingState {
  isRecording: boolean;
  isPaused?: boolean;
  isProcessing?: boolean;
}

class FloatingWindow {
  private startTime: number | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private animationFrame: number | null = null;
  private state: RecordingState = { isRecording: false };

  constructor() {
    this.init();
  }

  async init() {
    this.setupUI();
    this.setupEventListeners();

    // Get initial state
    try {
      this.state = await window.electronAPI.getRecordingState();
      this.updateState(this.state);
    } catch (error) {
      console.error('Error getting initial state:', error);
    }
  }

  setupUI() {
    const app = document.getElementById('floating-app');
    if (!app) {
      throw new Error('Floating app element not found');
    }

    app.innerHTML = `
      <div class="wrapper">
        <div class="glow"></div>
        <div class="container">
          <div class="drag-handle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5"/>
              <circle cx="15" cy="6" r="1.5"/>
              <circle cx="9" cy="12" r="1.5"/>
              <circle cx="15" cy="12" r="1.5"/>
              <circle cx="9" cy="18" r="1.5"/>
              <circle cx="15" cy="18" r="1.5"/>
            </svg>
          </div>

          <div class="divider"></div>

          <div class="status">
            <button class="mic-button" id="mic-button" title="Start Recording">
              <svg viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
            <div class="status-text">
              <div class="status-label" id="status-label">Ready</div>
              <div class="status-time" id="status-time">00:00:00</div>
            </div>
          </div>

          <div class="visualizer" id="visualizer">
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
          </div>

          <button class="control-btn stop" id="stop-btn" title="Stop Recording">
            <svg viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Microphone button - start recording
    const micBtn = document.getElementById('mic-button');
    micBtn?.addEventListener('click', () => {
      window.electronAPI.startRecording().catch(console.error);
    });

    // Stop button
    const stopBtn = document.getElementById('stop-btn');
    stopBtn?.addEventListener('click', () => {
      window.electronAPI.stopRecording().catch(console.error);
    });

    // Listen for recording events
    window.electronAPI.onRecordingStarted(() => {
      this.state.isRecording = true;
      this.state.isProcessing = false;
      this.updateState(this.state);
      this.startTimer();
      this.startVisualizer();
    });

    window.electronAPI.onRecordingStopped(() => {
      this.state.isRecording = false;
      this.updateState(this.state);
      this.stopTimer();
      this.stopVisualizer();
    });

    window.electronAPI.onProcessingStarted(() => {
      this.state.isProcessing = true;
      this.state.isRecording = false;
      this.updateState(this.state);
      this.stopTimer();
      this.stopVisualizer();
    });

    window.electronAPI.onTranscriptionCompleted(() => {
      this.state.isProcessing = false;
      this.updateState(this.state);
    });

    window.electronAPI.onError((error) => {
      console.error('Error:', error);
      this.state.isRecording = false;
      this.state.isProcessing = false;
      this.updateState(this.state);
      this.stopTimer();
      this.stopVisualizer();
    });
  }

  updateState(state: RecordingState) {
    const micBtn = document.getElementById('mic-button') as HTMLButtonElement;
    const statusLabel = document.getElementById('status-label');
    const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;

    if (!micBtn || !statusLabel || !stopBtn) return;

    // Remove all state classes
    micBtn.classList.remove('recording', 'processing', 'idle');

    if (state.isRecording) {
      // Recording state - show stop button, hide mic button
      micBtn.style.display = 'none';
      stopBtn.style.display = 'flex';
      statusLabel.textContent = 'Listening...';
    } else if (state.isProcessing) {
      // Processing state - hide both buttons, show processing indicator
      micBtn.classList.add('processing');
      micBtn.style.display = 'flex';
      stopBtn.style.display = 'none';
      statusLabel.textContent = 'Processing...';
    } else {
      // Idle state - show mic button, hide stop button
      micBtn.classList.add('idle');
      micBtn.style.display = 'flex';
      stopBtn.style.display = 'none';
      statusLabel.textContent = 'Ready';
    }
  }

  formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  updateTimer() {
    if (!this.startTime) return;
    const elapsed = (Date.now() - this.startTime) / 1000;
    const timeElement = document.getElementById('status-time');
    if (timeElement) {
      timeElement.textContent = this.formatTime(elapsed);
    }
  }

  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => this.updateTimer(), 100);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.startTime = null;
    const timeElement = document.getElementById('status-time');
    if (timeElement) {
      timeElement.textContent = '00:00:00';
    }
  }

  animateVisualizerFrame() {
    const bars = document.querySelectorAll('.bar');
    bars.forEach((bar: Element) => {
      const height = Math.random() * 20 + 8;
      (bar as HTMLElement).style.height = `${height}px`;
    });
    this.animationFrame = requestAnimationFrame(() => this.animateVisualizerFrame());
  }

  startVisualizer() {
    this.animateVisualizerFrame();
  }

  stopVisualizer() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    const bars = document.querySelectorAll('.bar');
    bars.forEach((bar: Element) => {
      (bar as HTMLElement).style.height = '8px';
    });
  }
}

// Initialize when DOM is ready
new FloatingWindow();
