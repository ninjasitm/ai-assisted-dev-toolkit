# Bootstrap Upgrade to v4.0

Upgrade to toolkit 4.0.0, including native OpenCode V2 for confirmed OpenCode users. For pre-3.0 installations, also migrate inline content to snippet-based architecture and clean up duplicate skills. Only modify confirmed harness targets; preserve unrelated harness/Codex behavior.

## OpenCode version preflight (before any changes)

- Confirm OpenCode use from actual session/runtime evidence or ask the user; directory presence alone is not proof. If only other harnesses are used, skip this preflight and all OpenCode steps.
- For confirmed OpenCode use, run `opencode --version` before any project writes. Trim output and parse numeric major/minor/patch components, accepting an optional leading `v`; toolkit 4.x requires `major >= 2`.
- If OpenCode V1 (`major < 2`) is detected, **STOP** before customizing/migrating OpenCode files or writing `.toolkit-version` as `4.0.0`. Ask the user to upgrade OpenCode to V2 or remain on toolkit 3.x.
- If the CLI is missing, fails, or output is unparseable, **STOP OpenCode steps** and leave the version marker unchanged; ask the user to confirm/install a supported OpenCode version, then rerun this check. Never assume V2.
- If oh-my-opencode-slim >=3.0.0 is used or planned, require OpenCode >=2.0.7 (compare version components numerically); otherwise **STOP** before changes and ask to upgrade. Proceed only after this gate passes.

## Toolkit version routing (before parallel dispatch)

Read `.toolkit-version` and select the route before dispatching agents or changing files; apply only confirmed harness scopes:

- **>=4.0.0**: Use bootstrap-patch and **STOP** this upgrade without rewrites or version marking.
- **v3 (`3.x`)**: **Skip Steps 2–6 and 8–10.** Run only the relevant native OpenCode migration in Step 7 (confirmed OpenCode use only), then applicable approved merge/validation/version/report steps 11–15. Preserve existing snippet bodies/frontmatter and unrelated harness files.
- **Pre-3.0 or missing marker**: Steps 2–6 and applicable approved legacy steps 8–10 require a verified legacy inline installation. A missing marker alone is not legacy evidence; if snippets already exist or the installed version cannot be verified, **STOP** and ask rather than extracting/rewriting them. Back up before legacy conversion and preserve existing customizations.
- **Invalid or unverified version**: **STOP** and ask; never guess a route or downgrade.

## OpenCode migration guardrails

Back up V1; native-converted files are incompatible with V1. Preserve models/providers/user-global plugins. Templates register the author's native V2 package `@dietrichgebert/ponytail@4.12.0`; obsolete toolkit-local Ponytail copies are replaced only after backup and approval (Step 7), with no API port or bridge. Keep `opentmux` commented as V1-only. Only with approval, merge pinned `"plugins": ["oh-my-opencode-slim@3.0.0"]` locally without replacing other registrations. Slim's separate strict schema retains `prompt`/`permission`/`variant`; do not host-migrate it or silently upgrade the separate external starter. Activate on the next run/restart; plugin/runtime integration is untested and publishing 4.0.0 has not been executed.

## Usage

```
/bootstrap-upgrade
/bootstrap-upgrade --dry-run
/bootstrap-upgrade --verbose
/bootstrap-upgrade --dry-run --verbose
```

- `--dry-run`: Show what would be changed without writing files
- `--verbose`: Log every file operation with paths and content summaries

## Orchestrator Checkpoint

> **🛑 Before starting**: This command modifies files across 5+ directory trees (`.claude/`, `.github/`, `.cursor/`, `.opencode/`, `.agents/`).
> Complete version routing above before parallel dispatch; only the verified legacy route may dispatch Steps 3–6, for confirmed harnesses.
> See `.claude/rules-snippets/subagent-workflow.md` for patterns.

## Process

### 1. Pre-flight Checks

Run all checks before making any changes:

1. **Detect project type**:
   - If `apps/` and `packages/` directories exist at root → `monorepo` (use `src/monorepo/` templates)
   - Otherwise → `repo` (use `src/repo/` templates)

