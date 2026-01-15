# Copilot Instructions — AI-Assisted Development Toolkit

## Project overview

- This is a **template repository** containing AI instruction templates for other projects.
- Templates live in `src/repo/` (single repos) and `src/monorepo/` (monorepos).
- All templates use `{{PLACEHOLDER}}` syntax for project-specific values.

## Key principles

- **Preserve placeholders**: When editing templates, keep `{{VAR}}` syntax intact.
- **Stay generic**: Templates should work for any project type within their category.
- **Document changes**: Update README.md when adding new placeholders or files.

## Directory structure

- `src/repo/` - Templates for single repository projects
- `src/monorepo/` - Templates for monorepo projects
- `.cursor/` - This toolkit's own Cursor configuration (not a template)
- `.github/` - This toolkit's own GitHub configuration (not a template)

## Template file types

- `.mdc` - Cursor rule files
- `.md` - Commands and prompts
- `.prompt.md` - GitHub Copilot reusable prompts
- `.instructions.md` - GitHub Copilot context instructions

## Workflows

- Dev: Review and edit template files
- Test: Copy templates to a test project and replace placeholders
- Document: Update placeholder reference in README.md

## Other instruction sources

- [AGENTS.md](AGENTS.md) - Repository context
- [README.md](README.md) - Usage documentation
