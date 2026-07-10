---
applyTo:
  - "**/*.{test,spec}.*"
  - "tests/**"
  - "__tests__/**"
description: "Testing standards, commands, and conventions."
---

# Testing Standards

Follow the rules defined in [.claude/rules-snippets/testing.md](../rules-snippets/testing.md).

Key points:
- Unit tests: `{{TEST_FILE_PATTERN}}`, integration tests: `{{INTEGRATION_TEST_PATTERN}}`, E2E tests: `{{E2E_TEST_PATTERN}}`.
- Minimum coverage: {{COVERAGE_THRESHOLD}}.
- New features require tests before merging.
