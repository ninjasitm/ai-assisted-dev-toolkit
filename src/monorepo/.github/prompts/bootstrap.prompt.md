---
description: Bootstrap AI instructions for monorepo
---

# Bootstrap Monorepo AI Instructions

Analyze the monorepo workspace and customize AI instruction templates.

## Usage

```
/bootstrap
```

## Process

### Step 1: Ecosystem Detection

Detect the primary language ecosystem:

| Ecosystem             | Detection Files                           | Package Manager      | Build System                        |
| --------------------- | ----------------------------------------- | -------------------- | ----------------------------------- |
| JavaScript/TypeScript | `package.json`, `turbo.json`, `nx.json`   | npm, yarn, pnpm, bun | Turborepo, Nx, Lerna                |
| PHP                   | `composer.json`, `artisan`                | Composer             | Laravel Modules, Symfony Flex       |
| .NET                  | `*.sln`, `Directory.Build.props`          | NuGet/dotnet         | MSBuild, dotnet CLI                 |
| Python                | `pyproject.toml`, `setup.py`              | pip, poetry, uv, pdm | Hatch, Poetry, uv workspaces        |
| Go                    | `go.work`, `go.mod`                       | Go modules           | Go workspaces                       |
| Rust                  | `Cargo.toml` with `[workspace]`           | Cargo                | Cargo workspaces                    |
| Java/Kotlin           | `settings.gradle.kts`, `pom.xml` (parent) | Gradle, Maven        | Gradle multi-project, Maven modules |
| Ruby                  | `Gemfile` with path gems                  | Bundler              | Packwerk (Shopify)                  |

### Step 2: Monorepo Structure Detection

**Common Monorepo Patterns:**

| Language      | Apps Directory           | Packages Directory     | Config Location            |
| ------------- | ------------------------ | ---------------------- | -------------------------- |
| JS/TS         | `apps/`, `applications/` | `packages/`, `libs/`   | Root + per-package         |
| .NET          | `src/`                   | `src/` (by convention) | `Directory.Build.props`    |
| PHP (Laravel) | `Modules/`               | `packages/`            | `config/`, `composer.json` |
| Python        | `apps/`, `services/`     | `packages/`, `libs/`   | `pyproject.toml`           |
| Java/Kotlin   | `apps/`, `services/`     | `libs/`, `modules/`    | Root `build.gradle.kts`    |
| Go            | `cmd/`, `services/`      | `pkg/`, `internal/`    | Root `go.work`             |

### Step 3: Variable Inference

**Root Variables (Universal):**
| Variable | Source |
|----------|--------|
| `{{PROJECT_NAME}}` | Root config file (package.json, \*.sln, pyproject.toml, etc.) |
| `{{PROJECT_DESCRIPTION}}` | Root config description field |
| `{{LANGUAGE}}` | Detected ecosystem |
| `{{BUILD_SYSTEM}}` | Detected build tool |
| `{{PACKAGE_MANAGER}}` | Lock file / config |
| `{{RUNTIME_VERSION}}` | Version file (.nvmrc, .python-version, global.json, etc.) |
| `{{DEFAULT_BRANCH}}` | Git config |

**App Variables (for each app):**
| Variable | Source |
|----------|--------|
| `{{APP_NAME_N}}` | Directory name |
| `{{APP_N_DESCRIPTION}}` | App config description |
| `{{APP_N_FRAMEWORK}}` | Dependencies / config |
| `{{APP_N_DEV_PORT}}` | Config or defaults |
| `{{APP_N_DEPLOY_PLATFORM}}` | Deploy config files |

**Package/Library Variables:**
| Variable | Source |
|----------|--------|
| `{{PACKAGE_NAME_N}}` | Directory name |
| `{{PACKAGE_N_DESCRIPTION}}` | Package config description |

### Step 4: Framework Detection

**JavaScript/TypeScript:**

- Next.js, Nuxt, Remix, SvelteKit (apps)
- React, Vue, Svelte (packages)
- Express, Hono, Fastify (API)

**PHP:**

- Laravel, Symfony, Slim (apps)
- Laravel Modules, Symfony Flex (structure)

**.NET:**

- Blazor, ASP.NET Core MVC, Razor Pages (web)
- ASP.NET Core Web API, gRPC (API)
- Worker Service, Azure Functions (background)

**Python:**

- Django, FastAPI, Flask (apps)
- Celery, Dramatiq (workers)
- Click, Typer (CLI)

**Java/Kotlin:**

- Spring Boot, Quarkus, Micronaut (apps)
- Spring Batch (batch processing)

**Go:**

- Gin, Echo, Fiber, Chi (web)
- gRPC, Connect (API)

### Step 5: Present Findings

