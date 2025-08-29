Abaixo está um **Documento de Requisitos de Software (SRS)** completo e claro para o aplicativo que você quer criar. Ele segue uma estrutura comum em engenharia de software, cobrindo visão geral, requisitos funcionais, não funcionais e considerações técnicas.

---

## Documento de Requisitos – **OpenWispr**

### 1. Visão Geral

**Objetivo**
Criar um aplicativo desktop open source que permita ao usuário converter voz em texto rapidamente usando atalhos de teclado. Ao pressionar uma hotkey, o aplicativo começa a gravar áudio; ao soltar, transcreve usando *faster\_whisper* e envia o texto diretamente para o campo de entrada ativo (onde quer que o cursor esteja).

**Benefícios**

* Produtividade: Transcrição rápida sem trocar de janela.
* Portabilidade: Open source, multiplataforma (Windows, macOS, Linux).
* Baixo custo de execução: Uso de *faster\_whisper* (modelo local) sem depender de serviços pagos.
* Privacidade: Processamento local do áudio, sem enviar dados para a nuvem.

**Stakeholders**

* Usuários finais: pessoas que desejam ditar texto rapidamente (programadores, escritores, criadores de conteúdo).
* Colaboradores da comunidade open source.

---

### 2. Funcionalidades Principais

#### 2.1. Gravação por Hotkey

* **Descrição:** O app deve iniciar a gravação de áudio ao pressionar uma combinação de teclas configurável (ex.: Ctrl+Space).
* **Fluxo:**

  1. Usuário pressiona hotkey.
  2. App inicia captura de áudio do microfone padrão.
  3. Usuário mantém a tecla pressionada enquanto fala.
  4. Ao soltar a hotkey, a gravação é interrompida.

#### 2.2. Transcrição com *faster\_whisper*

* **Descrição:** O áudio gravado deve ser processado localmente com o modelo *faster\_whisper* selecionado.
* **Requisitos específicos:**

  * Suporte a diferentes tamanhos de modelo (*tiny, base, small, medium*).
  * Detecção automática de idioma (opcional).
  * Cache local do modelo para reduzir tempo de carregamento.

#### 2.3. Inserção de Texto no Foco Atual

* **Descrição:** O texto transcrito deve ser "digitado" automaticamente no campo onde o cursor estiver, sem exigir troca manual de aplicativo.
* **Detalhes técnicos:**

  * Usar injeção de teclado simulada (key events) ou APIs de automação do sistema.
  * Manter compatibilidade com navegadores, IDEs, editores de texto, mensageiros etc.

#### 2.4. Configurações do Usuário

* **Itens configuráveis:**

  * Hotkey personalizada (com validação para não conflitar com atalhos do sistema).
  * Modelo Whisper utilizado (seleção via menu).
  * Sensibilidade/volume mínimo para gravação.
  * Opção para enviar texto com quebra de linha ou não.
  * Habilitar/desabilitar detecção automática de idioma.

#### 2.5. Indicadores Visuais

* **Descrição:** Mostrar um pequeno overlay indicando status:

  * *Ouvindo* (quando a hotkey está pressionada).
  * *Processando* (quando o áudio é transcrito).
  * *Pronto* (quando texto é enviado).
* **Detalhe:** Overlay minimalista, não invasivo, sempre no topo.

---

### 3. Requisitos Não Funcionais

* **Multiplataforma:** Suporte a Windows, macOS e Linux.
* **Baixa latência:** Transcrição deve ocorrer em < 2 segundos para áudios curtos (1–3s).
* **Segurança/privacidade:** Nenhum áudio ou texto é enviado para servidores externos.
* **Open Source:** Código hospedado no GitHub sob licença permissiva (MIT ou Apache 2.0).
* **Performance:** Uso eficiente de CPU/GPU para rodar *faster\_whisper*.
* **Instalação simples:** Disponibilizar binários (instalador ou AppImage) além do código-fonte.

---

### 4. Restrições Técnicas

* **Tecnologia base sugerida:**

  * Electron para app desktop.
  * Python backend para *faster_whisper* ou build do modelo em C++/Rust (para melhor performance).
  * Comunicação entre frontend e backend via IPC (Electron).
* **Bibliotecas auxiliares:**

  * *pyaudio* ou *sounddevice* para captura de áudio.
  * *keyboard* (Windows/Linux) e *pynput* ou APIs nativas para hotkeys.
  * *robotjs* ou alternativas para injeção de texto.

---

### 5. Casos de Uso

#### UC-01: Ditado rápido

**Ator:** Usuário final
**Cenário:**

1. Usuário pressiona Ctrl+Space.
2. Fala "Reunião marcada para amanhã às 10h."
3. Solta a tecla.
4. App transcreve e insere texto diretamente no editor de e-mail aberto.

#### UC-02: Troca de idioma

**Ator:** Usuário final
**Cenário:**

1. Usuário seleciona modelo multilíngue no menu de configurações.
2. Pressiona hotkey, fala em inglês.
3. App detecta idioma automaticamente e insere texto no idioma correto.

---

### 6. Possíveis Extensões Futuras

* Suporte a comandos de voz (ex.: "abrir navegador", "colocar vírgula").
* Integração com APIs externas (para quem quiser usar OpenAI/Deepgram).
* Histórico de transcrições para revisão posterior.
* Tema dark/light no overlay.

---

### 7. Critérios de Aceitação

* O app deve funcionar offline após o download do modelo Whisper.
* O texto inserido não pode ter mais de 300 ms de atraso perceptível em relação ao término da fala.
* A hotkey padrão deve funcionar logo na primeira execução, mas pode ser alterada.
* O overlay nunca deve bloquear o foco do usuário.
