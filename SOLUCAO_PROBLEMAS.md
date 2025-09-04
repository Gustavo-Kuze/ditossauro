# 🔧 Solução de Problemas - VoiceFlow AI

## ❌ Erro: "Unexpected character '\0'" com robotjs

Este erro é comum quando o Vite tenta processar módulos nativos. **Já foi corrigido** nas configurações, mas se persistir:

### ✅ Solução Aplicada
1. **Configurações do Vite atualizadas** para tratar módulos nativos como externos
2. **Electron Forge configurado** para não empacotar módulos nativos no asar
3. **Imports corrigidos** para usar `require()` ao invés de `import`

### 🔄 Se o erro persistir:

1. **Limpe o cache:**
   ```bash
   npm run clean
   # Ou manualmente:
   rm -rf node_modules/.vite
   rm -rf .vite
   ```

2. **Reinstale dependências:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Reconstrua módulos nativos:**
   ```bash
   npm run rebuild
   # Ou:
   npx electron-rebuild
   ```

---

## 🔧 Outros Problemas Comuns

### 1. **robotjs não compila no Windows**

**Erro:** `gyp ERR! build error` ou `MSBuild.exe failed`

**Solução:**
```bash
# Instalar ferramentas de build do Windows
npm install --global windows-build-tools

# Ou instalar manualmente:
# - Visual Studio Build Tools 2019/2022
# - Python 2.7 ou 3.x

# Depois rebuildar:
npm rebuild robotjs
```

### 2. **node-record-lpcm16 falha na instalação**

**Erro:** Problemas de compilação com módulos de áudio

**Solução:**
```bash
# Instalar dependências de sistema (Windows)
npm install --global node-gyp

# No Ubuntu/Debian:
sudo apt-get install build-essential libasound2-dev

# No macOS:
brew install node
```

### 3. **Permissões de microfone (Windows)**

**Erro:** Gravação não funciona

**Solução:**
1. Execute o app como **Administrador** na primeira vez
2. Vá em **Configurações do Windows** > **Privacidade** > **Microfone**
3. Habilite acesso para aplicativos desktop

### 4. **Hotkeys não funcionam**

**Erro:** F2 não responde

**Solução:**
1. **Conflito com outros apps:** Verifique se F2 está sendo usado por outro programa
2. **Permissões:** Execute como administrador no Windows
3. **Troque a hotkey:** Use outras combinações nas configurações

### 5. **AssemblyAI retorna erro 401**

**Erro:** `Unauthorized` na transcrição

**Solução:**
1. **Verifique a chave API** no arquivo `.env`
2. **Teste no site:** https://www.assemblyai.com/playground
3. **Chave expirou:** Gere uma nova no dashboard

### 6. **Texto não é inserido automaticamente**

**Erro:** Transcrição funciona mas texto não aparece

**Solução:**
1. **Campo não está focado:** Clique no campo de texto antes
2. **Aplicativo não permite:** Alguns apps bloqueiam automação
3. **Configuração:** Verifique se auto-inserção está habilitada

---

## 🚀 Comandos de Diagnóstico

### Verificar instalação:
```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar dependências
npm ls robotjs
npm ls node-record-lpcm16
```

### Teste de módulos nativos:
```bash
# Testar robotjs
node -e "console.log(require('robotjs').getScreenSize())"

# Testar gravação (se disponível)
node -e "console.log(require('node-record-lpcm16'))"
```

### Logs detalhados:
```bash
# Executar com debug
DEBUG=* npm start

# Ou apenas logs do Electron
npm start --verbose
```

---

## 📞 Se nada funcionar:

1. **Verifique os requisitos:**
   - Windows 10/11
   - Node.js 16+
   - Microfone funcionando
   - Permissões de administrador

2. **Alternativa simples:**
   ```bash
   # Remover módulos problemáticos temporariamente
   npm uninstall robotjs node-record-lpcm16
   npm install
   npm start
   ```

3. **Contatação:**
   - Abra uma issue no repositório
   - Inclua logs de erro completos
   - Especifique sua versão do Windows/Node

---

## ✅ Verificação Final

Depois de aplicar as correções, teste:

1. `npm start` - deve iniciar sem erros
2. F2 - deve mostrar "Gravando..."
3. Configure chave API
4. Teste uma transcrição completa

**Status:** ✅ Todas as correções foram aplicadas automaticamente!