```markdown
## 📊 Monorepo Analysis

### 🔍 Detected Ecosystem

| Property        | Value               |
| --------------- | ------------------- |
| Language        | {{LANGUAGE}}        |
| Build System    | {{BUILD_SYSTEM}}    |
| Package Manager | {{PACKAGE_MANAGER}} |
| Runtime Version | {{RUNTIME_VERSION}} |

### 🏠 Root Configuration

| Variable     | Value       |
| ------------ | ----------- |
| PROJECT_NAME | my-monorepo |

### 📱 Apps

| App | Framework  | Port | Deploy     |
| --- | ---------- | ---- | ---------- |
| web | Next.js 15 | 3000 | Vercel     |
| api | FastAPI    | 8000 | AWS Lambda |

### 📦 Packages/Libraries

| Package      | Description   |
| ------------ | ------------- |
| @scope/ui    | UI components |
| @scope/utils | Utilities     |

### ❓ Please Provide

1. PROJECT_DESCRIPTION: What is this monorepo for?
2. ISSUE_TRACKER: Issue tracking system?
```

### Step 6: Template Updates

**Root Level Files:**

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `.github/instructions/*.instructions.md`
- `.github/prompts/*.prompt.md`
- `.cursor/rules/*.mdc`
- `.cursor/commands/*.md`

**App-Level Files (create for each app):**

- `{{APP_DIR}}/{app}/AGENTS.md`
- `{{APP_DIR}}/{app}/README.md`

**Package-Level Files:**

- `{{PACKAGES_DIR}}/{pkg}/README.md`

### Step 7: Language-Specific Content Generation

Generate appropriate patterns for each app based on framework:

**JavaScript/TypeScript (Next.js):**

```markdown
## Patterns

- App Router with Server Components
- API Routes in app/api/
- Use @scope/ui for components
```

**.NET (Blazor):**

```markdown
## Patterns

- Blazor components in Pages/
- Shared Razor components in Shared/
- Reference MySaaS.Shared for DTOs
```

**PHP (Laravel Module):**

```markdown
## Patterns

- Controllers in Http/Controllers/
- Models in Entities/
- Use Modules/Core for shared logic
```

**Python (FastAPI):**

```markdown
## Patterns

- Routers in routers/
- Pydantic models in schemas/
- Use my-platform-core for business logic
```

**Java (Spring Boot):**

```markdown
## Patterns

- Controllers in web/
- Services in service/
- Use libs/domain for entities
```

### Step 8: AI Agent Skills Recommendation

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

- Install skills at workspace root (`.github/skills/{skill-name}/` or `.cursor/skills/{skill-name}/`)
- Skills are installed by skill name, not org/repo path (e.g., `superpowers/` not `obra/superpowers/`)
- Consider per-app skills if apps use different frameworks
- Update root `AGENTS.md` to reference installed skills

**Present Recommendation:**

````markdown
## 🎯 Recommended AI Agent Skills

Based on your monorepo ({{BUILD_SYSTEM}}/{{LANGUAGE}}):

### Core Skills (recommended for all projects)

```bash
npx -y skills add obra/superpowers
npx -y skills add trailofbits/skills
npx -y skills add softaworks/agent-toolkit
```
````

### Framework-Specific Skills

```bash
# For web app (Next.js)
npx -y skills add vercel-labs/agent-skills

# For api (Hono/Elysia)
npx -y skills add elysiajs/skills
```

### Install All?

Would you like to install these skills now? (Y/n)

````

**On Confirmation:**
- Run skill installation commands at workspace root
- Skills installed to `.github/skills/{skill-name}/` (by skill name, not org/repo)
- Update root `AGENTS.md` to reference installed skills
- Add skill references to relevant app `AGENTS.md` files

### Step 9: Pattern Discovery & Custom Skills

Scan the codebase to identify reusable patterns that could become custom AI skills:

**Pattern Categories to Detect:**

| Category           | What to Look For                                                                       |
| ------------------ | -------------------------------------------------------------------------------------- |
| **Components**     | UI component libraries, shared components, design system patterns                      |
| **Logging**        | Custom loggers, log formatters, observability patterns, error tracking                 |
| **API**            | API client wrappers, request/response patterns, authentication flows                   |
| **Scaffolding**    | Code generators, templates, boilerplate patterns                                       |
| **UI Patterns**    | Layout patterns, responsive design systems, accessibility patterns                     |
| **Font Patterns**  | Typography systems, font loading strategies, text styling conventions                  |
| **Color Patterns** | Color systems, theme providers, dark/light mode implementations                        |
| **UX Patterns**    | Navigation patterns, form handling, validation, loading states, error boundaries       |
| **State**          | State management patterns, caching strategies, data fetching patterns                  |
| **Testing**        | Test utilities, mock factories, fixture patterns                                       |
| **Config**         | Environment handling, feature flags, configuration patterns                            |
| **Security**       | Auth patterns, permission systems, input sanitization                                  |

