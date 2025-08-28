# OpenWispr

An open-source desktop application to transform voice into text with a keyboard shortcut.
A lightweight alternative to WisprFlow, running **100% locally** with [faster_whisper](https://github.com/guillaumekln/faster-whisper).

> [Versão em Português Brasileiro disponível aqui](docs/pt_br/README.md)

---

## Features
- Press and hold a hotkey to speak.
- Upon release, the audio is transcribed locally.
- The text is typed directly into the focused field.
- Simple interface with a visual overlay.
- No data is sent to the cloud.

---

## Structure

```
openwispr/
├── README.md
├── LICENSE
├── .gitignore
├── frontend/               # UI (Tauri + React)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── main.tsx
│   ├── package.json
│   └── tsconfig.json
├── backend/                # Python Backend (transcription)
│   ├── main.py
│   ├── requirements.txt
│   └── utils/
│       └── audio_processor.py
├── src-tauri/              # Tauri Config (bridge)
│   ├── Cargo.toml
│   ├── src/
│   │   └── main.rs
│   └── tauri.conf.json
├── scripts/                # Helper scripts
│   ├── build.py
│   └── dev.sh
└── assets/
    ├── icon.png
    └── overlay/
```

---

## Running in Dev Mode

### Quick Setup (All Platforms)
```bash
# Install all dependencies
npm run setup

# Start development server
npm run dev
```

### Manual Setup
1. Install backend dependencies:
   
    ```bash
      cd backend
      pip install -r requirements.txt
    ```

2. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Run the app:

   ```bash
   cd ..
   npm run tauri dev
   ```

### Windows Users
If you encounter issues on Windows, see [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for detailed Windows-specific instructions, or use:

```cmd
npm run dev:windows
```

---

## Build

To generate a binary:

```bash
npm run tauri build
```

---

## License

MIT License – see the [LICENSE](LICENSE) file.
