# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [5.1.1] - 2026-10-21

### Fixed

- Factory worktrees are created in `.worktrees/<id>/` at the repo root (the git root in a monorepo) instead of a sibling `../<repo>-factory/<id>/` folder outside the repo. The factory ensures `.worktrees/` is git-ignored.
- The `using-git-worktrees` skill uses only `.worktrees/` for project-local worktrees (the non-hidden `worktrees/` alternative is removed), expands `$HOME` in the global path, and commits the `.gitignore` change on the default branch. The Factory skill states that the worktree folder is named by the job id, not the branch, and that `factory/worktree-bootstrap.md` replaces the worktree skill's setup and baseline-test steps. The Factory README notes that tools ignoring `.gitignore` should exclude `.worktrees/`.

## [5.1.0] - 2026-10-21

### Changed

- Factory runs on the native `planner`, `implementer`, and `reviewer` agents instead of seven `factory-*` agents. Each role's Factory rules (outputs, evidence, verdict format, escalation triggers) moved into role briefs in `.agents/skills/factory/roles/`. Reviewers and the approver return their report, and the orchestrator saves it as `round-<N>/review-<lens>.md` or `decision.md`. The gates, verdicts, approval rules, and rework flow are unchanged.
- `doctor` lists the removed `factory-*` files as stale toolkit files (matched by path and content hash) and never deletes them. The OpenCode `factory-*` agents also match their 5.0.0 hashes, not only 5.0.1.
- Factory dispatch states that the role brief overrides the dispatched agent's default output format and file-writing rules, and the reply's first line follows the brief.
- The Claude `planner` agent gets `Glob` and `Bash(*)` (plan mode deletes a stale `tasks.md`); `implementer` and `reviewer` get `Glob`.

### Removed

- The seven `factory-*` agents (spec writer, builder, code, security, ux, and ui reviewers, approver) and their `.claude/agents-snippets/` prompts, from `.claude/agents/`, `.cursor/agents/`, `.github/agents/`, `.opencode/agents/`, and `.claude/agents-snippets/` in both templates.
- `request.body.temperature` from every OpenCode agent file, and the AGENTS.md guidance that set it. The current OpenCode runner does not send it.

### Migration

- Run `patch` in each installed project, then run `doctor`. It lists the old `factory-*` files as stale. Check each listed file, then delete it by hand. Doctor does not delete anything.

## [5.0.1] - 2026-10-21

### Added

- `patch --dry-run`, persisted `--exclude`/`--only` selections in `.nitm/toolkit.json`, version pinning for `upgrade <version>`/`--version`, and `.toolkit-version` plus `.nitm/manifest.json` state tracking. `doctor` now reports version mismatches, stale files without deleting them, and supports a placeholder allowlist.
- Added `test/opencode-wrappers.test.js` to verify explicit "Read and follow" instructions in OpenCode wrappers.
- Factory configuration now supports `{{FACTORY_FEATURE_PATHS}}` and `{{MERGE_MODE}}` (`local` or `push-mr`), per-workspace tests during monorepo merges, and `factory/worktree-bootstrap.md`.

### Changed

- `bootstrap-patch` resolves versions from `.toolkit-version`, tries `npm pack` with a no-`v` git-tag fallback, and gates supported OpenCode versions without a hard-coded major.
- OpenCode wrappers replace bare `@.claude/` imports with explicit "Read and follow" instructions. Config `instructions` loading is runtime-dependent; wrappers no longer rely on it.
- Legacy heading-style `tasks.md` assigns one ticket per heading without rewriting the file; task numbering starts at T1, and `implement-feature` ticks tasks only under the current heading.
- CLI supports `--dry-run`, persisted file selection, exact-version upgrades (refusing `latest`), conditional `BOOTSTRAP.md` rewrites with backups, and toolkit version/manifest tracking.
- The template no longer registers the Ponytail OpenCode plugin (`@dietrichgebert/ponytail`); the operator installs it globally. Bootstrap may check for it and tell the operator to install it globally, but never adds it to project config.
- `ponytail-review` permits `git diff`, `git status`, and `git show`. Document its Claude hooks as plugin-only.
- Backfilled 4.0.1 and 3.0.x release notes.

