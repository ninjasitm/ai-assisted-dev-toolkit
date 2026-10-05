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

Individual templates and skills may use additional placeholders; those are documented in the template's own header or README.

## Tech Stack

- **Framework:** {{FRAMEWORK}}
- **Language:** {{LANGUAGE}}
- **Styling:** {{STYLING}}
- **Package Manager:** {{PACKAGE_MANAGER}}

## Template Placeholders

The following placeholders must be replaced when customizing this template:

| Placeholder             | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| {{PROJECT_NAME}}        | Project name (kebab-case).                                 |
| {{PROJECT_DESCRIPTION}} | Short description of the project.                          |
| {{FRAMEWORK}}           | Primary framework (with version if applicable).            |
| {{LANGUAGE}}            | Primary programming language (with version if applicable). |
| {{STYLING}}             | Styling solution (e.g., Tailwind, CSS Modules).            |
| {{PACKAGE_MANAGER}}     | Package manager (npm, pnpm, yarn, bun).                    |
| {{NODE_VERSION}}        | Required Node.js version.                                  |
| {{REPO_URL}}            | Repository URL.                                            |
| {{DEV_PORT}}            | Development server port.                                   |
| {{SRC_STRUCTURE}}       | High-level source folder structure.                        |
| {{LICENSE_TYPE}}        | License identifier (e.g., MIT, Apache-2.0).                |
| {{SRC_DIR}}             | Source directory (e.g., src, app, lib).                    |
| {{TEST_DIR}}            | Test directory (e.g., tests, test, spec).                  |
| {{FILE_EXTENSION}}      | Primary file extension (e.g., ts, js, tsx).                |
| {{DEFAULT_BRANCH}}      | Default git branch (e.g., main, master).                   |

## Getting Started

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

# Start development server
{{PACKAGE_MANAGER}} run dev
```

The development server will start at `http://localhost:{{DEV_PORT}}`.

## Project Structure

```
{{PROJECT_NAME}}/
├── src/
│   ├── {{SRC_STRUCTURE}}
├── tests/
├── docs/
├── .cursor/           # Cursor IDE configuration
├── .github/           # GitHub configuration
└── package.json
```

## Scripts

| Command                         | Description              |
| ------------------------------- | ------------------------ |
| `{{PACKAGE_MANAGER}} run dev`   | Start development server |
| `{{PACKAGE_MANAGER}} run build` | Build for production     |
| `{{PACKAGE_MANAGER}} run test`  | Run tests                |
| `{{PACKAGE_MANAGER}} run lint`  | Run linter               |

## Development

See the following files for AI-assisted development:

- [AGENTS.md](AGENTS.md) - AI agent context
- [.cursor/rules/](.cursor/rules/) - Cursor IDE rules
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - GitHub Copilot instructions

## AI Instructions and Commands

### Native OpenCode V2

Toolkit v4 requires **OpenCode V2 (major >=2)** for OpenCode use; oh-my-opencode-slim >=3.0.0 requires OpenCode >=2.0.7. Bootstrap, patch, and upgrade run `opencode --version` before changes (optional leading `v` accepted). V1 must stop before OpenCode customization/migration or marking toolkit 4.0.0: upgrade OpenCode or remain on toolkit 3.x. A missing CLI or unparseable version stops OpenCode steps and version marking until confirmed/installed. Confirm harness use from runtime evidence or ask, not scaffold directories; other-harness-only setup is unaffected.

The template's local `plugins` array registers the author's native V2 package `@dietrichgebert/ponytail@4.12.0`, alongside `opencode-mem` and `@tarquinen/opencode-dcp@latest`; `opentmux` remains commented as V1-only. The obsolete local Ponytail plugin is no longer bundled; no local API port or bridge is used. For existing projects, back up and obtain approval before removing only known toolkit `.opencode/plugins/ponytail.js`, `.mjs`, or `.ts` copies; preserve unrelated local plugins and merge/deduplicate upstream registration locally without editing global plugins. Native local plugins are discovered automatically; do not register them twice.

With approval, merge `"plugins": ["oh-my-opencode-slim@3.0.0"]` locally without replacing other registrations. Slim's separate strict schema retains `prompt`, `permission`, and `variant`; do not host-migrate it. The external starter is a separate package, not automatically upgraded. Plugin/runtime integration has not been tested.

Use native `agents`/`system`, `request.body.temperature`, ordered `permissions` (`action`/`resource`/`effect`, `shell`/`subagent`), `commands`/`subagent`, `plugins` with `{ "package": "…", "options": {} }`, skill-directory arrays, and `mcp.servers` with inverse `disabled` and `timeout.catalog`/`timeout.execution`. Follow the [V2 migration guide](https://opencode.ai/v2/docs/migrate-v1) and [plugin guide](https://opencode.ai/v2/docs/build/plugins); the published schema may describe V1 and is not V2 validation authority.

Ambient `AGENTS.md` works; config `instructions` entries are not loaded. `@refs` are ordinary text: read linked snippets explicitly. `request.body.temperature` remains in config, but the current runner does not send it. Preserve `lsp: true`; use project lint/typecheck/compiler commands (no V2 LSP tools/diagnostics currently).

`--env opencode` supplies minimal shared references without activating other harnesses. Back up V1, merge rather than clobber models/providers/plugins, and activate on the next run/restart. Native-converted files are incompatible with V1. Verify with installed V2; `doctor` is not runtime validation. Toolkit 4.0.0 publishing has not been executed.

### Native Codex

`--env codex` includes `.codex/`, `.agents/`, and shared context, plus `.github/instructions/` and `.claude/rules-snippets/` solely to supply AGENTS-linked standards and their wrapper source content. No other harness command, agent, or config directories are installed; these references do not establish Copilot/Claude use or load automatically as Codex rules. Other harness scopes are unchanged.

Codex reads `AGENTS.md` and `.agents/skills/` natively. The optional comment-only `.codex/config.toml` preserves inherited defaults and is loaded only after explicit user trust; it does not grant trust or activate MCP servers. Codex MCP uses native `[mcp_servers.name]` TOML, not `.mcp.json`.

For npm setup, ask Codex to read and follow `.nitm/BOOTSTRAP.md`. For manual copies without `.nitm/`, provide `.claude/prompt-snippets/bootstrap.md` as a task document (copy the shared snippets too). For AI-guided updates, provide `.claude/prompt-snippets/bootstrap-patch.md`. The slash commands below and tool-specific custom-agent formats are not native Codex commands or agent definitions. Bootstrap must identify the actual running harness or ask, not infer it from scaffolded directories.

This repository includes AI instruction files to standardize development workflows across tools. The `.cursor/` and `.github/` folders define how AI assistants should analyze, plan, implement, and review changes.

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
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

{{LICENSE_TYPE}}
