# OpenWispr Setup Guide

This document provides instructions for setting up and running the OpenWispr voice-to-text application.

## 🚀 Quick Start

### Prerequisites

Before running OpenWispr, ensure you have the following installed:

- **Node.js** (v16 or later) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or later) - [Download here](https://python.org/)
- **npm** (comes with Node.js)
- **pip** (comes with Python)

### Development Setup

1. **Clone or navigate to the project directory:**
   ```bash
   cd /path/to/openwispr
   ```

2. **Run the setup script:**
   ```bash
   ./scripts/dev.sh
   ```
   
   This script will:
   - Check prerequisites
   - Install all dependencies (root, frontend, and backend)
   - Build TypeScript files
   - Prepare the development environment

3. **Start the application:**
   ```bash
   npm run electron:dev
   ```

   This will start:
   - Python backend server (port 5000)
   - React development server (port 3000)
   - Electron main process

### Manual Setup (Alternative)

If the setup script doesn't work, you can set up manually:

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Build TypeScript files:**
   ```bash
   npx tsc electron/main.ts --outDir electron --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck
   npx tsc electron/preload.ts --outDir electron --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck
   ```

5. **Start the application:**
   ```bash
   npm run electron:dev
   ```

## 🏗️ Building for Production

To create a distributable version:

```bash
python scripts/build.py
```

Or manually:
```bash
npm run build
```

The built application will be in the `dist/` directory.

## 🎮 Usage

1. **Launch the application** - The main window will open with settings and status information.

2. **Configure your hotkey** - The default is `Ctrl+Space` (or `Cmd+Space` on macOS).

3. **Start using voice input:**
   - Press and hold your configured hotkey
   - Speak clearly into your microphone
   - Release the hotkey when finished
   - The transcribed text will be automatically typed into the active application

4. **Customize settings:**
   - Choose different Whisper model sizes (tiny, base, small, medium)
   - Enable/disable auto-language detection
   - Configure overlay visibility and position
   - Adjust hotkey combinations

## 🔧 Troubleshooting

### Backend Won't Start
- Ensure Python and pip are installed
- Check that all Python dependencies are installed: `pip install -r backend/requirements.txt`
- On Linux, you may need to install additional audio libraries: `sudo apt-get install portaudio19-dev`

### Frontend Won't Load
- Ensure Node.js and npm are installed
- Check that frontend dependencies are installed: `cd frontend && npm install`
- Try clearing the npm cache: `npm cache clean --force`

### Hotkey Not Working
- Check if the hotkey combination conflicts with system shortcuts
- Try a different key combination in the settings
- Ensure the application has necessary permissions (especially on macOS and Linux)

### Audio Recording Issues
- Check microphone permissions
- Ensure your microphone is set as the default input device
- Test with different microphone sensitivity settings

### Text Injection Not Working
- On Linux, install xdotool: `sudo apt-get install xdotool`
- On macOS, grant accessibility permissions when prompted
- On Windows, ensure the application has necessary permissions

## 📁 Project Structure

```
openwispr/
├── README.md                 # Main project documentation
├── REQUIREMENTS.md           # Detailed requirements specification
├── ARCHITECTURE.md           # Technical architecture overview
├── SETUP.md                 # This setup guide
├── LICENSE                  # MIT License
├── package.json             # Root project configuration
├── .gitignore              # Git ignore rules
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── MainView.tsx
│   │   │   └── OverlayView.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── backend/                # Python backend
│   ├── main.py            # Flask server and main logic
│   ├── requirements.txt   # Python dependencies
│   └── utils/
│       └── audio_processor.py  # Audio recording and transcription
├── electron/              # Electron configuration
│   ├── main.ts           # Main process (TypeScript)
│   └── preload.ts        # Preload script (TypeScript)
├── scripts/               # Build and development scripts
│   ├── dev.sh            # Development setup script
│   └── build.py          # Production build script
└── assets/               # Application assets
    ├── icon.svg          # Application icon
    └── overlay/          # Overlay assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter issues:

1. Check this setup guide
2. Review the troubleshooting section
3. Check the GitHub issues page
4. Create a new issue with detailed information about your problem

---

**Happy transcribing! 🎤✨**