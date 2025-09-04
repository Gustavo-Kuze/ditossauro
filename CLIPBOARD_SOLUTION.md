# Solução de Inserção de Texto via Clipboard

## Problema Resolvido

O problema anterior era que o RobotJS digitava o texto letra por letra, causando lentidão significativa ao inserir textos longos da transcrição da AssemblyAI em aplicações externas.

## Nova Solução

### Método Principal: Clipboard
A solução agora usa o clipboard (área de transferência) do sistema para inserir texto rapidamente:

1. **Backup**: Salva o conteúdo atual do clipboard
2. **Copia**: Coloca o texto transcrito no clipboard
3. **Cola**: Usa `Ctrl+V` para colar instantaneamente
4. **Restaura**: Volta o clipboard ao estado anterior

### Fallback Automático
Se por algum motivo o método do clipboard falhar, o sistema automaticamente volta ao método anterior de digitação caractere por caractere.

## Configuração

A nova funcionalidade pode ser controlada através da configuração `behavior.useClipboard`:

```typescript
{
  behavior: {
    autoInsert: true,
    showConfirmation: false,
    useClipboard: true  // true = clipboard (rápido), false = digitação (lento)
  }
}
```

**Padrão**: `true` (usa clipboard por padrão para máxima performance)

## Vantagens

1. **Performance**: Inserção praticamente instantânea vs vários segundos
2. **Compatibilidade**: Funciona com qualquer aplicação que aceite `Ctrl+V`
3. **Backup automático**: Preserva o conteúdo original do clipboard
4. **Fallback robusto**: Se falhar, volta ao método anterior automaticamente
5. **Configurável**: Pode ser desabilitado se houver problemas de compatibilidade

## Implementação Técnica

### Arquivo Modificados:
- `src/text-inserter.ts` - Lógica principal da inserção
- `src/voice-flow-app.ts` - Integração com configurações
- `src/types.ts` - Nova configuração `useClipboard`
- `src/settings-manager.ts` - Valor padrão da configuração

### Novos Métodos:
- `insertTextViaClipboard()` - Inserção rápida via clipboard
- `insertTextViaTyping()` - Método anterior como fallback

## Uso

A funcionalidade é transparente para o usuário - a inserção de texto continuará funcionando normalmente, mas muito mais rápida.

Para desabilitar (se necessário):
1. Abrir configurações do aplicativo
2. Ir para seção "Comportamento" 
3. Desmarcar "Usar Clipboard para inserção rápida"

## Benefícios Esperados

- **Textos curtos (1-10 palavras)**: Redução de ~2-3 segundos para instantâneo
- **Textos médios (10-50 palavras)**: Redução de ~5-15 segundos para instantâneo  
- **Textos longos (50+ palavras)**: Redução de ~15+ segundos para instantâneo

A experiência do usuário será significativamente melhorada, especialmente para transcrições mais longas.