2. **Check toolkit version**: Apply the route selected above; inventory and confirm only its applicable steps and confirmed harness targets.

3. **Confirm migration scope**:

   ```markdown
   ## 🔄 Bootstrap Upgrade: toolkit v4.0.0

    **Project type**: repo | monorepo
    **Current version**: <version or "none (legacy)">
    **Selected route**: verified legacy | v3 native OpenCode

    ### What will happen (omit skipped steps for the selected route):

    1.  Verified legacy only: create missing snippet directories, extract inline content, and convert confirmed harness wrappers (Steps 2–6)
    2.  Confirmed OpenCode only: merge native V2 host files and approved missing wrappers (Step 7)
    3.  Verified legacy only: approved hook installation and verified identical duplicate skill cleanup (Steps 8–10); preserve custom skills
    4.  Merge only applicable missing documentation and validate the selected route; v3 keeps existing snippet bodies/frontmatter unchanged
    5.  Create `.toolkit-version` with `4.0.0` after the approved migration
    6.  Commit all changes

   Proceed? (Y/n)
   ```

   If `--dry-run`: show the report and **stop** — do not write any files.

### 2. Create Snippet Directories

**Steps 2–6 are verified-legacy-only.** Skip this entire block for v3; never extract or rewrite existing snippet bodies/frontmatter. Process only confirmed harness targets.

```bash
mkdir -p .claude/rules-snippets
mkdir -p .claude/prompt-snippets
mkdir -p .claude/agents-snippets
```

### 3. Extract Content from `.claude/` → Snippet Files

**Parallelizable**: Process rules, commands, and agents independently.

**Frontmatter extraction rule**: Content between the first `---` and the second `---` is frontmatter. Everything after the second `---` (including leading newline) is the body.

| Source                           | Destination                         | Example               |
| -------------------------------- | ----------------------------------- | --------------------- |
| `.claude/rules/*.md` body        | `.claude/rules-snippets/<name>.md`  | `coding-standards.md` |
| `.claude/commands/*.md` body     | `.claude/prompt-snippets/<name>.md` | `bootstrap.md`        |
| `.claude/agents/*.agent.md` body | `.claude/agents-snippets/<name>.md` | `reviewer.agent.md`   |

For each file: read → extract body after frontmatter → write to snippet destination. **Preserve all `{{PLACEHOLDER}}` values exactly.**

### 4. Convert `.claude/` Files to Thin Wrappers

**Parallelizable**: Process rules, commands, and agents independently.

Replace each file's body with a wrapper that preserves frontmatter and references the snippet:

| File Type                   | Frontmatter to Keep                             | Reference Line                                                                                 |
| --------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `.claude/rules/*.md`        | `applyTo`, `description`                        | `Follow the rules defined in [../rules-snippets/<name>.md](../rules-snippets/<name>.md).`      |
| `.claude/commands/*.md`     | `description`, `allowed-tools`, `argument-hint` | `Follow the prompt defined in [../prompt-snippets/<name>.md](../prompt-snippets/<name>.md).`   |
| `.claude/agents/*.agent.md` | `name`, `description`, `tools`                  | `Follow the agent definition in [../agents-snippets/<name>.md](../agents-snippets/<name>.md).` |

Wrapper format:

```markdown
---
<original frontmatter preserved>
---

# <Title from original>

<reference line from table above>
```

### 5. Convert `.github/` Files to Thin Wrappers

**Parallelizable**: Process instructions, prompts, and agents independently.

Same wrapper pattern as Step 4 — preserve frontmatter, replace body with reference:

| Source                                   | Frontmatter                    | Snippet Target                      | Reference Path                            |
| ---------------------------------------- | ------------------------------ | ----------------------------------- | ----------------------------------------- |
| `.github/instructions/*.instructions.md` | `applyTo`, `description`       | `.claude/rules-snippets/<name>.md`  | `../../.claude/rules-snippets/<name>.md`  |
| `.github/prompts/*.prompt.md`            | `description`                  | `.claude/prompt-snippets/<name>.md` | `../../.claude/prompt-snippets/<name>.md` |
| `.github/agents/*.agent.md`              | `name`, `description`, `tools` | `.claude/agents-snippets/<name>.md` | `../../.claude/agents-snippets/<name>.md` |

