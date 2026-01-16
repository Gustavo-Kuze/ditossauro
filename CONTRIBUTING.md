# Contributing to Ditossauro

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to Ditossauro. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Getting Started

### Prerequisites

*   **Node.js**: standard LTS version recommended.
*   **Git**: for version control.
*   **A Groq API Key**: Require for most functionality (Transcription & Code generation).

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

## Reporting Issues

*   Search existing issues **before** creating a new one.
*   Clearly describe the issue including steps to reproduce.
*   Include system details (OS, Node version, etc.).

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
