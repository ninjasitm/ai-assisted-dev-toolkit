---
applyTo: "**/*"
description: "Project-specific coding patterns and shared utilities for {{PROJECT_NAME}}."
---

# Patterns and conventions

## State management

- State modules live in `{{STATE_DIR}}`.
- Use {{STATE_MANAGEMENT}} for state management.
- {{STATE_PATTERN_DESCRIPTION}}

## API patterns

- API services live in `{{SERVICES_DIR}}`.
- {{API_PATTERN_DESCRIPTION}}

## Component patterns

- Components follow {{COMPONENT_PATTERN}} pattern.
- {{COMPONENT_PATTERN_DESCRIPTION}}

## Utilities

- Shared utilities live in `{{UTILS_DIR}}`.
- {{UTILITY_PATTERN_DESCRIPTION}}

## SRP and reuse-first principle

- **Before implementing new functionality, review existing patterns** in `{{COMPOSABLES_PATH}}`, `{{UTILS_PATH}}`, and `{{HELPERS_PATH}}` for capabilities that already solve the problem.
- **Prefer extending existing utilities** over creating new ones or duplicating logic inline — a new solution is only warranted when the existing one genuinely cannot accommodate the use case.
- **Never duplicate state or behavior** that an existing utility already manages (e.g., loading flags, error state, async wrappers). Inline duplication violates SRP and makes behavior inconsistent across the codebase.
- When in doubt, extend the existing pattern and keep consumers (components, controllers, handlers) thin.
