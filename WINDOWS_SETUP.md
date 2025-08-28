# OpenWispr - Configuração no Windows

Este guia fornece instruções específicas para configurar e executar o OpenWispr no Windows.

## 📋 Pré-requisitos

### 1. Node.js
- Baixe e instale do [nodejs.org](https://nodejs.org/)
- Escolha a versão LTS (recomendada)
- Verifique a instalação: `node --version`

### 2. Python 3
- Baixe e instale do [python.org](https://python.org/)
- **IMPORTANTE**: Marque "Add Python to PATH" durante a instalação
- Verifique a instalação: `python --version`

### 3. Rust
- Instale do [rustup.rs](https://rustup.rs/)
- Execute o instalador e siga as instruções
- Reinicie o terminal após a instalação
- Verifique a instalação: `cargo --version`

### 4. Microsoft C++ Build Tools
- Instale o Visual Studio Build Tools ou Visual Studio Community
- Ou instale apenas as ferramentas de build C++:
  ```cmd
  winget install Microsoft.VisualStudio.2022.BuildTools
  ```

### 5. Git (opcional, mas recomendado)
- Baixe e instale do [git-scm.com](https://git-scm.com/)

## 🚀 Configuração Rápida

### Opção 1: Configuração Automática
```cmd
# Clone o repositório (se ainda não fez)
git clone https://github.com/openwispr/openwispr.git
cd openwispr

# Instale as dependências
npm run setup

# Inicie o servidor de desenvolvimento
npm run dev
```

### Opção 2: Configuração Manual
```cmd
# 1. Instalar dependências do frontend
cd frontend
npm install
cd ..

# 2. Instalar dependências do backend
cd backend
pip install -r requirements.txt
cd ..

# 3. Instalar Tauri CLI
cargo install tauri-cli

# 4. Iniciar desenvolvimento
npm run tauri dev
```

## 🛠️ Comandos Disponíveis

```cmd
# Desenvolvimento
npm run dev              # Inicia o servidor de desenvolvimento (multiplataforma)
npm run dev:windows      # Força o uso do script Windows (.bat)
npm run dev:simple       # Versão simplificada para teste rápido
scripts\dev.bat          # Executa diretamente o script Windows

# Diagnóstico
npm run diagnose         # Executa diagnóstico para identificar problemas
scripts\diagnose.bat     # Executa diretamente o diagnóstico

# Build
npm run build            # Build de produção (multiplataforma)
npm run build:windows    # Força o uso do script Windows (.bat)
scripts\build.bat        # Executa diretamente o script Windows

# Tauri direto
npm run tauri dev        # Inicia desenvolvimento via Tauri
npm run tauri build      # Build de produção via Tauri
```

## 🔧 Solução de Problemas Comuns

### Erro: "'.' não é reconhecido como um comando interno"
Este erro ocorre quando o sistema tenta executar um script bash (.sh) no Windows.

**Solução:**
```cmd
# Use o comando específico para Windows:
npm run dev:windows

# Ou execute diretamente:
scripts\dev.bat
```

### Script para após verificar Python e para silenciosamente
Se o script `dev:windows` para após verificar o Python sem erro:

**Diagnóstico:**
```cmd
# Execute o diagnóstico para identificar o problema:
npm run diagnose

# Ou tente a versão simplificada:
npm run dev:simple
```

**Possíveis causas:**
1. Rust/Cargo não instalado ou não no PATH
2. Tauri CLI não instalado
3. Erro silencioso na instalação de dependências

**Solução rápida:**
```cmd
# Tente a versão simplificada primeiro:
npm run dev:simple

# Se não funcionar, instale o Rust:
# 1. Vá para https://rustup.rs/
# 2. Baixe e execute o instalador
# 3. Reinicie o terminal
# 4. Execute: cargo install tauri-cli
```

### Erro: "python3 não é reconhecido"
No Windows, o Python pode estar instalado como `python` em vez de `python3`.

**Solução:**
```cmd
# Teste qual comando funciona:
python --version
python3 --version

# Se apenas 'python' funcionar, crie um alias ou use:
python -m pip install -r backend\requirements.txt
```

### Erro: "cargo não é reconhecido"
O Rust não foi instalado corretamente ou não está no PATH.

**Solução:**
1. Reinstale o Rust do [rustup.rs](https://rustup.rs/)
2. Reinicie o terminal/prompt de comando
3. Verifique: `cargo --version`

### Erro de Permissões do Microfone
O Windows pode bloquear o acesso ao microfone.

**Solução:**
1. Vá para Configurações → Privacidade → Microfone
2. Ative "Permitir que aplicativos acessem o microfone"
3. Execute o aplicativo como administrador se necessário

### Erro de Build C++
Problemas com compilação de dependências nativas.

**Solução:**
```cmd
# Instale as ferramentas de build C++:
npm install --global windows-build-tools

# Ou instale o Visual Studio Build Tools
```

### Erro: "Access denied" ao instalar pacotes
Problemas de permissão ao instalar dependências.

**Solução:**
```cmd
# Execute o prompt como administrador
# Ou use o PowerShell como administrador
```

## 📁 Estrutura de Arquivos Windows

```
openwispr\
├── scripts\
│   ├── dev.bat              ✅ Script de desenvolvimento Windows
│   ├── build.bat            ✅ Script de build Windows  
│   ├── dev.sh               ✅ Script Unix (não usado no Windows)
│   └── build.py             ✅ Script Python (multiplataforma)
├── frontend\                ✅ Frontend React
├── backend\                 ✅ Backend Python
└── src-tauri\              ✅ Configuração Tauri
```

## 🎯 Teste da Instalação

Para verificar se tudo está funcionando:

```cmd
# 1. Verificar Node.js
node --version

# 2. Verificar Python
python --version

# 3. Verificar Rust
cargo --version

# 4. Testar o aplicativo
npm run dev:windows
```

## 💡 Dicas para Windows

1. **Use o PowerShell ou Command Prompt** - Evite usar Git Bash para executar os comandos npm
2. **Execute como Administrador** se encontrar problemas de permissão
3. **Desative antivírus temporariamente** durante a primeira instalação se houver problemas
4. **Adicione exceções no Windows Defender** para a pasta do projeto
5. **Use caminhos absolutos** se houver problemas com caminhos relativos

## 🆘 Suporte

Se continuar com problemas:

1. Verifique a seção [Issues](https://github.com/openwispr/openwispr/issues)
2. Execute `npm run dev:windows` em vez de `npm run dev`
3. Tente executar diretamente: `scripts\dev.bat`
4. Verifique se todas as ferramentas estão instaladas e no PATH

---

**Nota:** Este projeto foi testado no Windows 10/11. Para versões mais antigas, podem ser necessários ajustes adicionais.