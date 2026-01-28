# Getting Started

This guide will help you get Ditossauro up and running on your system.

## Prerequisites

Before you begin, ensure you have the following installed:

### System Requirements

* A working **microphone**
* One of the following operating systems:
  * Windows (fully supported)
  * Linux (in development)
  * macOS (in development)

### Software Requirements

* **Node.js** (recommended: latest LTS version)
* **npm** or **yarn**
* **Git** (for cloning the repository)

### API Keys

* **Groq API Key** (required)
  * Used for Whisper-based speech-to-text and LLM processing
  * Sign up at [Groq](https://groq.com/) to get your API key

> ⚠️ Without a valid Groq API key, transcription and code/command generation will not work.

## Installation

### Option 1: Clone from GitHub

1. **Fork the repository** on GitHub (if you plan to contribute)

2. **Clone the repository** locally:
   ```bash
   git clone https://github.com/Gustavo-Kuze/ditossauro.git
   cd ditossauro
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

   > **Note**: This project relies on native modules (like `uiohook-napi`). The `postinstall` script should automatically rebuild them for Electron. If you encounter errors, try running `npm run postinstall` manually or ensure you have the necessary build tools for your OS.

### Option 2: Download Release (Coming Soon)

Pre-built binaries will be available in the GitHub releases section.

## Configuration

### Setting up your Groq API Key

1. **Start the application**:
   ```bash
   npm start
   ```

2. **Open Settings**: Click on the settings icon in the application

3. **Enter your API Key**: Paste your Groq API key in the designated field

4. **Save**: Click save to store your configuration

## Running the Application

### Development Mode

Start the development server and Electron app:

```bash
npm start
```

This will:
* Launch the Electron application
* Enable hot reload for development
* Open developer tools

### Production Build

To create a production build:

```bash
npm run make
```

This will create distributable packages in the `out` directory.

## Verifying Installation

Once the application is running:

1. **Test Plain Transcription**:
   * Press and hold `CTRL + Win`
   * Speak clearly into your microphone
   * Release the keys
   * Your transcribed text should appear in the focused application

2. **Test Code Generation**:
   * Press `CTRL + Shift + Win`
   * Say "command list files"
   * A bash command like `ls -la` should be generated and inserted

## Troubleshooting

### Common Issues

#### "Not recording" error
* Check microphone permissions
* Ensure your microphone is properly connected
* Try restarting the application

#### No voice command detected
* Verify you're saying the command keyword at the START of your phrase
* Check that the correct locale is set in settings (en or pt-BR)
* Look for console logs indicating voice command detection

#### Code not generated correctly
* Verify your Groq API key is configured correctly
* Check that the Groq API has available credits/quota
* Look for error messages in the console

### Getting Help

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/Gustavo-Kuze/ditossauro/issues) for similar problems
2. Create a new issue with:
   * System details (OS, Node version)
   * Steps to reproduce
   * Error messages or logs

## Next Steps

* Learn about [Features](features.md)
* Explore [Voice Commands](voice-commands.md)
* Start [Contributing](contributing.md)
