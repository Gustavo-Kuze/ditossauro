# Features

Ditossauro provides powerful voice-to-code capabilities for developers. Here's a detailed look at all available features.

## 🎙️ Speech Transcription (Plain Text)

### Overview
Convert your speech into plain text with high accuracy using Whisper AI via the Groq API.

### How to Use
1. Press and hold `CTRL + Win`
2. Speak clearly into your microphone
3. Release the keys when you're done speaking
4. The transcribed text will be inserted at your cursor position

### Use Cases
* Writing documentation
* Composing emails or messages
* Taking notes during meetings
* Dictating comments in code

### Technical Details
* Powered by OpenAI's Whisper model via Groq API
* Supports multiple languages
* Real-time transcription
* No post-processing - outputs exactly what you say

---

## 💻 Code & Command Generation from Voice

### Overview
Generate code snippets and terminal commands directly from natural language using AI.

### How to Use
1. Press `CTRL + Shift + Win`
2. Start with a command keyword (see below)
3. Describe what you want to create
4. The generated code/command will be inserted at your cursor

### Available Command Types

#### Terminal Commands
**Keyword**: `command` (English) or `comando` (Portuguese)

**Examples**:
* "command find all JavaScript files" → `find . -name "*.js"`
* "command search for error in logs" → `grep -i "error" /var/log/*`
* "command show disk usage" → `df -h`
* "command compress this directory" → `tar -czf archive.tar.gz .`

#### JavaScript
**Keyword**: `javascript`

**Examples**:
* "javascript if user id exists then write user logged in" → `if(user.id) { console.log('user logged in'); }`
* "javascript create variable is active set to true" → `const isActive = true;`
* "javascript function to calculate sum of two numbers" → `function sum(a, b) { return a + b; }`

#### TypeScript
**Keyword**: `typescript`

**Examples**:
* "typescript create user interface with name and email" → `interface User { name: string; email: string; }`
* "typescript function get user by id" → `function getUserById(id: number): User { ... }`
* "typescript async function fetch data" → `async function fetchData(): Promise<void> { ... }`

#### Python
**Keyword**: `python`

**Examples**:
* "python hello world" → `print('hello world')`
* "python if user id exists print user logged in" → `if user.id:\n    print('user logged in')`
* "python create function get user by id" → `def get_user_by_id(user_id: int) -> str:\n    pass`

#### Bash Scripts
**Keyword**: `bash`

**Examples**:
* "bash script to backup files" → Full bash script with proper syntax
* "bash loop through files" → `for file in *; do ... done`

#### Hotkey Pressing
**Keyword**: `hotkeys`

**Examples**:
* "hotkeys control shift f" → Presses `CTRL + Shift + F` (e.g., global search in VSCode)
* "hotkeys alt tab" → Switches windows
* "hotkeys control c" → Copy

**Supported Modifiers**:
* `control` / `ctrl`
* `shift`
* `alt`
* `win` / `super` / `meta`

#### Translation
**Keyword**: `translate`

**Examples**:
* "translate cat to german" → `Katze`
* "translate hello world to spanish" → `hola mundo`
* "translate good morning to french" → `bonjour`

#### Personal Assistant
**Keyword**: `dito`

**Examples**:
* "dito, what's the height of the Eiffel Tower?" → `The Eiffel Tower is approximately 330 meters (1,083 feet) tall.`
* "dito, explain quantum computing" → Detailed explanation
* "dito, what's the capital of Japan?" → `Tokyo`

### How It Works

1. **Speech Recognition**: Your speech is captured and transcribed using Whisper
2. **Intent Detection**: The system detects which command type you're using
3. **Context Processing**: The transcribed text (minus the keyword) is sent to an LLM
4. **Code Generation**: The LLM generates the appropriate code or command
5. **Insertion**: Only the generated code is inserted - no extra text or explanations

---

## 🌍 Multi-Language Support

### Supported Languages

* **English** (en)
* **Portuguese Brazilian** (pt-BR)

### Switching Languages

1. Open Settings
2. Select your preferred language
3. Restart the application

Command keywords are automatically translated based on your selected language.

---

## ⌨️ Global Hotkeys

Ditossauro uses global hotkeys that work even when the application is in the background.

| Action                    | Hotkey               | Description                           |
| ------------------------- | -------------------- | ------------------------------------- |
| Plain transcription       | `CTRL + Win` (hold)  | Transcribe speech to plain text       |
| Code / command generation | `CTRL + Shift + Win` | Generate code/commands from speech    |

> **Note**: Hotkeys can be customized in the application settings (feature coming soon).

---

## 🎯 Smart Features

### Automatic Code Detection

When using code generation mode, Ditossauro automatically:
* Detects the programming language or command type
* Strips unnecessary prefixes before processing
* Generates clean, ready-to-use code
* Handles edge cases (extra spaces, case variations)

### Backward Compatibility

If you don't specify a command keyword:
* The system defaults to JavaScript code generation
* This maintains compatibility with earlier versions

### Voice Command Validation

* **Case Insensitive**: "COMMAND", "command", or "Command" all work
* **Whitespace Tolerant**: Extra spaces are automatically trimmed
* **Word Boundary Matching**: "commander" won't match "command"

---

## 🔒 Privacy & Security

* All voice processing is done via the Groq API
* No audio is stored locally
* Your API key is stored locally and never shared
* Open-source codebase for full transparency

---

## 🚀 Performance

* **Fast transcription**: Typically 1-3 seconds for short phrases
* **Efficient code generation**: 2-5 seconds depending on complexity
* **Low resource usage**: Minimal impact on system performance
* **Background operation**: Works while app is minimized

---

## 🔄 Future Features

See our [Roadmap](/#roadmap) for upcoming features including:
* Support for additional programming languages
* Custom hotkey configuration
* OpenAI, Anthropic, and Google API support
* Linux and macOS support
* Enhanced code context awareness
