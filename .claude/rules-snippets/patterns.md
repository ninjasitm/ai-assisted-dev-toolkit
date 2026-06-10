# Template rules and conventions

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

## SRP and reuse-first principle

- **Before implementing new functionality, review existing patterns** in the codebase (composables, utils, helpers, services, hooks, etc.) for capabilities that already solve the problem.
- **Prefer extending existing utilities** over creating new ones or duplicating logic inline — a new solution is only warranted when the existing one genuinely cannot accommodate the use case.
- **Never duplicate state or behavior** that an existing utility already manages (e.g., loading flags, error state, async wrappers). Inline duplication violates SRP and makes behavior inconsistent across the codebase.
- When in doubt, extend the existing pattern and keep consumers (components, controllers, handlers) thin.
- Templates should reinforce this principle by including placeholders like `{{COMPOSABLES_PATH}}`, `{{UTILS_PATH}}`, or `{{HELPERS_PATH}}` so adopters document where reusable patterns live in their project.
