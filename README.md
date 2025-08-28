# OpenWispr

Um aplicativo desktop open source para transformar voz em texto com um atalho de teclado.  
Alternativa leve ao WisprFlow, rodando **100% local** com [faster_whisper](https://github.com/guillaumekln/faster-whisper).

---

## Funcionalidades
- Pressione e segure uma hotkey para falar.
- Ao soltar, o áudio é transcrito localmente.
- O texto é digitado diretamente no campo em foco.
- Interface simples com overlay visual.
- Sem envio de dados para a nuvem.

---

## Estrutura

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
├── backend/                # Backend Python (transcrição)
│   ├── main.py
│   ├── requirements.txt
│   └── utils/
│       └── audio_processor.py
├── src-tauri/              # Configuração Tauri (bridge)
│   ├── Cargo.toml
│   ├── src/
│   │   └── main.rs
│   └── tauri.conf.json
├── scripts/                # Scripts auxiliares
│   ├── build.py
│   └── dev.sh
└── assets/
    ├── icon.png
    └── overlay/
```

---

## Rodando em modo dev

1. Instale dependências do backend:
   
    ```bash
      cd backend
      pip install -r requirements.txt
    ```

2. Instale dependências do frontend:

   ```bash
   cd frontend
   npm install
   ```

3. Rode o app:

   ```bash
   cd ..
   npm run tauri dev
   ```

---

## Build

Para gerar binário:

```bash
npm run tauri build
```

---

## Licença

MIT License – veja o arquivo [LICENSE](LICENSE).
