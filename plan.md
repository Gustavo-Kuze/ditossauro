# Plano de Implementação: Cancelamento de Gravação com Tecla C

## 📋 Visão Geral

### Problema Atual
- Ao pressionar `CTRL + META` (transcrição simples) ou `CTRL + Shift + META` (modo comando), a gravação é iniciada
- Ao soltar as teclas de ativação, o áudio é **sempre** enviado para a API do Groq para transcrição
- Não existe forma de cancelar uma gravação em andamento antes de processá-la
- Isso gera desperdício de tokens da API quando o usuário fala algo errado

### Solução Proposta
- Implementar cancelamento de gravação pressionando **C** enquanto segura as teclas de ativação
- **Combinação para cancelar:**
  - Modo transcrição simples: `CTRL + META + C`
  - Modo comando: `CTRL + Shift + META + C`
- A tecla `C` **só cancela se as teclas do hotkey já estiverem pressionadas**
- Pressionar `C` sozinho não faz nada
- Funcionar tanto no modo de transcrição simples quanto no modo de comando
- **Não enviar o áudio para a API** quando a gravação for cancelada
- Fornecer feedback visual ao usuário (ícone da tray, UI)

## 🔍 Análise do Código Atual

### Componentes Existentes

#### 1. HotkeyManager (`src/hotkey-manager.ts`)
- ✅ Possui suporte para tecla de cancelamento (`cancelKey`)
- ✅ Emite evento `cancel-pressed` quando a tecla é configurada
- ⚠️ **PROBLEMA ATUAL:** Usa uma tecla separada (ex: `ESC`) que é verificada independentemente
- ❌ **NÃO possui** lógica para verificar combinação de teclas (hotkey + C)

```typescript
// Lógica ATUAL (problema para nosso requisito)
if (this.cancelKey) {
  const cancelKeyCode = KEY_CODE_MAP[this.cancelKey];
  if (cancelKeyCode && this.pressedKeys.has(cancelKeyCode)) {
    this.emit('cancel-pressed');
    return;
  }
}
```

**O que precisa mudar:**
- Remover verificação de tecla separada
- Implementar verificação de combinação: (hotkeys + C)
- Emitir `cancel-pressed` quando a combinação for detectada

#### 2. AppSettings (`src/types.ts`)
- Possui `cancel: string` em `hotkeys`
- ❌ **NÃO é necessário** para nova abordagem (cancelamento via combinação)

```typescript
// Linha 19-23 (ATUAL)
hotkeys: {
  startStop: HotkeyConfig;
  codeSnippet: HotkeyConfig;
  cancel: string; // ❌ Deve ser removido
};
```

#### 3. DitossauroApp (`src/ditossauro-app.ts`)
- Gerencia estado de gravação (`RecordingState`)
- Inicia/para gravação via IPC com renderer
- Processa áudio e envia para API no método `processAudioData()`
- ❌ **NÃO possui** método `cancelRecording()`
- ❌ Ao chamar `stopRecording()`, sempre chama `processAudioData()` via IPC

**Fluxo atual:**
```
stopRecording() → renderer envia áudio → processAudioData() → API do Groq
```

#### 4. SettingsManager (`src/settings-manager.ts`)
- Possui configuração padrão: `cancel: 'Escape'`
- ❌ **Precisa ser removido** (cancelamento não usa tecla separada)

```typescript
// Linha 19 (ATUAL)
cancel: 'Escape' // ❌ Remover esta linha
```

#### 5. Main.ts (`src/main.ts`)
- Possui listener para evento `cancel-pressed` (linhas 324-329)
- ❌ **Apenas faz log**, não implementa lógica de cancelamento

```typescript
// Linha 324-329 (ATUAL)
this.hotkeyManager.on('cancel-pressed', () => {
  if (this.ditossauroApp.getRecordingState().isRecording) {
    console.log('⏹️ Recording canceled by user');
    // Implement cancellation logic if needed
  }
});
```

#### 6. Web Audio Recorder (injetado no renderer)
- Controla gravação via Web Audio API
- Emite eventos `recording-started` e `recording-stopped`
- Coleta chunks de áudio em buffer
- ❌ Não possui método de cancelamento

## 🎯 Plano de Implementação

### Etapa 1: Atualizar HotkeyManager para Verificar Combinações

#### Arquivo: `src/hotkey-manager.ts`

**Objetivo:** Implementar lógica para detectar cancelamento via (hotkeys + C)

**Remover:**
```typescript
// REMOVER (linha 89)
private cancelKey: string | null = null;

// REMOVER (linha 108)
this.cancelKey = cancelKey || null;

// REMOVER (linha 130)
this.cancelKey = null;

// REMOVER (linhas 198-205)
// Verificação separada de cancelKey
if (this.cancelKey) {
  const cancelKeyCode = KEY_CODE_MAP[this.cancelKey];
  if (cancelKeyCode && this.pressedKeys.has(cancelKeyCode)) {
    this.emit('cancel-pressed');
    return;
  }
}
```

