Below is a complete and clear **Software Requirements Specification (SRS)** document for the application you want to create. It follows a common structure in software engineering, covering an overview, functional and non-functional requirements, and technical considerations.

> [Versão em Português Brasileiro disponível aqui](docs/pt_br/REQUIREMENTS.md)

---

## Requirements Document – **OpenWispr**

### 1. Overview

**Objective**
Create an open-source desktop application that allows users to quickly convert voice to text using keyboard shortcuts. When a hotkey is pressed, the application starts recording audio; upon release, it transcribes the audio using *faster_whisper* and sends the text directly to the active input field (wherever the cursor is).

**Benefits**

*   **Productivity:** Fast transcription without switching windows.
*   **Portability:** Open source, cross-platform (Windows, macOS, Linux).
*   **Low running cost:** Uses *faster_whisper* (a local model) without relying on paid services.
*   **Privacy:** Local audio processing, no data is sent to the cloud.

**Stakeholders**

*   **End-users:** People who want to dictate text quickly (programmers, writers, content creators).
*   **Open-source community contributors.**

---

### 2. Key Features

#### 2.1. Hotkey Recording

*   **Description:** The app should start recording audio when a configurable key combination is pressed (e.g., Ctrl+Space).
*   **Flow:**
    1.  The user presses the hotkey.
    2.  The app starts capturing audio from the default microphone.
    3.  The user holds down the key while speaking.
    4.  When the hotkey is released, recording stops.

#### 2.2. Transcription with *faster_whisper*

*   **Description:** The recorded audio must be processed locally with the selected *faster_whisper* model.
*   **Specific Requirements:**
    *   Support for different model sizes (*tiny, base, small, medium*).
    *   Automatic language detection (optional).
    *   Local model caching to reduce loading time.

#### 2.3. Text Insertion at Current Focus

*   **Description:** The transcribed text should be automatically "typed" into the field where the cursor is, without requiring a manual application switch.
*   **Technical Details:**
    *   Use simulated keyboard injection (key events) or system automation APIs.
    *   Maintain compatibility with browsers, IDEs, text editors, messengers, etc.

#### 2.4. User Settings

*   **Configurable Items:**
    *   Custom hotkey (with validation to avoid conflicts with system shortcuts).
    *   Whisper model used (selection via a menu).
    *   Minimum recording sensitivity/volume.
    *   Option to send text with or without a line break.
    *   Enable/disable automatic language detection.

#### 2.5. Visual Indicators

*   **Description:** Display a small overlay indicating the status:
    *   *Listening* (when the hotkey is pressed).
    *   *Processing* (when the audio is being transcribed).
    *   *Ready* (when the text is sent).
*   **Detail:** The overlay should be minimalist, non-intrusive, and always on top.

---

### 3. Non-Functional Requirements

*   **Cross-platform:** Support for Windows, macOS, and Linux.
*   **Low latency:** Transcription should occur in < 2 seconds for short audio clips (1–3s).
*   **Security/Privacy:** No audio or text is sent to external servers.
*   **Open Source:** Code hosted on GitHub under a permissive license (MIT or Apache 2.0).
*   **Performance:** Efficient use of CPU/GPU to run *faster_whisper*.
*   **Simple Installation:** Provide binaries (installer or AppImage) in addition to the source code.

---

### 4. Technical Constraints

*   **Suggested Base Technology:**
    *   Electron for the desktop app.
    *   Python backend for *faster_whisper* or a model build in C++/Rust (for better performance).
    *   Communication between frontend and backend via IPC (Electron).
*   **Auxiliary Libraries:**
    *   *pyaudio* or *sounddevice* for audio capture.
    *   *keyboard* (Windows/Linux) and *pynput* or native APIs for hotkeys.
    *   *robotjs* or alternatives for text injection.

---

### 5. Use Cases

#### UC-01: Quick Dictation

**Actor:** End-user
**Scenario:**

1.  The user presses Ctrl+Space.
2.  Says, "Meeting scheduled for tomorrow at 10 AM."
3.  Releases the key.
4.  The app transcribes and inserts the text directly into the open email editor.

#### UC-02: Language Switching

**Actor:** End-user
**Scenario:**

1.  The user selects a multilingual model from the settings menu.
2.  Presses the hotkey and speaks in English.
3.  The app automatically detects the language and inserts the text in the correct language.

---

### 6. Potential Future Extensions

*   Support for voice commands (e.g., "open browser," "add comma").
*   Integration with external APIs (for those who want to use OpenAI/Deepgram).
*   History of transcriptions for later review.
*   Dark/light theme for the overlay.

---

### 7. Acceptance Criteria

*   The app must work offline after downloading the Whisper model.
*   The inserted text should have no more than a 300 ms perceptible delay after speech ends.
*   The default hotkey must work on the first run but should be changeable.
*   The overlay must never block the user's focus.
