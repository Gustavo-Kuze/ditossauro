import { uIOhook, UiohookKey } from 'uiohook-napi';
import { HotkeyConfig } from './types';
import { EventEmitter } from 'events';

/**
 * Mapeamento de nomes de teclas para códigos do uiohook
 */
const KEY_CODE_MAP: Record<string, number> = {
  // Modificadores
  'Control': UiohookKey.Ctrl,
  'ControlLeft': UiohookKey.CtrlLeft,
  'ControlRight': UiohookKey.CtrlRight,
  'Shift': UiohookKey.Shift,
  'ShiftLeft': UiohookKey.ShiftLeft,
  'ShiftRight': UiohookKey.ShiftRight,
  'Alt': UiohookKey.Alt,
  'AltLeft': UiohookKey.AltLeft,
  'AltRight': UiohookKey.AltRight,
  'Meta': UiohookKey.Meta,
  'MetaLeft': UiohookKey.MetaLeft,
  'MetaRight': UiohookKey.MetaRight,

  // Teclas de função
  'F1': UiohookKey.F1,
  'F2': UiohookKey.F2,
  'F3': UiohookKey.F3,
  'F4': UiohookKey.F4,
  'F5': UiohookKey.F5,
  'F6': UiohookKey.F6,
  'F7': UiohookKey.F7,
  'F8': UiohookKey.F8,
  'F9': UiohookKey.F9,
  'F10': UiohookKey.F10,
  'F11': UiohookKey.F11,
  'F12': UiohookKey.F12,

  // Teclas especiais
  'Escape': UiohookKey.Escape,
  'Space': UiohookKey.Space,
  'Enter': UiohookKey.Enter,
  'Tab': UiohookKey.Tab,
  'Backspace': UiohookKey.Backspace,

  // Números
  '0': UiohookKey.Digit0,
  '1': UiohookKey.Digit1,
  '2': UiohookKey.Digit2,
  '3': UiohookKey.Digit3,
  '4': UiohookKey.Digit4,
  '5': UiohookKey.Digit5,
  '6': UiohookKey.Digit6,
  '7': UiohookKey.Digit7,
  '8': UiohookKey.Digit8,
  '9': UiohookKey.Digit9,

  // Letras
  'A': UiohookKey.A, 'B': UiohookKey.B, 'C': UiohookKey.C, 'D': UiohookKey.D,
  'E': UiohookKey.E, 'F': UiohookKey.F, 'G': UiohookKey.G, 'H': UiohookKey.H,
  'I': UiohookKey.I, 'J': UiohookKey.J, 'K': UiohookKey.K, 'L': UiohookKey.L,
  'M': UiohookKey.M, 'N': UiohookKey.N, 'O': UiohookKey.O, 'P': UiohookKey.P,
  'Q': UiohookKey.Q, 'R': UiohookKey.R, 'S': UiohookKey.S, 'T': UiohookKey.T,
  'U': UiohookKey.U, 'V': UiohookKey.V, 'W': UiohookKey.W, 'X': UiohookKey.X,
  'Y': UiohookKey.Y, 'Z': UiohookKey.Z,
};

export interface HotkeyManagerEvents {
  'hotkey-pressed': () => void;
  'hotkey-released': () => void;
  'cancel-pressed': () => void;
}

export declare interface HotkeyManager {
  on<U extends keyof HotkeyManagerEvents>(
    event: U,
    listener: HotkeyManagerEvents[U]
  ): this;

  emit<U extends keyof HotkeyManagerEvents>(
    event: U,
    ...args: Parameters<HotkeyManagerEvents[U]>
  ): boolean;
}

export class HotkeyManager extends EventEmitter {
  private startStopConfig: HotkeyConfig | null = null;
  private cancelKey: string | null = null;
  private pressedKeys = new Set<number>();
  private isHotkeyActive = false;
  private isListening = false;
  private lastToggleTime = 0;
  private readonly DEBOUNCE_MS = 100; // Debounce para evitar múltiplos toggles

  constructor() {
    super();
  }

  /**
   * Registra as hotkeys
   */
  register(startStopConfig: HotkeyConfig, cancelKey?: string): void {
    this.startStopConfig = startStopConfig;
    this.cancelKey = cancelKey || null;

    if (!this.isListening) {
      this.startListening();
    }

    const keysStr = startStopConfig.keys.join('+');
    console.log(`✅ Hotkey registrada: ${keysStr} (modo: ${startStopConfig.mode})`);
    if (cancelKey) {
      console.log(`✅ Tecla de cancelamento: ${cancelKey}`);
    }
  }

  /**
   * Remove o registro de todas as hotkeys
   */
  unregister(): void {
    this.stopListening();
    this.startStopConfig = null;
    this.cancelKey = null;
    this.pressedKeys.clear();
    this.isHotkeyActive = false;
    console.log('🔇 Hotkeys desregistradas');
  }

  /**
   * Inicia a escuta de eventos de teclado
   */
  private startListening(): void {
    if (this.isListening) return;

    uIOhook.on('keydown', (event) => {
      this.pressedKeys.add(event.keycode);
      this.checkHotkey();
    });

    uIOhook.on('keyup', (event) => {
      const wasHotkeyActive = this.isHotkeyActive;
      this.pressedKeys.delete(event.keycode);

      // Se era uma hotkey ativa e foi solta
      if (wasHotkeyActive && !this.checkHotkey()) {
        if (this.startStopConfig?.mode === 'push-to-talk') {
          this.emit('hotkey-released');
        }
      }
    });

    uIOhook.start();
    this.isListening = true;
    console.log('🎧 Iniciando escuta de hotkeys...');
  }

  /**
   * Para a escuta de eventos de teclado
   */
  private stopListening(): void {
    if (!this.isListening) return;

    try {
      uIOhook.stop();
      this.isListening = false;
      console.log('🔇 Escuta de hotkeys parada');
    } catch (error) {
      console.error('Erro ao parar uIOhook:', error);
    }
  }

  /**
   * Verifica se a combinação de teclas está pressionada
   */
  private checkHotkey(): boolean {
    if (!this.startStopConfig) return false;

    const requiredKeyCodes = this.startStopConfig.keys
      .map(key => KEY_CODE_MAP[key])
      .filter(code => code !== undefined);

    if (requiredKeyCodes.length === 0) return false;

    // Verificar se todas as teclas necessárias estão pressionadas
    const allKeysPressed = requiredKeyCodes.every(code => this.pressedKeys.has(code));

    // Verificar tecla de cancelamento
    if (this.cancelKey) {
      const cancelKeyCode = KEY_CODE_MAP[this.cancelKey];
      if (cancelKeyCode && this.pressedKeys.has(cancelKeyCode)) {
        this.emit('cancel-pressed');
        return false;
      }
    }

    if (allKeysPressed && !this.isHotkeyActive) {
      // Hotkey foi pressionada
      this.isHotkeyActive = true;

      if (this.startStopConfig.mode === 'toggle') {
        // Modo toggle: emitir apenas se passou o tempo de debounce
        const now = Date.now();
        if (now - this.lastToggleTime > this.DEBOUNCE_MS) {
          this.lastToggleTime = now;
          this.emit('hotkey-pressed');
        }
      } else {
        // Modo push-to-talk: emitir imediatamente
        this.emit('hotkey-pressed');
      }

      return true;
    } else if (!allKeysPressed && this.isHotkeyActive) {
      // Hotkey foi solta
      this.isHotkeyActive = false;
      return false;
    }

    return this.isHotkeyActive;
  }

  /**
   * Destrói o gerenciador de hotkeys
   */
  destroy(): void {
    this.unregister();
  }
}
