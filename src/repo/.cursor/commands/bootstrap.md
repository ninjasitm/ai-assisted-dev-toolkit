---
description: Bootstrap AI instructions by inferring project details and customizing templates
---

You are helping to bootstrap AI instructions for this project by analyzing the codebase and customizing template files.

## Your Task

1. **Analyze the Project**:

   **Detect Language Ecosystem:**

   | Ecosystem                 | Config Files                                     | Package Manager        | Lock Files                                                      |
   | ------------------------- | ------------------------------------------------ | ---------------------- | --------------------------------------------------------------- |
   | **JavaScript/TypeScript** | `package.json`, `tsconfig.json`                  | npm, pnpm, yarn, bun   | `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb` |
   | **PHP**                   | `composer.json`, `artisan`                       | Composer               | `composer.lock`                                                 |
   | **.NET**                  | `*.csproj`, `*.sln`, `Program.cs`                | dotnet, NuGet          | `packages.lock.json`, `*.deps.json`                             |
   | **Python**                | `pyproject.toml`, `setup.py`, `requirements.txt` | pip, poetry, uv, conda | `poetry.lock`, `uv.lock`, `Pipfile.lock`                        |
   | **Ruby**                  | `Gemfile`, `*.gemspec`                           | Bundler                | `Gemfile.lock`                                                  |
   | **Go**                    | `go.mod`                                         | go mod                 | `go.sum`                                                        |
   | **Rust**                  | `Cargo.toml`                                     | Cargo                  | `Cargo.lock`                                                    |
   | **Java**                  | `pom.xml`, `build.gradle`                        | Maven, Gradle          | `pom.xml`, `gradle.lockfile`                                    |

   **Detect Framework:**

   | Language   | Frameworks to Detect                                                       |
   | ---------- | -------------------------------------------------------------------------- |
   | **JS/TS**  | Next.js, Nuxt, Vue, React, Angular, Svelte, Express, Hono, Fastify, NestJS |
   | **PHP**    | Laravel, Symfony, CodeIgniter, Slim, Yii                                   |
   | **.NET**   | Blazor, ASP.NET Core, MAUI, WPF, Console                                   |
   | **Python** | Django, Flask, FastAPI, Starlette, Pyramid                                 |
   | **Ruby**   | Rails, Sinatra, Hanami                                                     |
   | **Go**     | Gin, Echo, Fiber, Chi, net/http                                            |
   | **Rust**   | Actix, Axum, Rocket, Warp                                                  |
   | **Java**   | Spring Boot, Quarkus, Micronaut, Jakarta EE                                |

   **Detect Additional Tools:**

   - Database: Prisma, Drizzle, Entity Framework, Eloquent, SQLAlchemy, ActiveRecord, GORM, Diesel
   - Testing: Vitest, Jest, PHPUnit, xUnit, pytest, RSpec, go test, cargo test, JUnit
   - Styling: TailwindCSS, Bootstrap, SASS, Material UI
   - Deployment configs: vercel.json, netlify.toml, wrangler.toml, Dockerfile, fly.toml, railway.toml

