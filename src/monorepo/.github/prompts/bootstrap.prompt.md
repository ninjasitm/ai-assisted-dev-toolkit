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

### Step 8: Completion Report

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

### Next Steps

1. Review AGENTS.md files for accuracy
2. Add project-specific patterns
3. Customize prompts and commands
4. Test with your workflow
```

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