**Adicionar NOVA lógica:**
```typescript
// Adicionar no método checkHotkeys() (após linha 197)

// Primeiro, verificar se tecla C está pressionada
const cKeyCode = KEY_CODE_MAP['C'];
const isCPressed = cKeyCode && this.pressedKeys.has(cKeyCode);

if (isCPressed) {
  // Verificar se hotkey de start/stop está ativo + C
  if (this.startStopConfig) {
    const startStopKeys = this.startStopConfig.keys
      .map(key => KEY_CODE_MAP[key])
      .filter(code => code !== undefined);
    
    // Se todas as teclas do hotkey + C estão pressionadas
    if (startStopKeys.every(code => this.pressedKeys.has(code))) {
      console.log('🚫 Cancel combination detected: start/stop hotkeys + C');
      this.emit('cancel-pressed');
      return; // Cancel detectado, não verificar outros hotkeys
    }
  }
  
  // Verificar se hotkey de code snippet está ativo + C
  if (this.codeSnippetConfig) {
    const codeSnippetKeys = this.codeSnippetConfig.keys
      .map(key => KEY_CODE_MAP[key])
      .filter(code => code !== undefined);
    
    // Se todas as teclas do hotkey + C estão pressionadas
    if (codeSnippetKeys.every(code => this.pressedKeys.has(code))) {
      console.log('🚫 Cancel combination detected: code snippet hotkeys + C');
      this.emit('cancel-pressed');
      return; // Cancel detectado, não verificar outros hotkeys
    }
  }
}

// Se C foi pressionado mas nenhum hotkey ativo, ignorar
// (C sozinho não faz nada)
```

**Atualizar método register():**
```typescript
// Remover parâmetro cancelKey
register(startStopConfig: HotkeyConfig, codeSnippetConfig: HotkeyConfig): void {
  this.startStopConfig = startStopConfig;
  this.codeSnippetConfig = codeSnippetConfig;
  // REMOVER: this.cancelKey = cancelKey || null;

  if (!this.isListening) {
    this.startListening();
  }

  const startStopKeysStr = startStopConfig.keys.join('+');
  const codeSnippetKeysStr = codeSnippetConfig.keys.join('+');
  console.log(`✅ Hotkey registered (start/stop): ${startStopKeysStr} (mode: ${startStopConfig.mode})`);
  console.log(`✅ Hotkey registered (code snippet): ${codeSnippetKeysStr} (mode: ${codeSnippetConfig.mode})`);
  console.log(`✅ Cancel combination: hotkeys + C`); // NOVO log
}
```

**Atualizar método unregister():**
```typescript
unregister(): void {
  this.stopListening();
  this.startStopConfig = null;
  this.codeSnippetConfig = null;
  // REMOVER: this.cancelKey = null;
  this.pressedKeys.clear();
  this.isStartStopHotkeyActive = false;
  this.isCodeSnippetHotkeyActive = false;
  console.log('🔇 Hotkeys unregistered');
}
```

**Atualizar interface HotkeyManagerEvents (não muda):**
```typescript
// Linha 71 (MANTÉM)
'cancel-pressed': () => void;
// Evento continua o mesmo, apenas a forma de disparar muda
```

**Justificativa:**
- A tecla `C` só cancela se as teclas do hotkey já estiverem pressionadas
- Verifica `CTRL + META + C` para start/stop
- Verifica `CTRL + Shift + META + C` para code snippet
- Pressionar `C` sozinho não faz nada
- A verificação de combinação acontece **antes** de processar hotkeys de gravação

### Etapa 2: Remover Configuração de Tecla de Cancelamento

#### Arquivo: `src/types.ts`

**Objetivo:** Remover campo de tecla de cancelamento separada

```typescript
// ATUALIZAR interface AppSettings (linhas 18-25)
export interface AppSettings {
  locale: string;
  hotkeys: {
    startStop: HotkeyConfig;
    codeSnippet: HotkeyConfig;
    // REMOVER: cancel: string;
  };
  // ...
}
```

**Justificativa:**
- Cancelamento agora é feito via combinação (hotkeys + C)
- Não precisa mais de tecla separada

#### Arquivo: `src/settings-manager.ts`

**Objetivo:** Remover configuração padrão de cancelamento

