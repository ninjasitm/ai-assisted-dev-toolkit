# {{PROJECT_NAME}}

@AGENTS.md

## Commands

- Install: `{{INSTALL_COMMAND}}`
- Dev: `{{DEV_COMMAND}}`
- Build: `{{BUILD_COMMAND}}`
- Test: `{{TEST_COMMAND}}`
- Lint: `{{LINT_COMMAND}}`

## Stack

- {{LANGUAGE}} with {{FRAMEWORK}}
- Database: {{DATABASE}}
- Testing: {{TEST_FRAMEWORK}}
- Build system: {{BUILD_SYSTEM}}
- Package manager: {{PACKAGE_MANAGER}}

## Apps

- `{{APP_DIR}}/{{APP_NAME_1}}` — {{APP_1_DESCRIPTION}} ({{APP_1_FRAMEWORK}}, port {{APP_1_DEV_PORT}})
- `{{APP_DIR}}/{{APP_NAME_2}}` — {{APP_2_DESCRIPTION}} ({{APP_2_FRAMEWORK}}, port {{APP_2_DEV_PORT}})

## Packages

- `{{PACKAGES_DIR}}/{{PACKAGE_NAME_1}}` — {{PACKAGE_1_DESCRIPTION}}
- `{{PACKAGES_DIR}}/{{PACKAGE_NAME_2}}` — {{PACKAGE_2_DESCRIPTION}}

## Claude Code

- Rules are in `.claude/rules/` — they load automatically each session.
- Detailed standards are in `.github/instructions/`.
- Agent definitions are in `.github/agents/` (shared with Copilot).
- Custom commands are in `.claude/commands/`.
- Skills are in `.claude/skills/` and `.agents/skills/`.
- See `AGENTS.md` for full project context, orchestration checkpoint, and agent hierarchy.
- See `.github/instructions/` for detailed standards (coding, testing, deployment, logging, etc.).
- For cross-app changes, always use orchestrator-first flow with the Feature Builder coordinator.

## GitHub Copilot

- Instructions are in `.github/instructions/` — they power completions and chat.
- Agents are in `.github/agents/`.
- Prompts are in `.github/prompts/`.
- MCP config is in `.vscode/mcp.json`.

## Cursor IDE

- Rules are in `.cursor/rules/` (.mdc format).
- Agents are in `.cursor/agents/`.
- Commands are in `.cursor/commands/`.
- MCP config is in `.cursor/mcp.json`.

## OpenCode

- Config is in `.opencode/opencode.jsonc`.
- Commands are in `.opencode/commands/`.
- Rules are in `.opencode/rules/`.
- Agents are in `.opencode/agents/`.
- Instructions are loaded from `AGENTS.md`, `.github/instructions/`, and `.claude/rules/`.
- Skills are loaded from `.agents/skills/` and `.claude/skills/`.
