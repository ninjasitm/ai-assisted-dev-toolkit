---
applyTo: "**/*"
description: "Deprecated features and anti-patterns to avoid in the {{PROJECT_NAME}} monorepo."
---

# What to Avoid

Follow the rules defined in [.claude/rules-snippets/what-to-avoid.md](../../.claude/rules-snippets/what-to-avoid.md).

Key points:
- No deprecated {{FRAMEWORK}} features, global CSS outside {{STYLING}} configuration, or direct DOM manipulation.
- No custom solutions for problems solved by core libraries.
- No mixing server and client code inappropriately; use consistent naming for events and handlers.
- No duplicating logic across apps — extract to shared packages in `{{PACKAGES_DIR}}/`.
