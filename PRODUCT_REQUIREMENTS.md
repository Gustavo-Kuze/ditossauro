# Documento de Requisitos do Produto - VoiceFlow AI

## 1. Visão Geral do Produto

### 1.1 Descrição
O VoiceFlow AI é uma alternativa open source ao WisprFlow, projetada como um aplicativo de desktop para transcrição de voz em tempo real. O aplicativo permite aos usuários capturar áudio através de hotkeys, processar a transcrição usando a API da AssemblyAI e inserir automaticamente o texto transcrito em qualquer campo de texto ativo no sistema operacional.

### 1.2 Objetivos
- Fornecer uma solução gratuita e open source para transcrição de voz
- Oferecer integração universal com qualquer aplicativo no sistema
- Garantir alta precisão na transcrição utilizando AssemblyAI
- Proporcionar uma experiência de usuário fluida e responsiva

### 1.3 Público-Alvo
- Profissionais que precisam de transcrição rápida (escritores, jornalistas, estudantes)
- Pessoas com dificuldades de digitação
- Usuários que buscam maior produtividade na criação de conteúdo
- Desenvolvedores que querem uma alternativa open source

## 2. Requisitos Funcionais

### 2.1 Captura de Áudio (RF01)
- **RF01.1**: O aplicativo deve permitir configuração de hotkeys personalizáveis para iniciar/parar a gravação
- **RF01.2**: A gravação deve iniciar quando a hotkey for pressionada e mantida
- **RF01.3**: A gravação deve parar quando a hotkey for solta
- **RF01.4**: Deve fornecer feedback visual/sonoro do status de gravação
- **RF01.5**: Deve detectar automaticamente o dispositivo de entrada de áudio padrão
- **RF01.6**: Deve permitir seleção manual do dispositivo de entrada de áudio

### 2.2 Processamento de Transcrição (RF02)
- **RF02.1**: Deve integrar com a API da AssemblyAI para transcrição
- **RF02.2**: Deve suportar configuração de idioma (português brasileiro e inglês prioritários)
- **RF02.3**: Deve processar arquivos de áudio em formatos comuns (WAV, MP3, FLAC)
- **RF02.4**: Deve implementar retry automático em caso de falha na API
- **RF02.5**: Deve mostrar indicador de progresso durante o processamento

### 2.3 Inserção de Texto (RF03)
- **RF03.1**: Deve inserir automaticamente o texto transcrito no campo ativo
- **RF03.2**: Deve funcionar com qualquer aplicativo do sistema (navegador, editor de texto, etc.)
- **RF03.3**: Deve preservar a posição do cursor no campo de destino
- **RF03.4**: Deve permitir cancelamento antes da inserção
- **RF03.5**: Deve suportar diferentes modos de inserção (substituir, adicionar)

### 2.4 Interface do Usuário (RF04)
- **RF04.1**: Interface minimalista com opção de ficar na system tray
- **RF04.2**: Painel de configurações para hotkeys, idioma e dispositivos
- **RF04.3**: Histórico de transcrições com opção de busca
- **RF04.4**: Indicador visual do status da aplicação
- **RF04.5**: Sistema de notificações para feedback do usuário

### 2.5 Configurações e Personalização (RF05)
- **RF05.1**: Configuração de hotkeys globais do sistema
- **RF05.2**: Seleção de idioma para transcrição
- **RF05.3**: Configuração de dispositivos de áudio
- **RF05.4**: Configuração da API da AssemblyAI (chave API)
- **RF05.5**: Configurações de comportamento (auto-inserção, confirmação)

## 3. Requisitos Não-Funcionais

### 3.1 Performance (RNF01)
- **RNF01.1**: Tempo de resposta para início de gravação < 200ms
- **RNF01.2**: Processamento de transcrição deve ser otimizado para conexões lentas
- **RNF01.3**: Uso de memória RAM não deve exceder 150MB em operação normal
- **RNF01.4**: Aplicativo deve iniciar em menos de 3 segundos

### 3.2 Usabilidade (RNF02)
- **RNF02.1**: Interface intuitiva que pode ser operada apenas com hotkeys
- **RNF02.2**: Documentação completa em português brasileiro e inglês
- **RNF02.3**: Instalação simples em um clique
- **RNF02.4**: Configuração inicial em menos de 2 minutos

### 3.3 Compatibilidade (RNF03)
- **RNF03.1**: Suporte a Windows 10/11 (prioritário)
- **RNF03.2**: Suporte a macOS 10.15+ (futuro)
- **RNF03.3**: Suporte a Linux Ubuntu/Debian (futuro)
- **RNF03.4**: Compatibilidade com diferentes layouts de teclado