**Detection Approach:**

```markdown
Search for patterns in:
1. `components/` or `ui/` directories - Component patterns
2. `lib/`, `utils/`, `helpers/` - Utility patterns
3. `hooks/`, `composables/` - Reactive patterns
4. `services/`, `api/` - API and service patterns
5. `config/`, `constants/` - Configuration patterns
6. `styles/`, `theme/` - Styling patterns
7. `test/`, `__tests__/`, `spec/` - Testing patterns
8. Look for files with 10+ imports (heavily reused)
9. Look for consistent naming conventions
10. Identify wrapper/adapter patterns around external libraries
```

**Pattern Analysis Report:**

```markdown
## 🔍 Discovered Codebase Patterns

Analyzing your monorepo for reusable patterns that could become AI skills...

### 📦 Component Patterns
| Pattern | Location | Usage Count | Description |
|---------|----------|-------------|-------------|
| Button variants | `packages/ui/src/Button/` | 47 imports | Consistent button system with variants |
| Form components | `packages/ui/src/Form/` | 32 imports | Form handling with validation |
| Modal system | `packages/ui/src/Modal/` | 18 imports | Accessible modal implementation |

### 🎨 Styling Patterns
| Pattern | Location | Description |
|---------|----------|-------------|
| Theme tokens | `packages/ui/src/theme/` | CSS custom properties system |
| Responsive utils | `packages/ui/src/responsive/` | Breakpoint utilities |
| Color palette | `packages/ui/src/colors/` | Semantic color system |

### 🔌 API Patterns
| Pattern | Location | Description |
|---------|----------|-------------|
| API client | `packages/api/src/client.ts` | Typed API wrapper with retry logic |
| Auth flow | `packages/auth/src/` | OAuth/JWT authentication pattern |
| Error handling | `packages/api/src/errors.ts` | Standardized error responses |

### 📊 Logging Patterns
| Pattern | Location | Description |
|---------|----------|-------------|
| Logger service | `packages/core/src/logger/` | Structured logging with context |
| Error tracker | `packages/core/src/tracking/` | Error boundary + Sentry integration |

### 🧪 Testing Patterns
| Pattern | Location | Description |
|---------|----------|-------------|
| Test utils | `packages/testing/src/` | Shared test helpers and mocks |
| Fixtures | `packages/testing/fixtures/` | Reusable test data factories |
```

**Confirm Pattern Skills:**

```markdown
## 🎯 Create Custom Skills from Patterns?

These patterns could be converted to AI skills for consistent code generation:

### Recommended Custom Skills:

1. **ui-components** - Your component library patterns
   - Button, Form, Modal conventions
   - Prop patterns and accessibility standards
   - Would help AI generate consistent UI code

2. **api-patterns** - Your API integration patterns
   - Client wrapper conventions
   - Error handling standards
   - Auth flow patterns

3. **logging-observability** - Your logging standards
   - Log levels and formatting
   - Context propagation
   - Error tracking integration

4. **testing-utils** - Your test conventions
   - Mock patterns
   - Fixture factories
   - Test organization

### Create these custom skills? (Select options)

- [ ] All recommended skills
- [ ] ui-components only
- [ ] api-patterns only
- [ ] logging-observability only
- [ ] testing-utils only
- [ ] Skip custom skill creation
```

**On Skill Creation Confirmation:**

1. Generate skill files in `.github/skills/{skill-name}/` or `.cursor/skills/{skill-name}/`
2. Each skill includes:
   - `SKILL.md` - Skill definition with patterns and examples
   - Code examples extracted from codebase
   - Do's and Don'ts based on existing patterns
3. Update `AGENTS.md` to reference new custom skills
4. Provide instructions for skill refinement

**Custom Skill Template:**

```markdown
---
name: {{SKILL_NAME}}
description: {{SKILL_DESCRIPTION}}
author: {{PROJECT_NAME}}
version: 1.0.0
---

# {{SKILL_NAME}}

## Overview
{{SKILL_DESCRIPTION}}

## Patterns

### {{PATTERN_1_NAME}}
{{PATTERN_1_DESCRIPTION}}

**Example:**
```{{LANGUAGE}}
{{PATTERN_1_EXAMPLE}}
```

### {{PATTERN_2_NAME}}
...

## Do's and Don'ts

✅ **Do:**
- {{DO_1}}
- {{DO_2}}

❌ **Don't:**
- {{DONT_1}}
- {{DONT_2}}

## Related Files
- {{RELATED_FILE_1}}
- {{RELATED_FILE_2}}
```

### Step 10: Completion Report

