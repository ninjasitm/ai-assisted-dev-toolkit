# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Common Placeholders

Templates use `{{PLACEHOLDER}}` syntax (SCREAMING_SNAKE_CASE). The most common placeholders:

| Placeholder | Description |
| --- | --- |
| `{{PROJECT_NAME}}` | Project name |
| `{{FRAMEWORK}}` | Primary framework (Next.js, Nuxt, Laravel, Django, etc.) |
| `{{LANGUAGE}}` | Programming language (TypeScript, PHP, Python, C#, etc.) |
| `{{PACKAGE_MANAGER}}` | Package manager (npm, pnpm, composer, pip, etc.) |
| `{{DEV_PORT}}` | Development server port |
| `{{DEPLOY_PLATFORM}}` | Deployment target |
| `{{ISSUE_TRACKER}}` | Issue tracker (Jira, Linear, GitHub Issues) |
| `{{ISSUE_ID}}` | Issue or ticket identifier |
| `{{FEATURE_NAME}}` | Feature name |
| `{{PROJECT_DESCRIPTION}}` | Short project description |
| `{{DEFAULT_BRANCH}}` | Default git branch (e.g., main) |
| `{{REPO_URL}}` | Repository URL |
| `{{SRC_DIR}}` | Source directory |
| `{{TEST_DIR}}` | Test directory |
| `{{FILE_EXTENSION}}` | Primary source file extension |
| `{{APP_NAME_1}}` | First app name |
| `{{APP_DIR}}` | App directory under apps/ |
| `{{BUILD_SYSTEM}}` | Monorepo build system (Turborepo, Nx, etc.) |
| `{{DOCS_APP}}` | Docs app name |
| `{{PACKAGES_DIR}}` | Shared packages directory |

Individual templates and skills may use additional placeholders; those are documented in the template's own header or README.

## Monorepo Structure

This is a monorepo managed with {{BUILD_SYSTEM}}.

```
{{PROJECT_NAME}}/
├── apps/
│   ├── {{APP_NAME_1}}/          # {{APP_1_DESCRIPTION}}
│   └── {{APP_NAME_2}}/          # {{APP_2_DESCRIPTION}}
├── packages/
│   ├── {{PACKAGE_NAME_1}}/      # {{PACKAGE_1_DESCRIPTION}}
│   ├── {{PACKAGE_NAME_2}}/      # {{PACKAGE_2_DESCRIPTION}}
│   └── config/                  # Shared configuration
├── {{MONOREPO_CONFIG}}          # Monorepo configuration
└── package.json                 # Root workspace config
```

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
```

### Development

```bash
# Run all apps in development mode
{{PACKAGE_MANAGER}} dev

# Run specific app
{{PACKAGE_MANAGER}} dev --filter={{APP_NAME_1}}

# Build all packages
{{PACKAGE_MANAGER}} build

# Run tests
{{PACKAGE_MANAGER}} test
```

## Apps

| App              | Description           | Port               |
| ---------------- | --------------------- | ------------------ |
| `{{APP_NAME_1}}` | {{APP_1_DESCRIPTION}} | {{APP_1_DEV_PORT}} |
| `{{APP_NAME_2}}` | {{APP_2_DESCRIPTION}} | {{APP_2_DEV_PORT}} |

## Packages

| Package                                | Description                                 |
| -------------------------------------- | ------------------------------------------- |
| `@{{PROJECT_NAME}}/{{PACKAGE_NAME_1}}` | {{PACKAGE_1_DESCRIPTION}}                   |
| `@{{PROJECT_NAME}}/{{PACKAGE_NAME_2}}` | {{PACKAGE_2_DESCRIPTION}}                   |
| `@{{PROJECT_NAME}}/config`             | Shared ESLint, TypeScript, and build config |

## Scripts

```bash
# Development
{{PACKAGE_MANAGER}} dev                    # Start all apps
{{PACKAGE_MANAGER}} dev --filter=<app>     # Start specific app

# Building
{{PACKAGE_MANAGER}} build                  # Build all packages
{{PACKAGE_MANAGER}} build --filter=<app>   # Build specific app

# Testing
{{PACKAGE_MANAGER}} test                   # Run all tests
{{PACKAGE_MANAGER}} test --filter=<app>    # Test specific app

# Linting
{{PACKAGE_MANAGER}} lint                   # Lint all packages
{{PACKAGE_MANAGER}} format                 # Format code

# Type checking
{{PACKAGE_MANAGER}} check-types            # Type check all packages
```

## Monorepo Features

- **Remote Caching**: Enabled via build system configuration
- **Parallel Execution**: Tasks run in parallel when possible
- **Incremental Builds**: Only rebuilds changed packages
- **Task Dependencies**: Defined in monorepo config

## Environment Variables

Create `.env` files in each app directory:

```bash
# apps/{{APP_NAME_1}}/.env.local
{{APP_1_ENV_EXAMPLE}}

# apps/{{APP_NAME_2}}/.env.local
{{APP_2_ENV_EXAMPLE}}
```

## Documentation

- [AGENTS.md](AGENTS.md) - AI development context
- [apps/{{APP_NAME_1}}/README.md](apps/{{APP_NAME_1}}/README.md) - App documentation
- [packages/{{PACKAGE_NAME_1}}/README.md](packages/{{PACKAGE_NAME_1}}/README.md) - Package documentation

## AI Instructions and Commands

This monorepo includes AI instruction files to standardize development workflows across tools. The `.cursor/` and `.github/` folders define how AI assistants should analyze, plan, implement, and review changes across apps and packages.

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
2. Make changes following project conventions
3. Run `{{PACKAGE_MANAGER}} lint` and `{{PACKAGE_MANAGER}} test`
4. Submit a pull request

## License

{{LICENSE_TYPE}}