**Name mapping for instructions**: Strip `.instructions` suffix — `agent-conduct.instructions.md` → `agent-conduct.md`.

**Missing snippet?** If an instruction file (e.g., `deployment.instructions.md`) has no matching `.claude/rules/` file, first create the snippet by copying the full content to `.claude/rules-snippets/<name>.md`, then convert to wrapper.

For `.github/instructions/` wrappers, include 2–3 key bullet points after the reference line:

```markdown
Follow the rules defined in [../../.claude/rules-snippets/<name>.md](../../.claude/rules-snippets/<name>.md).

Key points:

- <first key point from original>
- <second key point from original>
```

### 6. Convert `.cursor/` Files to Thin Wrappers

**Parallelizable**: Process rules, commands, and agents independently.

Same pattern as Steps 4–5 — preserve frontmatter, replace body with reference:

| Source                      | Snippet Target                      | Reference Path                            |
| --------------------------- | ----------------------------------- | ----------------------------------------- |
| `.cursor/rules/*.mdc`       | `.claude/rules-snippets/<name>.md`  | `../../.claude/rules-snippets/<name>.md`  |
| `.cursor/commands/*.md`     | `.claude/prompt-snippets/<name>.md` | `../../.claude/prompt-snippets/<name>.md` |
| `.cursor/agents/*.agent.md` | `.claude/agents-snippets/<name>.md` | `../../.claude/agents-snippets/<name>.md` |

For `.cursor/rules/*.mdc`: preserve the original frontmatter exactly (it may use different field names than `.claude/` rules).

### 7. Create `.opencode/` Directory (confirmed OpenCode use only)

For the v3 route, merge only relevant native OpenCode host fields; preserve existing wrapper bodies, modes, unrelated frontmatter, and shared snippet bodies/frontmatter. The wrapper examples below apply only to approved missing files, not replacement of existing wrappers.