```markdown
## ✅ Bootstrap Complete!

### Ecosystem: {{LANGUAGE}} / {{BUILD_SYSTEM}}

### Root Files (N updated)

- [x] AGENTS.md
- [x] .github/copilot-instructions.md
- [x] .github/instructions/\*.instructions.md
- [x] .cursor/rules/\*.mdc
- [x] .cursor/commands/\*.md
- [x] .github/prompts/\*.prompt.md

### App Files (N created/updated)

- [x] {{APP_DIR}}/web/AGENTS.md
- [x] {{APP_DIR}}/web/README.md
- [x] {{APP_DIR}}/api/AGENTS.md
- [x] {{APP_DIR}}/api/README.md

### Package/Library Files (N updated)

- [x] {{PACKAGES_DIR}}/shared/README.md
- [x] {{PACKAGES_DIR}}/core/README.md

### Installed Skills

- [x] obra/superpowers - Development workflow
- [x] trailofbits/skills - Security & quality
- [x] {{FRAMEWORK_SKILL}} - Framework patterns

### Next Steps

1. Review AGENTS.md files for accuracy
2. Add project-specific patterns
3. Customize prompts and commands
4. Test with your workflow
5. Browse more skills at https://skills.sh/
6. Create custom skills at https://agentskills.io/specification
````

## Monorepo Detection Logic

```typescript
// Detect workspace structure (any language)
const analyzeMonorepo = async () => {
	// JavaScript/TypeScript
	if (await exists("package.json")) {
		const pkg = await readJson("package.json");
		if (
			pkg.workspaces ||
			(await exists("turbo.json")) ||
			(await exists("nx.json"))
		) {
			return detectJsMonorepo();
		}
	}

	// .NET
	const slnFiles = await glob("*.sln");
	if (slnFiles.length > 0) {
		return detectDotNetMonorepo();
	}

	// Python
	if (await exists("pyproject.toml")) {
		const pyproject = await readToml("pyproject.toml");
		if (
			pyproject.tool?.hatch?.envs ||
			pyproject.tool?.pdm ||
			(await exists("uv.lock"))
		) {
			return detectPythonMonorepo();
		}
	}

	// Go
	if (await exists("go.work")) {
		return detectGoMonorepo();
	}

	// Java/Kotlin
	if (
		(await exists("settings.gradle.kts")) ||
		(await exists("settings.gradle"))
	) {
		return detectGradleMonorepo();
	}
	const pomFiles = await glob("**/pom.xml");
	if (pomFiles.length > 1) {
		return detectMavenMonorepo();
	}

	// Rust
	if (await exists("Cargo.toml")) {
		const cargo = await readToml("Cargo.toml");
		if (cargo.workspace) {
			return detectRustMonorepo();
		}
	}

	// PHP
	if (await exists("composer.json")) {
		const composer = await readJson("composer.json");
		if (composer.extra?.laravel || (await exists("Modules/"))) {
			return detectPhpMonorepo();
		}
	}

	return { type: "unknown" };
};

// Detect app framework (language-specific)
const detectAppFramework = (lang, deps) => {
	const detectors = {
		javascript: () => {
			if (deps.next) return { name: "Next.js", version: deps.next };
			if (deps.nuxt) return { name: "Nuxt", version: deps.nuxt };
			if (deps.hono) return { name: "Hono", version: deps.hono };
			if (deps.express) return { name: "Express", version: deps.express };
		},
		dotnet: (csproj) => {
			if (csproj.includes("Microsoft.AspNetCore.Components"))
				return { name: "Blazor" };
			if (csproj.includes("Microsoft.NET.Sdk.Web"))
				return { name: "ASP.NET Core" };
			if (csproj.includes("Microsoft.NET.Sdk.Worker"))
				return { name: "Worker Service" };
		},
		python: () => {
			if (deps.fastapi) return { name: "FastAPI" };
			if (deps.django) return { name: "Django" };
			if (deps.flask) return { name: "Flask" };
		},
		php: () => {
			if (deps["laravel/framework"]) return { name: "Laravel" };
			if (deps["symfony/framework-bundle"]) return { name: "Symfony" };
		},
		java: () => {
			if (deps["org.springframework.boot"]) return { name: "Spring Boot" };
			if (deps["io.quarkus"]) return { name: "Quarkus" };
		},
	};

	return detectors[lang]?.(deps) ?? { name: "Unknown", version: "N/A" };
};
```

## Notes

- Run after copying monorepo templates to your project
- Supports JavaScript/TypeScript, .NET, PHP, Python, Go, Rust, Java/Kotlin ecosystems
- Automatically detects monorepo structure and build system
- Generates language-appropriate patterns and conventions
- Creates AGENTS.md for each app automatically
- Updates package READMEs with correct scope
- Re-run when adding new apps or packages
