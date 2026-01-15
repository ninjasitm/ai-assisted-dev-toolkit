# AI-Assisted Development Toolkit

A comprehensive template repository providing AI instruction files, prompts, and rules for AI-assisted development workflows. This toolkit helps teams establish consistent AI coding practices across projects.

## Purpose

This repository serves as a **template source** for AI development instructions that can be copied into your projects. It provides:

- **Cursor IDE rules** (`.cursor/rules/`) for AI behavior configuration
- **Cursor commands** (`.cursor/commands/`) for custom AI workflows
- **GitHub Copilot instructions** (`.github/copilot-instructions.md`)
- **GitHub prompts** (`.github/prompts/`) for reusable prompt templates
- **AGENTS.md** files for AI agent context

## Repository Structure

```
/
├── src/
│   ├── repo/           # Templates for single repositories
│   │   ├── .cursor/    # Cursor IDE configuration
│   │   ├── .github/    # GitHub Copilot instructions
│   │   ├── AGENTS.md   # AI agent context template
│   │   └── README.md   # Project README template
│   │
│   └── monorepo/       # Templates for monorepos
│       ├── .cursor/    # Root-level Cursor config
│       ├── .github/    # Root-level GitHub config
│       ├── apps/       # App-specific templates
│       ├── packages/   # Package-specific templates
│       └── AGENTS.md   # Monorepo agent context
│
├── .cursor/            # This toolkit's own Cursor config
├── .github/            # This toolkit's own GitHub config
└── AGENTS.md           # This toolkit's agent context
```

## Usage

### For Single Repositories

**Step 1: Copy the templates**

```bash
cp -r src/repo/.cursor /path/to/your/project/
cp -r src/repo/.github /path/to/your/project/
cp src/repo/AGENTS.md /path/to/your/project/
```

**Step 2: Run the Bootstrap Command**

Open your project in Cursor IDE or VS Code with GitHub Copilot, then run:

- **Cursor IDE**: Use the `/bootstrap` command
- **GitHub Copilot**: Use the `bootstrap.prompt.md` prompt (`/bootstrap`)

The bootstrap process will:

1. Analyze your project's structure, dependencies, and configuration files
2. Infer template variables (framework, language, package manager, etc.)
3. Prompt you for any values it couldn't detect
4. Automatically update all `{{PLACEHOLDER}}` values in your AI instruction files

**Step 3: Review and Customize**

After bootstrapping, review the generated files and add any project-specific patterns to `AGENTS.md`.

### For Monorepos

**Step 1: Copy the templates**

```bash
cp -r src/monorepo/.cursor /path/to/your/project/
cp -r src/monorepo/.github /path/to/your/project/
cp src/monorepo/AGENTS.md /path/to/your/project/
# Optionally copy app/package templates
cp -r src/monorepo/apps/app-template /path/to/your/project/apps/
cp -r src/monorepo/packages/package-template /path/to/your/project/packages/
```

**Step 2: Run the Bootstrap Command**

Open your project in Cursor IDE or VS Code with GitHub Copilot, then run:

- **Cursor IDE**: Use the `/bootstrap` command
- **GitHub Copilot**: Use the `bootstrap.prompt.md` prompt (`/bootstrap`)

The bootstrap process will:

1. Analyze your monorepo workspace, including all apps and packages
2. Detect frameworks, ports, and deployment platforms for each app
3. Infer package scopes and descriptions
4. Prompt you for any missing information
5. Create `AGENTS.md` files for each app with framework-specific patterns
6. Update all `{{PLACEHOLDER}}` values throughout the monorepo

**Step 3: Review and Customize**

After bootstrapping:

- Review root `AGENTS.md` for overall project context
- Check each `apps/*/AGENTS.md` for app-specific patterns
- Add any custom conventions or patterns unique to your project

## Placeholder Reference

Templates use `{{PLACEHOLDER}}` syntax for values you need to customize. The bootstrap command will automatically detect and fill most of these values.

### Common Placeholders

