# Voice Commands

Complete reference guide for all voice commands in Ditossauro.

## Command Structure

All voice commands follow this pattern:

```
[KEYWORD] [natural language instruction]
```

The keyword tells Ditossauro what type of output to generate, and the instruction describes what you want to create.

---

## Terminal/Bash Commands

### English
**Keyword**: `command`

### Portuguese
**Keyword**: `comando`

### Examples

| Voice Input | Generated Output |
|-------------|------------------|
| "command find all JavaScript files" | `find . -name "*.js"` |
| "command search for error in logs" | `grep -i "error" /var/log/*` |
| "command show disk usage" | `df -h` |
| "command list processes using port 3000" | `lsof -i :3000` |
| "command compress this directory" | `tar -czf archive.tar.gz .` |
| "command show running docker containers" | `docker ps` |
| "command git commit all changes" | `git add . && git commit -m "changes"` |
| "command count lines in all python files" | `find . -name "*.py" | xargs wc -l` |

### Tips
* Be specific about what you want to do
* Mention file types or patterns when relevant
* Common tools are well-supported (git, docker, grep, find, etc.)

---

## JavaScript

### Keyword
`javascript` (same in all languages)

### Examples

| Voice Input | Generated Output |
|-------------|------------------|
| "javascript create variable is active set to true" | `const isActive = true;` |
| "javascript if user id exists then write user logged in" | `if(user.id) { console.log('user logged in'); }` |
| "javascript function to calculate sum of two numbers" | `function sum(a, b) { return a + b; }` |
| "javascript arrow function to multiply by two" | `const multiplyByTwo = (n) => n * 2;` |
| "javascript async function to fetch user data" | `async function fetchUserData() { ... }` |
| "javascript create array of numbers one to ten" | `const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];` |
| "javascript map array to uppercase" | `array.map(item => item.toUpperCase())` |

### Tips
* Use natural language to describe the logic
* Mention function types (async, arrow, regular)
* Specify variable types (const, let, var)

---

## TypeScript

### Keyword
`typescript` (same in all languages)

### Examples

| Voice Input | Generated Output |
|-------------|------------------|
| "typescript create user interface with name and email" | `interface User { name: string; email: string; }` |
| "typescript function get user by id" | `function getUserById(id: number): User { ... }` |
| "typescript type for api response with data and error" | `type ApiResponse = { data?: any; error?: string; }` |
| "typescript async function returns promise of string" | `async function getData(): Promise<string> { ... }` |
| "typescript class with constructor" | `class MyClass { constructor() { ... } }` |

### Tips
* Mention interfaces, types, or classes explicitly
* Specify return types when important
* Type annotations are automatically included

---

## Python

### Keyword
`python` (same in all languages)

### Examples

| Voice Input | Generated Output |
|-------------|------------------|
| "python hello world" | `print('hello world')` |
| "python if user id exists print user logged in" | `if user.id:\n    print('user logged in')` |
| "python create function get user by id" | `def get_user_by_id(user_id: int) -> str:\n    pass` |
| "python list comprehension squares" | `[x**2 for x in range(10)]` |
| "python class with init method" | `class MyClass:\n    def __init__(self):\n        pass` |
| "python read file line by line" | `with open('file.txt') as f:\n    for line in f:\n        print(line)` |

### Tips
* Python indentation is automatically handled
* Specify function signatures when needed
* Common patterns (list comprehensions, context managers) work well

---

## Bash Scripts

### Keyword
`bash` (same in all languages)

### Examples

| Voice Input | Generated Output |
|-------------|------------------|
| "bash script to backup files" | Complete bash script with shebang and backup logic |
| "bash loop through files" | `for file in *; do ... done` |
| "bash if directory exists" | `if [ -d "/path/to/dir" ]; then ... fi` |
| "bash function to check if service is running" | Complete function with service check logic |

### Tips
* Good for creating complete shell scripts
* Automatically includes proper syntax and shebangs
* Handles conditionals and loops

