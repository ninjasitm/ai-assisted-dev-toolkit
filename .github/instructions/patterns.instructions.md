---
applyTo: "**/*"
description: "Template editing patterns and placeholder conventions."
---

# Template patterns and conventions

## Placeholder syntax

- Use `{{PLACEHOLDER_NAME}}` for all customizable values.
- Placeholder names should be SCREAMING_SNAKE_CASE.
- Document all placeholders in the template's README or header comments.

## Template organization

- `src/repo/` contains single repository templates.
- `src/monorepo/` contains monorepo templates.
- Each template folder mirrors a real project structure.

## File naming

- `.mdc` files are Cursor rules.
- `.md` files are commands or documentation.
- `.prompt.md` files are GitHub Copilot prompts.
- `.instructions.md` files are GitHub Copilot instructions.

## Content guidelines

- Keep templates generic and framework-agnostic where possible.
- Use conditional sections with comments for optional features.
- Provide examples that are easy to customize.