```typescript
// ATUALIZAR defaultSettings (linhas 9-51)
private defaultSettings: AppSettings = {
  // ...
  hotkeys: {
    startStop: {
      keys: ['Control', 'Meta'],
      mode: 'push-to-talk'
    },
    codeSnippet: {
      keys: ['Control', 'Shift', 'Meta'],
      mode: 'push-to-talk'
    },
    // REMOVER: cancel: 'Escape'
  },
  // ...
};

// ATUALIZAR loadSettings() para remover migração de cancel (linhas 71-84)
// REMOVER trecho que migrava cancelKey
```

**Justificativa:**
- Remove referência a tecla de cancelamento separada
- Simplifica configuração

### Etapa 3: Atualizar Tipos e Estado

#### Arquivo: `src/types.ts`

**Objetivo:** Adicionar suporte para estado de cancelamento

```typescript
// Atualizar interface RecordingState
export interface RecordingState {
  isRecording: boolean;
  startTime?: Date;
  audioBuffer?: Buffer[];
  isCanceled?: boolean; // NOVO: flag para indicar cancelamento
}
```

**Justificativa:** A flag `isCanceled` permite diferenciar entre:
- Parada normal (enviar para API)
- Cancelamento (não enviar para API)

### Etapa 4: Implementar Método de Cancelamento no DitossauroApp

#### Arquivo: `src/ditossauro-app.ts`

**Objetivo:** Criar método `cancelRecording()` que interrompe gravação sem processar áudio

```typescript
// Adicionar método público
async cancelRecording(): Promise<void> {
  if (!this.recordingState.isRecording) {
    console.log('⚠️ Not recording, cannot cancel');
    return;
  }

  try {
    console.log('🚫 Canceling recording...');
    
    // Atualizar estado para indicar cancelamento
    this.recordingState = {
      isRecording: false,
      isCanceled: true
    };
    
    // Parar gravação no renderer SEM processar áudio
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      await this.mainWindow.webContents.executeJavaScript(`
        window.audioRecorder.cancelRecording()
      `);
    }
    
    // Emitir evento de cancelamento para UI
    this.emit('recording-canceled');
    
    // Atualizar ícone da tray
    this.emit('tray-icon-update', 'idle');
    
    console.log('✅ Recording canceled successfully');
  } catch (error) {
    console.error('❌ Error canceling recording:', error);
    this.emit('error', error);
  }
}
```

**Justificativa:**
- Define flag `isCanceled: true` para evitar processamento
- Chama método `cancelRecording()` no renderer (diferente de `stopRecording()`)
- Emite eventos para UI atualizar
- Não chama `processAudioData()` (sem API, sem gasto de tokens)

### Etapa 5: Implementar Cancelamento no Web Audio Recorder

#### Arquivo: `src/main.ts` (injeção do Web Audio Recorder)

**Objetivo:** Adicionar método `cancelRecording()` no renderer que descarta áudio

**Localização:** Buscar método `injectWebAudioRecorder()` e adicionar novo método

```typescript
// Adicionar à classe WebAudioRecorderRenderer
async cancelRecording(): Promise<void> {
  if (!this.isRecording) {
    console.log('⚠️ Not recording, cannot cancel');
    return;
  }

  console.log('🚫 Canceling recording in renderer...');

  // Parar gravação
  this.isRecording = false;

  // Parar MediaRecorder
  if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
    this.mediaRecorder.stop();
  }

  // **IMPORTANTE:** Descartar chunks de áudio acumulados
  this.audioChunks = [];

  // Parar tracks de áudio
  if (this.stream) {
    this.stream.getTracks().forEach(track => {
      track.stop();
    });
  }

  // NOTIFICAR via IPC que gravação foi cancelada
  // Isso evita chamar processAudioData()
  window.electronAPI.sendAudioEvent('recording-canceled');
  
  console.log('✅ Recording canceled in renderer, audio discarded');
}
```

**Justificativa:**
- Diferencia de `stopRecording()` (que processa áudio)
- Limpa `audioChunks` para não enviar dados
- Emite evento `recording-canceled` em vez de `recording-stopped`

**ATENÇÃO:** Preciso verificar onde o áudio é enviado após `stopRecording()`:
```typescript
// Provavelmente existe algo assim:
stopRecording() {
  // ... parar gravação ...
  
  // ENVIAR ÁUDIO PARA MAIN PROCESS
  const blob = new Blob(this.audioChunks);
  window.electronAPI.processAudioData(blob, duration);
}
```

Em `cancelRecording()`, **NÃO** devemos enviar o áudio!

### Etapa 6: Atualizar Handler de Áudio no DitossauroApp

#### Arquivo: `src/ditossauro-app.ts`

**Objetivo:** Atualizar `setupAudioHandlers()` para lidar com evento `recording-canceled`