| Placeholder               | Description               | Example                                                               |
| ------------------------- | ------------------------- | --------------------------------------------------------------------- |
| `{{PROJECT_NAME}}`        | Your project name         | `my-awesome-app`                                                      |
| `{{PROJECT_DESCRIPTION}}` | Brief project description | `A web app for...`                                                    |
| `{{LANGUAGE}}`            | Primary language          | `TypeScript`, `PHP`, `C#`, `Python`, `Ruby`, `Go`, `Rust`, `Java`     |
| `{{FRAMEWORK}}`           | Primary framework         | `Next.js`, `Laravel`, `Blazor`, `Django`, `Rails`, `Spring Boot`      |
| `{{PACKAGE_MANAGER}}`     | Package manager           | `npm`, `composer`, `dotnet`, `pip`, `bundler`, `go`, `cargo`, `maven` |
| `{{FILE_EXTENSION}}`      | File extension            | `ts`, `php`, `cs`, `py`, `rb`, `go`, `rs`, `java`                     |
| `{{DEV_PORT}}`            | Development server port   | `3000`, `8000`, `5000`                                                |
| `{{DEPLOY_PLATFORM}}`     | Deployment target         | `Vercel`, `AWS`, `Azure`, `Heroku`                                    |
| `{{DATABASE}}`            | Database/ORM              | `Prisma`, `Eloquent`, `EF Core`, `SQLAlchemy`, `ActiveRecord`         |
| `{{TEST_FRAMEWORK}}`      | Testing framework         | `Vitest`, `PHPUnit`, `xUnit`, `pytest`, `RSpec`, `JUnit`              |
| `{{ISSUE_TRACKER}}`       | Issue tracking system     | `Jira`, `Linear`, `GitHub Issues`                                     |
| `{{DEFAULT_BRANCH}}`      | Default git branch        | `main`, `master`                                                      |
| `{{RUNTIME_VERSION}}`     | Runtime version           | `Node 20`, `PHP 8.3`, `.NET 8`, `Python 3.12`                         |
| `{{REPO_URL}}`            | Repository URL            | `https://github.com/org/repo`                                         |
| `{{SRC_DIR}}`             | Source directory          | `src`, `app`, `lib`                                                   |
| `{{TEST_DIR}}`            | Test directory            | `tests`, `test`, `spec`                                               |
| `{{STYLING}}`             | Styling solution          | `Tailwind`, `CSS Modules`, `SCSS`                                     |
| `{{NODE_VERSION}}`        | Node.js version           | `20`, `22`                                                            |
| `{{LICENSE_TYPE}}`        | License identifier        | `MIT`, `Apache-2.0`, `ISC`                                            |
| `{{SRC_STRUCTURE}}`       | Source folder structure   | `components/`, `lib/`, `utils/`                                       |

### Command Placeholders

| Placeholder           | Description          | Example                                             |
| --------------------- | -------------------- | --------------------------------------------------- |
| `{{INSTALL_COMMAND}}` | Install dependencies | `npm install`, `composer install`, `dotnet restore` |
| `{{DEV_COMMAND}}`     | Run dev server       | `npm run dev`, `php artisan serve`, `dotnet watch`  |
| `{{BUILD_COMMAND}}`   | Build for production | `npm run build`, `dotnet publish`                   |
| `{{TEST_COMMAND}}`    | Run tests            | `npm test`, `./vendor/bin/phpunit`, `dotnet test`   |
| `{{LINT_COMMAND}}`    | Run linting          | `npm run lint`, `./vendor/bin/pint`                 |

### Monorepo-Specific Placeholders

| Placeholder                 | Description                | Example                                                 |
| --------------------------- | -------------------------- | ------------------------------------------------------- |
| `{{APP_NAME_1}}`            | First app name             | `web`, `frontend`                                       |
| `{{APP_NAME_2}}`            | Second app name            | `api`, `server`                                         |
| `{{APP_1_DESCRIPTION}}`     | First app description      | `Web frontend`                                          |
| `{{APP_2_DESCRIPTION}}`     | Second app description     | `API server`                                            |
| `{{APP_1_FRAMEWORK}}`       | First app framework        | `Next.js`, `Vue`                                        |
| `{{APP_2_FRAMEWORK}}`       | Second app framework       | `Express`, `Hono`                                       |
| `{{APP_1_DEV_PORT}}`        | First app dev port         | `3000`                                                  |
| `{{APP_2_DEV_PORT}}`        | Second app dev port        | `8787`                                                  |
| `{{PACKAGE_NAME_1}}`        | First package name         | `ui`, `shared`                                          |
| `{{PACKAGE_NAME_2}}`        | Second package name        | `utils`, `types`                                        |
| `{{PACKAGE_1_DESCRIPTION}}` | First package description  | `Shared UI components`                                  |
| `{{PACKAGE_2_DESCRIPTION}}` | Second package description | `Utility functions`                                     |
| `{{BUILD_SYSTEM}}`          | Monorepo build tool        | `Turborepo`, `Nx`, `MSBuild`, `Gradle`, `Cargo`         |
| `{{MONOREPO_CONFIG}}`       | Config file name           | `turbo.json`, `nx.json`, `*.sln`, `settings.gradle.kts` |
| `{{APP_DIR}}`               | Apps directory             | `apps`, `src`, `services`, `Modules`                    |
| `{{PACKAGES_DIR}}`          | Packages directory         | `packages`, `libs`, `internal`, `pkg`                   |
| `{{PACKAGE_SCOPE}}`         | Package scope/namespace    | `@my-org`, `MyCompany`, `my_package`                    |
| `{{PROJECT_STRUCTURE}}`     | Full project structure     | (Generated tree diagram)                                |

