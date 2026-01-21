---
description: Bootstrap AI instructions by analyzing project and customizing templates
---

# Bootstrap AI Instructions

Analyze the project structure and customize AI instruction templates for this codebase.

## Usage

```
/bootstrap
```

## Process

### Step 1: Project Analysis

Detect the language ecosystem by checking for these files:

**JavaScript/TypeScript:**

```
- package.json, tsconfig.json, jsconfig.json
- package-lock.json, pnpm-lock.yaml, yarn.lock, bun.lockb
- next.config.*, nuxt.config.*, vite.config.*, angular.json
```

**PHP:**

```
- composer.json, composer.lock
- artisan (Laravel), symfony.lock (Symfony)
- phpunit.xml, .php-version
```

**.NET (C#/F#):**

```
- *.csproj, *.fsproj, *.sln
- Program.cs, appsettings.json
- global.json, nuget.config
```

**Python:**

```
- pyproject.toml, setup.py, setup.cfg
- requirements.txt, Pipfile, poetry.lock, uv.lock
- manage.py (Django), app.py (Flask/FastAPI)
```

**Ruby:**

```
- Gemfile, Gemfile.lock, *.gemspec
- config.ru, Rakefile
- bin/rails (Rails)
```

**Go:**

```
- go.mod, go.sum
- main.go, cmd/
```

**Rust:**

```
- Cargo.toml, Cargo.lock
- src/main.rs, src/lib.rs
```

**Java/Kotlin:**

```
- pom.xml, build.gradle, build.gradle.kts
- src/main/java/, src/main/kotlin/
```

### Step 2: Variable Inference

Map discovered information to template variables:

| Variable                    | Source                                                                      |
| --------------------------- | --------------------------------------------------------------------------- |
| `{{PROJECT_NAME}}`          | Config file name field or directory                                         |
| `{{PROJECT_DESCRIPTION}}`   | Config description or README                                                |
| `{{LANGUAGE}}`              | Detected language (TypeScript, PHP, C#, Python, etc.)                       |
| `{{FRAMEWORK}}`             | Detected framework with version                                             |
| `{{PACKAGE_MANAGER}}`       | Lock file or config (npm, composer, dotnet, pip, bundler, go, cargo, maven) |
| `{{DEV_PORT}}`              | Scripts, config, or framework default                                       |
| `{{SRC_DIR}}`               | Source directory structure                                                  |
| `{{TEST_DIR}}`              | Test directory location                                                     |
| `{{FILE_EXTENSION}}`        | Primary extension (ts, php, cs, py, rb, go, rs, java)                       |
| `{{DATABASE}}`              | ORM/database dependencies                                                   |
| `{{TEST_FRAMEWORK}}`        | Test framework                                                              |
| `{{DEPLOY_PLATFORM}}`       | Deployment config files                                                     |
| `{{RUNTIME_VERSION}}`       | Runtime version from config                                                 |
| `{{NEW_RELEVANT_VARIABLE}}` | ...other inferred values...                                                 |

### Step 3: User Confirmation

Present inferred values and ask for missing ones:

```markdown
## 📊 Project Analysis Results

### 🔍 Detected Ecosystem: {{LANGUAGE}}

### ✅ Inferred Values

| Variable        | Value            |
| --------------- | ---------------- |
| PROJECT_NAME    | detected-name    |
| LANGUAGE        | PHP 8.3          |
| FRAMEWORK       | Laravel 11       |
| PACKAGE_MANAGER | composer         |
| DATABASE        | Eloquent (MySQL) |
| ...             | ...              |

### ❓ Please Provide

1. **PROJECT_DESCRIPTION**: Brief description of the project?
2. **DEPLOY_PLATFORM**: Where will this be deployed?
3. **ISSUE_TRACKER**: What issue tracker do you use?
```

### Step 4: Template Customization

Replace placeholders in all template files:

**Files to Update:**

- `AGENTS.md` - Project context and patterns
- `.github/copilot-instructions.md` - Copilot configuration
- `.github/instructions/*.instructions.md` - Context instructions
- `.github/prompts/*.prompt.md` - Reusable prompts
- `.cursor/rules/*.mdc` - Cursor IDE rules
- `.cursor/commands/*.md` - Custom commands

### Step 5: Language-Specific Enhancements

Add language and framework-specific patterns to `AGENTS.md`:

**JavaScript/TypeScript:**

- Next.js: App Router, Server Components
- Nuxt: Composables, Nitro
- React/Vue: Components, state management

**PHP:**

- Laravel: Eloquent, Controllers, Blade, Artisan
- Symfony: Services, Doctrine, Twig

**.NET:**

- Blazor: Components, DI, services
- ASP.NET Core: Controllers, Minimal APIs, EF Core

**Python:**

- Django: Models, Views, Templates
- FastAPI: Routes, Pydantic, DI
- Flask: Blueprints, SQLAlchemy

**Ruby:**

- Rails: MVC, ActiveRecord, migrations

**Go:**

- Gin/Echo: Handlers, middleware

**Rust:**

- Actix/Axum: Handlers, extractors

**Java:**

- Spring Boot: Controllers, Services, JPA

### Step 6: AI Agent Skills Recommendation

Based on detected ecosystem and frameworks, recommend relevant skills from [skills.sh](https://skills.sh/) and [agentskills.io](https://agentskills.io/).

**Core Skills (Always Recommend):**

| Skill Repository           | Purpose                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `obra/superpowers`         | TDD, systematic debugging, planning, code review workflows |
| `trailofbits/skills`       | Security analysis, Semgrep, property-based testing         |
| `softaworks/agent-toolkit` | README writing, clear documentation                        |

**Framework-Specific Skills:**

| Detected Framework | Skill Repository                      |
| ------------------ | ------------------------------------- |
| React/Next.js      | `vercel-labs/agent-skills`            |
| Vue/Nuxt           | `onmax/nuxt-skills`                   |
| Expo/React Native  | `expo/skills`                         |
| Better-Auth        | `better-auth/skills`                  |
| NestJS             | `Kadajett/agent-nestjs-skills`        |
| Elysia.js          | `elysiajs/skills`                     |
| Three.js           | `CloudAI-X/threejs-skills`            |
| Remotion           | `remotion-dev/skills`                 |
| Convex             | `waynesutton/convexskills`            |
| TanStack Query     | `jezweb/claude-skills`                |
| shadcn/ui          | `giuseppe-trisciuoglio/developer-kit` |
| SwiftUI/iOS        | `Dimillian/Skills`                    |
| Obsidian           | `kepano/obsidian-skills`              |
| Stripe Integration | `anthropics/claude-plugins-official`  |

**Language-Specific Skills:**

| Language/Framework | Skill Repository                      | Install Command                                                                     |
| ------------------ | ------------------------------------- | ----------------------------------------------------------------------------------- |
| PHP                | `vapvarun/claude-backup` (php)        | `npx skills add vapvarun/claude-backup --skill "php"`                               |
| Laravel            | `vapvarun/claude-backup` (laravel)    | `npx skills add vapvarun/claude-backup --skill "laravel"`                           |
| Python             | `siviter-xyz/dot-agent` (python)      | `npx skills add siviter-xyz/dot-agent --skill "python"`                             |
| Django             | `vintasoftware/django-ai-plugins`     | `npx skills add vintasoftware/django-ai-plugins --skill "django-expert"`            |
| Next.js            | `sickn33/antigravity-awesome-skills`  | `npx skills add sickn33/antigravity-awesome-skills --skill "nextjs-best-practices"` |
| React              | `vercel-labs/agent-skills`            | `npx skills add vercel-labs/agent-skills --skill "vercel-react-best-practices"`     |
| Vue                | `onmax/nuxt-skills` (vue)             | `npx skills add onmax/nuxt-skills --skill "vue"`                                    |
| Nuxt               | `onmax/nuxt-skills` (nuxt)            | `npx skills add onmax/nuxt-skills --skill "nuxt"`                                   |
| Expo               | `expo/skills`                         | `npx skills add expo/skills`                                                        |
| TypeScript         | `pproenca/dot-skills` (typescript)    | `npx skills add pproenca/dot-skills`                                                |
| Advanced Types     | `wshobson/agents` (ts-advanced-types) | `npx skills add wshobson/agents`                                                    |

**Skill Creation for Unsupported Frameworks:**

Use `npx skills add anthropics/skills` (includes `skill-creator`) to create custom skills.

**Present Recommendation:**

````markdown
## 🎯 Recommended AI Agent Skills

Based on your project ({{FRAMEWORK}}/{{LANGUAGE}}):

### Core Skills (recommended for all projects)

```bash
npx skills add obra/superpowers
npx skills add trailofbits/skills
npx skills add softaworks/agent-toolkit
```
````

### Framework-Specific Skills

```bash
npx skills add {{FRAMEWORK_SKILL_REPO}}
```

### Install All?

Would you like to install these skills now? (Y/n)

````

**On Confirmation:**
- Run skill installation commands
- Skills installed to `.github/skills/{skill-name}/` (by skill name, not org/repo)
- Update `AGENTS.md` to reference installed skills

### Step 7: Completion Report

```markdown
## ✅ Bootstrap Complete!

### Ecosystem: {{LANGUAGE}} / {{FRAMEWORK}}

### Updated Files

- [x] AGENTS.md (with {{LANGUAGE}} patterns)
- [x] .github/copilot-instructions.md
- [x] .github/instructions/\*.instructions.md
- [x] .cursor/rules/\*.mdc
- [x] .cursor/commands/\*.md
- [x] .github/prompts/\*.prompt.md

### Installed Skills

- [x] obra/superpowers - Development workflow
- [x] trailofbits/skills - Security & quality
- [x] {{FRAMEWORK_SKILL}} - Framework patterns

### Next Steps

1. Review generated content in AGENTS.md
2. Add project-specific patterns and conventions
3. Customize prompts for your workflow
4. Test commands with your codebase
5. Browse more skills at https://skills.sh/
6. Create custom skills at https://agentskills.io/specification
````

## Ecosystem Detection Logic

```
// Pseudo-code for ecosystem detection
detectEcosystem(files):
  if "composer.json" exists → PHP
  if "*.csproj" or "*.sln" exists → .NET
  if "pyproject.toml" or "requirements.txt" exists → Python
  if "Gemfile" exists → Ruby
  if "go.mod" exists → Go
  if "Cargo.toml" exists → Rust
  if "pom.xml" or "build.gradle" exists → Java
  if "package.json" exists → JavaScript/TypeScript

detectFramework(ecosystem, files, deps):
  PHP:
    if "artisan" exists → Laravel
    if "symfony.lock" exists → Symfony
  .NET:
    if csproj contains "Blazor" → Blazor
    if csproj contains "Microsoft.AspNetCore" → ASP.NET Core
  Python:
    if deps contains "django" → Django
    if deps contains "fastapi" → FastAPI
    if deps contains "flask" → Flask
  Ruby:
    if "bin/rails" exists → Rails
  ... etc
```

## Notes

- Run this command after copying template files to your project
- Supports all major language ecosystems
- Re-run if project configuration changes significantly
- Review generated content before committing
