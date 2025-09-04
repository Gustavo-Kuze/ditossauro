# 🎤 VoiceFlow AI

Uma alternativa open source ao WisprFlow para transcrição de voz em tempo real.

## ✨ Características

- 🎯 **Transcrição em tempo real** usando AssemblyAI
- ⌨️ **Hotkeys globais** configuráveis
- 📝 **Inserção automática** de texto em qualquer aplicativo
- 🌍 **Suporte multilíngue** (Português e Inglês)
- 🎨 **Interface moderna** e minimalista
- 📊 **Histórico** de transcrições
- 🔧 **System tray** para uso discreto

## 🚀 Instalação

### Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- Windows 10/11 (Linux e macOS em breve)
- Chave API da AssemblyAI (gratuita)

### Passos

1. **Clone o repositório:**
   \`\`\`bash
   git clone <repo-url>
   cd voiceflow-ai
   \`\`\`

2. **Instale as dependências:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure a API:**
   - Copie \`.env.example\` para \`.env\`
   - Obtenha sua chave gratuita em [AssemblyAI](https://www.assemblyai.com/)
   - Configure \`ASSEMBLYAI_API_KEY\` no arquivo \`.env\`

4. **Execute o aplicativo:**
   \`\`\`bash
   npm start
   \`\`\`

## 🎯 Como Usar

1. **Configure sua chave API** na aba Configurações
2. **Ajuste as hotkeys** (padrão: F2 para gravar)
3. **Pressione F2** para iniciar a gravação
4. **Fale naturalmente**
5. **Pressione F2 novamente** para parar e transcrever
6. **O texto será inserido** automaticamente onde seu cursor estiver

## ⌨️ Atalhos Padrão

- **F2**: Iniciar/Parar gravação
- **Escape**: Cancelar gravação

## 🛠️ Desenvolvimento

### Scripts Disponíveis

\`\`\`bash
npm start          # Iniciar em desenvolvimento
npm run package    # Criar pacote para distribuição
npm run make       # Criar instalador
\`\`\`

### Estrutura do Projeto

\`\`\`
src/
├── main.ts              # Processo principal do Electron
├── preload.ts           # Script de preload (API segura)
├── renderer.ts          # Interface de usuário
├── types.ts             # Definições TypeScript
├── voice-flow-app.ts    # Lógica principal da aplicação
├── audio-recorder.ts    # Captura de áudio
├── assemblyai-client.ts # Cliente da API AssemblyAI
├── text-inserter.ts     # Inserção de texto
├── settings-manager.ts  # Gerenciamento de configurações
└── index.css            # Estilos
\`\`\`

## 🔧 Configurações

### Hotkeys
- Personalize as teclas de atalho
- Suporte a combinações (Ctrl+Shift+F2)

### Áudio
- Seleção de dispositivo de entrada
- Configuração de taxa de amostragem

### API
- Chave da AssemblyAI
- Seleção de idioma

### Comportamento
- Auto-inserção de texto
- Confirmação antes de inserir

## 📋 Histórico

- Visualize todas as transcrições
- Copie texto facilmente
- Reinsira transcrições anteriores

## 🐛 Solução de Problemas

### Gravação não funciona
- Verifique se o microfone está conectado
- Teste o dispositivo de áudio nas configurações

### Transcrição falha
- Verifique sua conexão com internet
- Confirme se a chave API está correta
- Teste a conexão na aba Configurações

### Hotkey não responde
- Verifique se não há conflito com outras aplicações
- Tente uma combinação diferente

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🙏 Agradecimentos

- [AssemblyAI](https://www.assemblyai.com/) pela API de transcrição
- [Electron](https://www.electronjs.org/) pelo framework
- Comunidade open source

## 📞 Suporte

- Abra uma [issue](link-para-issues) para reportar bugs
- Consulte a [documentação](link-para-docs) para mais detalhes
- Entre em contato: [email]

---

Feito com ❤️ por Gustavo Silva
