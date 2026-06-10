---
applyTo: "**/*"
description: "Testing standards and conventions for {{PROJECT_NAME}}."
---

# Testing Standards

Follow the rules defined in [.claude/rules-snippets/testing.md](../../.claude/rules-snippets/testing.md).

Key points:
- Run tests with `{{TEST_COMMAND}}`, coverage with `{{TEST_COVERAGE_COMMAND}}`, and E2E with `{{E2E_TEST_COMMAND}}`.
- Unit tests: `{{TEST_FILE_PATTERN}}`, integration: `{{INTEGRATION_TEST_PATTERN}}`, E2E: `{{E2E_TEST_PATTERN}}`.
- Minimum coverage {{COVERAGE_THRESHOLD}}; critical paths need integration/E2E coverage; new features require tests before merging.
