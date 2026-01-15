---
applyTo: "**/*"
description: "AI-Assisted Development Toolkit structure and purpose."
---

# Toolkit architecture

This is a **template repository** for AI development instructions.

## Purpose

- Provide reusable AI instruction templates for Cursor IDE and GitHub Copilot.
- Support both single repositories and monorepos.
- Use placeholder syntax `{{VAR}}` for project-specific customization.

## Structure

- `src/repo/` - Templates for single repository projects.
- `src/monorepo/` - Templates for monorepo projects.
- Root `.cursor/` and `.github/` - This toolkit's own configuration.

## Template types

- **AGENTS.md** - AI agent context files.
- **Cursor rules** - `.mdc` files for IDE behavior.
- **Cursor commands** - `.md` files for custom workflows.
- **GitHub prompts** - `.prompt.md` files for reusable prompts.
- **GitHub instructions** - `.instructions.md` files for context.
