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
├── frontend/               # UI (Electron + React)
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
├── electron/              # Electron Config (main process)
│   ├── main.ts
│   ├── preload.ts
│   └── electron-builder.yml
├── scripts/                # Helper scripts
│   ├── build.py
│   └── dev.sh
└── assets/
    ├── icon.png
    └── overlay/
```

---

## Running in Dev Mode

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
   npm run electron:dev
   ```

---

## Build

To generate a binary:

```bash
npm run electron:build
```

---

## License

MIT License – see the [LICENSE](LICENSE) file.
