Aqui está uma proposta de diagrama técnico de arquitetura para o app.
Ele mostra os módulos principais, como eles se comunicam e quais tecnologias podem ser usadas em cada camada.

Descrição do fluxo

Hotkey Handler (camada de sistema) detecta quando o usuário pressiona/solta a tecla.

Audio Recorder começa a gravar do microfone e envia o áudio bruto para o Transcription Engine.

Transcription Engine processa com faster_whisper e retorna texto.

Text Injector envia o texto para o campo de entrada atual usando eventos de teclado simulados.

Overlay UI exibe status visual (gravando, processando, pronto).

Settings Manager salva configurações (hotkey, modelo, idioma) em disco.

Diagrama em blocos (ASCII para clareza)
         ┌────────────────────┐
         │   Sistema Operacional│
         │ (APIs p/ hotkeys,    │
         │   microfone, teclado)│
         └───────┬─────────────┘
                 │
         ┌───────▼─────────────┐
         │   Hotkey Handler     │
         │(pynput / keyboard API)│
         └───────┬─────────────┘
                 │ press/solta
         ┌───────▼─────────────┐
         │   Audio Recorder     │
         │ (pyaudio/sounddevice)│
         └───────┬─────────────┘
                 │ stream PCM
         ┌───────▼─────────────┐
         │ Transcription Engine │
         │ (faster_whisper)     │
         └───────┬─────────────┘
                 │ texto
         ┌───────▼─────────────┐
         │    Text Injector     │
         │(robotjs/nativo OS API)│
         └───────┬─────────────┘
                 │ simular teclas
         ┌───────▼─────────────┐
         │   Aplicativo alvo    │
         │ (campo focado)       │
         └─────────────────────┘

   ┌─────────────────────────┐        ┌─────────────────────────┐
   │     Overlay UI           │◄──────┤   Settings Manager       │
   │ (Electron/Tauri frontend)│       │ (JSON local / SQLite)    │
   └─────────────────────────┘        └─────────────────────────┘

Componentes detalhados
1. Hotkey Handler

Captura eventos globais do teclado.

Gatilho: pressionou tecla → iniciar gravação, soltou tecla → parar gravação + transcrever.

2. Audio Recorder

Captura áudio com baixa latência (16 kHz, mono, PCM).

Passa o áudio em tempo real ou buffer final para o motor de transcrição.

3. Transcription Engine

Backend em Python ou Rust chamando faster_whisper.

Suporte a múltiplos modelos (tiny/base/small).

Opção de detecção automática de idioma.

4. Text Injector

Simula eventos de teclado para "digitar" o texto na aplicação em foco.

Em Windows: SendInput API.

Em macOS: CGEventPost.

Em Linux: xdotool ou APIs nativas X11/Wayland.

5. Overlay UI

Mostra estado atual: Gravando → Processando → Pronto.

Construído em Electron ou Tauri para facilitar portabilidade.

6. Settings Manager

Persistência local em JSON (ou SQLite para configs mais complexas).

Guarda: hotkey, idioma, modelo, volume mínimo, preferências de inserção de texto.