```typescript
// Modificar setupAudioHandlers()
private setupAudioHandlers(): void {
  // Handler para processar áudio (existente)
  ipcMain.handle('process-audio-data', async (_, audioData: number[], duration: number) => {
    // VERIFICAR se foi cancelado
    if (this.recordingState.isCanceled) {
      console.log('⚠️ Recording was canceled, ignoring audio data');
      return { audioFile: null, duration: 0 };
    }
    
    try {
      return await this.processAudioData(audioData, duration);
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  });

  // Handler para eventos de áudio
  ipcMain.on('audio-event', (_, eventType: string, data?: unknown) => {
    switch (eventType) {
      case 'recording-started':
        this.recordingState = { isRecording: true, startTime: new Date() };
        this.emit('recording-started');
        console.log('🎤 Recording started');
        break;
      
      // NOVO: Lidar com cancelamento
      case 'recording-canceled':
        this.recordingState = { isRecording: false, isCanceled: true };
        this.emit('recording-canceled');
        console.log('🚫 Recording canceled');
        break;
      
      case 'recording-stopped':
        // Se foi cancelado, ignorar
        if (this.recordingState.isCanceled) {
          console.log('⚠️ Recording was canceled, ignoring stop event');
          break;
        }
        
        this.recordingState = { isRecording: false };
        this.emit('recording-stopped', data);
        console.log('⏹️ Recording stopped');
        break;
      
      // ... outros casos ...
    }
  });
}
```

**Justificativa:**
- Verifica flag `isCanceled` antes de processar áudio
- Emite evento específico `recording-canceled` para UI
- Ignora evento `recording-stopped` se cancelado

### Etapa 7: Atualizar Chamada de HotkeyManager.register()

#### Arquivo: `src/main.ts`

**Objetivo:** Remover parâmetro `cancelKey` de todas as chamadas a `hotkeyManager.register()`

```typescript
// Buscar chamadas de hotkeyManager.register()
// Deve ser em um método como setupHotkeyManager() ou no construtor

// ANTES:
this.hotkeyManager.register(
  startStopConfig,
  codeSnippetConfig,
  cancelKey  // ❌ REMOVER este parâmetro
);

// DEPOIS:
this.hotkeyManager.register(
  startStopConfig,
  codeSnippetConfig
  // Parâmetro cancelKey removido
);
```

**Justificativa:**
- `HotkeyManager.register()` não aceita mais parâmetro `cancelKey`
- Cancelamento é verificado internamente como combinação (hotkeys + C)

### Etapa 8: Implementar Lógica de Cancelamento no Main.ts

#### Arquivo: `src/main.ts`

**Objetivo:** Atualizar listener de `cancel-pressed` para chamar novo método

```typescript
// Modificar listener existente (linha 324-329)
this.hotkeyManager.on('cancel-pressed', async () => {
  const recordingState = this.ditossauroApp.getRecordingState();
  
  if (recordingState.isRecording) {
    console.log('🚫 Cancel combination pressed (hotkeys + C) during recording');
    
    // Chamar método de cancelamento
    await this.ditossauroApp.cancelRecording();
    
    // Atualizar ícone da tray para idle
    if (this.tray) {
      this.tray.setImage(this.trayIcons.idle);
      this.tray.setToolTip(i18nMain.t('tray.idle'));
    }
    
    // Atualizar floating window se estiver ativa
    if (this.floatingWindow && !this.floatingWindow.isDestroyed()) {
      this.floatingWindow.webContents.send('recording-canceled');
    }
    
    // Resetar estado de processamento de code snippet
    this.isProcessingCodeSnippet = false;
    
    // Notificar usuário via UI principal
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('recording-canceled');
    }
  }
});
```

**Justificativa:**
- Chama método `cancelRecording()` do DitossauroApp
- Atualiza todos os estados visuais (tray, floating window, main window)
- Reseta flags de processamento
- Fornece feedback visual ao usuário

### Etapa 9: Adicionar Eventos à Interface do DitossauroApp

#### Arquivo: `src/ditossauro-app.ts`

**Objetivo:** Documentar novo evento na classe

```typescript
// No topo da classe, após extends EventEmitter
// Adicionar comentário sobre eventos:
/*
Eventos emitidos:
- 'recording-started': Gravação iniciada
- 'recording-stopped': Gravação parada (normal)
- 'recording-canceled': Gravação cancelada (NOVO)
- 'processing-started': Processamento iniciado
- 'processing-completed': Processamento concluído
- 'transcription-completed': Transcrição concluída
- 'error': Erro ocorrido
*/
```

### Etapa 10: Atualizar IPC Bridge no Preload

#### Arquivo: `src/preload.ts`

**Objetivo:** Garantir que evento de cancelamento está disponível no renderer