2. **Infer Template Variables**:

   Based on your analysis, determine values for:

   | Variable                  | How to Infer                                                           |
   | ------------------------- | ---------------------------------------------------------------------- |
   | `{{PROJECT_NAME}}`        | Config file name field or directory name                               |
   | `{{PROJECT_DESCRIPTION}}` | Config file description or README                                      |
   | `{{LANGUAGE}}`            | Detected ecosystem (TypeScript, PHP, C#, Python, Ruby, Go, Rust, Java) |
   | `{{FRAMEWORK}}`           | Detected framework with version                                        |
   | `{{PACKAGE_MANAGER}}`     | Detected package manager                                               |
   | `{{DEV_PORT}}`            | Scripts, config, or framework defaults                                 |
   | `{{SRC_DIR}}`             | Source directory (src, app, lib, src/main, etc.)                       |
   | `{{TEST_DIR}}`            | Test directory (tests, test, spec, **tests**, src/test)                |
   | `{{FILE_EXTENSION}}`      | Primary file extension (ts, php, cs, py, rb, go, rs, java)             |
   | `{{DATABASE}}`            | ORM/database library                                                   |
   | `{{TEST_FRAMEWORK}}`      | Testing framework                                                      |
   | `{{DEPLOY_PLATFORM}}`     | Deployment config files                                                |
   | `{{RUNTIME_VERSION}}`     | Node, PHP, .NET, Python version from config                            |

3. **Report Inferred Values**:

   ```
   📊 Project Analysis Complete

   🔍 Detected Ecosystem: {{LANGUAGE}}

   ✅ Inferred Values:
   - PROJECT_NAME: my-app
   - LANGUAGE: PHP 8.3
   - FRAMEWORK: Laravel 11
   - PACKAGE_MANAGER: composer
   - DATABASE: Eloquent (MySQL)
   - TEST_FRAMEWORK: PHPUnit
   ...

   ❓ Unable to Infer (please provide):
   - PROJECT_DESCRIPTION: What does this project do?
   - DEPLOY_PLATFORM: Where will this be deployed?
   ```

4. **Prompt for Missing Values**:

   For any values that couldn't be inferred, ask the user specific questions:

   - "What is a brief description of this project?"
   - "Where will this project be deployed?"
   - "What issue tracker do you use (GitHub Issues, Jira, Linear)?"

5. **Update Template Files**:

   Once all values are confirmed, update these files by replacing `{{PLACEHOLDER}}` with actual values:

   - `AGENTS.md`
   - `.github/copilot-instructions.md`
   - `.github/instructions/*.instructions.md`
   - `.github/prompts/*.prompt.md`
   - `.cursor/rules/*.mdc`
   - `.cursor/commands/*.md`
   - `README.md` (if it contains placeholders)

6. **Generate Language-Specific Content**:

   Based on the detected language and framework, add relevant patterns to `AGENTS.md`:

   **JavaScript/TypeScript:**

   - **Next.js**: App Router patterns, Server Components, API routes
   - **Nuxt**: Composables, auto-imports, Nitro server
   - **React/Vue**: Component patterns, hooks/composables, state management
   - **Express/Hono**: Route handlers, middleware patterns

   **PHP:**

   - **Laravel**: Eloquent models, Controllers, Blade templates, Artisan commands
   - **Symfony**: Services, Doctrine entities, Twig templates

   **.NET:**

   - **Blazor**: Components, services, dependency injection
   - **ASP.NET Core**: Controllers, Minimal APIs, Entity Framework

   **Python:**

   - **Django**: Models, Views, Templates, Admin
   - **FastAPI**: Routes, Pydantic models, dependency injection
   - **Flask**: Blueprints, SQLAlchemy models

   **Ruby:**

   - **Rails**: Models, Controllers, Views, ActiveRecord

   **Go:**

   - **Gin/Echo**: Handlers, middleware, repository pattern

   **Rust:**

   - **Actix/Axum**: Handlers, extractors, state management

   **Java:**

   - **Spring Boot**: Controllers, Services, Repositories, JPA entities

7. **Recommend and Install AI Agent Skills**:

   Based on the detected ecosystem and frameworks, recommend relevant skills from [skills.sh](https://skills.sh/).

   **Core Skills (Always Recommend):**

   | Skill Repository           | Skills Included                       | Purpose                             |
   | -------------------------- | ------------------------------------- | ----------------------------------- |
   | `obra/superpowers`         | TDD, debugging, planning, code review | Development workflow best practices |
   | `trailofbits/skills`       | Semgrep, security analysis            | Security and code quality           |
   | `softaworks/agent-toolkit` | README writing, clear writing         | Documentation quality               |

   **Framework-Specific Skills:**

   | Detected          | Skill Repository                      | Install Command                                      |
   | ----------------- | ------------------------------------- | ---------------------------------------------------- |
   | React/Next.js     | `vercel-labs/agent-skills`            | `npx skills add vercel-labs/agent-skills`            |
   | Vue/Nuxt          | `onmax/nuxt-skills`                   | `npx skills add onmax/nuxt-skills`                   |
   | Expo/React Native | `expo/skills`                         | `npx skills add expo/skills`                         |
   | Better-Auth       | `better-auth/skills`                  | `npx skills add better-auth/skills`                  |
   | NestJS            | `Kadajett/agent-nestjs-skills`        | `npx skills add Kadajett/agent-nestjs-skills`        |
   | Remotion          | `remotion-dev/skills`                 | `npx skills add remotion-dev/skills`                 |
   | Elysia.js         | `elysiajs/skills`                     | `npx skills add elysiajs/skills`                     |
   | Three.js          | `CloudAI-X/threejs-skills`            | `npx skills add CloudAI-X/threejs-skills`            |
   | Convex            | `waynesutton/convexskills`            | `npx skills add waynesutton/convexskills`            |
   | TanStack Query    | `jezweb/claude-skills`                | `npx skills add jezweb/claude-skills`                |
   | TailwindCSS       | `expo/skills`                         | `npx skills add expo/skills`                         |
   | shadcn/ui         | `giuseppe-trisciuoglio/developer-kit` | `npx skills add giuseppe-trisciuoglio/developer-kit` |
   | Stripe            | `anthropics/claude-plugins-official`  | `npx skills add anthropics/claude-plugins-official`  |
   | SwiftUI/iOS       | `Dimillian/Skills`                    | `npx skills add Dimillian/Skills`                    |
   | Obsidian          | `kepano/obsidian-skills`              | `npx skills add kepano/obsidian-skills`              |

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

   Use `npx skills add anthropics/skills` (includes `skill-creator`) to create custom skills for frameworks not yet in the ecosystem.

   **Present Skills Recommendation:**

   ```
   🎯 Recommended AI Agent Skills

   Based on your project ({{FRAMEWORK}}/{{LANGUAGE}}), these skills will enhance your AI assistant:

   📦 Core Skills (recommended for all projects):
   - npx skills add obra/superpowers
   - npx skills add trailofbits/skills
   - npx skills add softaworks/agent-toolkit

   🔧 Framework-Specific Skills:
   - npx skills add {{FRAMEWORK_SKILL_REPO}}

   Install all recommended skills? (Y/n)
   ```

   **On Confirmation:**

   - Execute skill installation commands
   - Create `.cursor/skills/` directory structure
   - Update `AGENTS.md` to reference installed skills

   **Skills Directory Structure After Installation:**

   ```
   .cursor/                  # or .github/ for GitHub Copilot
   ├── rules/                # Cursor IDE rules
   ├── commands/             # Custom commands
   └── skills/               # Installed skills
       ├── superpowers/      # From obra/superpowers
       │   └── SKILL.md
       ├── agent-skills/     # From vercel-labs/agent-skills
       │   └── SKILL.md
       └── {skill-name}/     # Each skill by name (not org/repo)
           └── SKILL.md
   ```

   **Note:** Skills are installed by skill name, not org/repo path. For example, `npx skills add obra/superpowers` installs to `.cursor/skills/superpowers/`.

8. **Report Completion**:

   ```
   ✅ Bootstrap Complete!

   📁 Updated Files:
   - AGENTS.md (with {{LANGUAGE}}/{{FRAMEWORK}} patterns)
   - .github/copilot-instructions.md
   - .github/instructions/project-context.instructions.md
   - ... (list all updated files)

   🎯 Installed Skills:
   - obra/superpowers (TDD, debugging, planning)
   - {{FRAMEWORK_SKILLS}} (framework best practices)
   - ... (list installed skills)

   Next Steps:
   1. Review the generated files
   2. Add any project-specific patterns to AGENTS.md
   3. Customize prompts and commands as needed
   4. Browse more skills at https://skills.sh/
   5. Create custom skills for organization-specific patterns
   ```

## Example Workflows

### JavaScript/TypeScript Project

```
User: /bootstrap

AI: 📊 Analyzing project...

Found:
- package.json: "my-nextjs-app"
- Dependencies: next@15, react@19, tailwindcss
- Lock file: pnpm-lock.yaml
- tsconfig.json present

🔍 Detected Ecosystem: TypeScript

✅ Inferred:
- PROJECT_NAME: my-nextjs-app
- LANGUAGE: TypeScript
- FRAMEWORK: Next.js 15
- PACKAGE_MANAGER: pnpm
```

### PHP/Laravel Project

```
User: /bootstrap

AI: 📊 Analyzing project...

Found:
- composer.json: "my-laravel-app"
- Framework: laravel/framework ^11.0
- artisan file present
- .env.example with DB_CONNECTION

🔍 Detected Ecosystem: PHP

✅ Inferred:
- PROJECT_NAME: my-laravel-app
- LANGUAGE: PHP 8.3
- FRAMEWORK: Laravel 11
- PACKAGE_MANAGER: composer
- DATABASE: MySQL (Eloquent)
- TEST_FRAMEWORK: PHPUnit
```

### .NET/Blazor Project

```
User: /bootstrap

AI: 📊 Analyzing project...

Found:
- MyApp.csproj with Blazor SDK
- Program.cs present
- appsettings.json

🔍 Detected Ecosystem: C#/.NET

✅ Inferred:
- PROJECT_NAME: MyApp
- LANGUAGE: C# 12
- FRAMEWORK: Blazor Server (.NET 8)
- PACKAGE_MANAGER: dotnet/NuGet
- DATABASE: Entity Framework Core
- TEST_FRAMEWORK: xUnit
```

### Python/FastAPI Project

```
User: /bootstrap

AI: 📊 Analyzing project...

Found:
- pyproject.toml: "my-api"
- Dependencies: fastapi, uvicorn, sqlalchemy
- poetry.lock present

🔍 Detected Ecosystem: Python

✅ Inferred:
- PROJECT_NAME: my-api
- LANGUAGE: Python 3.12
- FRAMEWORK: FastAPI
- PACKAGE_MANAGER: poetry
- DATABASE: SQLAlchemy (PostgreSQL)
- TEST_FRAMEWORK: pytest
```
