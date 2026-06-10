---
applyTo: "**/*"
description: "Documentation standards for features and fixes"
---

# Documentation Guidelines

Follow the rules defined in [.claude/rules-snippets/documentation.md](../../.claude/rules-snippets/documentation.md).

Key points:
- Features require `docs/features/{{ISSUE_ID}}-FEATURE-NAME/` with `spec.md` and `plan.md`; fixes go in monthly logs (`docs/fixes/{YYYY-MM}.md`) or complex fix folders.
- Documentation is a mandatory pre-commit gate — write or update docs before committing code, include doc changes in the same commit/PR.
- Use [Keep a Changelog](https://keepachangelog.com/) format for changelogs and monthly fix logs; create ADRs for significant architectural decisions.
