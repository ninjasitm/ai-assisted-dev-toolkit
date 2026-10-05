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

### Native OpenCode V2

Toolkit v4 requires **OpenCode V2 (major >=2)** for OpenCode use; oh-my-opencode-slim >=3.0.0 requires OpenCode >=2.0.7. Bootstrap, patch, and upgrade run `opencode --version` before changes (optional leading `v` accepted). V1 must stop before OpenCode customization/migration or marking toolkit 4.0.0: upgrade OpenCode or remain on toolkit 3.x. A missing CLI or unparseable version stops OpenCode steps and version marking until confirmed/installed. Confirm harness use from runtime evidence or ask, not scaffold directories; other-harness-only setup is unaffected.

The template's local `plugins` array registers the author's native V2 package `@dietrichgebert/ponytail@4.12.0`, alongside `opencode-mem` and `@tarquinen/opencode-dcp@latest`; `opentmux` remains commented as V1-only. The obsolete local Ponytail plugin is no longer bundled; no local API port or bridge is used. For existing projects, back up and obtain approval before removing only known toolkit `.opencode/plugins/ponytail.js`, `.mjs`, or `.ts` copies; preserve unrelated local plugins and merge/deduplicate upstream registration locally without editing global plugins. Native local plugins are discovered automatically; do not register them twice.

With approval, merge `"plugins": ["oh-my-opencode-slim@3.0.0"]` locally without replacing other registrations. Slim's separate strict schema retains `prompt`, `permission`, and `variant`; do not host-migrate it. The external starter is a separate package, not automatically upgraded. Plugin/runtime integration has not been tested.

Use native `agents`/`system`, `request.body.temperature`, ordered `permissions` (`action`/`resource`/`effect`, `shell`/`subagent`), `commands`/`subagent`, `plugins` with `{ "package": "…", "options": {} }`, skill-directory arrays, and `mcp.servers` with inverse `disabled` and `timeout.catalog`/`timeout.execution`. Follow the [V2 migration guide](https://opencode.ai/v2/docs/migrate-v1) and [plugin guide](https://opencode.ai/v2/docs/build/plugins); the published schema may describe V1 and is not V2 validation authority.

Ambient root/nested `AGENTS.md` works; config `instructions` entries are not loaded. `@refs` are ordinary text: read linked snippets explicitly. `request.body.temperature` remains in config, but the current runner does not send it. Preserve `lsp: true`; use workspace lint/typecheck/compiler commands (no V2 LSP tools/diagnostics currently).

`--env opencode` supplies minimal shared references without activating other harnesses. Back up V1, merge rather than clobber models/providers/plugins, and activate on the next run/restart. Native-converted files are incompatible with V1. Verify with installed V2; `doctor` is not runtime validation. Toolkit 4.0.0 publishing has not been executed.

### Native Codex

`--env codex` includes `.codex/`, `.agents/`, and shared context, plus `.github/instructions/` and `.claude/rules-snippets/` solely to supply AGENTS-linked standards and their wrapper source content. No other harness command, agent, or config directories are installed; these references do not establish Copilot/Claude use or load automatically as Codex rules. Other harness scopes are unchanged.

Codex reads root/nested `AGENTS.md` instructions and `.agents/skills/` natively. The optional comment-only `.codex/config.toml` preserves inherited defaults and is loaded only after explicit user trust; it does not grant trust or activate MCP servers. Codex MCP uses native `[mcp_servers.name]` TOML, not `.mcp.json`.

For npm setup, ask Codex to read and follow `.nitm/BOOTSTRAP.md`. For manual copies without `.nitm/`, provide `.claude/prompt-snippets/bootstrap.md` as a task document (copy the shared snippets too). For AI-guided updates, provide `.claude/prompt-snippets/bootstrap-patch.md`. Toolkit slash commands and other tools' custom-agent formats are not native Codex commands or agent definitions. Bootstrap must identify the actual running harness or ask, not infer it from scaffolded directories.

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