---

## Hotkey Pressing

### Keyword
`hotkeys` (same in all languages)

### Examples

| Voice Input | Action |
|-------------|--------|
| "hotkeys control shift f" | Presses `CTRL + Shift + F` |
| "hotkeys alt tab" | Switches windows |
| "hotkeys control c" | Copy |
| "hotkeys control v" | Paste |
| "hotkeys windows d" | Show desktop |
| "hotkeys control shift escape" | Opens Task Manager (Windows) |

### Supported Modifiers
* `control` / `ctrl`
* `shift`
* `alt`
* `win` / `windows` / `super` / `meta`

### Supported Keys
* All letters (a-z)
* All numbers (0-9)
* Function keys (f1-f12)
* Special keys (tab, enter, escape, space, etc.)

### Tips
* Say modifiers first, then the key
* Multiple modifiers are supported
* Common shortcuts work as expected

---

## Translation

### Keyword
`translate` (same in all languages)

### Examples

| Voice Input | Generated Output |
|-------------|------------------|
| "translate cat to german" | `Katze` |
| "translate hello world to spanish" | `hola mundo` |
| "translate good morning to french" | `bonjour` |
| "translate thank you to japanese" | `ありがとう` |

### Supported Languages
* Major world languages are supported
* Language names can be spoken in English or your app language

### Tips
* Say the word/phrase first, then "to [language]"
* Works with single words or phrases
* Maintains context when appropriate

---

## Personal Assistant (Dito)

### Keyword
`dito` (same in all languages)

### Examples

| Voice Input | Generated Output |
|-------------|------------------|
| "dito, what's the height of the Eiffel Tower?" | Factual answer with measurement |
| "dito, explain quantum computing" | Detailed explanation |
| "dito, what's the capital of Japan?" | `Tokyo` |
| "dito, how do I center a div in CSS?" | CSS solution and explanation |
| "dito, what's the difference between let and const?" | Explanation of JavaScript concepts |

### Use Cases
* Quick factual questions
* Programming concept explanations
* General knowledge queries
* Quick calculations
* Unit conversions

### Tips
* Start with "dito" followed by a comma or pause
* Ask clear, specific questions
* Works best for factual information

---

## Testing Voice Commands

### Automated Tests

Run the test suite to verify voice command detection:

```bash
node test-voice-commands.js
```

All tests should pass (18/18).

### Manual Testing

1. Start the application: `npm start`
2. Configure your Groq API key
3. Use the code-snippet hotkey: `CTRL + Shift + Win`
4. Try the examples above

### Troubleshooting

#### Voice command not detected
* Ensure you say the keyword at the START of your phrase
* Check your locale settings (en or pt-BR)
* Look for console logs indicating detection

#### Generated code is incorrect
* Try rephrasing your instruction
* Be more specific about what you want
* Check that your Groq API key is valid

#### Hotkeys not working
* Verify the application is running
* Check that global hotkeys are enabled in settings
* Ensure no other application is using the same hotkey

---

## Edge Cases & Special Behaviors

### Case Insensitivity
All keywords are case-insensitive:
* "COMMAND", "command", "Command" all work the same

### Whitespace Handling
Extra spaces are automatically trimmed:
* "  command   list files  " works correctly

### No Keyword (Backward Compatibility)
If no keyword is detected, defaults to JavaScript:
* "create a function" → Generates JavaScript function

### Word Boundary Matching
Prevents false matches:
* "commander" does NOT match "command"
* "javascript ninja" correctly matches "javascript"

---

## Adding Custom Commands (Advanced)

To add support for more languages or command types, see the developer documentation in the repository:

1. Add to `CodeLanguage` type in `src/types.ts`
2. Add keywords to language files in `src/locales/`
3. Create interpreter in `src/interpreters/`
4. Register in `src/code-interpreter-factory.ts`

The voice command detector automatically picks up new keywords from the localization files.