```typescript
// Verificar se audio-event está na lista de canais permitidos
const electronAPI = {
  invoke: (channel: string, ...args: any[]) => {
    const validChannels = [
      'get-settings',
      'update-settings',
      'process-audio-data',
      // ...
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
  send: (channel: string, ...args: any[]) => {
    const validChannels = [
      'audio-event',
      // ...
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  // ...
};
```

**Justificativa:** O evento `audio-event` já deve existir, mas é bom verificar.

### Etapa 11: Atualizar UI do Renderer

#### Arquivos: `src/renderer.ts`, UI HTML/CSS

**Objetivo:** Adicionar feedback visual quando gravação é cancelada

```typescript
// Em renderer.ts, adicionar listener para evento de cancelamento
window.electronAPI.onRecordingCanceled(() => {
  console.log('🚫 Recording canceled in renderer');
  
  // Atualizar UI
  updateRecordingStatus(false);
  showNotification('Gravação cancelada', 'Pressione as teclas de ativação novamente para gravar.');
  
  // Parar qualquer timer de duração
  stopDurationTimer();
  
  // Resetar indicador de gravação
  hideRecordingIndicator();
});
```

### Etapa 12: Atualizar Floating Window

#### Arquivos: `src/floating-renderer.ts`, `floating_window.html`

**Objetivo:** Mostrar estado de cancelamento na floating window

```typescript
// Em floating-renderer.ts
window.electronAPI.onRecordingCanceled(() => {
  console.log('🚫 Floating window: recording canceled');
  
  // Atualizar UI para estado de cancelamento
  const statusText = document.getElementById('status-text');
  if (statusText) {
    statusText.textContent = 'Cancelado';
    statusText.classList.add('canceled');
  }
  
  // Após breve delay, voltar ao estado idle
  setTimeout(() => {
    updateFloatingWindowStatus('idle');
  }, 1000);
});
```

### Etapa 13: Testes

#### Arquivo: `tests/unit/hotkey-manager.test.ts` (novo) ou existente

**Objetivo:** Adicionar testes para detecção de combinação de cancelamento

```typescript
describe('HotkeyManager - Cancellation Combinations', () => {
  let hotkeyManager: HotkeyManager;
  
  beforeEach(() => {
    hotkeyManager = new HotkeyManager();
    vi.clearAllMocks();
  });
  
  it('should emit cancel-pressed when C is pressed with start/stop hotkeys', () => {
    // Arrange
    const mockEmit = vi.spyOn(hotkeyManager, 'emit');
    const cancelCallback = vi.fn();
    hotkeyManager.on('cancel-pressed', cancelCallback);
    
    hotkeyManager.register(
      { keys: ['Control', 'Meta'], mode: 'push-to-talk' },
      { keys: ['Control', 'Shift', 'Meta'], mode: 'push-to-talk' }
    );
    
    // Simulate pressing Control, Meta, and C
    const mockKeyDown = (keycode: number) => {
      // Simula evento keydown
    };
    
    mockKeyDown(UiohookKey.Ctrl);
    mockKeyDown(UiohookKey.Meta);
    mockKeyDown(UiohookKey.C);
    
    // Assert
    expect(mockEmit).toHaveBeenCalledWith('cancel-pressed');
    expect(cancelCallback).toHaveBeenCalled();
  });
  
  it('should emit cancel-pressed when C is pressed with code snippet hotkeys', () => {
    // Arrange
    const mockEmit = vi.spyOn(hotkeyManager, 'emit');
    const cancelCallback = vi.fn();
    hotkeyManager.on('cancel-pressed', cancelCallback);
    
    hotkeyManager.register(
      { keys: ['Control', 'Meta'], mode: 'push-to-talk' },
      { keys: ['Control', 'Shift', 'Meta'], mode: 'push-to-talk' }
    );
    
    // Simulate pressing Control, Shift, Meta, and C
    const mockKeyDown = (keycode: number) => {
      // Simula evento keydown
    };
    
    mockKeyDown(UiohookKey.Ctrl);
    mockKeyDown(UiohookKey.Shift);
    mockKeyDown(UiohookKey.Meta);
    mockKeyDown(UiohookKey.C);
    
    // Assert
    expect(mockEmit).toHaveBeenCalledWith('cancel-pressed');
    expect(cancelCallback).toHaveBeenCalled();
  });
  
  it('should NOT emit cancel-pressed when C is pressed alone', () => {
    // Arrange
    const mockEmit = vi.spyOn(hotkeyManager, 'emit');
    const cancelCallback = vi.fn();
    hotkeyManager.on('cancel-pressed', cancelCallback);
    
    hotkeyManager.register(
      { keys: ['Control', 'Meta'], mode: 'push-to-talk' },
      { keys: ['Control', 'Shift', 'Meta'], mode: 'push-to-talk' }
    );
    
    // Simulate pressing only C
    const mockKeyDown = (keycode: number) => {
      // Simula evento keydown
    };
    
    mockKeyDown(UiohookKey.C);
    
    // Assert
    expect(mockEmit).not.toHaveBeenCalledWith('cancel-pressed');
    expect(cancelCallback).not.toHaveBeenCalled();
  });
});
```

