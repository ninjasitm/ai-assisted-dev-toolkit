---
description: Bootstrap AI instructions for monorepo by analyzing workspace and customizing templates
---

You are helping to bootstrap AI instructions for this monorepo by analyzing the workspace structure and customizing template files.

## Your Task

1. **Analyze the Monorepo**:

   **Detect Language Ecosystem:**

   | Ecosystem                 | Root Config                | Workspace Config                                    |
   | ------------------------- | -------------------------- | --------------------------------------------------- |
   | **JavaScript/TypeScript** | `package.json`             | `pnpm-workspace.yaml`, `workspaces` in package.json |
   | **PHP**                   | `composer.json`            | Composer path repositories                          |
   | **.NET**                  | `*.sln`                    | Solution file with multiple projects                |
   | **Python**                | `pyproject.toml`           | Poetry workspaces, uv workspaces                    |
   | **Go**                    | `go.work`                  | Go workspaces                                       |
   | **Rust**                  | `Cargo.toml`               | Cargo workspaces                                    |
   | **Java**                  | `pom.xml` / `build.gradle` | Maven modules, Gradle multi-project                 |

   **Detect Build System:**

   - JavaScript: Turborepo (`turbo.json`), Nx (`nx.json`), Lerna (`lerna.json`)
   - .NET: Solution files, MSBuild
   - Java: Maven, Gradle
   - Other: Makefiles, Bazel, etc.

   **Scan Workspace:**

   - Scan `apps/` or similar directories for applications
   - Scan `packages/`, `libs/`, `modules/` for shared code
   - For each app/package, analyze their config files

2. **Infer Root-Level Variables**:

   | Variable                  | How to Infer                                       |
   | ------------------------- | -------------------------------------------------- |
   | `{{PROJECT_NAME}}`        | Root config name or directory name                 |
   | `{{PROJECT_DESCRIPTION}}` | Root config description                            |
   | `{{LANGUAGE}}`            | Detected ecosystem                                 |
   | `{{PACKAGE_MANAGER}}`     | Lock file or config (pnpm, composer, dotnet, etc.) |
   | `{{BUILD_SYSTEM}}`        | Build tool (Turborepo, Nx, MSBuild, Maven, etc.)   |
   | `{{DEFAULT_BRANCH}}`      | Git config or assume "main"                        |
   | `{{TEST_FRAMEWORK}}`      | Common test framework across packages              |

3. **Analyze Apps**:

   For each app in `apps/` (or equivalent):

   | Variable                    | How to Infer                       |
   | --------------------------- | ---------------------------------- |
   | `{{APP_NAME_N}}`            | Directory names                    |
   | `{{APP_N_LANGUAGE}}`        | App-specific language if different |
   | `{{APP_N_FRAMEWORK}}`       | Detected framework                 |
   | `{{APP_N_DEV_PORT}}`        | Config or framework defaults       |
   | `{{APP_N_DEPLOY_PLATFORM}}` | Deployment config files            |

4. **Analyze Packages**:

   For each package in `packages/` (or equivalent):

   | Variable                    | How to Infer               |
   | --------------------------- | -------------------------- |
   | `{{PACKAGE_NAME_N}}`        | Directory names            |
   | `{{PACKAGE_N_DESCRIPTION}}` | Package config description |

5. **Report Inferred Values**:

   ```
   📊 Monorepo Analysis Complete

   🏠 Root Configuration:
   - PROJECT_NAME: my-monorepo
   - PACKAGE_MANAGER: pnpm
   - NODE_VERSION: 20.x

   📱 Apps Detected:
   ┌─────────┬─────────────┬──────────┬──────┐
   │ Name    │ Framework   │ Port     │ Deploy │
   ├─────────┼─────────────┼──────────┼──────┤
   │ web     │ Next.js 15  │ 3000     │ Vercel │
   │ api     │ Hono        │ 8787     │ Cloudflare │
   └─────────┴─────────────┴──────────┴──────┘

   📦 Packages Detected:
   ┌─────────┬─────────────────────────┐
   │ Name    │ Description             │
   ├─────────┼─────────────────────────┤
   │ ui      │ Shared UI components    │
   │ utils   │ Utility functions       │
   │ config  │ Shared configuration    │
   └─────────┴─────────────────────────┘

   ❓ Please Provide:
   - PROJECT_DESCRIPTION: What is this monorepo for?
   ```

6. **Prompt for Missing Values**:

   Ask specific questions for values that couldn't be inferred:

   - "What is the main purpose of this monorepo?"
   - "What issue tracker do you use (GitHub Issues, Jira, Linear)?"
   - "Any additional apps or packages to document?"

