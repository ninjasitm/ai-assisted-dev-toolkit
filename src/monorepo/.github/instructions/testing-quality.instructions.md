---
applyTo: "**/*"
description: "Testing and quality assurance standards for the {{PROJECT_NAME}} monorepo."
---

# Testing & Quality

Follow the rules defined in [.claude/rules-snippets/testing-quality.md](../../.claude/rules-snippets/testing-quality.md).

Key points:
- Ensure lint, test, and build pass before committing.
- Use {{TEST_FRAMEWORK}} for unit/component tests and {{E2E_FRAMEWORK}} for end-to-end tests.
- Place tests alongside implementation files or in `tests/` directory.
- Aim for meaningful test coverage of business logic; shared packages need standalone unit tests.
- Run `{{PACKAGE_MANAGER}} test` for all apps or `--filter={{APP_NAME_1}}` for specific apps.
