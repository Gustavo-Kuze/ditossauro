# Ditossauro

[![English](https://img.shields.io/badge/Lang-English-blue)](README.md) [![Português](https://img.shields.io/badge/Lang-Português-green)](README-pt-BR.md)

<img src="https://raw.githubusercontent.com/Gustavo-Kuze/ditossauro/main/src/assets/app_icon.png" alt="Ditossauro Logo" width="150" />

Ditossauro is an open-source desktop voice productivity tool. It allows you to transcribe speech and generate **code or terminal commands directly from spoken language** using global hotkeys.

The app is designed for developers who want fast, hands-free interaction with their system while coding or working in the terminal.

---

## ✨ Features

### 🎙️ Speech Transcription (Plain Text)

**Press**

```
CTRL + Win (hold)
```
**For**:
* High-quality speech-to-text powered by **Whisper via the Groq API**
* Outputs **plain text only**, ideal for writing messages, notes, or documentation

---

### 💻 Code & Command Generation from Voice

**Press**

```
CTRL + Shift + Win
```
**For**:
* Advanced code and command generation using **Whisper + LLMs via the Groq API**

When this mode is triggered, Ditossauro:

1. Transcribes your speech using Whisper (Groq)
2. Interprets intent (code vs command)
3. Outputs **only the generated code or command**, no extra text

You can now speak **natural language instructions** and have Ditossauro generate:

* Source code (JavaScript, Python, etc.)
* Shell / terminal commands
* Developer-friendly snippets ready to paste and run

> Remember: always start your sentence with what type of code you want to generate.

Available commands:

* "command" - for terminal commands
* "javascript" - for JavaScript code snippets
* "typescript" - for TypeScript code snippets
* "python" - for Python code snippets
* "bash" - for Bash scripts
* "hotkeys" - for pressing hotkeys
* "translate" - for translating text to other languages
* "dito" - general purpose personal assistance

This enables a workflow similar to *"dictation for developers"*.

**Examples**

* "command find all JavaScript files" → `find . -name "*.js"`
* "command search for error in logs" → `grep -i "error" /var/log/*`
* "command show disk usage" → `df -h`
* "javascript if user id exists then write user logged in" → `if(user.id) { console.log('user logged in'); }`
* "javascript create variable is active set to true" → `const isActive = true;`
* "translate cat to german" → `Katze`
* "hotkeys control shift f" → Presses `CTRL + Shift + F` on the focused window (global search on VSCode, for example)
* "dito, whats the height of the Eiffel Tower?" → `The Eiffel Tower is approximately 330 meters (1,083 feet) tall.`

---

## 📦 Requirements

Before running Ditossauro, make sure you have the following:

### System Requirements

* A working **microphone**

### Software Requirements

* **Node.js** (recommended: latest LTS)
* **npm** or **yarn**
* **Git**

### API Keys

* **Groq API Key** (required)
  * Used for Whisper-based speech-to-text, LLM processing and code generation

Set the API key in the app settings when you start it.

> ⚠️ Without a valid Groq API key, transcription and code/command generation will not work.

---

## ⌨️ Hotkeys Summary

| Action                    | Hotkey               |
| ------------------------- | -------------------- |
| Plain transcription       | `CTRL + Win` (hold)  |
| Code / command generation | `CTRL + Shift + Win` |

## Roadmap

- [x] Generate terminal commands
- [x] Generate code snippets
- [x] Translate text to other languages
- [x] Press hotkeys from voice commands
- [x] Quick questions and answers (personal assistant)
- [x] Windows Support
- [ ] Linux Support
- [ ] MacOS Support
- [x] Unit Tests
- [ ] E2E Tests
- [x] Press hotkeys based on voice commands
- [x] Support for Groq API
- [ ] Support for OpenAI API
- [ ] Support for Anthropic API
- [ ] Support for Google API

## Contributing

Contributions are welcome! Please read our [contributing guidelines](https://github.com/Gustavo-Kuze/ditossauro/blob/main/CONTRIBUTING.md) for more information.

## License

MIT License
