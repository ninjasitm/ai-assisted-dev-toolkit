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
- Package manager: {{PACKAGE_MANAGER}}

## Claude Code

- Rules are in `.claude/rules/` — they load automatically each session.
- Detailed standards are in `.github/instructions/`.
- Agent definitions are in `.github/agents/` (shared with Copilot).
- Custom commands are in `.claude/commands/`.
- Skills are in `.agents/skills/`.
- See `AGENTS.md` for full project context, orchestration checkpoint, and agent hierarchy.
- See `.github/instructions/` for detailed standards (coding, testing, deployment, logging, etc.).

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

- Config is in `.opencode/opencode.json`.
- Commands are in `.opencode/commands/`.
- Rules are in `.opencode/rules/`.
- Agents are in `.opencode/agents/`.
- Instructions are loaded from `AGENTS.md`, `.github/instructions/`, and `.claude/rules/`.
- Skills are loaded from `.agents/skills/` and `.claude/skills/`.
