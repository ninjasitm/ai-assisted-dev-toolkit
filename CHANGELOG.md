# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Feature specification template (`feature-spec.template.md`)
- Feature implementation plan template (`feature-plan.template.md`)
- Complex fix specification template (`complex-fix-spec.template.md`)
- Complex fix implementation plan template (`complex-fix-plan.template.md`)
- Architecture Decision Record template (`adr.template.md`)
- Documentation folders for architecture (`docs/architecture/`) and API (`docs/api/`)
- README files for skills directories (`.cursor/skills/`, `.github/skills/`)

### Changed

- Updated bundled skills count from 14 to 16 in README (added `logging` and `project-documentation`)
- Updated AGENTS.md structure diagram to include `.agents/` folder
- Cleaned AGENTS.md template to remove project-specific content
- Updated skill reference table in `src/repo/AGENTS.md` to list all 16 skills

### Fixed

- Removed project-specific Nuxt/Vue/Pinia code from AGENTS.md files
- Synchronized structure diagrams between README.md and AGENTS.md
- Added missing templates referenced in templates/README.md

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