### Fixed

- Removed stale "publishing not executed" and "4.x" wording.

## [5.0.0]

### Breaking

- `/tasks` now writes a slim `tasks.md`: one checklist line per task (checkbox, ID, short description, optional `[P]`, optional ` — <ticket key>`). Details stay in `spec.md` and `plan.md`. `/assign-tasks` and `/implement-feature` read the slim lines and write ticket keys back after the em dash. Existing `tasks.md` files are not rewritten; re-run `/tasks` on a feature to convert one.
- `upgrade` no longer overwrites your files. It used to run `install --force`. It now adds missing files and keeps existing ones (`patch` semantics), then re-emits the bootstrap handoff. Overwriting needs an explicit `upgrade --force`, which prints a warning first. Scripts that relied on `upgrade` to refresh templates must add `--force`.

### Added

- Factory pipeline (opt-in): `/factory <request>` takes a feature through intake, spec gate, plan gate, build, parallel lens reviews, approval, and local merge, with subcommands `start`, `approve`, `rework`, `status`, and `watch`. Nothing runs until `/factory` is invoked. Job state lives in `factory/jobs/`, which is git-ignored. Entry points ship for Claude Code, GitHub Copilot, Cursor, and OpenCode; Codex uses the orchestrator skill `.agents/skills/factory/SKILL.md`.
- Factory gates and intake: intake reads `AGENTS.md`, related features in `docs/features/`, and the code it touches, asks at most five glaring questions, and saves the answers to `intake.md`. Every job stops at `awaiting-spec` and `awaiting-plan` in every approval mode, and nothing is ticketed or built before the operator confirms the plan. Change requests are saved as `spec-<k>.md` or `plan-<k>.md`.
- Factory feature folders and tracking: each job belongs to `docs/features/<KEY>-<slug>/` (or `docs/features/<slug>/` before a ticket exists). `job.json` records `feature_dir`, `issue_key`, `size`, `tracking`, and `worktree`. Large work with a documented tracker creates tickets through `/assign-tasks`, writes their keys onto `tasks.md`, and moves them through In Progress, In Review, and Done. Done only follows `/factory approve`.
- Factory builds run in a git worktree on `factory/<id>`. `--in-place` builds in the main checkout instead, and only from a clean default branch with no other in-place job open. The builder writes `qa.md` with suggested checks, printed before approval; it never gates anything.
- Factory agents: `factory-spec-writer`, `factory-builder`, `factory-reviewer-code`, `factory-reviewer-security`, `factory-reviewer-ux`, `factory-reviewer-ui`, and `factory-approver`, with shared snippets in `.claude/agents-snippets/`. Their OpenCode wrappers use native V2 `permissions`.
- `factory/` template folder (README, `_gitignore`) installed by default. CLI `factory status` (one-shot table) and `factory watch` (live view) are read-only over `factory/jobs/*/job.json`; `abandoned` jobs are shown as closed.
- Factory `/factory archive [--all] [--dry-run]` moves closed jobs (`merged` or `abandoned`) from `factory/jobs/` to `factory/archive/`. By default only jobs last updated more than 7 days ago move. `--all` moves every closed job, and open jobs never move. CLI `factory archive` makes the same moves. `/factory archive` also asks before deleting an archived abandoned job's branch and worktree, and never pushes. Archived jobs are not resumable (`/factory start` says they are closed), and their ids count toward job numbering until a prune removes them.
- Factory `/factory prune [--all] [--abandoned] [--dry-run]` permanently deletes closed jobs from `factory/jobs/` and `factory/archive/`. By default only `merged` jobs are deleted, and only those last updated more than 7 days ago. `--all` drops the age limit for merged jobs. `--abandoned` also deletes `abandoned` jobs under the same age rule. Without it, abandoned jobs are kept and counted, and the flow offers to rerun with `--abandoned`. It lists the candidates, asks once in chat, and deletes only after a yes. When abandoned jobs are pruned, it then asks, per abandoned branch, whether to delete the branch and its worktree, as archive does. Open jobs and `docs/features/` are never touched. `/factory archive` keeps its selection: merged and abandoned. CLI `factory prune` lists by default and deletes with `--yes`; `--abandoned` is accepted only by `factory prune`.
- Link checks in `test/links.test.js`: every relative markdown link and `@path` import in `src/repo` and `src/monorepo` must resolve, and so must every scoped install (each `--env` × layout).

