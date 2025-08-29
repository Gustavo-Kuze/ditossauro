Here is a proposed technical architecture diagram for the app.
It shows the main modules, how they communicate, and what technologies can be used in each layer.

> [Versão em Português Brasileiro disponível aqui](docs/pt_br/ARCHITECTURE.md)

**Flow Description**

*   **Hotkey Handler** (system layer) detects when the user presses/releases the key.
*   **Audio Recorder** starts recording from the microphone and sends the raw audio to the Transcription Engine.
*   **Transcription Engine** processes the audio with `faster_whisper` and returns the text.
*   **Text Injector** sends the text to the current input field using simulated keyboard events.
*   **Overlay UI** displays the visual status (recording, processing, ready).
*   **Settings Manager** saves configurations (hotkey, model, language) to disk.

**Block Diagram (ASCII for clarity)**

```
         ┌──────────────────────┐
         │   Operating System   │
         │(APIs for hotkeys, mic,│
         │      keyboard)       │
         └──────────┬───────────┘
                    │
         ┌──────────▼───────────┐
         │    Hotkey Handler    │
         │ (pynput/keyboard API)│
         └──────────┬───────────┘
                    │ press/release
         ┌──────────▼───────────┐
         │   Audio Recorder     │
         │(pyaudio/sounddevice) │
         └──────────┬───────────┘
                    │ PCM stream
         ┌──────────▼───────────┐
         │ Transcription Engine │
         │  (faster_whisper)    │
         └──────────┬───────────┘
                    │ text
         ┌──────────▼───────────┐
         │    Text Injector     │
         │(robotjs/native OS API)│
         └──────────┬───────────┘
                    │ simulate keys
         ┌──────────▼───────────┐
         │   Target Application │
         │    (focused field)   │
         └──────────────────────┘

   ┌─────────────────────────┐        ┌─────────────────────────┐
   │       Overlay UI        │◄──────┤    Settings Manager      │
   │(Electron frontend)│       │  (Local JSON / SQLite)   │
   └─────────────────────────┘        └─────────────────────────┘
```

**Detailed Components**

1.  **Hotkey Handler**
    *   Captures global keyboard events.
    *   **Trigger:** key press → start recording, key release → stop recording + transcribe.

2.  **Audio Recorder**
    *   Captures audio with low latency (16 kHz, mono, PCM).
    *   Passes the audio in real-time or as a final buffer to the transcription engine.

3.  **Transcription Engine**
    *   Backend in Python or Rust calling `faster_whisper`.
    *   Supports multiple models (tiny/base/small).
    *   Option for automatic language detection.

4.  **Text Injector**
    *   Simulates keyboard events to "type" the text into the focused application.
    *   On Windows: `SendInput` API.
    *   On macOS: `CGEventPost`.
    *   On Linux: `xdotool` or native X11/Wayland APIs.

5.  **Overlay UI**
    *   Shows the current state: Recording → Processing → Ready.
    *   Built with Electron for easier portability.

6.  **Settings Manager**
    *   Local persistence in JSON (or SQLite for more complex configs).
    *   Saves: hotkey, language, model, minimum volume, text insertion preferences.
