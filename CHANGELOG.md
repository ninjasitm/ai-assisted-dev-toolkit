# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Custom agent templates (`.agent.md`) for subagent orchestration workflows
- Feature Builder coordinator agent for end-to-end feature development
- TDD coordinator agent with Red-Green-Refactor cycle
- Worker agents: Planner, Implementer, Reviewer, Researcher, Red, Green, Refactor
- Agent templates in both `.github/agents/` and `.cursor/agents/` for VS Code and Cursor support
- Docs app sync requirements and per-app documentation obligations in monorepo documentation instructions
- Pre-commit documentation gate checklist for monorepo template
- Feature specification template (`feature-spec.template.md`)
- Feature implementation plan template (`feature-plan.template.md`)
- Complex fix specification template (`complex-fix-spec.template.md`)
- Complex fix implementation plan template (`complex-fix-plan.template.md`)
- Architecture Decision Record template (`adr.template.md`)
- Documentation folders for architecture (`docs/architecture/`) and API (`docs/api/`)
- README files for skills directories (`.cursor/skills/`, `.github/skills/`)
- Ponytail skill bundle — 6 YAGNI/stdlib/native/minimum-discipline skills (`ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `ponytail-review`)
- Ponytail OpenCode plugin (`.opencode/plugins/ponytail.mjs`) loaded via the `plugin` config key
- 7 ponytail hooks in `hooks/` (`ponytail-activate`, `ponytail-config`, `ponytail-instructions`, `ponytail-mode-tracker`, `ponytail-runtime`, `ponytail-statusline.sh`, `ponytail-statusline.ps1`), plus 2 hook configuration files for Claude/Codex and Copilot (`claude-codex-hooks.json`, `copilot-hooks.json`)
- Ponytail rule in `.agents/rules/` and `.cursor/rules/` for ambient agent context
- 6 ponytail commands (`ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `ponytail-review`) with thin-wrapper sources in `.claude/prompt-snippets/`
- `check-parity.sh` extended with a Ponytail Parity block
- `orient-to-recent-work` skill — auto-loaded at session start, orients agents to recent activity (CHANGELOG Unreleased, recent commits) before any non-trivial task

### Changed

- Updated AGENTS.md templates with Custom Agents (Subagents) section
- Updated copilot-instructions.md templates with agent references
- Updated root README.md with comprehensive subagents documentation
- Updated repository structure diagrams to include `agents/` directories
- Updated monorepo `documentation.instructions.md` with docs app (`apps/{{DOCS_APP}}`) sync guidance, per-app documentation obligations table, and content organization patterns
- Updated bundled skills count from 14 to 16 in README (added `logging` and `project-documentation`)
- Updated AGENTS.md structure diagram to include `.agents/` folder
- Cleaned AGENTS.md template to remove project-specific content
- Updated skill reference table in `src/repo/AGENTS.md` to list all 16 skills

### Fixed

- Removed project-specific Nuxt/Vue/Pinia code from AGENTS.md files
- Synchronized structure diagrams between README.md and AGENTS.md
- Added missing templates referenced in templates/README.md
- `scripts/pre-commit-check.sh` — early-exit when no files are staged so the CHANGELOG check no longer fires on empty commits (PR #20 review)
- `scripts/check-parity.sh` — removed duplicate `check_body_match` call for the cursor ↔ github prompt body (PR #20 review)
- `.opencode/plugins/ponytail.mjs` — wrapped `writeMode` in a try/catch so an unwritable state directory no longer crashes the plugin (PR #20 review)
- `ponytail-help` SKILL.md and prompt snippet — added missing `ponytail-audit`, `ponytail-debt`, and `/ponytail-gain` entries; corrected OpenCode slash-command count to six; rewrote the Claude-Code-specific Update section to describe the template update flow (PR #20 review)
- `ponytail-gain` SKILL.md and prompt snippet (repo, monorepo, root) — replaced the phantom `benchmarks/` source reference with the upstream `DietrichGebert/ponytail` repo link (PR #20 review)
- `README.md` — corrected "8 activation hooks" to "7 activation hooks" to match CHANGELOG and the actual hook count (PR #20 review)
- Root `AGENTS.md` — corrected skill count from 16 to 32 and completed the bundled skills table
- `src/repo/AGENTS.md` and `src/monorepo/AGENTS.md` — completed skill tables with all 32 bundled skills
- `src/repo/CLAUDE.md` — fixed `command/` → `commands/` typo and added missing OpenCode rules/agents references
- Root `AGENTS.md` — fixed `command/` → `commands/` typo in directory structure diagram
- `src/monorepo/templates/monthly-fix-log.template.md` — replaced Vue-specific `Component.vue` with generic file paths
- Template READMEs and docs — replaced project-specific `LEB-123`/`LEB-456` with generic `ISSUE-123`/`ISSUE-456`
- Renamed `composition-api-component-structure` rule to `component-structure` across repo and monorepo templates

## [0.1.0] - 2026-01-26

### Added

- Initial release of AI-Assisted Development Toolkit
- Single repository templates (`src/repo/`)
- Monorepo templates (`src/monorepo/`)
- 16 bundled universal skills in `.agents/skills/`
- 13 Cursor IDE rules (`.cursor/rules/`)
- 14 Cursor commands (`.cursor/commands/`)
- 13 GitHub Copilot prompts (`.github/prompts/`)
- 4 GitHub Copilot instructions (`.github/instructions/`)
- Bootstrap command for automatic project configuration
- Support for multiple language ecosystems:
  - JavaScript/TypeScript
  - PHP
  - .NET (C#/F#)
  - Python
  - Ruby
  - Go
  - Rust
  - Java/Kotlin
- Documentation structure templates (`docs/features/`, `docs/fixes/`)
- Monthly fix log template

[Unreleased]: https://github.com/ninjasitm/ai-assisted-dev-toolkit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ninjasitm/ai-assisted-dev-toolkit/releases/tag/v0.1.0
