---
paths:
  - "**/*.{test,spec}.*"
  - "tests/**"
  - "__tests__/**"
  - "apps/**/tests/**"
  - "packages/**/tests/**"
description: "Testing standards and quality assurance."
---

# Testing Quality

Follow the rules defined in [.claude/rules-snippets/testing-quality.md](../rules-snippets/testing-quality.md).

Key points:
- Ensure lint, test, and build pass before committing.
- Use {{TEST_FRAMEWORK}} for unit/component tests and {{E2E_FRAMEWORK}} for end-to-end tests.
- Place tests alongside implementation files or in `tests/` directory.
- Aim for meaningful test coverage of business logic.
