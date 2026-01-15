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

## Logging

- Use bracketed tags for logs: `[ComponentName]: message`.
- Log levels: error, warn, info, debug.

## Utilities

- Shared utilities live in `{{UTILS_DIR}}`.
- {{UTILITY_PATTERN_DESCRIPTION}}
