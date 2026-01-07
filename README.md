# OpenWispr

OpenWispr is an open-source desktop voice productivity tool inspired by WisprFlow. It allows you to transcribe speech and generate **code or terminal commands directly from spoken language** using global hotkeys.

The app is designed for developers who want fast, hands-free interaction with their system while coding or working in the terminal.

---

## 📦 Requirements

Before running OpenWispr, make sure you have the following:

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

## ✨ Features

### 🎙️ Speech Transcription (Plain Text)

* High-quality speech-to-text powered by **Whisper via the Groq API**
* Outputs **plain text only**, ideal for writing messages, notes, or documentation

**Hotkey**

```
CTRL + Win (hold)
```

---

### 💻 Code & Command Generation from Voice

You can now speak **natural language instructions** and have OpenWispr generate:

* Source code (JavaScript, Python, etc.)
* Shell / terminal commands
* Developer-friendly snippets ready to paste and run

> Remember: always start your sentence with what type of code you want to generate.

Available commands:

* "command"
* "javascript"
* "typescript"
* "python"
* "bash"
* "terminal"

This enables a workflow similar to *“dictation for developers”*.

**Examples**

* "command find all JavaScript files" → `find . -name "*.js"`
* "command search for error in logs" → `grep -i "error" /var/log/*`
* "command show disk usage" → `df -h`
* "javascript if user id exists then write user logged in" → `if(user.id) { console.log('user logged in'); }`
* "javascript create variable is active set to true" → `const isActive = true;`

**Hotkey**

```
CTRL + Shift + Win
```

When this mode is triggered, OpenWispr:

1. Transcribes your speech using Whisper (Groq)
2. Interprets intent (code vs command)
3. Outputs **only the generated code or command**, no extra text

---

## ⌨️ Hotkeys Summary

| Action                    | Hotkey               |
| ------------------------- | -------------------- |
| Plain transcription       | `CTRL + Win` (hold)  |
| Code / command generation | `CTRL + Shift + Win` |

## Roadmap

- [x] Windows Support
- [ ] Linux Support
- [ ] MacOS Support
- [ ] Unit Tests
- [ ] E2E Tests
- [ ] Support for OpenAI API
- [ ] Support for Anthropic API
- [ ] Support for Google API

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) for more information.

## License

MIT License
