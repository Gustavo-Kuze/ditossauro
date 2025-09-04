# 🔧 Instruções de Instalação - VoiceFlow AI

## Comandos para Executar

Execute estes comandos na ordem apresentada:

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copie o arquivo de exemplo
copy .env.example .env

# Ou no Linux/macOS:
cp .env.example .env
```

### 3. Configurar Chave da API AssemblyAI

1. **Obter chave gratuita:**
   - Acesse: https://www.assemblyai.com/
   - Crie uma conta gratuita
   - Copie sua API key do dashboard

2. **Configurar no projeto:**
   - Abra o arquivo `.env` que foi criado
   - Substitua `your_api_key_here` pela sua chave real:
     ```
     ASSEMBLYAI_API_KEY=sua_chave_aqui
     ```

### 4. Executar o Aplicativo
```bash
# Modo desenvolvimento
npm start

# Ou gerar executável
npm run package
```

## 📋 Dependências Instaladas

O projeto inclui estas dependências principais:

**Produção:**
- `node-record-lpcm16` - Captura de áudio
- `robotjs` - Inserção automática de texto  
- `axios` - Cliente HTTP para API
- `form-data` - Upload de arquivos
- `uuid` - Geração de IDs únicos

**Electron:**
- Hotkeys globais
- System tray
- Notificações do sistema

## ⚠️ Requisitos do Sistema

### Windows
- Windows 10 ou 11
- Node.js 16+
- Microfone configurado
- Conexão com internet

### Possíveis Problemas

1. **robotjs não compila:**
   ```bash
   npm install --global windows-build-tools
   npm rebuild robotjs
   ```

2. **node-record-lpcm16 falha:**
   - Instale o Python 2.7
   - Configure variáveis de ambiente do Visual Studio

3. **Permissões no Windows:**
   - Execute como administrador na primeira vez
   - Configure permissões de microfone

## 🎯 Primeiro Uso

1. Execute `npm start`
2. Configure sua chave API na aba "Configurações"
3. Teste a conexão com o botão "Testar Conexão"
4. Pressione F2 para fazer sua primeira gravação!

## 🔄 Compilação para Distribuição

```bash
# Gerar pacote para Windows
npm run make

# Os arquivos gerados estarão em:
# out/make/squirrel.windows/x64/
```

## 🆘 Suporte

Se encontrar problemas:
1. Verifique se todas as dependências foram instaladas
2. Confirme se o Node.js está na versão 16+
3. Teste a chave API no site da AssemblyAI
4. Execute como administrador se necessário
