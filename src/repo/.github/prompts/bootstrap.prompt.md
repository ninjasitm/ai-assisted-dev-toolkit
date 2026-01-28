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
| `{{PM_TOOL}}`               | Detected project management tool                                            |
| `{{PM_URL}}`                | Project management tool URL/workspace (if applicable)                       |
| `{{PM_PROJECT_ID}}`         | Project ID or workspace ID (if applicable)                                  |
| `{{PM_ISSUE_KEY}}`          | Issue key format (e.g., PROJ-###)                                           |
| `{{NEW_RELEVANT_VARIABLE}}` | ...other inferred values...                                                 |

### Step 2.5: Project Management Detection

**Detection Strategy:**

1. **GitHub Issues** - Check for:
   - `.github/ISSUE_TEMPLATE/` directory
   - Repository issues enabled (via git remote URL)
   - Default detection for GitHub-hosted repos

2. **Jira** - Check for:
   - `jira.properties` or `jira.yml`
   - References in CI/CD configs (`.github/workflows/`, `azure-pipelines.yml`)
   - `JIRA_` environment variables in config files
   - Jira issue keys (e.g., `PROJ-123`) in commit history

3. **Azure DevOps (Azure Boards)** - Check for:
   - `azure-pipelines.yml` with Azure Boards integration
   - `.azure/` directory
   - Azure DevOps URLs in README

4. **Linear** - Check for:
   - `.linear/` directory or `linear.json`
   - Linear issue references in commits (e.g., `ENG-123`)

5. **GitLab Issues** - Check for:
   - `.gitlab-ci.yml`
   - GitLab remote URL

**Issue Key Format Detection:**

| PM Tool       | Key Format    | Example  | Detection Method                  |
| ------------- | ------------- | -------- | --------------------------------- |
| GitHub Issues | `#{NUM}`      | `#42`    | GitHub remote URL                 |
| Jira          | `{KEY}-{NUM}` | `PROJ-1` | Scan commits for `[A-Z]+-\d+`     |
| Azure Boards  | `#{NUM}`      | `#123`   | Azure DevOps URL in config        |
| Linear        | `{KEY}-{NUM}` | `ENG-42` | Scan commits for `[A-Z]{2,5}-\d+` |
| GitLab Issues | `#{NUM}`      | `#8`     | GitLab remote URL                 |

**If Multiple Tools Detected:**

- Prioritize: Jira > Azure Boards > Linear > GitHub Issues > GitLab Issues
- Ask user to confirm which is primary

**If No Tool Detected:**

- Ask user if they use issue tracking
- Provide common options to choose from

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

### 📋 Project Management

| Property   | Value                             |
| ---------- | --------------------------------- |
| Tool       | {{PM_TOOL}} (detected/inferred)   |
| URL        | {{PM_URL}} or "N/A"               |
| Project ID | {{PM_PROJECT_ID}} or "N/A"        |
| Issue Key  | {{PM_ISSUE_KEY}} (e.g., PROJ-###) |

### ❓ Please Provide

1. **PROJECT_DESCRIPTION**: Brief description of the project?
2. **DEPLOY_PLATFORM**: Where will this be deployed?
3. **Project Management** (detected: {{PM_TOOL}} or "None detected"):
   - Confirm detected tool or specify different tool
   - Provide URL if applicable (e.g., `https://yourorg.atlassian.net` for Jira)
   - Provide project/workspace ID if applicable (e.g., Azure DevOps project ID, Linear workspace)
   - Confirm issue key format (e.g., `PROJ-###` for Jira, `#42` for GitHub)
```

### Step 4: Template Customization

Replace placeholders in all template files:

**Files to Update:**

- `AGENTS.md` - Project context and patterns (include project management section)
- `.github/copilot-instructions.md` - Copilot configuration
- `.github/instructions/*.instructions.md` - Context instructions
- `.github/prompts/*.prompt.md` - Reusable prompts
- `.cursor/rules/*.mdc` - Cursor IDE rules
- `.cursor/commands/*.md` - Custom commands

**Project Management Section (added to AGENTS.md):**

```markdown
## 📋 Project Management

**Tool:** {{PM_TOOL}}
**URL:** {{PM_URL}} _(if applicable)_
**Project ID:** {{PM_PROJECT_ID}} _(if applicable)_
**Issue Key Format:** `{{PM_ISSUE_KEY}}`

### Conventions

- Reference issues in commit messages: `{{PM_ISSUE_KEY}}: Brief description`
- Link PRs to issues: Include issue key in PR title or description
- Use issue keys for traceability: `Fixes {{PM_ISSUE_KEY}}`, `Relates to {{PM_ISSUE_KEY}}`

### Examples

**Commit Messages:**
```

{{PM_EXAMPLE_KEY}}: Add user authentication
{{PM_EXAMPLE_KEY}}: Fix database connection timeout

```

**PR Titles:**
```

{{PM_EXAMPLE_KEY}}: Implement OAuth2 login flow
feat(auth): Add SSO support ({{PM_EXAMPLE_KEY}})

````

**PR Descriptions:**
```markdown
Fixes {{PM_EXAMPLE_KEY}}
Relates to {{PM_EXAMPLE_KEY_2}}
````

`````

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

**Present Recommendation:**

````markdown
## 🎯 Recommended AI Agent Skills

Based on your project ({{FRAMEWORK}}/{{LANGUAGE}}):

### Core Skills (recommended for all projects)

```bash
npx -y skills add obra/superpowers
npx -y skills add trailofbits/skills
npx -y skills add softaworks/agent-toolkit
`````

````

### Framework-Specific Skills

```bash
npx -y skills add {{FRAMEWORK_SKILL_REPO}}
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

### Project Management: {{PM_TOOL}}

- **Tool:** {{PM_TOOL}}
- **URL:** {{PM_URL}} _(if applicable)_
- **Project ID:** {{PM_PROJECT_ID}} _(if applicable)_
- **Issue Format:** `{{PM_ISSUE_KEY}}`

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
```

### Step 8: Skills Review & Cleanup

After bootstrap completion, review all installed skills for relevance:

**Skill Audit Process:**

1. **Inventory Installed Skills**
   - Scan `.github/skills/` and `.cursor/skills/` directories
   - List all installed skill names and descriptions
   - Check each skill's SKILL.md for its purpose

2. **Relevance Analysis**
   - Compare skills against detected ecosystem, framework, and language
   - Identify skills that don't match the project's tech stack
   - Flag generic skills that may not be needed

**Relevance Criteria:**

| Skill Category     | Keep If...                 | Consider Removing If...                                      |
| ------------------ | -------------------------- | ------------------------------------------------------------ |
| Language-specific  | Matches detected language  | Different language (e.g., PHP skills in .NET project)        |
| Framework-specific | Matches detected framework | Different framework (e.g., Django skills in FastAPI project) |
| Core workflow      | TDD, debugging, planning   | Duplicate functionality                                      |
| Security/Quality   | Always relevant            | Very specialized (e.g., crypto for non-crypto projects)      |
| UI-specific        | Has frontend components    | Backend-only API                                             |
| Testing            | Always relevant            | Redundant test patterns                                      |

**Review Report:**

```markdown
## 🔍 Skill Review

### ✅ Relevant Skills ({{N}} installed)

| Skill                       | Purpose                   | Reason                     |
| --------------------------- | ------------------------- | -------------------------- |
| superpowers                 | TDD & debugging workflows | Core development practices |
| vercel-react-best-practices | React patterns            | Matches detected framework |
| {{FRAMEWORK_SKILL}}         | {{FRAMEWORK}} patterns    | Matches project framework  |

### ⚠️ Potentially Unnecessary Skills ({{N}} found)

| Skill             | Purpose          | Why Flagged                               |
| ----------------- | ---------------- | ----------------------------------------- |
| django-expert     | Django patterns  | No Django detected - you're using FastAPI |
| php               | PHP patterns     | No PHP files found - TypeScript project   |
| swift-development | SwiftUI patterns | No iOS/Swift code detected                |

### 🚫 Remove Unnecessary Skills?

These skills don't match your detected tech stack and may clutter AI context.

Remove flagged skills? (Y/n)
```

**On Confirmation:**

```bash
# Remove unnecessary skills
rm -rf .github/skills/django-expert/
rm -rf .cursor/skills/php/
rm -rf .github/skills/swift-development/

# Update AGENTS.md to remove references
```

**Post-Cleanup Report:**

```markdown
## ✅ Skill Cleanup Complete

Removed {{N}} unnecessary skills:

- django-expert
- php
- swift-development

Kept {{N}} relevant skills:

- superpowers
- vercel-react-best-practices
- {{FRAMEWORK_SKILL}}
```

### Step 9: Instruction Files Verification

Verify that all necessary instruction files exist and are properly configured:

**Required Instruction Files:**

| File                          | Purpose                         | Location                |
| ----------------------------- | ------------------------------- | ----------------------- |
| `copilot-instructions.md`     | Main GitHub Copilot context     | `.github/`              |
| `{framework}.instructions.md` | Framework-specific patterns     | `.github/instructions/` |
| `{language}.instructions.md`  | Language-specific patterns      | `.github/instructions/` |
| `patterns.instructions.md`    | Project patterns                | `.github/instructions/` |
| `testing.instructions.md`     | Testing conventions             | `.github/instructions/` |
| `api.instructions.md`         | API conventions (if applicable) | `.github/instructions/` |

**Detection & Validation:**

```markdown
## 📋 Instruction Files Audit

### ✅ Found ({{N}} files)

| File                       | Purpose             | Status       |
| -------------------------- | ------------------- | ------------ |
| copilot-instructions.md    | Main context        | ✓ Configured |
| typescript.instructions.md | TypeScript patterns | ✓ Configured |
| patterns.instructions.md   | Project patterns    | ✓ Configured |

### ⚠️ Missing Recommended Instructions ({{N}} files)

| File                          | Purpose          | Why Needed                   |
| ----------------------------- | ---------------- | ---------------------------- |
| nextjs.instructions.md        | Next.js patterns | Project uses Next.js 15      |
| testing.instructions.md       | Test conventions | Multiple test files detected |
| api-standards.instructions.md | API conventions  | REST API detected in project |

### 📝 Create Missing Instruction Files?

These files would help AI understand your project's conventions.

Create recommended instructions? (Y/n)
```

**On Confirmation:**

Generate missing instruction files with appropriate templates:

**Example: Framework Instruction Template**

```markdown
---
applyTo: "src/**"
description: "{{FRAMEWORK}} patterns and conventions"
---

# {{FRAMEWORK}} Instructions

## Project Context

Framework: {{FRAMEWORK}} {{VERSION}}
Port: {{DEV_PORT}}
Deploy: {{DEPLOY_PLATFORM}}

## Patterns

### {{PATTERN_1}}

{{AUTO_DETECTED_PATTERN_1}}

### {{PATTERN_2}}

{{AUTO_DETECTED_PATTERN_2}}

## File Structure

{{AUTO_DETECTED_STRUCTURE}}

## Dependencies

Key packages:
{{LIST_KEY_DEPENDENCIES}}

## Do's and Don'ts

✅ **Do:**

- Follow {{FRAMEWORK}} best practices
- {{DO_1_FROM_FRAMEWORK_SKILL}}
- {{DO_2_FROM_FRAMEWORK_SKILL}}

❌ **Don't:**

- {{DONT_1_FROM_FRAMEWORK_SKILL}}
- {{DONT_2_FROM_FRAMEWORK_SKILL}}

## Related Documentation

- [{{FRAMEWORK}} Docs]({{DOCS_URL}})
- [Project README](README.md)
```

**Example: Testing Instruction Template**

```markdown
---
applyTo: "**/*.{test,spec}.{ts,tsx,py,php,cs}"
description: "Testing conventions and patterns"
---

# Testing Instructions

## Test Framework

Detected: {{TEST_FRAMEWORK}}

## Test Structure

{{AUTO_DETECTED_TEST_PATTERNS}}

## Conventions

### Naming

- Test files: {{DETECTED_TEST_FILE_PATTERN}}
- Test functions: {{DETECTED_TEST_FUNCTION_PATTERN}}

### Organization

{{DETECTED_TEST_ORGANIZATION}}

## Utilities

Available test utilities:
{{LIST_TEST_UTILS_FROM_CODEBASE}}

## Coverage Requirements

{{COVERAGE_CONFIG_IF_FOUND}}

## Best Practices

✅ **Do:**

- {{TESTING_BEST_PRACTICE_1}}
- {{TESTING_BEST_PRACTICE_2}}

❌ **Don't:**

- {{TESTING_ANTIPATTERN_1}}
- {{TESTING_ANTIPATTERN_2}}
```

**Post-Creation Report:**

```markdown
## ✅ Instruction Files Created

Created {{N}} new instruction files:

- [x] `.github/instructions/nextjs.instructions.md`
- [x] `.github/instructions/testing.instructions.md`
- [x] `.github/instructions/api-standards.instructions.md`

### Next Steps

1. Review generated instruction files for accuracy
2. Customize patterns based on your preferences
3. Add project-specific conventions
4. Test with GitHub Copilot

All instruction files are automatically loaded by GitHub Copilot when editing matching files.
```

### Step 10: Final Verification

```markdown
## ✅ Bootstrap Complete & Verified!

### Summary

| Category                  | Count | Status |
| ------------------------- | ----- | ------ |
| Files updated             | {{N}} | ✓      |
| Skills installed          | {{N}} | ✓      |
| Skills removed            | {{N}} | ✓      |
| Instruction files created | {{N}} | ✓      |
| Project management        | 1     | ✓      |

### Project Management Configuration

**Tool:** {{PM_TOOL}}
**URL:** {{PM_URL}} _(if applicable)_
**Project ID:** {{PM_PROJECT_ID}} _(if applicable)_
**Issue Format:** `{{PM_ISSUE_KEY}}`
**Location:** Root AGENTS.md and copilot-instructions.md

### Skill Inventory

**Installed & Relevant ({{N}}):**

- {{SKILL_1}}
- {{SKILL_2}}
- {{SKILL_N}}

### Instruction Files

**Active Instructions ({{N}}):**

- {{INSTRUCTION_1}}
- {{INSTRUCTION_2}}
- {{INSTRUCTION_N}}

### Quality Checks

- [x] All placeholders replaced
- [x] Framework patterns match detected stack
- [x] No duplicate skills
- [x] AGENTS.md configured
- [x] Instruction files cover all frameworks
- [x] Skills align with tech stack

### Your Project is Ready! 🎉

GitHub Copilot and Cursor will now understand:

- Your project structure
- Framework-specific patterns
- Custom conventions
- Testing strategies

Try asking:

- "Create a new API endpoint using our patterns"
- "Add a component following our conventions"
- "Write tests for UserService using our test utilities"
```

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
