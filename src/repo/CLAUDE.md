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

- Detailed rules are in `.claude/rules/` — they load automatically each session.
- Subagent definitions are in `.claude/agents/`.
- Custom commands are in `.claude/commands/`.
- Skills are in `.claude/skills/` and `.agents/skills/`.
- See `AGENTS.md` for full project context, orchestration checkpoint, and agent hierarchy.
- See `.github/instructions/` for detailed standards (coding, testing, deployment, logging, etc.).
