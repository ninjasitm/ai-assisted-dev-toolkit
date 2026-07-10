---
paths:
  - "src/components/**"
  - "apps/**/components/**"
  - "packages/**/components/**"
  - "**/*.{vue,tsx,jsx}"
description: "Component structure and composition patterns."
---

# Component Structure

Follow the rules defined in [.claude/rules-snippets/component-structure.md](../rules-snippets/component-structure.md).

Key points:
- Follow the {{COMPONENT_PATTERN}} pattern for all components.
- Use clear and descriptive naming for props, events, and methods.
- Add code comments for complex logic or non-obvious implementations.
- Use bracketed identifiers for logs: `[ComponentName]: message`.