### Changed

- Factory dashboard: `factory status` and `factory watch` hide closed jobs by default and print `N closed jobs hidden (--all to show)`. `--all` shows closed jobs and archived ones.
- Scoped installs (`--env`) also copy `.agents/skills/`, `.claude/agents-snippets/`, `.claude/prompt-snippets/`, `.claude/rules-snippets/`, and `factory/`, the shared references every harness's wrappers use.
- Templates named `_gitignore` install as `.gitignore`, because npm drops `.gitignore` files from packages.
- Releases publish through npm trusted publishing (OIDC, with provenance) from `.github/workflows/publish.yml`, which now also does the auto patch bump and tag (`auto-patch-tag.yml` removed). The `NPM_TOKEN` secret is no longer used.

### Fixed

- Scoped Cursor, Copilot, and OpenCode installs no longer leave dangling links: `.claude/rules-snippets/` is now shared by every scope, since Cursor rules link there.
- Scoped installs share only `.agents/skills/`, so Claude/Codex ambient rules in `.agents/rules/` no longer appear in Cursor, Copilot, or OpenCode installs.
- `doctor` placeholder scan matches names with digits (for example `{{DB2_HOST}}`), skips `templates/` blank forms, and ignores runtime-only placeholders (`ISSUE_ID`, `ISSUE_KEY`, `FEATURE_NAME`, `NAME`), so a bootstrapped project can report clean.
- `.cursor/rules/orient-to-recent-work.mdc` skill link now resolves (`../` → `../../`).

## [4.0.1] - 2026-10-20

### Changed

- Updated the package version for the patch release.

## [4.0.0]

### Migration

- Toolkit v4 / package 4.0.0 requires native OpenCode V2 for OpenCode use; oh-my-opencode-slim >=3.0.0 requires OpenCode >=2.0.7. Native host config uses plural maps, ordered permissions, skill directories, and `mcp.servers`. Back up V1 (converted files are incompatible with it), preserve user/global settings and Slim's separate strict schema, leave the external starter unchanged, and activate on the next run/restart. Config `instructions` are ignored, ambient `AGENTS.md` works, `@refs` require explicit reads, and `request.body.temperature` is preserved but not currently sent by the runner. Preserve `lsp: true`; use project checks, not unavailable V2 LSP tools. Plugin/runtime integration is untested; publishing has not been executed.
- Removed all three local Ponytail plugin copies (root, repo template, monorepo template). Both templates register the author's native V2 `@dietrichgebert/ponytail@4.12.0` package locally; `opentmux` remains commented as V1-only. No API port or bridge was added. The toolkit root alone omits `plugins` to inherit existing user/global registrations; no global config was changed. Existing targets remove only known obsolete toolkit Ponytail `.js`/`.mjs`/`.ts` copies after backup and approval, preserving unrelated plugins and deduplicating upstream registration locally.

### Fixed

