# Project context rules

## Toolkit architecture

This is a **template repository** for AI development instructions.

## Purpose

- Provide reusable AI instruction templates for Cursor IDE, GitHub Copilot, and Claude Code.
- Support both single repositories and monorepos.
- Use placeholder syntax `{{VAR}}` for project-specific customization.

## Structure

- `src/repo/` - Templates for single repository projects.
- `src/monorepo/` - Templates for monorepo projects.
- Root `.cursor/` and `.github/` - This toolkit's own configuration.

## Template types

- **AGENTS.md** - AI agent context files.
- **CLAUDE.md** - Claude Code main instructions (also read by Copilot).
- **Cursor rules** - `.mdc` files for IDE behavior.
- **Cursor commands** - `.md` files for custom workflows.
- **GitHub prompts** - `.prompt.md` files for reusable prompts.
- **GitHub instructions** - `.instructions.md` files for context.
- **Claude rules** - Thin wrappers pointing to shared rule snippets.
- **Rule snippets** - Shared content in `.claude/rules-snippets/`.

## Cross-compatible architecture

This toolkit uses a layered architecture for cross-tool compatibility:

1. **Shared layer** (both Claude Code and Copilot read):
   - `CLAUDE.md` — Single main instructions file
   - `.claude/skills/` — Shared skill definitions
   - `.claude/prompt-snippets/` — Shared content fragments

2. **Copilot source of truth**:
   - `.github/instructions/` — Full detailed rules
   - `.github/agents/` — Full agent definitions
   - `.github/prompts/` — Reusable prompts

3. **Claude thin wrappers**:
   - `.claude/rules/` — Points to `.claude/rules-snippets/`
   - `.claude/agents/` — Points to shared prompt snippets

4. **Tool-specific**:
   - `.cursor/` — Cursor IDE (independent)
   - `.mcp.json` — Claude Code MCP config
   - `.vscode/mcp.json` — GitHub Copilot MCP config
