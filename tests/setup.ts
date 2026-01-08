import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron APIs globally
if (typeof global.window === 'undefined') {
  (global as any).window = {};
}

// Mock electron module
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      const paths: Record<string, string> = {
        userData: '/mock/user-data',
        temp: '/mock/temp',
        home: '/mock/home',
      };
      return paths[name] || '/mock/path';
    }),
    getName: vi.fn(() => 'OpenWispr'),
    getVersion: vi.fn(() => '1.0.0'),
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    send: vi.fn(),
    removeListener: vi.fn(),
  },
  BrowserWindow: vi.fn(() => ({
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    webContents: {
      send: vi.fn(),
      executeJavaScript: vi.fn(),
    },
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
  })),
  Tray: vi.fn(() => ({
    setImage: vi.fn(),
    setContextMenu: vi.fn(),
    setToolTip: vi.fn(),
  })),
  Menu: {
    buildFromTemplate: vi.fn(),
    setApplicationMenu: vi.fn(),
  },
  nativeImage: {
    createFromPath: vi.fn(() => ({})),
  },
  clipboard: {
    readText: vi.fn(() => ''),
    writeText: vi.fn(),
  },
}));

// Mock native modules (will be overridden in specific tests)
vi.mock('uiohook-napi', () => ({
  uIOhook: {
    on: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  },
  UiohookKey: {
    Ctrl: 29,
    CtrlLeft: 29,
    CtrlRight: 97,
    Shift: 42,
    ShiftLeft: 42,
    ShiftRight: 54,
    Alt: 56,
    AltLeft: 56,
    AltRight: 100,
    Meta: 3675,
    MetaLeft: 3675,
    MetaRight: 3676,
    Escape: 1,
    Space: 57,
    Enter: 28,
    F1: 59,
    F2: 60,
    F3: 61,
    F4: 62,
    F5: 63,
    F6: 64,
    F7: 65,
    F8: 66,
    F9: 67,
    F10: 68,
    F11: 87,
    F12: 88,
    A: 30,
    B: 48,
    C: 46,
    D: 32,
    E: 18,
    F: 33,
    G: 34,
    H: 35,
    I: 23,
    J: 36,
    K: 37,
    L: 38,
    M: 50,
    N: 49,
    O: 24,
    P: 25,
    Q: 16,
    R: 19,
    S: 31,
    T: 20,
    U: 22,
    V: 47,
    W: 17,
    X: 45,
    Y: 21,
    Z: 44,
    Digit0: 11,
    Digit1: 2,
    Digit2: 3,
    Digit3: 4,
    Digit4: 5,
    Digit5: 6,
    Digit6: 7,
    Digit7: 8,
    Digit8: 9,
    Digit9: 10,
  },
}));

vi.mock('robotjs', () => ({
  keyTap: vi.fn(),
  typeString: vi.fn(),
  typeStringDelayed: vi.fn(),
  getMousePos: vi.fn(() => ({ x: 0, y: 0 })),
  moveMouse: vi.fn(),
  mouseClick: vi.fn(),
}));

// Mock Groq SDK
vi.mock('groq-sdk', () => {
  const mockGroqInstance = {
    audio: {
      transcriptions: {
        create: vi.fn(),
      },
    },
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  };

  const MockGroq = vi.fn().mockImplementation(function() {
    return mockGroqInstance;
  });

  return {
    default: MockGroq,
    Groq: MockGroq,
  };
});

// Mock AssemblyAI
vi.mock('assemblyai', () => {
  const mockAssemblyInstance = {
    transcripts: {
      transcribe: vi.fn(),
    },
  };

  const MockAssemblyAI = vi.fn().mockImplementation(function() {
    return mockAssemblyInstance;
  });

  return {
    AssemblyAI: MockAssemblyAI,
  };
});
