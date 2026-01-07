# Voice Commands Testing Guide

This guide provides comprehensive testing instructions for the new voice command feature in OpenWispr.

## Automated Tests

Run the automated test suite:
```bash
node test-voice-commands.js
```

**All 18 tests passed successfully!** ✅

## Manual Testing Instructions

### Prerequisites
1. Start the application: `npm start`
2. Configure your Groq API key in settings
3. Make sure the code-snippet hotkey is configured (default: `Ctrl+Shift+Win`)

### Test Scenarios

#### 1. English Voice Commands

##### Test: Bash/Terminal Commands
**Hotkey**: Press and hold `Ctrl+Shift+Win` (code-snippet hotkey)
**Say**: "command list files"
**Expected Result**: Generates bash command like `ls -la`

**Other examples to try**:
- "command find all JavaScript files" → `find . -name "*.js"`
- "command search for error in logs" → `grep -i "error" /var/log/*`
- "command show disk usage" → `df -h`

##### Test: JavaScript Code Generation
**Say**: "javascript create function"
**Expected Result**: Generates JavaScript code like `function myFunction() { }`

**Other examples**:
- "javascript if user id exists then write user logged in" → `if(user.id) { console.log('user logged in'); }`
- "javascript create variable is active set to true" → `const isActive = true;`

##### Test: TypeScript Code Generation
**Say**: "typescript user interface"
**Expected Result**: Generates TypeScript interface

**Other examples**:
- "typescript create user interface with name and email" → `interface User { name: string; email: string; }`
- "typescript function get user by id" → `function getUserById(id: number): User { ... }`

##### Test: Python Code Generation
**Say**: "python hello world"
**Expected Result**: Generates Python code like `print('hello world')`

**Other examples**:
- "python if user id exists print user logged in" → `if user.id:\n    print('user logged in')`
- "python create function get user by id" → `def get_user_by_id(user_id: int) -> str:\n    pass`

#### 2. Portuguese Voice Commands

First, switch the app language to Portuguese (pt-BR) in settings.

##### Test: Bash/Terminal Commands (Portuguese)
**Say**: "comando listar arquivos"
**Expected Result**: Generates bash command like `ls -la`

**Other examples**:
- "comando encontrar arquivos JavaScript" → `find . -name "*.js"`
- "comando mostrar uso do disco" → `df -h`

##### Test: Other Languages (Portuguese)
**Say**: "javascript criar função"
**Expected Result**: Generates JavaScript code

Note: "javascript", "typescript", and "python" keywords remain the same in Portuguese.

#### 3. Edge Cases

##### Test: Case Insensitivity
**Say**: "COMMAND list files" (uppercase)
**Expected Result**: Works correctly, generates bash command

##### Test: Extra Spaces
**Say**: "  command   list files  " (extra spaces)
**Expected Result**: Works correctly, spaces are trimmed

##### Test: No Command Prefix (Backward Compatibility)
**Say**: "create a function" (no language prefix)
**Expected Result**: Defaults to JavaScript code generation

##### Test: Word Boundary Matching
**Say**: "commander list files" (should NOT match "command")
**Expected Result**: Defaults to JavaScript, does NOT detect as bash command

##### Test: Only Command Word
**Say**: "command" (nothing after)
**Expected Result**: Generates nothing or minimal code

#### 4. Comparison Test: Normal vs Code-Snippet Hotkey

##### Normal Hotkey (Ctrl+Win)
**Say**: "Testing normal transcription"
**Expected Result**: Inserts raw text: "Testing normal transcription"

##### Code-Snippet Hotkey (Ctrl+Shift+Win)
**Say**: "javascript create variable test"
**Expected Result**: Inserts interpreted JavaScript code: `const test = ...`

### Expected Console Output

When using the code-snippet hotkey, you should see logs like:

```
🔧 Code snippet mode: enabled
🎤 Gravação iniciada (Web Audio API)
⬛️ Gravação parada
📝 Transcription for code snippet: "javascript create function"
🎯 Detected language: javascript, stripped: "create function"
🤖 Interpreting code with Groq: "create function"
✅ Code interpretation result: "function myFunction() { }"
💻 Interpreted javascript code: "function myFunction() { }"
```

### Troubleshooting

#### Issue: "Not recording" error
**Solution**: This has been fixed. If you still see it, ensure you're using the latest code.

#### Issue: No voice command detected (always defaults to JavaScript)
**Check**:
1. Verify you said the command keyword at the START of your phrase
2. Ensure the locale is set correctly in settings (en or pt-BR)
3. Check console for `🎯 Voice command detected:` or `🎯 No voice command detected` logs

#### Issue: Code not generated correctly
**Check**:
1. Groq API key is configured
2. Check console for `❌` error messages
3. Verify the Groq API has credits/quota available

## Test Results Summary

### Automated Tests: ✅ ALL PASSED (18/18)

#### English Commands (4/4 passed)
- ✅ Bash: "command list files"
- ✅ JavaScript: "javascript create function"
- ✅ TypeScript: "typescript user interface"
- ✅ Python: "python hello world"

#### Portuguese Commands (4/4 passed)
- ✅ Bash: "comando listar arquivos"
- ✅ JavaScript: "javascript criar função"
- ✅ TypeScript: "typescript interface usuario"
- ✅ Python: "python ola mundo"

#### Edge Cases (10/10 passed)
- ✅ Uppercase: "COMMAND list files"
- ✅ Mixed case: "JavaScript create function"
- ✅ Extra spaces: "  command   list files  "
- ✅ No prefix (EN): "create a function" → defaults to JavaScript
- ✅ No prefix (PT): "criar uma função" → defaults to JavaScript
- ✅ Word boundary: "commander list files" → NOT matched as command
- ✅ Empty string: "" → defaults to JavaScript
- ✅ Whitespace only: "   " → defaults to JavaScript
- ✅ Only keyword: "command" → bash with empty content
- ✅ Only keyword: "javascript" → JavaScript with empty content

## Implementation Quality Checklist

- ✅ Voice command detection is case-insensitive
- ✅ Handles extra whitespace correctly
- ✅ Word boundary matching prevents false positives
- ✅ i18n support for English and Portuguese
- ✅ Defaults to JavaScript when no command detected (backward compatible)
- ✅ Command prefix is stripped before sending to interpreter
- ✅ Extensible architecture for adding new languages
- ✅ Race condition protection in main.ts
- ✅ All edge cases handled properly

## Next Steps

1. **Manual Testing**: Test with actual voice input using your microphone
2. **Integration Testing**: Verify text is inserted correctly into other applications
3. **User Acceptance**: Get feedback on command keywords and behavior
4. **Documentation**: Update user-facing documentation with voice command examples

## Adding New Languages (Future)

To add support for more programming languages (e.g., Go, Rust, Java):

1. Add to `CodeLanguage` type in `src/types.ts`
2. Add keywords to `src/locales/en.json` and `src/locales/pt-BR.json`
3. Create new interpreter in `src/interpreters/`
4. Register in `src/code-interpreter-factory.ts`
5. Update this test file with new test cases

No changes needed to VoiceCommandDetector - it automatically picks up new keywords from i18n!
