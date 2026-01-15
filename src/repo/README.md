# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Tech Stack

- **Framework:** {{FRAMEWORK}}
- **Language:** {{LANGUAGE}}
- **Styling:** {{STYLING}}
- **Package Manager:** {{PACKAGE_MANAGER}}

## Template Placeholders

The following placeholders must be replaced when customizing this template:

| Placeholder             | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| {{PROJECT_NAME}}        | Project name (kebab-case).                                 |
| {{PROJECT_DESCRIPTION}} | Short description of the project.                          |
| {{FRAMEWORK}}           | Primary framework (with version if applicable).            |
| {{LANGUAGE}}            | Primary programming language (with version if applicable). |
| {{STYLING}}             | Styling solution (e.g., Tailwind, CSS Modules).            |
| {{PACKAGE_MANAGER}}     | Package manager (npm, pnpm, yarn, bun).                    |
| {{NODE_VERSION}}        | Required Node.js version.                                  |
| {{REPO_URL}}            | Repository URL.                                            |
| {{DEV_PORT}}            | Development server port.                                   |
| {{SRC_STRUCTURE}}       | High-level source folder structure.                        |
| {{LICENSE_TYPE}}        | License identifier (e.g., MIT, Apache-2.0).                |
| {{SRC_DIR}}             | Source directory (e.g., src, app, lib).                    |
| {{TEST_DIR}}            | Test directory (e.g., tests, test, spec).                  |
| {{FILE_EXTENSION}}      | Primary file extension (e.g., ts, js, tsx).                |
| {{DEFAULT_BRANCH}}      | Default git branch (e.g., main, master).                   |

## Getting Started

### Prerequisites

- Node.js {{NODE_VERSION}}
- {{PACKAGE_MANAGER}}

### Installation

```bash
# Clone the repository
git clone {{REPO_URL}}
cd {{PROJECT_NAME}}

# Install dependencies
{{PACKAGE_MANAGER}} install

# Start development server
{{PACKAGE_MANAGER}} run dev
```

The development server will start at `http://localhost:{{DEV_PORT}}`.

## Project Structure

```
{{PROJECT_NAME}}/
├── src/
│   ├── {{SRC_STRUCTURE}}
├── tests/
├── docs/
├── .cursor/           # Cursor IDE configuration
├── .github/           # GitHub configuration
└── package.json
```

## Scripts

| Command                         | Description              |
| ------------------------------- | ------------------------ |
| `{{PACKAGE_MANAGER}} run dev`   | Start development server |
| `{{PACKAGE_MANAGER}} run build` | Build for production     |
| `{{PACKAGE_MANAGER}} run test`  | Run tests                |
| `{{PACKAGE_MANAGER}} run lint`  | Run linter               |

## Development

See the following files for AI-assisted development:

- [AGENTS.md](AGENTS.md) - AI agent context
- [.cursor/rules/](.cursor/rules/) - Cursor IDE rules
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - GitHub Copilot instructions

## AI Instructions and Commands

This repository includes AI instruction files to standardize development workflows across tools. The `.cursor/` and `.github/` folders define how AI assistants should analyze, plan, implement, and review changes.

### Planning

- `/specify` — Create or refine a feature specification.
- `/plan` — Produce an implementation plan with steps and dependencies.
- `/tasks` — Break work into actionable tasks.
- `/assign-tasks` — Convert requirements into tickets in `{{ISSUE_TRACKER}}`.

### Implementing

- `/implement-feature` — Implement a feature from tasks/specs with validation.
- `/implement-fixes` — Apply focused bug fixes with testing and PR notes.

### Reviewing

- `/review` — Run a structured code review checklist for changes.
- `/review-pr` — Review pull requests with architecture, testing, and security checks.

### Code Management

- `/commit-push` — Create conventional commits and push safely to a feature branch.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

{{LICENSE_TYPE}}
