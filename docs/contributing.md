# Contributing to Ditossauro

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to Ditossauro. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Getting Started

### Prerequisites

*   **Node.js**: standard LTS version recommended.
*   **Git**: for version control.
*   **A Groq API Key**: Required for most functionality (Transcription & Code generation).

### Installation

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/ditossauro.git
    cd ditossauro
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
    > **Note**: This project relies on native modules (like `uiohook-napi`). The `postinstall` script should automatically rebuild them for Electron. If you encounter errors, try running `npm run postinstall` manually or ensure you have the necessary build tools for your OS (e.g., Visual Studio Build Tools on Windows, Xcode Command Line Tools on macOS).

## Development Workflow

1.  **Create a Branch**: Always work on a new branch for your specific feature or fix.
    ```bash
    git checkout -b feature/my-new-feature
    ```
2.  **Run the App**: Start the development server and Electron app.
    ```bash
    npm start
    ```
3.  **Linting**: Ensure your code follows the project's style guidelines.
    ```bash
    npm run lint
    ```

## Pull Request Process

1.  Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2.  Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3.  Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/).
4.  You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

## Coding Standards

*   **TypeScript**: We use TypeScript. Please ensure all new code is strongly typed.
*   **Linting**: Run `npm run lint` before committing to catch common errors.
*   **Localization**: We use i18next for localization. Please ensure all new strings are added to the appropriate language files.

## Testing

### Running Tests

Execute the test suite:

```bash
npm test
```

### Writing Tests

* Add unit tests for new functionality
* Ensure all tests pass before submitting a PR
* Test files should be placed in the `tests/` directory
* Use descriptive test names that explain what is being tested

### Voice Command Tests

For voice command features, also run:

```bash
node test-voice-commands.js
```

## Project Structure

```
ditossauro/
├── src/
│   ├── assets/          # Images, icons, etc.
│   ├── components/      # UI components
│   ├── interpreters/    # Code interpreters for different languages
│   ├── locales/         # i18n translation files
│   ├── types.ts         # TypeScript type definitions
│   └── ...
├── tests/               # Test files
├── docs/                # Documentation (Docsify)
├── scripts/             # Build and utility scripts
└── ...
```

## Adding New Features

### Adding a New Programming Language

To add support for a new programming language:

1. **Add the language type** in `src/types.ts`:
   ```typescript
   export type CodeLanguage = 'bash' | 'javascript' | 'typescript' | 'python' | 'your-language';
   ```

2. **Add keywords to localization files** in `src/locales/en.json` and `src/locales/pt-BR.json`:
   ```json
   {
     "voiceCommands": {
       "yourLanguage": "your-language"
     }
   }
   ```

3. **Create an interpreter** in `src/interpreters/your-language-interpreter.ts`:
   ```typescript
   export class YourLanguageInterpreter implements CodeInterpreter {
     async interpret(input: string): Promise<string> {
       // Implementation
     }
   }
   ```

4. **Register in factory** at `src/code-interpreter-factory.ts`:
   ```typescript
   case 'your-language':
     return new YourLanguageInterpreter();
   ```

5. **Add tests** in `test-voice-commands.js`

### Adding New Voice Command Types

Follow a similar pattern to adding programming languages, but consider the command's unique requirements.

## Reporting Issues

*   Search existing issues **before** creating a new one.
*   Clearly describe the issue including steps to reproduce.
*   Include system details (OS, Node version, etc.).
*   Provide error messages and logs when applicable.

### Issue Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g. Windows 10]
 - Node Version: [e.g. 18.16.0]
 - Ditossauro Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

## Code Review Process

* All submissions require review
* Maintainers will review PRs as soon as possible
* Address feedback promptly
* Keep discussions focused and professional

## Documentation

* Update documentation for new features
* Keep README.md current
* Add JSDoc comments for functions and classes
* Update the docs/ folder for user-facing documentation

## Localization

We support multiple languages. When adding UI strings:

1. Add the English version to `src/locales/en.json`
2. Add translations to other language files
3. Use the i18next translation function: `t('key.path')`
4. Run `npm run validate-translations` to check for missing keys

## Community

* Be respectful and inclusive
* Follow our [Code of Conduct](code-of-conduct.md)
* Help others in issues and discussions
* Share your use cases and ideas

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to:
* Open an issue for questions
* Start a discussion on GitHub
* Reach out to maintainers

---

Thank you for contributing to Ditossauro! 🦖