1. **Merge `.opencode/opencode.jsonc`** using native V2 fields:

   ```json
   {
     "$schema": "https://opencode.ai/config.json",
      "instructions": ["AGENTS.md", ".opencode/rules/*.md"],
      "skills": [".agents/skills"],
      "plugins": ["@dietrichgebert/ponytail@4.12.0"],
      "lsp": true
   }
   ```

   Follow official V2 [migration](https://opencode.ai/v2/docs/migrate-v1), [config](https://opencode.ai/v2/docs/config), [agents](https://opencode.ai/v2/docs/agents), and [plugins](https://opencode.ai/v2/docs/build/plugins) docs. The published schema may describe V1; do not use it or a V1 API fetch as native V2 validation authority. Use `agents`/JSON `system` (Markdown bodies for file agents), `request.body.temperature`, ordered `permissions` (`action`/`resource`/`effect`, `shell`/`subagent`, last match wins), `commands`/`subagent`, `plugins` with `{ "package": "…", "options": {} }`, skill-directory arrays, and `mcp.servers` with inverse `disabled` and `timeout.catalog`/`timeout.execution`.

   `instructions` entries are accepted but not loaded; ambient `AGENTS.md` works. `@refs` are ordinary text, not attachments: wrappers must explicitly tell agents to read referenced snippets. `request.body.temperature` remains in config, but the current runner does not send it. Preserve `lsp: true`; use project lint/typecheck/compiler commands (no current V2 LSP tools/diagnostics). `--env opencode` supplies minimal shared references without other harness activation. Verify using installed V2 after the next run/restart; report only checks actually run.

2. **Replace obsolete toolkit Ponytail (backup and approval only)**:
   - Back up the local config and known obsolete toolkit-owned `.opencode/plugins/ponytail.js`, `.opencode/plugins/ponytail.mjs`, and `.opencode/plugins/ponytail.ts` copies; obtain approval before removing only those copies. Preserve unrelated local plugins.
   - Merge/deduplicate the author's native V2 `@dietrichgebert/ponytail@4.12.0` package in the local `plugins` array where appropriate, preserving other registrations/options. Do not edit global config or overwrite global plugins. Keep `opentmux` commented as V1-only; do not copy local Ponytail source, port APIs, or introduce bridges. Native local discovery needs no duplicate explicit registration; runtime integration remains untested.

3. **Create wrappers with explicit snippet-read instructions** — one file per snippet:

   | Directory                 | Source Snippets            | Wrapper Body                         |
   | ------------------------- | -------------------------- | ------------------------------------ |
   | `.opencode/commands/*.md` | `.claude/prompt-snippets/` | `Read and follow .claude/prompt-snippets/<name>.md` |
   | `.opencode/rules/*.md`    | `.claude/rules-snippets/`  | `Read and follow .claude/rules-snippets/<name>.md`  |
   | `.opencode/agents/*.md`   | `.claude/agents-snippets/` | `Read and follow .claude/agents-snippets/<name>.md` |

   Wrapper format for all three:

   ```markdown
   ---
   description: "<description from snippet frontmatter>"
   ---

   # <Title>

   Read and follow `.claude/<snippet-type>/<name>.md` before performing this task.
   ```

### 8. Install Pre-Commit Hook

Install the CHANGELOG/secrets enforcement hook to run before every commit:

1. Copy `scripts/pre-commit-check.sh` from the template to the target project's `scripts/` directory
2. Install as a git hook:

   ```bash
   cp scripts/pre-commit-check.sh .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```

This enforces:

- **CHANGELOG.md** — [Unreleased] must have content when non-trivial files are staged
- **Zone.Identifier** — `*:Zone.Identifier` files are blocked from commit
- **Secrets** — `.env`, `.env.*`, `*.key`, `*.pem` files are blocked from commit

Use `git commit --no-verify` to bypass.

### 9. Install Project Hooks

1. Create `hooks/` directory in the target project
2. Copy all files from the template's `hooks/*` directory (preserve sub-structure)
3. Make `.js` files executable on Unix: `chmod +x hooks/*.js`

### 10. Clean Up Duplicate Skills

- Merge approved `.agents/rules/*.md` additions without overwriting custom content; skip this step on the v3 route.
- Preserve custom, unmatched, modified, and nested skill content; name or location alone does not prove duplication.
- A candidate in a confirmed harness skill directory may be removed only after the same-name canonical `.agents/skills/<skill-name>/` copy exists and a complete recursive comparison (`diff -qr` or equivalent, including nested content) proves them identical. Missing canonical copy, differences, or comparison errors mean preserve and report, not delete.
- Back up the verified identical duplicate and obtain explicit approval before removing only that duplicate; keep the canonical copy intact. No bulk deletion or name/location-based nested cleanup.

### 11. Update `CLAUDE.md`

If `CLAUDE.md` is an applicable confirmed harness target and a thin redirect to `AGENTS.md`, merge only missing relevant sections; preserve existing bodies/frontmatter:

1. **Snippet Directories** section with links to `rules-snippets/`, `prompt-snippets/`, `agents-snippets/`
2. **Multi-Tool Support** section with links to `.github/`, `.cursor/`, `.opencode/`
3. **Related Documentation** entries for snippet dirs, `.opencode/`, and `.toolkit-version`

See existing `CLAUDE.md` in the toolkit template (`src/repo/CLAUDE.md`) for the exact format.

### 12. Create `.toolkit-version` File

Only after the approved migration and OpenCode preflight pass (or OpenCode is confirmed out of scope):

```bash
echo "4.0.0" > .toolkit-version
```

### 13. Validation

Run only checks applicable to the selected route and confirmed harnesses; on v3 compare retained snippet bodies/frontmatter to backups:

| Check                                 | Method                                                                                   | Pass Criteria                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------- |
| Snippet files exist                   | `ls -la .claude/{rules,prompt,agents}-snippets/`                                         | All files > 0 bytes                           |
| Thin wrappers reference correct paths | Grep each wrapper for its reference line                                                 | Every reference points to an existing snippet |
| No `{{PLACEHOLDER}}` lost             | `grep -r '{{' .claude/*-snippets/`                                                       | Count matches original files                  |
| No broken relative paths              | For each wrapper, verify linked snippet exists                                           | All links resolve                             |
| `.opencode/` complete                 | Check `opencode.jsonc` + one file per snippet in commands/, rules/, agents/              | Counts match                                  |
| Custom skills preserved               | Compare the before/after inventory and any removed duplicate against its canonical copy | Only approved verified identical duplicates removed |

If `--verbose`: log each check result with file paths.

### 14. Generate Upgrade Report

Output the report to stdout (and optionally to `docs/upgrade-report-v4.md`). Include only operations/checks actually performed for the selected route; omit legacy extraction/cleanup rows on v3 and never pre-mark skipped checks as passed:

```markdown
## 🚀 Bootstrap Upgrade Report

**From**: detected installed version (include inline extraction only for pre-3.0)
**To**: 4.0.0 (native V2 for confirmed OpenCode use; snippet conversion only for verified legacy)
**Selected route**: verified legacy | v3 native OpenCode
**Date**: {{DATE}}
**Dry run**: yes | no

### Snippet Directories Created

- `.claude/rules-snippets/` — X files
- `.claude/prompt-snippets/` — X files
- `.claude/agents-snippets/` — X files

### Files Converted to Thin Wrappers

- `.claude/rules/` — X files
- `.claude/commands/` — X files
- `.claude/agents/` — X files
- `.github/instructions/` — X files
- `.github/prompts/` — X files
- `.github/agents/` — X files
- `.cursor/rules/` — X files
- `.cursor/commands/` — X files
- `.cursor/agents/` — X files

### New Directories Created

- `.opencode/` — X files (config, commands, rules, agents)

### Cleanup

- Removed X verified identical duplicates after comparison, backup, and approval (if performed)
- Preserved custom, unmatched, and nested skill content and canonical copies

### Files Created

- `.toolkit-version` — 4.0.0

### Validation

- [ ] Applicable snippet files exist and have content
- [ ] Applicable thin wrappers reference correct snippets
- [ ] No {{PLACEHOLDER}} syntax lost; v3 snippet bodies/frontmatter unchanged
- [ ] No broken relative paths
- [ ] .opencode/ checks passed (confirmed OpenCode use only)
- [ ] Custom skills preserved; any duplicate removal met the safety checks
```

If `--verbose`: include a file-by-file log of every operation.

### 15. Git Commit

If not `--dry-run`, stage and commit all changes:

```bash
git add -A
git commit -m "chore: upgrade AI instructions to toolkit v4.0.0"
```

If `--dry-run`: skip commit, note in report: "Dry run — no changes committed."

## Parallelization Summary

Only after route selection, verified-legacy steps may run in parallel for confirmed harnesses:

| Step | Parallelizable Groups                                         |
| ---- | ------------------------------------------------------------- |
| 3    | rules extraction ‖ commands extraction ‖ agents extraction    |
| 4    | rules wrappers ‖ commands wrappers ‖ agents wrappers          |
| 5    | instructions wrappers ‖ prompts wrappers ‖ agents wrappers    |
| 6    | rules wrappers ‖ commands wrappers ‖ agents wrappers          |
| 10   | Independent of 3–6 — can run in parallel with file conversion |

Verified legacy sequence: 1 → 2 → (3‖4‖5‖6‖10) → 7 → 8 → 9 → 11 → 12 → 13 → 14 → 15, skipping unconfirmed scopes/unapproved operations. V3 sequence: 1 → applicable 7 → applicable 11–15; never run Steps 2–6 or 8–10.

## Error Handling

- If a file has no frontmatter: treat entire file as body content, create wrapper with empty frontmatter fields
- If a snippet file already exists: **skip** with warning (do not overwrite)
- If `.opencode/` already exists: merge — add missing files and propose native V2 conversion of existing host files; preserve customizations and skip files already migrated
- If git commit fails: show error, suggest manual commit
- If any validation check fails: report the failure but continue with remaining checks

## Notes

- This is a **one-time operation** — running it again on an already-migrated project should be a no-op (pre-flight check aborts)
- All `{{PLACEHOLDER}}` values are preserved exactly — this migration changes file structure, not content
- Project-specific customizations in file bodies are preserved in the extracted snippets
- After upgrade, use `/bootstrap-patch` for incremental template updates
