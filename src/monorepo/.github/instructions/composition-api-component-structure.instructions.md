---
applyTo: "**/*"
description: "Component structure patterns and naming conventions for the {{PROJECT_NAME}} monorepo."
---

# Component Structure

Follow the rules defined in [.claude/rules-snippets/composition-api-component-structure.md](../../.claude/rules-snippets/composition-api-component-structure.md).

Key points:
- Follow the {{COMPONENT_PATTERN}} pattern for all components with clear, descriptive naming for props, events, and methods.
- Keep logic within components focused and manageable; add code comments for complex or non-obvious implementations.
- Use bracketed identifiers for logs: `[ComponentName]: message`.
- Share reusable components via `{{PACKAGES_DIR}}/` when used across multiple apps.