#### Arquivo: `tests/unit/ditossauro-app.test.ts` (novo) ou existente

**Objetivo:** Adicionar testes para funcionalidade de cancelamento

```typescript
describe('DitossauroApp - Recording Cancellation', () => {
  it('should cancel recording when cancelRecording is called', async () => {
    // Setup
    const mockWindow = createMockBrowserWindow();
    const app = new DitossauroApp(mockWindow);
    await app.startRecording();
    
    // Act
    await app.cancelRecording();
    
    // Assert
    expect(app.getRecordingState().isRecording).toBe(false);
    expect(app.getRecordingState().isCanceled).toBe(true);
  });
  
  it('should not process audio when recording is canceled', async () => {
    // Setup
    const app = new DitossauroApp();
    await app.startRecording();
    await app.cancelRecording();
    
    // Act
    const audioData = [1, 2, 3, 4, 5];
    
    // Assert - should throw or return error
    await expect(
      app.processAudioData(audioData, 1)
    ).rejects.toThrow('Recording was canceled');
  });
  
  it('should emit recording-canceled event', async () => {
    // Setup
    const app = new DitossauroApp();
    const mockEmit = vi.spyOn(app, 'emit');
    await app.startRecording();
    
    // Act
    await app.cancelRecording();
    
    // Assert
    expect(mockEmit).toHaveBeenCalledWith('recording-canceled');
  });
});
```

## 📊 Fluxo de Execução Final

### Cenário 1: Cancelamento no Modo Transcrição Simples

```
1. Usuário pressiona CTRL + META
   → hotkey-pressed emitido
   → startRecording() chamado
   → isRecording = true
   → Ícone da tray mudou para 'recording'

2. Usuário começa a falar
   → Audio sendo gravado

3. Usuário percebe erro e mantém CTRL + META pressionados, adiciona C
   → pressedKeys = { Ctrl, Meta, C }
   → HotkeyManager detecta: startStopKeys + C estão todos pressionados
   → cancel-pressed emitido
   → cancelRecording() chamado
   → isRecording = false
   → isCanceled = true
   → cancelRecording() no renderer
   → audioChunks limpos
   → Ícone da tray voltou para 'idle'
   → UI mostra mensagem: "Gravação cancelada"

4. Usuário solta CTRL + META e C
   → hotkey-released emitido
   → stopRecording() checa isRecording (false)
   → NADA acontece (como deve ser)
```

### Cenário 2: Cancelamento no Modo Comando

```
1. Usuário pressiona CTRL + Shift + META
   → code-snippet-hotkey-pressed emitido
   → setCodeSnippetMode(true)
   → startRecording() chamado
   → isRecording = true
   → isCodeSnippetMode = true
   → Ícone da tray mudou para 'recording'

2. Usuário começa a falar comando
   → Audio sendo gravado

3. Usuário percebe erro e mantém CTRL + Shift + META pressionados, adiciona C
   → pressedKeys = { Ctrl, Shift, Meta, C }
   → HotkeyManager detecta: codeSnippetKeys + C estão todos pressionados
   → cancel-pressed emitido
   → cancelRecording() chamado
   → isRecording = false
   → isCanceled = true
   → cancelRecording() no renderer
   → audioChunks limpos
   → isProcessingCodeSnippet = false
   → isCodeSnippetMode = false
   → Ícone da tray voltou para 'idle'
   → UI mostra mensagem: "Gravação cancelada"

4. Usuário solta CTRL + Shift + META e C
   → code-snippet-hotkey-released emitido
   → handleCodeSnippetRecordingStop() checa isRecording (false)
   → isProcessingCodeSnippet é false
   → NADA acontece (como deve ser)
   → **API não é chamada, tokens não são gastos**
```

### Cenário 3: Pressionar C Sozinho (Deve NÃO Cancelar)

```
1. Usuário pressiona apenas C (nenhum hotkey ativo)
   → pressedKeys = { C }
   → HotkeyManager detecta: isCPressed = true
   → Verifica startStopKeys (Ctrl, Meta) - NÃO estão todos pressionados
   → Verifica codeSnippetKeys (Ctrl, Shift, Meta) - NÃO estão todos pressionados
   → NENHUM evento emitido
   → NADA acontece (como deve ser)
```

## ⚠️ Pontos de Atenção e Riscos

