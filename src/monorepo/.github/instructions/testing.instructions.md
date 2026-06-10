---
applyTo: "**/*"
description: "Testing strategy and conventions for the {{PROJECT_NAME}} monorepo."
---

# Testing Standards

Follow the rules defined in [.claude/rules-snippets/testing.md](../../.claude/rules-snippets/testing.md).

Key points:
- **Commands**: `{{PACKAGE_MANAGER}} test` (all), `--filter={{APP_NAME_1}}` (specific app), `-- --watch` (watch mode).
- **Test locations**: Unit tests in `{{PACKAGES_DIR}}/**/` and `{{APP_DIR}}/**/`; integration in `{{INTEGRATION_TEST_DIR}}/`; E2E in `{{E2E_TEST_DIR}}/`.
- **Coverage**: Minimum {{COVERAGE_THRESHOLD}}; critical paths need integration or E2E coverage; new features require tests before merging.
- **Cross-package testing**: Shared packages need standalone unit tests; apps must test integration with shared packages.