## Supported Ecosystems

The bootstrap command supports the following language ecosystems:

| Ecosystem                 | Config Files                         | Frameworks                                                | Monorepo Build Systems          |
| ------------------------- | ------------------------------------ | --------------------------------------------------------- | ------------------------------- |
| **JavaScript/TypeScript** | `package.json`, `tsconfig.json`      | Next.js, Nuxt, React, Vue, Angular, Express, Hono, NestJS | Turborepo, Nx, Lerna, Yarn/pnpm |
| **PHP**                   | `composer.json`, `artisan`           | Laravel, Symfony, CodeIgniter, Slim                       | Laravel Modules, Symfony Flex   |
| **.NET (C#/F#)**          | `*.csproj`, `*.sln`                  | Blazor, ASP.NET Core, MAUI, WPF                           | MSBuild, dotnet CLI             |
| **Python**                | `pyproject.toml`, `requirements.txt` | Django, Flask, FastAPI, Starlette                         | uv, Poetry, Hatch, PDM          |
| **Ruby**                  | `Gemfile`, `*.gemspec`               | Rails, Sinatra, Hanami                                    | Packwerk (Shopify)              |
| **Go**                    | `go.mod`, `go.work`                  | Gin, Echo, Fiber, Chi                                     | Go Workspaces                   |
| **Rust**                  | `Cargo.toml`                         | Actix, Axum, Rocket, Warp                                 | Cargo Workspaces                |
| **Java/Kotlin**           | `pom.xml`, `build.gradle.kts`        | Spring Boot, Quarkus, Micronaut                           | Gradle multi-project, Maven     |

## File Descriptions

### AGENTS.md

The primary context file for AI agents. Contains:

- Project overview and tech stack
- Directory structure
- Coding standards and patterns
- API patterns and examples
- Testing guidelines

### .cursor/rules/\*.mdc

Cursor IDE behavior rules:

- `coding-standards.mdc` - Language and framework standards
- `project-context.mdc` - Project documentation requirements
- `version-control.mdc` - Git and commit conventions
- `what-to-avoid.mdc` - Anti-patterns and deprecated practices
- `api-server.mdc` - API server patterns
- `composition-api-component-structure.mdc` - Vue Composition API patterns
- `core-libraries.mdc` - Core library usage
- `environment-tooling.mdc` - Environment and tooling configuration
- `logging-comments.mdc` - Logging and code comment conventions
- `prisma-migrations.mdc` - Prisma database migrations
- `server-client-separation.mdc` - Server/client code separation
- `testing-quality.mdc` - Testing standards and quality
- `ui-accessibility.mdc` - UI and accessibility guidelines

### .cursor/commands/\*.md

Custom Cursor commands for workflows:

- `bootstrap.md` - **Start here!** Analyze project and customize templates
- `specify.md` - Create feature specifications
- `plan.md` - Generate implementation plans
- `implement.md` - Execute implementation tasks
- `review.md` - Code review workflow
- `commit-push.md` - Git commit and push workflow
- `constitution.md` - Project constitution and principles
- `tasks.md` - Task management workflow

### .github/prompts/\*.prompt.md

Reusable prompts for GitHub Copilot:

- `bootstrap.prompt.md` - **Start here!** Analyze project and customize templates
- `commit-push.prompt.md` - Conventional commit workflow
- `review.prompt.md` - Code review checklist
- `review-pr.prompt.md` - Pull request review
- `implement-feature.prompt.md` - Feature implementation
- `implement-fixes.prompt.md` - Bug fix implementation
- `specify.prompt.md` - Feature specification
- `plan.prompt.md` - Implementation planning
- `tasks.prompt.md` - Task management
- `assign-tasks.prompt.md` - Task assignment workflow
- `playwright-test.prompt.md` - Playwright test generation

### .github/instructions/\*.instructions.md

GitHub Copilot instruction files:

- `project-context.instructions.md` - Architecture overview
- `patterns.instructions.md` - Coding patterns
- `workflows.instructions.md` - Development workflows

## Contributing

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details.
