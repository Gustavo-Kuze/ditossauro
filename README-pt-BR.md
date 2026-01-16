# Ditossauro

[![Inglês](https://img.shields.io/badge/Lang-Inglês-blue)](README.md) [![Português](https://img.shields.io/badge/Lang-Português-green)](README-pt-BR.md)

<img src="src/assets/app_icon.png" alt="Logo do Ditossauro" width="150" />

Ditossauro é uma ferramenta de produtividade por voz de código aberto. Ele permite que você transcreva fala e gere **código ou comandos de terminal diretamente da linguagem falada** usando atalhos globais.

O aplicativo é projetado para desenvolvedores que desejam interação rápida e mãos livres com o sistema enquanto codificam ou trabalham no terminal.

---

## 📦 Requisitos

Antes de executar o Ditossauro, certifique-se de ter o seguinte:

### Requisitos do Sistema

* Um **microfone** funcional

### Requisitos de Software

* **Node.js** (recomendado: última versão LTS)
* **npm** ou **yarn**
* **Git**

### Chaves de API

* **Groq API Key** (obrigatória)
  * Usada para fala-para-texto baseado em Whisper, processamento de LLM e geração de código

Defina a chave de API nas configurações do aplicativo ao iniciá-lo.

> ⚠️ Sem uma chave de API Groq válida, a transcrição e geração de código/comando não funcionarão.

---

## ✨ Recursos

### 🎙️ Transcrição de Fala (Texto Simples)

* Fala-para-texto de alta qualidade alimentado por **Whisper via API Groq**
* Gera **apenas texto simples**, ideal para escrever mensagens, anotações ou documentação

**Atalho**

```
CTRL + Win (segurar)
```

---

### 💻 Geração de Código e Comandos por Voz

Você agora pode falar **instruções em linguagem natural** e fazer o Ditossauro gerar:

* Código-fonte (JavaScript, Python, etc.)
* Comandos de shell/terminal
* Snippets prontos para desenvolvedores para colar e executar

> Lembre-se: sempre inicie sua frase com o tipo de código que deseja gerar.

Comandos disponíveis:

* "command" (comando) - para comandos de terminal
* "javascript" - para snippets de código JavaScript
* "typescript" - para snippets de código TypeScript
* "python" - para snippets de código Python
* "bash" - para scripts Bash
* "hotkeys" (atalhos) - para pressionar atalhos
* "translate" (traduzir) - para traduzir texto para outros idiomas
* "dito" - assistência pessoal de propósito geral

Isso permite um fluxo de trabalho semelhante a *"ditado para desenvolvedores"*.

**Exemplos**

* "command encontrar todos os arquivos JavaScript" → `find . -name "*.js"`
* "command pesquisar erro nos logs" → `grep -i "error" /var/log/*`
* "command mostrar uso do disco" → `df -h`
* "javascript se id de usuário existe então escrever usuário conectado" → `if(user.id) { console.log('user logged in'); }`
* "javascript criar variável is active definida como true" → `const isActive = true;`
* "translate gato para alemão" → `Katze`
* "hotkeys control shift f" → Pressiona `CTRL + Shift + F` na janela focada (busca global no VSCode, por exemplo)

**Atalho**

```
CTRL + Shift + Win
```

Quando este modo é acionado, o Ditossauro:

1. Transcreve sua fala usando Whisper (Groq)
2. Interpreta a intenção (código vs comando)
3. Gera **apenas o código ou comando gerado**, sem texto extra

---

## ⌨️ Resumo de Atalhos

| Ação | Atalho |
| -------- | --------------- |
| Transcrição simples | `CTRL + Win` (segurar) |
| Geração de código/comando | `CTRL + Shift + Win` |

## Roadmap

- [x] Gerar comandos de terminal
- [x] Gerar snippets de código
- [x] Traduzir texto para outros idiomas
- [x] Pressionar atalhos por comandos de voz
- [x] Perguntas e respostas rápidas (assistente pessoal)
- [x] Suporte para Windows
- [ ] Suporte para Linux
- [ ] Suporte para MacOS
- [x] Testes unitários
- [ ] Testes E2E
- [x] Pressionar atalhos baseados em comandos de voz
- [x] Suporte para API Groq
- [ ] Suporte para API OpenAI
- [ ] Suporte para API Anthropic
- [ ] Suporte para API Google

## Contribuindo

Contribuições são bem-vindas! Por favor, leia nossas [diretrizes de contribuição](CONTRIBUTING.md) para mais informações.

## Licença

Licença MIT