7. **Update Template Files**:

   **Root Level:**

   - `AGENTS.md`
   - `.github/copilot-instructions.md`
   - `.github/instructions/*.instructions.md`
   - `.github/prompts/*.prompt.md`
   - `.cursor/rules/*.mdc`
   - `.cursor/commands/*.md`

   **Per App** (copy from `apps/app-template/` if needed):

   - `apps/{app}/AGENTS.md`
   - `apps/{app}/README.md`

   **Per Package:**

   - `packages/{package}/README.md`

8. **Generate App-Specific AGENTS.md**:

   For each detected app, create a customized `AGENTS.md` with:

   - Framework-specific patterns
   - Directory structure
   - Component/route conventions
   - State management patterns
   - API integration patterns

9. **Recommend and Install AI Agent Skills**:

   Based on detected ecosystem and frameworks, recommend relevant skills from [skills.sh](https://skills.sh/) and [agentskills.io](https://agentskills.io/).

   **Core Skills (Always Recommend):**

   | Skill Repository           | Purpose                                            |
   | -------------------------- | -------------------------------------------------- |
   | `obra/superpowers`         | TDD, systematic debugging, planning, code review   |
   | `trailofbits/skills`       | Security analysis, Semgrep, property-based testing |
   | `softaworks/agent-toolkit` | README writing, clear documentation                |

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

   **Monorepo-Specific Considerations:**

   - Install skills at workspace root (`.cursor/skills/{skill-name}/` or `.github/skills/{skill-name}/`)
   - Skills are installed by skill name, not org/repo path (e.g., `superpowers/` not `obra/superpowers/`)
   - Consider per-app skills if apps use different frameworks
   - Update root `AGENTS.md` to reference installed skills

   **Present Recommendation:**

   ```
   🎯 Recommended AI Agent Skills

   Based on your monorepo ({{BUILD_SYSTEM}}/{{LANGUAGE}}):

   Core Skills (recommended for all projects):
   npx skills add obra/superpowers
   npx skills add trailofbits/skills
   npx skills add softaworks/agent-toolkit

   Framework-Specific Skills:
   - web (Next.js): npx skills add vercel-labs/agent-skills
   - api (Hono): npx skills add elysiajs/skills

   Install All? (Y/n)
   ```

   **On Confirmation:**

   - Run skill installation commands at workspace root
   - Skills installed to `.cursor/skills/`
   - Update root `AGENTS.md` to reference installed skills
   - Add skill references to relevant app `AGENTS.md` files

10. **Report Completion**:

```
✅ Monorepo Bootstrap Complete!

Ecosystem: {{LANGUAGE}} / {{BUILD_SYSTEM}}

Root Files Updated:
- AGENTS.md
- .github/copilot-instructions.md
- .github/instructions/*.instructions.md
- .cursor/rules/*.mdc
- .cursor/commands/*.md

App Files Created/Updated:
- {{APP_DIR}}/{{APP_1}}/AGENTS.md
- {{APP_DIR}}/{{APP_1}}/README.md

Package/Library Files Updated:
- {{PACKAGES_DIR}}/{{PACKAGE_1}}/README.md

Installed Skills:
- obra/superpowers - Development workflow
- trailofbits/skills - Security & quality
- {{FRAMEWORK_SKILL}} - Framework patterns

Next Steps:
1. Review root AGENTS.md for accuracy
2. Review each app's AGENTS.md
3. Add project-specific patterns
4. Customize commands and prompts
5. Browse more skills at https://skills.sh/
6. Create custom skills at https://agentskills.io/specification
```

## Example Workflows

### JavaScript/TypeScript Monorepo (pnpm + Turborepo)

```
User: /bootstrap

AI: 📊 Analyzing monorepo...

Detected Ecosystem: JavaScript/TypeScript
Build System: Turborepo

Scanning workspace:
- Root: package.json, turbo.json, pnpm-workspace.yaml
- Apps: apps/web/, apps/api/, apps/docs/
- Packages: packages/ui/, packages/utils/, packages/config/

🏠 Root: my-saas-platform (pnpm, Node 20.x)

📱 Apps:
- web: Next.js 15, port 3000, Vercel
- api: Hono, port 8787, Cloudflare Workers
- docs: Nextra, port 3001, Vercel

📦 Packages:
- @my-saas/ui: Shared React components
- @my-saas/utils: Utility functions
- @my-saas/config: ESLint, TypeScript configs

❓ Please provide:
1. PROJECT_DESCRIPTION: Brief description?
2. ISSUE_TRACKER: GitHub Issues, Jira, or Linear?

User: SaaS platform for project management. We use Linear.

AI: ✅ Updating files...

✅ Bootstrap complete! (TypeScript/Turborepo)
```

### .NET Monorepo (MSBuild Solution)

```
User: /bootstrap

AI: 📊 Analyzing monorepo...

Detected Ecosystem: .NET/C#
Build System: MSBuild Solution

Scanning workspace:
- Root: MySaaS.sln, Directory.Build.props, nuget.config
- Apps: src/Web/, src/Api/, src/Worker/
- Libraries: src/Shared/, src/Domain/, src/Infrastructure/

🏠 Root: MySaaS (.NET 8, C#)

📱 Apps:
- Web: Blazor Server, port 5000
- Api: ASP.NET Core Web API, port 5001
- Worker: Worker Service (background jobs)

📦 Libraries:
- MySaaS.Shared: DTOs, common utilities
- MySaaS.Domain: Domain models, business logic
- MySaaS.Infrastructure: Database, external services

❓ Please provide:
1. PROJECT_DESCRIPTION: Brief description?
2. ISSUE_TRACKER: Azure DevOps, GitHub Issues, Jira?

User: Enterprise resource planning system. Azure DevOps.

AI: ✅ Updating files...

✅ Bootstrap complete! (.NET/MSBuild)
```

### PHP Monorepo (Laravel Modules)

```
User: /bootstrap

AI: 📊 Analyzing monorepo...

Detected Ecosystem: PHP
Build System: Composer/Laravel Modules

Scanning workspace:
- Root: composer.json, artisan, .env.example
- Modules: Modules/Core/, Modules/Auth/, Modules/Billing/
- Packages: packages/shared/, packages/api-client/

🏠 Root: my-laravel-app (Composer, PHP 8.3)

📱 Modules:
- Core: Base module with shared functionality
- Auth: Authentication and authorization
- Billing: Payment processing and subscriptions

📦 Packages:
- my-app/shared: Shared utilities and traits
- my-app/api-client: External API integrations

❓ Please provide:
1. PROJECT_DESCRIPTION: Brief description?
2. ISSUE_TRACKER: GitHub Issues, Jira?

User: Multi-tenant SaaS for e-commerce. We use Jira.

AI: ✅ Updating files...

✅ Bootstrap complete! (PHP/Laravel Modules)
```

### Java/Kotlin Monorepo (Gradle Multi-Project)

```
User: /bootstrap

AI: 📊 Analyzing monorepo...

Detected Ecosystem: Java/Kotlin
Build System: Gradle Multi-Project

Scanning workspace:
- Root: settings.gradle.kts, build.gradle.kts
- Apps: apps/api/, apps/web/, apps/batch/
- Libraries: libs/common/, libs/domain/, libs/persistence/

🏠 Root: my-platform (Gradle, Java 21)

📱 Apps:
- api: Spring Boot REST API, port 8080
- web: Spring Boot + Thymeleaf, port 8081
- batch: Spring Batch jobs

📦 Libraries:
- common: Shared utilities, logging
- domain: Domain entities, business logic
- persistence: JPA repositories, database config

❓ Please provide:
1. PROJECT_DESCRIPTION: Brief description?
2. ISSUE_TRACKER: Jira, GitHub Issues?

User: Financial services platform. We use Jira.

AI: ✅ Updating files...

✅ Bootstrap complete! (Java/Gradle)
```

### Python Monorepo (uv/Poetry Workspaces)

```
User: /bootstrap

AI: 📊 Analyzing monorepo...

Detected Ecosystem: Python
Build System: uv Workspaces

Scanning workspace:
- Root: pyproject.toml, uv.lock
- Apps: apps/api/, apps/worker/, apps/cli/
- Packages: packages/core/, packages/models/, packages/utils/

🏠 Root: my-ml-platform (uv, Python 3.12)

📱 Apps:
- api: FastAPI REST API, port 8000
- worker: Celery workers
- cli: Click CLI tool

📦 Packages:
- my-platform-core: Core business logic
- my-platform-models: Pydantic models, schemas
- my-platform-utils: Shared utilities

❓ Please provide:
1. PROJECT_DESCRIPTION: Brief description?
2. ISSUE_TRACKER: GitHub Issues, Linear?

User: ML platform for data processing. GitHub Issues.

AI: ✅ Updating files...

✅ Bootstrap complete! (Python/uv)
```
