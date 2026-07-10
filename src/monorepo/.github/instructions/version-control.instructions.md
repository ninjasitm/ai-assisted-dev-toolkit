---
applyTo: "**/*"
description: "Version control conventions and commit message format for the {{PROJECT_NAME}} monorepo."
---

# Version Control

Follow the rules defined in [.claude/rules-snippets/version-control.md](../../.claude/rules-snippets/version-control.md).

Key points:
- Use conventional commit format: `<type>(<scope>): <description>` with types: feat, fix, docs, refactor, test, chore, style, perf.
- Include ticket reference when applicable: `feat(auth): add login flow [{{ISSUE_PREFIX}}-123]`.
- Follow the PR template for pull requests.
- Scope commits to affected apps/packages (e.g., `feat({{APP_NAME_1}}): add search` or `fix({{PACKAGE_SCOPE}}/utils): date format`).
