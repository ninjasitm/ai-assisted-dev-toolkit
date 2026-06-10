---
applyTo: "**/*"
description: "Developer workflows and environment settings for {{PROJECT_NAME}}."
---

# Workflows

Follow the rules defined in [.claude/rules-snippets/workflows.md](../../.claude/rules-snippets/workflows.md).

Key points:
- Dev server: `{{PACKAGE_MANAGER}} run dev` (port {{DEV_PORT}}); build: `{{PACKAGE_MANAGER}} run build`; type check: `{{PACKAGE_MANAGER}} run type-check`.
- Unit tests: `{{PACKAGE_MANAGER}} run test`; coverage: `{{PACKAGE_MANAGER}} run test:coverage`; E2E: `{{PACKAGE_MANAGER}} run test:e2e`.
- Lint: `{{PACKAGE_MANAGER}} run lint`; format: `{{PACKAGE_MANAGER}} run format`.