### 1. Race Condition entre Stop e Cancel
**Risco:** Se usuário adiciona C e solta hotkey quase simultaneamente
**Mitigação:**
- Usar flag `isCanceled` para bloquear processamento
- Verificar `isRecording` antes de qualquer operação
- Resetar flag `isCanceled` quando nova gravação iniciar

```typescript
// Em startRecording()
async startRecording(): Promise<void> {
  // Resetar flag de cancelamento
  this.recordingState = {
    isRecording: true,
    isCanceled: false, // Resetar
    startTime: new Date()
  };
  // ...
}
```

### 2. Múltiplas Chamadas de Processamento
**Risco:** Handler `audio-event` pode receber tanto `recording-stopped` quanto `recording-canceled`
**Mitigação:**
- Verificar `isCanceled` em todos os handlers
- Processar apenas um evento por gravação

### 3. Cleanup de Recursos
**Risco:** Audio chunks e streams podem não ser limpos corretamente
**Mitigação:**
- Garantir que `cancelRecording()` limpa tudo:
  - `audioChunks = []`
  - `stream.getTracks().forEach(track => track.stop())`
  - `mediaRecorder.stop()`

### 4. Feedback Visual ao Usuário
**Risco:** Usuário pode não perceber que gravação foi cancelada
**Mitigação:**
- Atualizar ícone da tray imediatamente
- Mostrar notificação:
  - Titulo: "Gravação cancelada"
  - Mensagem: "Pressione as teclas de ativação novamente para gravar."
- Atualizar floating window (se ativa)
- Atualizar UI principal com indicador visual

### 5. Compatibilidade com Modos de Hotkey
**Risco:** Comportamento diferente entre `toggle` e `push-to-talk`
**Mitigação:**
- Testar ambos os modos extensivamente
- Garantir que cancelamento funciona independentemente do modo

### 6. Detecção Correta de Combinação
**Risco:** Pode haver falsos positivos se usuário digitar algo como "ctrl+c" em outro contexto
**Mitigação:**
- A combinação só é verificada quando `isRecording = true`
- Não há risco de cancelar fora do contexto de gravação
- A lógica já prevê isso verificando se o hotkey está ativo

## ✅ Checklist de Validação

### Funcional
- [ ] Pressionar `C` durante gravação (com hotkeys ativos) cancela a gravação
- [ ] Pressionar `C` sozinho (sem hotkeys ativos) NÃO cancela
- [ ] Combinação `CTRL + META + C` cancela gravação simples
- [ ] Combinação `CTRL + Shift + META + C` cancela gravação de comando
- [ ] Áudio NÃO é enviado para API quando cancelado
- [ ] Ícone da tray volta para 'idle' após cancelamento
- [ ] Floating window atualiza estado após cancelamento
- [ ] UI principal mostra mensagem de cancelamento
- [ ] Funciona no modo transcrição simples
- [ ] Funciona no modo comando (code snippet)
- [ ] Funciona no modo `toggle` e `push-to-talk`
- [ ] Cancelamento não interfere com gravações futuras

### Não-Funcional
- [ ] Tokens da API não são gastos em cancelamentos
- [ ] Performance não é afetada (mudanças mínimas no fluxo normal)
- [ ] Memória é limpa corretamente (sem leaks)
- [ ] Logs claros para debugging

### Código
- [ ] TypeScript compila sem erros
- [ ] Linting passa (ESLint)
- [ ] Testes unitários cobrem novos casos
- [ ] Comentários explicativos em pontos críticos
- [ ] Nomes de métodos e eventos são consistentes

## 📝 Notas Adicionais

### Combinação de Cancelamento
- **Modo transcrição simples:** `CTRL + META + C`
- **Modo comando:** `CTRL + Shift + META + C`
- Tecla C: Key code `UiohookKey.C` (já mapeado em `KEY_CODE_MAP`)

### Prioridade da Verificação de Combinação
- A verificação de combinação (hotkeys + C) acontece **antes** de:
  1. Verificar hotkey de gravação
  2. Verificar outros hotkeys
- Isso garante que cancelamento sempre tenha prioridade

### Comportamento Esperado
- Usuário segura hotkey de gravação → gravação inicia
- Usuário adiciona C enquanto segura hotkey → gravação cancela imediatamente
- Usuário solta hotkey → nada acontece (já foi cancelado)

### Tratamento de Erros
- Se `cancelRecording()` falhar, logar erro e emitir evento de erro
- Garantir que app não fique em estado inconsistente
- Resetar estado mesmo se erro ocorrer

