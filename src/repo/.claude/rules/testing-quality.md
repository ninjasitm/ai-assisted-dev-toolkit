---
applyTo:
  - "**/*.{test,spec}.*"
  - "tests/**"
  - "__tests__/**"
description: "Testing standards and quality gates."
---

# Testing & Quality

Follow the rules defined in [.claude/rules-snippets/testing.md](../rules-snippets/testing.md).

Key points:
- Ensure lint, test, and build pass before committing.
- Use {{TEST_FRAMEWORK}} for unit/component tests and {{E2E_FRAMEWORK}} for E2E tests.
- Aim for meaningful test coverage of business logic.
