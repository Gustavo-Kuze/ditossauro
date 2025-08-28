# OpenWispr Development Guide

This guide provides detailed instructions for setting up the development environment and contributing to OpenWispr.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Tools

1. **Node.js** (v16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Python 3** (v3.8 or higher)
   - Download from [python.org](https://python.org/)
   - Verify installation: `python3 --version`

3. **Rust** (latest stable)
   - Install from [rustup.rs](https://rustup.rs/)
   - Verify installation: `cargo --version`

4. **Git**
   - Download from [git-scm.com](https://git-scm.com/)

### System Dependencies

#### macOS
```bash
# Install system audio dependencies
brew install portaudio
```

#### Ubuntu/Debian
```bash
# Install system audio dependencies
sudo apt update
sudo apt install portaudio19-dev python3-pyaudio
```

#### Windows
- Install Microsoft C++ Build Tools
- Audio dependencies are typically handled by pip

## Quick Setup

### Option 1: Automated Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/openwispr/openwispr.git
cd openwispr

# Run the setup script
npm run setup

# Start development server
npm run dev
```

### Option 2: Manual Setup
```bash
# 1. Install frontend dependencies
cd frontend
npm install
cd ..

# 2. Install backend dependencies
cd backend
pip3 install -r requirements.txt
cd ..

# 3. Install Tauri CLI
cargo install tauri-cli

# 4. Start development
npm run tauri dev
```

## Development Workflow

### Starting the Development Server
```bash
# Option 1: Use the convenience script
npm run dev

# Option 2: Use Tauri directly
npm run tauri dev
```

### Building for Production
```bash
# Option 1: Use the build script
npm run build

# Option 2: Use Tauri directly
npm run tauri build
```

## Project Structure

```
openwispr/
├── README.md                 # Main project documentation
├── REQUIREMENTS.md           # Software requirements specification
├── ARCHITECTURE.md           # Technical architecture documentation
├── DEVELOPMENT.md            # This file - development guide
├── LICENSE                   # MIT license
├── .gitignore               # Git ignore patterns
├── package.json             # Main package.json with scripts
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx          # Main application component
│   │   ├── main.tsx         # Application entry point
│   │   ├── styles.css       # Global styles
│   │   └── components/      # React components
│   │       ├── StatusOverlay.tsx    # Recording status overlay
│   │       └── SettingsPanel.tsx    # Settings configuration
│   ├── package.json         # Frontend dependencies
│   ├── tsconfig.json        # TypeScript configuration
│   ├── vite.config.ts       # Vite bundler configuration
│   └── index.html           # HTML template
├── backend/                 # Python backend for audio processing
│   ├── main.py              # Backend entry point
│   ├── requirements.txt     # Python dependencies
│   └── utils/
│       └── audio_processor.py # Audio recording and transcription
├── src-tauri/              # Tauri configuration and Rust code
│   ├── src/
│   │   └── main.rs          # Rust backend (IPC bridge)
│   ├── Cargo.toml           # Rust dependencies
│   ├── tauri.conf.json      # Tauri configuration
│   ├── build.rs             # Build script
│   └── icons/               # Application icons
├── scripts/                 # Development and build scripts
│   ├── dev.sh              # Development setup script
│   └── build.py            # Production build script
└── assets/                 # Static assets
    ├── icon.png            # Main application icon
    └── overlay/            # Overlay graphics
```

## Key Components

### Frontend (React + TypeScript)
- **App.tsx**: Main application logic, handles global shortcuts and state
- **StatusOverlay.tsx**: Visual feedback during recording/processing
- **SettingsPanel.tsx**: Configuration interface for hotkeys and models

### Backend (Python)
- **main.py**: Command-line interface for the Python backend
- **audio_processor.py**: Handles audio recording and Whisper transcription

### Tauri Bridge (Rust)
- **main.rs**: Handles IPC between frontend and Python backend
- **tauri.conf.json**: Application configuration and permissions

## Development Tips

### Hot Reload
The development server supports hot reload for both frontend and backend changes:
- Frontend changes are automatically reloaded by Vite
- Backend changes require restarting the development server

### Debugging
- Frontend: Use browser developer tools (F12)
- Backend: Check terminal output for Python logs
- Rust: Use `println!` macros and check terminal output

### Testing Audio
1. Ensure your microphone is working and not muted
2. Grant microphone permissions when prompted
3. Test with short phrases first
4. Check the terminal for audio processing logs

## Common Issues

### Microphone Not Working
- **macOS**: Grant microphone permission in System Preferences > Security & Privacy
- **Linux**: Ensure your user is in the `audio` group
- **Windows**: Check Windows privacy settings for microphone access

### Python Dependencies
If you encounter issues with Python dependencies:
```bash
# Create a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

### Rust Compilation Issues
If Rust compilation fails:
```bash
# Update Rust
rustup update

# Clean build cache
cd src-tauri
cargo clean
```

### Audio Library Issues
On Linux, if you get audio-related errors:
```bash
# Install additional audio libraries
sudo apt install libasound2-dev libpulse-dev
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Create a Pull Request

## Performance Optimization

### Whisper Model Selection
- **tiny**: Fastest, least accurate (~39MB)
- **base**: Good balance (~74MB) - **Recommended for development**
- **small**: Better accuracy (~244MB)
- **medium**: High accuracy (~769MB)
- **large**: Best accuracy (~1550MB)

### Build Optimization
For production builds:
```bash
# Enable release optimizations
npm run tauri build -- --release
```

## Troubleshooting

### Build Failures
1. Ensure all prerequisites are installed
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Clear Rust cache: `cargo clean`
4. Check for conflicting global packages

### Runtime Issues
1. Check console for JavaScript errors
2. Verify Python backend is accessible
3. Test microphone permissions
4. Check firewall/antivirus settings

For more help, please check the [Issues](https://github.com/openwispr/openwispr/issues) page or create a new issue.