### Internacionalização (i18n)
- Adicionar mensagens de cancelamento em `src/locales/en.json`:
```json
{
  "notifications": {
    "recordingCanceled": "Recording canceled",
    "recordingCanceledMessage": "Press the activation keys again to record."
  }
}
```
- Adicionar em `src/locales/pt-BR.json`:
```json
{
  "notifications": {
    "recordingCanceled": "Gravação cancelada",
    "recordingCanceledMessage": "Pressione as teclas de ativação novamente para gravar."
  }
}
```

### Compatibilidade com Versões Futuras
- Implementação deve ser compatível com novos provedores de transcrição
- Interface `ITranscriptionProvider` não precisa de mudanças
- Lógica de cancelamento é independente do provedor

### Diferenças para Abordagem Anterior (ESC)
- **Antes:** Tecla ESC separada - sempre cancelava se pressionada
- **Agora:** Combinação (hotkeys + C) - só cancela se hotkeys estiverem ativos
- **Benefício:** Menos chance de cancelamento acidental
- **Benefício:** Usa tecla C que é mais rápida de digitar

## 🚀 Implementação

**Ordem recomendada de execução:**
1. Etapa 1: Atualizar HotkeyManager (1.5 horas) - **CRÍTICO**
2. Etapa 2: Remover configuração de tecla separada (30 min) - **CRÍTICO**
3. Etapa 4: Implementar cancelRecording no DitossauroApp (1 hora) - **CRÍTICO**
4. Etapa 5: Implementar cancelRecording no Web Audio Recorder (1 hora) - **CRÍTICO**
5. Etapa 6: Atualizar handlers de áudio (30 min) - **CRÍTICO**
6. Etapa 7: Atualizar chamada de HotkeyManager.register() (15 min) - **CRÍTICO**
7. Etapa 8: Implementar lógica no main.ts (1 hora) - **CRÍTICO**
8. Etapa 3: Atualizar tipos (15 min) - **IMPORTANTE**
9. Etapa 9: Adicionar eventos à interface (15 min) - **IMPORTANTE**
10. Etapa 10: Verificar preload (15 min) - **IMPORTANTE**
11. Etapa 11: Atualizar UI do renderer (1 hora) - **IMPORTANTE**
12. Etapa 12: Atualizar floating window (30 min) - **IMPORTANTE**
13. Etapa 13: Escrever testes (2 horas) - **DESEJÁVEL**

**Tempo total estimado:** ~10 horas

**Prioridade de tarefas:**
- **CRÍTICO (Etapas 1-7):** Funcionalidade básica de cancelamento via C
- **IMPORTANTE (Etapas 8-12):** UX e feedback visual
- **DESEJÁVEL (Etapa 13):** Testes unitários

## 🔍 Referências

### Arquivos a serem modificados:
1. `src/hotkey-manager.ts` - Implementar verificação de combinação (hotkeys + C)
2. `src/types.ts` - Adicionar flag `isCanceled`, remover `cancel: string`
3. `src/settings-manager.ts` - Remover configuração de cancelamento separada
4. `src/ditossauro-app.ts` - Adicionar `cancelRecording()`, atualizar handlers
5. `src/main.ts` - Atualizar listener de `cancel-pressed`, injetar método no renderer, atualizar chamadas de `register()`
6. `src/renderer.ts` - Adicionar listener para `recording-canceled`
7. `src/floating-renderer.ts` - Adicionar listener para `recording-canceled`
8. `tests/unit/hotkey-manager.test.ts` - Adicionar testes de combinação
9. `tests/unit/ditossauro-app.test.ts` - Adicionar testes de cancelamento
10. `src/locales/en.json` - Adicionar traduções
11. `src/locales/pt-BR.json` - Adicionar traduções

### Métodos e eventos existentes:
- `HotkeyManager.cancel-pressed` ✅ (já existe, mudar forma de disparar)
- `HotkeyManager.register()` 🔧 (remover parâmetro cancelKey)
- `DitossauroApp.stopRecording()` ✅ (já existe)
- `DitossauroApp.startRecording()` ✅ (já existe)
- `Web Audio Recorder.stopRecording()` ✅ (já existe)

### Novos componentes:
- `DitossauroApp.cancelRecording()` 🆕
- `Web Audio Recorder.cancelRecording()` 🆕
- `recording-canceled` event 🆕
- `RecordingState.isCanceled` 🆕
- Lógica de detecção de combinação em HotkeyManager 🆕

### Componentes removidos:
- `HotkeyManager.cancelKey` ❌ (remover propriedade)
- `AppSettings.hotkeys.cancel` ❌ (remover campo)
- Verificação separada de tecla de cancelamento ❌ (remover lógica)

### Comportamento de cancelamento:
| Abordagem | Trigger | Condição |
|------------|----------|-----------|
| Anterior (ESC) | Pressionar ESC | Sempre |
| Novo (C) | Pressionar C + hotkeys | Apenas se hotkeys ativos |
