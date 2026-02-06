# AI-Assisted Development Toolkit

A comprehensive template repository providing AI instruction files, prompts, and rules for AI-assisted development workflows. This toolkit helps teams establish consistent AI coding practices across projects.

## Purpose

This repository serves as a **template source** for AI development instructions that can be copied into your projects. It provides:

- **Cursor IDE rules** (`.cursor/rules/`) for AI behavior configuration
- **Cursor commands** (`.cursor/commands/`) for custom AI workflows
- **GitHub Copilot instructions** (`.github/copilot-instructions.md`)
- **GitHub prompts** (`.github/prompts/`) for reusable prompt templates
- **AGENTS.md** files for AI agent context
- **Skills recommendations** from [skills.sh](https://skills.sh/) for enhanced AI capabilities

## Repository Structure

```
/
├── src/
│   ├── repo/           # Templates for single repositories
│   │   ├── .cursor/    # Cursor IDE configuration
│   │   ├── .github/    # GitHub Copilot instructions
│   │   ├── .agents/    # Pre-installed universal skills
│   │   │   └── skills/ # Bundled skills (TDD, debugging, etc.)
│   │   ├── AGENTS.md   # AI agent context template
│   │   └── README.md   # Project README template
│   │
│   └── monorepo/       # Templates for monorepos
│       ├── .cursor/    # Root-level Cursor config
│       ├── .github/    # Root-level GitHub config
│       ├── .agents/    # Pre-installed universal skills
│       │   └── skills/ # Bundled skills (TDD, debugging, etc.)
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
cp -r src/repo/.agents /path/to/your/project/
cp src/repo/AGENTS.md /path/to/your/project/
```

The `.agents/skills/` folder contains pre-installed universal skills that are ready to use immediately (see [Bundled Universal Skills](#bundled-universal-skills)).

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
cp -r src/monorepo/.agents /path/to/your/project/
cp src/monorepo/AGENTS.md /path/to/your/project/
# Optionally copy app/package templates
cp -r src/monorepo/apps/app-template /path/to/your/project/apps/
cp -r src/monorepo/packages/package-template /path/to/your/project/packages/
```

The `.agents/skills/` folder contains pre-installed universal skills that are ready to use immediately (see [Bundled Universal Skills](#bundled-universal-skills)).

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
- `documentation.instructions.md` - Documentation standards for features and fixes

### docs/\* (Documentation Structure)

Documentation folders for tracking features and fixes:

- `docs/features/` - Feature documentation with specs and plans
- `docs/fixes/` - Fix documentation with monthly logs and complex fix folders
- `docs/architecture/` - Architecture Decision Records (ADRs)
- `docs/api/` - API specifications
- `templates/` - Reusable documentation templates

**Monorepo Note**: In monorepos, app-specific docs live in `apps/{app}/docs/` and root `docs/` is only for monorepo-wide concerns. See [monorepo documentation.instructions.md](src/monorepo/.github/instructions/documentation.instructions.md) for details.

#### Documentation Best Practices

**Feature Documentation:**

- Create folder: `docs/features/{{ISSUE_ID}}-FEATURE-NAME/`
- Include `spec.md` (functional specification) and `plan.md` (implementation plan)
- Use `/spec` and `/plan` commands for automatic generation

**Fix Documentation:**

- **Simple fixes**: Add to monthly log `docs/fixes/{YYYY-MM}.md`
- **Complex fixes**: Create folder `docs/fixes/{{ISSUE_ID}}-FIX-NAME/` with spec and plan
- Use [Keep a Changelog](https://keepachangelog.com/) format

**Decision Tree**: Is fix complex (multi-file, architectural)? → Folder. Otherwise → Monthly log.

See [documentation.instructions.md](src/repo/.github/instructions/documentation.instructions.md) for comprehensive guidelines.

## AI Agent Skills

Enhance your AI agents with specialized capabilities using the **Agent Skills** open format. Skills are folders of instructions, scripts, and resources that agents can discover and use to perform tasks more accurately and efficiently.

### Skills Resources

| Resource                                      | Description                                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [agentskills.io](https://agentskills.io/home) | Official specification, documentation, and integration guides for the Agent Skills format |
| [skills.sh](https://skills.sh/)               | Community skills directory with leaderboard and one-command installation                  |

### How Skills Work

Skills use **progressive disclosure** to manage context efficiently:

1. **Discovery**: Agents load only the name and description of each skill
2. **Activation**: When a task matches a skill's description, the agent reads full instructions
3. **Execution**: The agent follows instructions, loading referenced files or code as needed

### Skill Structure

At its core, a skill is a folder containing a `SKILL.md` file:

```
my-skill/
├── SKILL.md        # Required: instructions + metadata
├── scripts/        # Optional: executable code
├── references/     # Optional: documentation
└── assets/         # Optional: templates, resources
```

### Installing Skills

Install skills from [skills.sh](https://skills.sh/) using the `-a` or `--agent` flag to specify your AI agent:

```bash
# For a single agent
npx -y skills add -a cursor <owner/repo>

# For multiple agents (use multiple -a flags)
npx -y skills add -a cursor -a copilot <owner/repo>
```

#### Agent Detection

The skills CLI **automatically detects** which agents you have installed when you run any command. If you don't specify the `-a` flag, you'll be prompted to select from your detected agents.

Supported agents include:

- **Cursor, GitHub Copilot, Windsurf, Cline, Continue, Aider, Zed, Roo Code, and 35+ more**
- See [full list of supported agents](https://github.com/vercel-labs/skills?tab=readme-ov-file#supported-agents)

#### Agent-Specific Installation Examples

```bash
# For GitHub Copilot only
npx -y skills add -a copilot <owner/repo>

# For Cursor only
npx -y skills add -a cursor <owner/repo>

# For Windsurf only
npx -y skills add -a windsurf <owner/repo>

# For Cline only
npx -y skills add -a cline <owner/repo>

# For both Cursor and GitHub Copilot
npx -y skills add -a cursor -a copilot <owner/repo>
```

**Important:** Always specify the agent(s) explicitly using `-a <agent-name>` to install only for the agents you actively use. You can specify multiple agents using multiple `-a` flags. This prevents creating unnecessary configurations for unused agents.

Skills are installed to `{.cursor|.agents|.github}/skills/` and automatically available to your selected AI agent(s).

### Bundled Universal Skills

This toolkit includes **16 pre-installed universal skills** in the `.agents/skills/` folder. These skills are copied automatically when you set up your project and require **no additional installation**.

| Skill                              | Description                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **test-driven-development**        | TDD practices with red-green-refactor workflow. Write failing test first, then minimal code to pass. |
| **systematic-debugging**           | Structured debugging methodology. Find root cause before attempting fixes—no guessing.               |
| **verification-before-completion** | Quality checks before claiming work is done. Evidence before assertions, always.                     |
| **writing-plans**                  | Creating clear implementation plans before coding.                                                   |
| **executing-plans**                | Following through on implementation plans systematically.                                            |
| **requesting-code-review**         | Best practices for requesting code reviews from teammates.                                           |
| **receiving-code-review**          | Responding constructively to review feedback.                                                        |
| **brainstorming**                  | Structured ideation and problem-solving sessions.                                                    |
| **writing-skills**                 | Creating effective SKILL.md files for custom skills.                                                 |
| **using-superpowers**              | Meta-skill for leveraging the full skill system.                                                     |
| **using-git-worktrees**            | Git worktree workflows for parallel development.                                                     |
| **dispatching-parallel-agents**    | Coordinating multiple AI agents on related tasks.                                                    |
| **subagent-driven-development**    | Breaking complex tasks into subagent-manageable chunks.                                              |
| **finishing-a-development-branch** | Completing and merging development branches cleanly.                                                 |
| **logging**                        | Structured logging standards, log levels, and observability patterns.                                |
| **project-documentation**          | README files, code comments, ADRs, and changelog best practices.                                     |

**These skills are ready to use immediately after copying the templates.** No `npx -y skills add -a <agent>` commands needed.

### Additional Recommended Skills

Beyond the bundled skills, these additional skills complement this toolkit for specific use cases:

**Note:** All install commands in the tables below should include the `-a <agent>` flag to specify your AI agent. For example:

- `npx -y skills add -a copilot obra/superpowers` (for GitHub Copilot only)
- `npx -y skills add -a cursor obra/superpowers` (for Cursor only)
- `npx -y skills add -a cursor -a copilot obra/superpowers` (for both Cursor and GitHub Copilot)

**Tip:** If you omit the `-a` flag, the CLI will automatically detect your installed agents and prompt you to choose.

#### Development Workflow Skills (External)

If you want the original `obra/superpowers` skills (which the bundled skills are derived from), or additional workflow skills:

| Skill                      | Install Command                      | Description                                  |
| -------------------------- | ------------------------------------ | -------------------------------------------- |
| **Full Superpowers Suite** | `npx -y skills add obra/superpowers` | All workflow skills from the original source |

#### Security & Quality Skills

| Skill                      | Install Command                                    | Description                            |
| -------------------------- | -------------------------------------------------- | -------------------------------------- |
| **Semgrep**                | `npx -y skills add trailofbits/skills`             | Static analysis patterns               |
| **Property-Based Testing** | `npx -y skills add trailofbits/skills`             | Testing with property-based approaches |
| **Code Review**            | `npx -y skills add skillcreatorai/Ai-Agent-Skills` | Comprehensive code review guidance     |
| **Logging Best Practices** | `npx -y skills add boristane/agent-skills`         | Structured logging patterns            |

#### Frontend Skills

| Skill                           | Install Command                              | Description                     |
| ------------------------------- | -------------------------------------------- | ------------------------------- |
| **Vercel React Best Practices** | `npx -y skills add vercel-labs/agent-skills` | React patterns and optimization |
| **Web Design Guidelines**       | `npx -y skills add vercel-labs/agent-skills` | UI/UX design principles         |
| **Frontend Design**             | `npx -y skills add anthropics/skills`        | General frontend patterns       |
| **TailwindCSS Setup**           | `npx -y skills add expo/skills`              | Tailwind configuration          |

#### Framework-Specific Skills

| Skill           | Install Command                                         | Description               |
| --------------- | ------------------------------------------------------- | ------------------------- |
| **Vue**         | `npx -y skills add onmax/nuxt-skills`                   | Vue.js best practices     |
| **Nuxt**        | `npx -y skills add onmax/nuxt-skills`                   | Nuxt framework patterns   |
| **Nuxt UI**     | `npx -y skills add onmax/nuxt-skills`                   | Nuxt UI component library |
| **Better Auth** | `npx -y skills add better-auth/skills`                  | Authentication patterns   |
| **Expo**        | `npx -y skills add expo/skills`                         | React Native with Expo    |
| **NestJS**      | `npx -y skills add Kadajett/agent-nestjs-skills`        | NestJS backend patterns   |
| **Elysia.js**   | `npx -y skills add elysiajs/skills`                     | Elysia.js API patterns    |
| **Three.js**    | `npx -y skills add CloudAI-X/threejs-skills`            | Three.js 3D graphics      |
| **Remotion**    | `npx -y skills add remotion-dev/skills`                 | Remotion video creation   |
| **Convex**      | `npx -y skills add waynesutton/convexskills`            | Convex backend patterns   |
| **TanStack**    | `npx -y skills add jezweb/claude-skills`                | TanStack Query patterns   |
| **SwiftUI**     | `npx -y skills add Dimillian/Skills`                    | SwiftUI iOS patterns      |
| **Obsidian**    | `npx -y skills add kepano/obsidian-skills`              | Obsidian note-taking      |
| **shadcn/ui**   | `npx -y skills add giuseppe-trisciuoglio/developer-kit` | shadcn/ui components      |
| **Stripe**      | `npx -y skills add anthropics/claude-plugins-official`  | Stripe integration        |

#### Language-Specific Skills

| Language/Framework | Install Command                                                                        | Included Skills                   |
| ------------------ | -------------------------------------------------------------------------------------- | --------------------------------- |
| **PHP**            | `npx -y skills add vapvarun/claude-backup --skill "php"`                               | PHP best practices                |
| **Laravel**        | `npx -y skills add vapvarun/claude-backup --skill "laravel"`                           | Laravel patterns                  |
| **Python**         | `npx -y skills add siviter-xyz/dot-agent --skill "python"`                             | Python best practices             |
| **Django**         | `npx -y skills add vintasoftware/django-ai-plugins --skill "django-expert"`            | Django patterns                   |
| **Next.js**        | `npx -y skills add sickn33/antigravity-awesome-skills --skill "nextjs-best-practices"` | Next.js best practices            |
| **React**          | `npx -y skills add vercel-labs/agent-skills --skill "vercel-react-best-practices"`     | React + Vercel patterns           |
| **Vue**            | `npx -y skills add onmax/nuxt-skills --skill "vue"`                                    | Vue.js best practices             |
| **Nuxt**           | `npx -y skills add onmax/nuxt-skills --skill "nuxt"`                                   | Nuxt patterns                     |
| **Expo**           | `npx -y skills add expo/skills`                                                        | Expo/React Native                 |
| **TypeScript**     | `npx -y skills add pproenca/dot-skills`                                                | TypeScript best practices         |
| **Advanced Types** | `npx -y skills add wshobson/agents`                                                    | TypeScript advanced type patterns |

**Note:** For frameworks without dedicated skills, use `npx -y skills add -a <agent> anthropics/skills` which includes `skill-creator` to help you create custom skills. Remember to replace `<agent>` with your AI agent name (e.g., `copilot`, `cursor`, `windsurf`, `cline`).

#### Documentation & Writing Skills

| Skill                             | Install Command                              | Description                 |
| --------------------------------- | -------------------------------------------- | --------------------------- |
| **Crafting Effective READMEs**    | `npx -y skills add softaworks/agent-toolkit` | README writing guidance     |
| **Writing Clearly and Concisely** | `npx -y skills add softaworks/agent-toolkit` | Clear technical writing     |
| **Doc Coauthoring**               | `npx -y skills add anthropics/skills`        | Collaborative documentation |

### Adding Skills to Your Project

After bootstrapping your project with this toolkit:

1. **Identify your tech stack** - Review your framework and tooling
2. **Install relevant skills** - Add skills that match your technologies using `-a <agent>` flags
3. **Add custom skills** - Create project-specific skills as needed

**Example for a Nuxt + Hono monorepo:**

```bash
# Note: Development workflow skills (TDD, debugging, planning, etc.)
# are already bundled in .agents/skills/ - no installation needed!

# For Cursor only
npx -y skills add -a cursor onmax/nuxt-skills
npx -y skills add -a cursor vercel-labs/agent-skills
npx -y skills add -a cursor better-auth/skills
npx -y skills add -a cursor trailofbits/skills

# Or, for multiple agents (e.g., Cursor + GitHub Copilot)
npx -y skills add -a cursor -a copilot onmax/nuxt-skills
npx -y skills add -a cursor -a copilot vercel-labs/agent-skills
npx -y skills add -a cursor -a copilot better-auth/skills
npx -y skills add -a cursor -a copilot trailofbits/skills
```

### Creating Custom Skills

You can create project-specific skills following:

- **[Official Specification](https://agentskills.io/specification)** - Complete format specification for SKILL.md files
- **[Authoring Best Practices](https://agentskills.io/what-are-skills)** - Guidelines for writing effective skills
- **[Skill Creator on skills.sh](https://skills.sh/)** - Community examples and templates

A minimal `SKILL.md` requires only name and description in YAML frontmatter:

```markdown
---
name: my-custom-skill
description: When to use this skill and what it does.
---

# My Custom Skill

## When to use this skill

Use this skill when the user needs to...

## Instructions

1. Step one...
2. Step two...
```

Custom skills are useful for:

- Organization-specific coding standards
- Internal library documentation
- Domain-specific patterns
- Team workflow procedures

### Skill Directory Structure

After copying templates and installing additional skills, your project will have:

```
.agents/                  # Bundled universal skills (from this toolkit)
└── skills/
    ├── test-driven-development/
    │   └── SKILL.md
    ├── systematic-debugging/
    │   └── SKILL.md
    ├── verification-before-completion/
    │   └── SKILL.md
    └── ... (14 skills total)

.cursor/                  # or .github/ for GitHub Copilot
├── rules/                # IDE behavior rules (from this toolkit)
├── commands/             # Custom commands (from this toolkit)
└── skills/               # Additional skills from skills.sh
    ├── nuxt-skills/      # From onmax/nuxt-skills
    │   └── SKILL.md
    ├── agent-skills/     # From vercel-labs/agent-skills
    │   └── SKILL.md
    └── {skill-name}/     # Each installed skill gets its own folder
        └── SKILL.md
```

**Skill Locations:**

| Location          | Contents                                                   | Source                                       |
| ----------------- | ---------------------------------------------------------- | -------------------------------------------- |
| `.agents/skills/` | Universal workflow skills (TDD, debugging, planning, etc.) | Bundled with this toolkit                    |
| `.cursor/skills/` | Framework/language-specific skills                         | Installed via `npx -y skills add -a <agent>` |
| `.github/skills/` | Alternative location for GitHub Copilot                    | Installed via `npx -y skills add -a <agent>` |

**Note:** Skills installed via `npx -y skills add -a <agent>` use the skill name as the folder name (not org/repo path). For example, `npx -y skills add -a cursor obra/superpowers` installs to `.cursor/skills/superpowers/`.

**Recommendation:** Only install skills for agents you have installed and actively use. Symlinking to all known agents creates unnecessary configuration files and can clutter your project.

**Note:** Skills complement the templates in this toolkit. The templates provide project structure and conventions, while skills provide procedural knowledge for specific technologies.

## Contributing

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details.