- All six repo/monorepo bootstrap flows now require a fail-closed `opencode --version` preflight before changes for confirmed OpenCode use: accept an optional leading `v`, reject V1 before OpenCode customization/migration or toolkit 4.0.0 marking, and stop on a missing CLI or unparseable version. Slim >=3.0.0 enforces OpenCode >=2.0.7; other-harness-only setup is unaffected. Focused instruction-order/version-metadata regression checks cover the guard.
- Bootstrap audit/creation examples are explicitly conditional on confirmed Copilot use; completion reports describe performed harness-specific checks without assuming OpenCode configuration, Codex trust/loading, or Copilot/Cursor readiness. Codex-scoped install documentation now includes linked standards and their wrapper sources without implying other harness activation.

### Added

- Native Codex support for repo and monorepo templates: shared `AGENTS.md` and `.agents/skills/`, plus optional comment-only `.codex/config.toml` preserving inherited defaults and requiring explicit user trust
- Codex setup documentation and native bootstrap/patch guidance, including `.nitm/BOOTSTRAP.md` handoff, manual snippet fallback, and native MCP TOML configuration
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
- `bkt-cli` skill — Bitbucket CLI (`bkt`) command reference for repo and monorepo templates
- `glab-cli` skill — GitLab CLI (`glab`) command reference for repo and monorepo templates
- Ponytail skill bundle — 6 YAGNI/stdlib/native/minimum-discipline skills (`ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `ponytail-review`)
- Author's upstream Ponytail OpenCode plugin registration (`@dietrichgebert/ponytail@4.12.0`) in both template configs; no bundled local plugin source
- 7 ponytail hooks in `hooks/` (`ponytail-activate`, `ponytail-config`, `ponytail-instructions`, `ponytail-mode-tracker`, `ponytail-runtime`, `ponytail-statusline.sh`, `ponytail-statusline.ps1`), plus 2 hook configuration files for Claude/Codex and Copilot (`claude-codex-hooks.json`, `copilot-hooks.json`)
- Ponytail rule in `.agents/rules/` and `.cursor/rules/` for ambient agent context
- 6 ponytail commands (`ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `ponytail-review`) with thin-wrapper sources in `.claude/prompt-snippets/`
- `check-parity.sh` extended with a Ponytail Parity block
- `orient-to-recent-work` skill — auto-loaded at session start, orients agents to recent activity (CHANGELOG Unreleased, recent commits) before any non-trivial task
- npm package (`nitm-ai-dev-toolkit`) with a zero-dependency CLI: `install`, `patch`, `upgrade`, `doctor`, `omo-slim-starter install`
- CLI scaffolds AI agent config (Cursor, GitHub Copilot, Claude Code, OpenCode) into a target repo, then hands off to an AI agent to run the bootstrap flow
- `doctor` command inspects installs: missing files and unresolved `{{PLACEHOLDER}}` values
- GitHub Actions workflow (`.github/workflows/publish.yml`) publishing the package to npm on tagged versions (`v*`)
- CLI test suite (`test/cli.test.js`) using the built-in `node:test` runner (zero dependencies), covering project-type detection, environment scoping, install conflict handling, `doctor` checks, placeholder scanning, and bootstrap handoff; run via `npm test` and in CI (`.github/workflows/test.yml`)

### Changed