### 3.4 Segurança (RNF04)
- **RNF04.1**: Armazenamento seguro da chave API da AssemblyAI
- **RNF04.2**: Não armazenar arquivos de áudio localmente após transcrição
- **RNF04.3**: Comunicação criptografada com APIs externas
- **RNF04.4**: Opção de processamento local para dados sensíveis (futuro)

### 3.5 Confiabilidade (RNF05)
- **RNF05.1**: Disponibilidade de 99% durante uso normal
- **RNF05.2**: Recuperação automática de falhas de rede
- **RNF05.3**: Sistema de logs para diagnóstico
- **RNF05.4**: Backup automático das configurações

## 4. Requisitos Técnicos

### 4.1 Arquitetura
- **Plataforma**: Electron com TypeScript
- **Frontend**: HTML/CSS/JavaScript (Vite)
- **Backend**: Node.js (processo principal)
- **API Externa**: AssemblyAI para transcrição

### 4.2 Dependências Principais
- **Captura de Áudio**: `node-record-lpcm16` ou similar
- **Hotkeys Globais**: `electron-globalshortcut` ou `node-global-key-listener`
- **Inserção de Texto**: `robotjs` ou APIs nativas do sistema
- **API Client**: `axios` ou `fetch` para comunicação com AssemblyAI

### 4.3 Estrutura de Dados
```typescript
interface TranscriptionSession {
  id: string;
  timestamp: Date;
  audioFile?: Buffer;
  transcription: string;
  duration: number;
  language: string;
  confidence: number;
}

interface AppSettings {
  hotkeys: {
    startStop: string;
    cancel: string;
  };
  audio: {
    deviceId: string;
    sampleRate: number;
  };
  api: {
    assemblyAiKey: string;
    language: string;
  };
  behavior: {
    autoInsert: boolean;
    showConfirmation: boolean;
  };
}
```

## 5. User Stories

### 5.1 Como usuário básico:
- Quero pressionar uma hotkey e falar para que minha fala seja transcrita automaticamente
- Quero que o texto apareça onde estou digitando sem precisar copiar/colar
- Quero configurar facilmente as teclas de atalho

### 5.2 Como usuário avançado:
- Quero ver o histórico das minhas transcrições
- Quero configurar diferentes idiomas para transcrição
- Quero escolher qual microfone usar

### 5.3 Como desenvolvedor:
- Quero contribuir com o código open source
- Quero estender funcionalidades através de plugins
- Quero integrar com outras APIs de transcrição

## 6. Critérios de Aceitação

### 6.1 MVP (Minimum Viable Product)
- [ ] Hotkey funcional para iniciar/parar gravação
- [ ] Integração básica com AssemblyAI
- [ ] Inserção automática de texto em campos ativos
- [ ] Interface de configuração básica
- [ ] Funciona no Windows 10/11

### 6.2 Versão 1.0
- [ ] Todos os requisitos funcionais implementados
- [ ] Interface polida e intuitiva
- [ ] Sistema de atualizações automáticas
- [ ] Documentação completa
- [ ] Testes automatizados cobrindo 80% do código

## 7. Riscos e Mitigações

### 7.1 Riscos Técnicos
- **Latência da API**: Implementar cache e otimizações
- **Compatibilidade entre sistemas**: Testes extensivos em diferentes ambientes
- **Precisão da transcrição**: Implementar pós-processamento e correções

### 7.2 Riscos de Produto
- **Concorrência**: Foco na experiência open source e gratuita
- **Adoção**: Marketing focado em comunidades de desenvolvedores
- **Sustentabilidade**: Modelo de contribuições e sponsorships

## 8. Cronograma Estimado

### Fase 1 - MVP (4-6 semanas)
- Semana 1-2: Setup do projeto e captura de áudio
- Semana 3-4: Integração com AssemblyAI
- Semana 5-6: Inserção de texto e interface básica

### Fase 2 - Versão 1.0 (6-8 semanas)
- Semana 7-8: Interface avançada e configurações
- Semana 9-10: Histórico e funcionalidades extras
- Semana 11-12: Testes, documentação e polimento
- Semana 13-14: Preparação para lançamento

## 9. Métricas de Sucesso

### 9.1 Técnicas
- Tempo de resposta < 200ms para início de gravação
- Precisão de transcrição > 95% para áudio claro
- Taxa de falhas < 1%

### 9.2 Produto
- 1000+ downloads no primeiro mês
- 50+ estrelas no GitHub
- 90%+ de satisfação dos usuários (survey)
- 10+ contribuidores ativos na comunidade

## 10. Considerações Futuras

### 10.1 Funcionalidades Avançadas
- Transcrição offline com modelos locais
- Suporte a múltiplos idiomas simultâneos
- Integração com outras APIs de IA (OpenAI Whisper)
- Comandos de voz para controle do sistema

### 10.2 Expansão de Plataforma
- Versões para macOS e Linux
- Aplicativo mobile para sincronização
- Extensão para navegadores
- API para integração com outros aplicativos
