---
applyTo: "**/*"
description: "Project-specific coding patterns and shared utilities for {{PROJECT_NAME}}."
---

# Patterns and Conventions

Follow the rules defined in [.claude/rules-snippets/patterns.md](../../.claude/rules-snippets/patterns.md).

Key points:
- State modules in `{{STATE_DIR}}` with {{STATE_MANAGEMENT}}; API services in `{{SERVICES_DIR}}`; shared utilities in `{{UTILS_DIR}}`.
- Components follow {{COMPONENT_PATTERN}} pattern; prefer extending existing utilities over creating duplicates.
- Follow SRP and reuse-first principle: review `{{COMPOSABLES_PATH}}`, `{{UTILS_PATH}}`, and `{{HELPERS_PATH}}` before implementing new functionality.