- CLI default-install documentation and package metadata now include Codex; bootstrap uses actual runtime harness evidence or asks rather than inferring use from scaffolded directories
- Bootstrap skill commands use confirmed harness flags without hardcoded Copilot/Cursor overrides
- `install` now aborts if target files already exist (instead of silently skipping) and tells the user to pass `--force` to overwrite or run `patch` to add only missing files
- `patch` is documented as add-missing-only (never overwrites existing customizations) and re-emits the bootstrap handoff
- `omo-slim-starter install` now delegates to the published `npx nitm-opencode-starter install` (guides the user if unavailable) instead of cloning the repo and wiring scripts
- Bootstrap prompts (`bootstrap.md`) now state a "merge, don't clobber" principle so existing customized configs are preserved

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
- CLI `install` scaffolds all harnesses by default; `--env` is now optional (the `/bootstrap` command auto-detects the user's environment, so no per-harness runs are needed)
- `publish.yml` now runs the test suite before publishing (the `publish` job `needs: test`)

### Fixed

- Removed project-specific Nuxt/Vue/Pinia code from AGENTS.md files
- Synchronized structure diagrams between README.md and AGENTS.md
- Added missing templates referenced in templates/README.md
- `scripts/pre-commit-check.sh` — early-exit when no files are staged so the CHANGELOG check no longer fires on empty commits (PR #20 review)
- `scripts/check-parity.sh` — removed duplicate `check_body_match` call for the cursor ↔ github prompt body (PR #20 review)
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
- Comprehensive template review fixes: corrected `CLAUDE.md` `@import` paths (`prompt-snippets` → `rules-snippets`); fixed broken `../.agents/` skill links in `src/repo/AGENTS.md` and `src/monorepo/AGENTS.md`; updated README bundled-skills count to 32 and added `bkt-cli`/`glab-cli` rows; synced truncated monorepo rules-snippets (`agent-conduct`, `subagent-workflow`, `coding-standards`, `core-libraries`) to repo; converted inlined Cursor commands (`review-pr`, `review`, `commit-push`) to thin wrappers; aligned monorepo agent `tools:` names to Claude Code standard; fixed root `.opencode/commands` snippet imports; added missing `testing.md` rule and `component-structure.md` snippet; removed remaining `composition-api-component-structure` stale files
- Agent tool permissions corrected across repo and monorepo templates: Planner gained write + terminal (Copilot `edit`/`runInTerminal`/`terminalLastCommand`, OpenCode `edit: allow, bash: allow`, Claude `Bash(*)`); Documenter gained `Edit` + `Bash(*)` and OpenCode `edit: allow, bash: allow`; Researcher (Claude) lost `Write` (read-only); Reviewer (Claude) lost `Write` and OpenCode gained `bash: allow` (read + terminal). Added Agent Tool & Permission Calibration step to both `bootstrap.md` files

## [3.0.x]

3.0.0 is not on npm; use git tag `3.0.0` (`git clone --depth 1 --branch 3.0.0 …`) or npm 3.0.15+ as a merge base.

### Added

- **3.0.0 (2026-06-09):** Shared Claude/Copilot instructions, prompt snippets, and expanded agent workflows.
- **3.0.2 (2026-06-10):** `gh-cli` skill with PR review-thread resolution.
- **3.0.7 (2026-06-22):** Ponytail skill bundle, template parity improvements, documentation pre-commit check, and `orient-to-recent-work` skill.
- **3.0.13 (2026-07-10):** `bkt-cli` and `glab-cli` skills.
- **3.0.15 (2026-07-11):** npm package and zero-dependency CLI for install, patch, upgrade, doctor, and starter setup; CLI tests and CI.
- **3.0.23 (2026-09-30):** Codex added to default bootstrap.

### Changed

- **3.0.1–3.0.6 (2026-06-09–2026-06-12):** Aligned shared prompts/rules and command wrappers; improved OpenCode bootstrap validation, argument hints, placeholder conventions, template consistency, and agent guidance.
- **3.0.8–3.0.14 (2026-07-06–2026-07-10):** Refined OpenCode/Cursor commands and agent templates; corrected CLI skill guidance, references, and cross-tool template consistency.
- **3.0.18 (2026-07-11):** Allowed manual npm publishing through workflow dispatch.
- **3.0.19–3.0.23 (2026-07-13–2026-09-30):** Improved release automation and PR-thread guidance; migrated OpenCode config to `.jsonc` and prevented plugin config overwrite.

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

[Unreleased]: https://github.com/ninjasitm/ai-assisted-dev-toolkit/compare/v4.0.0...HEAD
[4.0.0]: https://github.com/ninjasitm/ai-assisted-dev-toolkit/compare/v3.0.23...v4.0.0
[0.1.0]: https://github.com/ninjasitm/ai-assisted-dev-toolkit/releases/tag/v0.1.0
