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
   | `{{PM_TOOL}}`             | Detected project management tool                   |
   | `{{PM_URL}}`              | Project management URL (if applicable)             |
   | `{{PM_PROJECT_ID}}`       | Project/workspace ID (if applicable)               |
   | `{{PM_ISSUE_KEY}}`        | Issue key format (e.g., PROJ-###, #42)             |

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

4.5. **Detect Project Management Tool**:

- **GitHub Issues**: `.github/ISSUE_TEMPLATE/` directory or GitHub remote URL
- **Jira**: `jira.properties`, `jira.yml`, or Jira issue keys in commits (e.g., `PROJ-123`)
- **Azure DevOps**: `azure-pipelines.yml`, `.azure/` directory
- **Linear**: `.linear/` directory, `linear.json`, or Linear references in commits
- **GitLab Issues**: `.gitlab-ci.yml` or GitLab remote URL
- Extract URL and project/workspace ID where applicable

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

   📋 Project Management:
   - Tool: GitHub Issues (detected)
   - URL: https://github.com/owner/monorepo
   - Project ID: owner/monorepo
   - Issue Key: #{{NUM}}

   ❓ Please Provide:
   - PROJECT_DESCRIPTION: What is this monorepo for?
   ```

6. **Prompt for Missing Values**:

   Ask specific questions for values that couldn't be inferred:
   - "What is the main purpose of this monorepo?"
   - "Confirm detected project management tool or specify different one (GitHub Issues, Jira, Azure DevOps, Linear, GitLab)?"
   - "Provide project management URL if applicable?"
   - "Provide project/workspace ID if applicable?"
   - "Any additional apps or packages to document?"

7. **Update Template Files**:

   **Root Level:**
   - `AGENTS.md` (include project management section)
   - `.github/copilot-instructions.md` (include PM context)
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

9. **Detect Installed AI Agents**:

   Before recommending skills, detect which AI agent directories exist in the workspace:

   | Directory Pattern                      | Agent Flag        | Agent Name     |
   | -------------------------------------- | ----------------- | -------------- |
   | `.cursor/` or `~/.cursor/`             | `cursor`          | Cursor         |
   | `.github/` (check for Copilot)         | `copilot`         | GitHub Copilot |
   | `.agents/`                             | Multiple possible | See note below |
   | `.windsurf/` or `~/.codeium/windsurf/` | `windsurf`        | Windsurf       |
   | `.cline/` or `~/.cline/`               | `cline`           | Cline          |
   | `.continue/` or `~/.continue/`         | `continue`        | Continue       |
   | `.roo/` or `~/.roo/`                   | `roo`             | Roo Code       |
   | `.claude/` or `~/.claude/`             | `claude-code`     | Claude Code    |

   **Note:** `.agents/` directory is used by multiple agents: `amp`, `codex`, `gemini-cli`, `github-copilot`, `opencode`, `replit`. If only `.agents/` exists, default to `codex` or `github-copilot` based on other indicators.

   **Build the agent flags string:**
   - For each detected agent, add `-a <agent>` to the command
   - Example: If `.cursor/` and `.github/` exist → use `-a cursor -a copilot`
   - If no agents detected, omit `-a` flags (CLI will prompt)

10. **Recommend and Install AI Agent Skills**:

Based on detected ecosystem and frameworks, recommend relevant skills from [skills.sh](https://skills.sh/) and [agentskills.io](https://agentskills.io/).

**Important:** Use the detected agent flags from step 9 in all `npx skills add` commands. This prevents creating unnecessary configurations for agents the user doesn't have installed.

**Core Skills (Always Recommend):**

| Skill Repository           | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `obra/superpowers`         | TDD, systematic debugging, planning, code review   |
| `trailofbits/skills`       | Security analysis, Semgrep, property-based testing |
| `softaworks/agent-toolkit` | README writing, clear documentation                |

**Example commands** (replace `<detected-agents>` with the actual flags from step 9, e.g., `-a cursor -a copilot`):

```bash
npx -y skills add <detected-agents> obra/superpowers
npx -y skills add <detected-agents> trailofbits/skills
```

**Framework-Specific Skills:**

When recommending framework-specific skills, include the detected agent flags. Examples:

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

| Language/Framework | Skill Repository                      | Install Command                                                                        |
| ------------------ | ------------------------------------- | -------------------------------------------------------------------------------------- |
| PHP                | `vapvarun/claude-backup` (php)        | `npx -y skills add vapvarun/claude-backup --skill "php"`                               |
| Laravel            | `vapvarun/claude-backup` (laravel)    | `npx -y skills add vapvarun/claude-backup --skill "laravel"`                           |
| Python             | `siviter-xyz/dot-agent` (python)      | `npx -y skills add siviter-xyz/dot-agent --skill "python"`                             |
| Django             | `vintasoftware/django-ai-plugins`     | `npx -y skills add vintasoftware/django-ai-plugins --skill "django-expert"`            |
| Next.js            | `sickn33/antigravity-awesome-skills`  | `npx -y skills add sickn33/antigravity-awesome-skills --skill "nextjs-best-practices"` |
| React              | `vercel-labs/agent-skills`            | `npx -y skills add vercel-labs/agent-skills --skill "vercel-react-best-practices"`     |
| Vue                | `onmax/nuxt-skills` (vue)             | `npx -y skills add onmax/nuxt-skills --skill "vue"`                                    |
| Nuxt               | `onmax/nuxt-skills` (nuxt)            | `npx -y skills add onmax/nuxt-skills --skill "nuxt"`                                   |
| Expo               | `expo/skills`                         | `npx -y skills add expo/skills`                                                        |
| TypeScript         | `pproenca/dot-skills` (typescript)    | `npx -y skills add pproenca/dot-skills`                                                |
| Advanced Types     | `wshobson/agents` (ts-advanced-types) | `npx -y skills add wshobson/agents`                                                    |

**Skill Creation for Unsupported Frameworks:**

Use `npx -y skills add anthropics/skills` (includes `skill-creator`) to create custom skills.

**Monorepo-Specific Considerations:**

- Install skills at workspace root (`.cursor/skills/{skill-name}/` or `.github/skills/{skill-name}/`)
- Skills are installed by skill name, not org/repo path (e.g., `superpowers/` not `obra/superpowers/`)
- Consider per-app skills if apps use different frameworks
- Update root `AGENTS.md` to reference installed skills

**Present Recommendation:**

After detecting agents in step 9, present the recommendations with the appropriate agent flags:

```
🎯 Recommended AI Agent Skills

Detected agents: {{DETECTED_AGENTS_LIST}}
Using flags: {{AGENT_FLAGS}}

Based on your monorepo ({{BUILD_SYSTEM}}/{{LANGUAGE}}):

Core Skills (recommended for all projects):
npx -y skills add {{AGENT_FLAGS}} obra/superpowers
npx -y skills add {{AGENT_FLAGS}} trailofbits/skills
npx -y skills add {{AGENT_FLAGS}} softaworks/agent-toolkit

Framework-Specific Skills:
- web (Next.js): npx -y skills add {{AGENT_FLAGS}} vercel-labs/agent-skills
- api (Hono): npx -y skills add {{AGENT_FLAGS}} elysiajs/skills

Install All? (Y/n)
```

**Example with detected agents:**

- If `.cursor/` and `.github/` exist: `AGENT_FLAGS="-a cursor -a copilot"`
- If only `.cursor/` exists: `AGENT_FLAGS="-a cursor"`
- Commands become: `npx -y skills add -a cursor -a copilot obra/superpowers`

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

9. **Review Installed Skills**:

   After completion, audit all installed skills:
   - Scan `.github/skills/` and `.cursor/skills/` directories
   - Compare each skill against detected ecosystems and frameworks
   - Flag skills that don't match any app's tech stack

   ```
   ## 🔍 Skill Review

   ### ✅ Relevant Skills ({{N}} installed)
   | Skill | Purpose | Matches |
   |-------|---------|----------|
   | superpowers | TDD workflows | All apps |
   | vercel-react-best-practices | React patterns | web app |
   | {{FRAMEWORK_SKILL}} | API patterns | api app |

   ### ⚠️ Potentially Unnecessary Skills ({{N}} found)
   | Skill | Purpose | Why Flagged |
   |-------|---------|-------------|
   | django-expert | Django patterns | No Django apps detected |
   | php | PHP patterns | JavaScript/TypeScript monorepo |

   Remove flagged skills? (Y/n)
   ```

   **On Confirmation:**
   - Remove unnecessary skill directories
   - Update root AGENTS.md to remove references
   - Report cleanup results

10. **Verify Instruction Files**:

    Check for required instruction files at root and app levels:

    ```
    ## 📋 Instruction Files Audit

    ### ✅ Found ({{N}} files)
    | File | Purpose | Status |
    |------|---------|--------|
    | copilot-instructions.md | Root context | ✓ |
    | typescript.instructions.md | TS patterns | ✓ |

    ### ⚠️ Missing Recommended ({{N}} files)
    | File | Purpose | Why Needed |
    |------|---------|------------|
    | nextjs.instructions.md | Next.js patterns | web app uses Next.js |
    | fastapi.instructions.md | FastAPI patterns | api app uses FastAPI |
    | testing.instructions.md | Test conventions | Multiple frameworks |

    Create missing instruction files? (Y/n)
    ```

    **On Confirmation:**
    - Generate instruction files with appropriate templates
    - Include app-specific scoping (applyTo paths)
    - Include framework-specific patterns from skills
    - Report created files

11. **Final Verification Report**:

    ```
    ## ✅ Bootstrap Complete & Verified!

    ### Summary
    | Category | Count | Status |
    |----------|-------|--------|
    | Root files updated | {{N}} | ✓ |
    | App files created | {{N}} | ✓ |
    | Package files updated | {{N}} | ✓ |
    | Skills installed | {{N}} | ✓ |
    | Skills removed | {{N}} | ✓ |
    | Instructions created | {{N}} | ✓ |

    ### Quality Checks
    - [x] Placeholders replaced
    - [x] Skills match tech stack
    - [x] No duplicate skills
    - [x] All apps have AGENTS.md
    - [x] Instructions cover all frameworks

    ### Your Monorepo is Ready! 🎉

    GitHub Copilot and Cursor understand:
    - Monorepo structure
    - App-specific frameworks
    - Shared packages
    - Cross-cutting patterns

    Try asking:
    - "Create an endpoint in apps/api using our patterns"
    - "Add a component to the design system"
    - "Write tests for UserService in packages/core"
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
