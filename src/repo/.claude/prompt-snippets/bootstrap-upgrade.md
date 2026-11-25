# Bootstrap Upgrade to toolkit <version>

Upgrade to toolkit <version> (the installed package version), including native OpenCode V2 for confirmed OpenCode users (toolkit 4.0.0 and later). For pre-3.0 installations, also migrate inline content to snippet-based architecture and clean up duplicate skills. Only modify confirmed harness targets; preserve unrelated harness/Codex behavior.

## OpenCode version preflight (before any changes)

- Confirm OpenCode use from actual session/runtime evidence or ask the user; directory presence alone is not proof. If only other harnesses are used, skip this preflight and all OpenCode steps.
- For confirmed OpenCode use, run `opencode --version` before any project writes. Trim output and parse numeric major/minor/patch components, accepting an optional leading `v`; toolkit 4.0.0 and later require `major >= 2`.
- If OpenCode V1 (`major < 2`) is detected, **STOP** before customizing/migrating OpenCode files or writing `.toolkit-version` as 4.0.0 or later. Ask the user to upgrade OpenCode to V2 or remain on toolkit 3.x.
- If the CLI is missing, fails, or output is unparseable, **STOP OpenCode steps** and leave the version marker unchanged; ask the user to confirm/install a supported OpenCode version, then rerun this check. Never assume V2.
- If oh-my-opencode-slim >=3.0.0 is used or planned, require OpenCode >=2.0.7 (compare version components numerically); otherwise **STOP** before changes and ask to upgrade. Proceed only after this gate passes.

## Toolkit version routing (before parallel dispatch)

Read `.toolkit-version` and select the route before dispatching agents or changing files; apply only confirmed harness scopes:

- **>=4.0.0**: Use bootstrap-patch and **STOP** this upgrade without rewrites or version marking.
- **v3 (`3.x`)**: **Skip Steps 2–6 and 8–10.** Run only the relevant native OpenCode migration in Step 7 (confirmed OpenCode use only), then applicable approved merge/validation/version/report steps 11–15. Preserve existing snippet bodies/frontmatter and unrelated harness files.
- **Pre-3.0 or missing marker**: Steps 2–6 and applicable approved legacy steps 8–10 require a verified legacy inline installation. A missing marker alone is not legacy evidence; if snippets already exist or the installed version cannot be verified, **STOP** and ask rather than extracting/rewriting them. Back up before legacy conversion and preserve existing customizations.
- **Invalid or unverified version**: **STOP** and ask; never guess a route or downgrade.
- **Completion checklist (every route)**: before any route runs, load the `## Completion Contract` once from `bootstrap.md` beside this guide, as `bootstrap-patch.md` describes, and hold it unchanged through apply. If its origin is uncertain, **STOP** and ask. The selected target does not supply these criteria.

## Migration order and approvals (v3 and legacy routes)

The native migration (Steps 2–11, for the selected route) runs first. The pinned CLI refresh (Step 12) runs second. Each phase has its own independent review and human approval; the post-native CLI set is previewed and approved separately, after native writes are complete.

1. **Scope, before any write (read-only):** pass the source gate in `bootstrap-patch.md` step 1, or reuse the source already verified in this run. The CLI path requires a verified pinned source that supports both review-token preview and `--expect` (5.4.4 is the first capable release; do not infer support or publication from that number). If the source gate fails, run no CLI invocation at all. If capability or any invocation flag is missing, changed, or unknown, bar the CLI path and leave its refresh pending; the native-only path may continue only under its own required evidence, independent review, and human approval. Record the exact resolved layout and flags from `bootstrap-patch.md` step 5. The pre-native preview, when available, is `node "$SOURCE_ROOT/bin/cli.js" patch --<resolved-layout> --dry-run [same selected flags]` (including all skips); it is informational for planning only, not the post-native write set or its approval. List every native operation with target, exact change, before-state (absent or sha256), and backup.
2. **Review the native candidate set** with the independent reviewer and obtain the existing human approval for that exact set. The CLI set will be independently reviewed and approved in its own post-native gate below; it is never approved by prediction or by the native-set review.
3. **Approve and apply the native set.** Revalidate, back up, then apply exactly the listed native operations.
4. **Preview the actual post-native CLI set** (Step 12). Because this preview is taken after the approved native writes, those writes do not stale its token. The native and CLI phases remain separate approval gates.
5. **Independently review and approve the exact post-native CLI set** (Step 12), then apply only with that preview's unchanged token.

Rules:
- Keep all guide-specific independent review and human gates. Any changed write needs review and its own approval. An earlier approval never covers a changed write or authorizes a new post-native CLI set.
- A `--dry-run` executes no native operation and no CLI apply. It may run the read-only pre-native preview in step 1, then stops; the actual post-native preview requires the separately approved native phase to have been applied.
- Category-level permission to inspect is not write approval.
- v3 snippet bodies, frontmatter, and existing wrappers stay byte-for-byte. A protected mutation in the CLI preview bars the CLI path only.

## OpenCode migration guardrails

Back up V1; native-converted files are incompatible with V1. Preserve models/providers/user-global plugins. The OpenCode Ponytail plugin (`@dietrichgebert/ponytail`) is installed globally by the operator and is never registered by templates or project config; obsolete toolkit-local Ponytail copies are removed only after backup and approval (Step 7), with no API port or bridge. Keep `opentmux` commented as V1-only. Only with approval, merge pinned `"plugins": ["oh-my-opencode-slim@3.0.0"]` locally without replacing other registrations. Slim's separate strict schema retains `prompt`/`permission`/`variant`; do not host-migrate it or silently upgrade the separate external starter. Activate on the next run/restart; plugin/runtime integration is untested.

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
   - Resolve as the CLI does (`bin/cli.js` `detectType`): an explicit flag first; otherwise a readable `package.json` with a `workspaces` field, or both `apps/` and `packages/` at root → `monorepo` (use `src/monorepo/` templates)
   - Otherwise → `repo` (use `src/repo/` templates)

2. **Check toolkit version**: Apply the route selected above; inventory and confirm only its applicable steps and confirmed harness targets.

3. **Confirm migration scope**:

   ```markdown
   ## 🔄 Bootstrap Upgrade: toolkit <version>

    **Project type**: repo | monorepo
    **Current version**: <version or "none (legacy)">
    **Selected route**: verified legacy | v3 native OpenCode

    ### What will happen (omit skipped steps for the selected route):

    1.  Verified legacy only: create missing snippet directories, extract inline content, and convert confirmed harness wrappers (Steps 2–6)
    2.  Confirmed OpenCode only: merge native V2 host files and approved missing wrappers (Step 7)
    3.  Verified legacy only: approved hook installation and verified identical duplicate skill cleanup (Steps 8–10); preserve custom skills
    4.  Merge only applicable missing documentation and validate the selected route; v3 keeps existing snippet bodies/frontmatter unchanged
    5.  Record the `.toolkit-version` marker through the guided patch flow (Step 12), after the approved migration
    6.  Commit only if you ask after acceptance, and then only the approved paths

   Scope only: no approval is given here. Approval comes per phase (see Migration order and approvals).
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

Replace each file's body with a thin wrapper (see Thin Wrapper Policy in `bootstrap.md`) that preserves frontmatter and references the snippet. Move any policy text into the snippet first; the wrapper keeps only the link, a title and at most five key points:

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
      "lsp": true
   }
   ```

   Follow official V2 [migration](https://opencode.ai/v2/docs/migrate-v1), [config](https://opencode.ai/v2/docs/config), [agents](https://opencode.ai/v2/docs/agents), and [plugins](https://opencode.ai/v2/docs/build/plugins) docs. The published schema may describe V1; do not use it or a V1 API fetch as native V2 validation authority. Use `agents`/JSON `system` (Markdown bodies for file agents), ordered `permissions` (`action`/`resource`/`effect`, `shell`/`subagent`, last match wins), `commands`/`subagent`, `plugins` with `{ "package": "…", "options": {} }`, skill-directory arrays, and `mcp.servers` with inverse `disabled` and `timeout.catalog`/`timeout.execution`.

   Ambient `AGENTS.md` works. `instructions` entries load only when the runtime injects them (OpenChamber does; other hosts may not), so do not rely on them: write explicit "Read and follow" wrappers regardless. `@refs` are ordinary text, not attachments: wrappers must explicitly tell agents to read referenced snippets. Do not set a temperature; the current runner does not send one. Preserve `lsp: true`; use project lint/typecheck/compiler commands (no current V2 LSP tools/diagnostics). `--env opencode` supplies minimal shared references without other harness activation. Verify using installed V2 after the next run/restart; report only checks actually run.

2. **Replace obsolete toolkit Ponytail (backup and approval only)**:
   - Back up the local config and known obsolete toolkit-owned `.opencode/plugins/ponytail.js`, `.opencode/plugins/ponytail.mjs`, and `.opencode/plugins/ponytail.ts` copies; obtain approval before removing only those copies. Preserve unrelated local plugins.
   - The OpenCode Ponytail plugin (`@dietrichgebert/ponytail`) is installed globally by the operator. Never add or pin it in the local `plugins` array. Check whether it is installed globally; if not, tell the operator to install it globally. Do not edit global config or overwrite global plugins. Keep `opentmux` commented as V1-only; do not copy local Ponytail source, port APIs, or introduce bridges. Runtime integration remains untested.

3. **Create wrappers with explicit snippet-read instructions** — only for entries the patch plan classifies *add* (never retired or not-relevant snippets), each one thin (see Thin Wrapper Policy in `bootstrap.md`), one file per snippet:

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

Install the CHANGELOG/secrets enforcement hook before every commit, only with the operator's approval, only in a git repository, and never over an existing `.git/hooks/pre-commit`. If one exists, show the difference and propose chaining or merging instead:

1. Copy `scripts/pre-commit-check.sh` from the template to the target project's `scripts/` directory
2. Install as a git hook:

   ```bash
   # only when .git/hooks/pre-commit does not exist yet
   cp scripts/pre-commit-check.sh .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```

This enforces:

- **CHANGELOG.md** — [Unreleased] must have content when non-trivial files are staged
- **Zone.Identifier** — `*:Zone.Identifier` files are blocked from commit
- **Secrets** — `.env`, `.env.*`, `*.key`, `*.pem` files are blocked from commit

Use `git commit --no-verify` to bypass.

### 9. Install Project Hooks (only with approval)

The `hooks/` files are Claude Code plugin hooks (`${CLAUDE_PLUGIN_ROOT}`) and the Ponytail runtime. They fire only when installed through the Ponytail plugin, not from project settings. Copy only the files the operator approves for a project that uses that plugin, and never overwrite an existing hook file.

1. Create `hooks/` in the target project when copying
2. Copy the approved files from the template's `hooks/*` directory (preserve sub-structure); skip any file that already exists
3. On Unix, make executable only the exact `.js` paths this step copied, one `chmod +x <path>` each. No wildcard.

### 10. Clean Up Duplicate Skills

- Merge approved `.agents/rules/*.md` additions without overwriting custom content; skip this step on the v3 route.
- Preserve custom, unmatched, modified, and nested skill content; name or location alone does not prove duplication.
- A candidate in a confirmed harness skill directory may be removed only after the same-name canonical `.agents/skills/<skill-name>/` copy exists and a complete recursive comparison (`diff -qr` or equivalent, including nested content) proves them identical. Missing canonical copy, differences, or comparison errors mean preserve and report, not delete.
- Back up the verified identical duplicate and obtain explicit approval before removing only that duplicate; keep the canonical copy intact. No bulk deletion or name/location-based nested cleanup.
- Removal also needs an independent review PASS of the exact candidate (the `bootstrap-patch.md` review loop) and the explicit consent above. Retiring a skill in `.nitm/retired.json` is never removal.

### 11. Update `CLAUDE.md`

If `CLAUDE.md` is an applicable confirmed harness target and a thin redirect to `AGENTS.md`, merge only missing relevant sections; preserve existing bodies/frontmatter:

1. **Snippet Directories** section with links to `rules-snippets/`, `prompt-snippets/`, `agents-snippets/`
2. **Multi-Tool Support** section with links to `.github/`, `.cursor/`, `.opencode/`
3. **Related Documentation** entries for snippet dirs, `.opencode/`, and `.toolkit-version`

See existing `CLAUDE.md` in the toolkit template (`src/repo/CLAUDE.md`) for the exact format.

### 12. Check `.toolkit-version` File

This is phase 2 of the Migration order: the pinned CLI refresh of the marker, with its own approval.

1. Use the same verified pinned source and exact invocation as `bootstrap-patch.md` step 5, including resolved layout, env, selection, and every `--skip-path`. From the target directory run `node "$SOURCE_ROOT/bin/cli.js" patch --<resolved-layout> --dry-run [same selected flags]` against the actual post-native state. Do not download a second copy or use unpinned `npx`. If the source does not support the token contract, any flag's support is unknown, or the preview omits the requested flags, **STOP** the CLI path and report the refresh pending; native-only work may stand on its own approval.
2. The post-native preview must print the ordered exact write set, metadata writes, explicit omissions, and a 64-hex review token. If the token is missing, the set conflicts, the before-state differs from the native-phase prediction, or any overlap/difference is not already understood and explicitly reviewed, **STOP before CLI writes**. Do not mint a replacement token and treat it as accepted. Re-previewing a changed state starts a fresh independent review and separate human approval of the exact new post-native set; otherwise leave the CLI refresh pending. A protected v3 mutation (any `update` or `overwrite` of an existing snippet, wrapper, or other v3 file) bars the CLI path only; it does not cancel the independently approved native path.
3. Send the exact post-native write set, metadata, omissions, token, and before-states through the `bootstrap-patch.md` independent review loop. Require its independent `VERDICT: PASS`, then separately obtain the user's explicit approval of that exact post-native set. The earlier native approval and any pre-native CLI preview do not approve these writes.
4. Immediately before CLI apply, confirm the same source identity and exact flags, verify every reviewed target/protected state is unchanged, and verify the `--expect` value byte-for-byte equals the token reviewed and approved above. Apply the same invocation, removing `--dry-run` and adding only `--expect <reviewed-token>`. A stale or refused token means **STOP with no CLI writes** and a fresh preview/review/approval; never auto-accept a new token. The CLI writes the approved metadata and files, with the `.toolkit-version` marker last among CLI writes and only after those writes succeed; it records the installed package version, never a hard-coded value. For confirmed OpenCode use, toolkit 4.0.0 or later may be recorded only after the V2 preflight passes. Review-token capability is a separate CLI requirement, available from patch-capable source 5.4.4+. Never write `.toolkit-version` by hand.
5. Compare `.nitm/BOOTSTRAP.md` to the approved preview action and protected before-state: `create` means it was absent and is now added; `refresh` means it was proven toolkit-owned and unchanged and now matches release bytes; `keep`, `skip`, and `unchanged` mean it remains byte-identical. Patch creates no automatic handoff backup. If the handoff action or resulting bytes differ from the approved set, **STOP** and report; do not back up or replace it manually. Existing guide-specific backups cover only separately approved manual operations.
6. Keep the temp source from `bootstrap-patch.md` step 1 until its terminal cleanup. If it is gone on resume, re-verify its identity before reuse.
7. Report the native and marker outcomes separately, with any pending calibration. Never mark the migration complete from the marker alone.

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

**Independent review of the actual outcome.** Dispatch the same independent read-only reviewer used in Migration order step 2, on the actual applied outcome: the native set plus the CLI refresh when it was applied, or the native set alone when the refresh was barred. Follow the post-apply loop in `bootstrap-patch.md` step 6: a CHANGES repair stays within the approved scope, and any follow-up write is a new proposal. Required calibration that is still unmet stays blocked pending calibration and does not block the independent native path. Report **reviewer-accepted** only for a current, scoped outcome with a PASS and verified evidence; otherwise report applied or pending. A preview is never reported as applied. No commit is implied; the commit rule is `bootstrap-patch.md` step 5f.

If `--verbose`: log each check result with file paths.

### 14. Generate Upgrade Report

Output the report to chat/stdout only. Do not write a report file into the project. Include only operations/checks actually performed for the selected route; omit legacy extraction/cleanup rows on v3 and never pre-mark skipped checks as passed:

```markdown
## Bootstrap Upgrade Status (write only after Step 13 verification)

**From**: detected installed version (include inline extraction only for pre-3.0)
**To**: <version> (toolkit 4.0.0 or later; native V2 for confirmed OpenCode use; snippet conversion only for verified legacy)
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

- `.toolkit-version` — version marker recorded by the guided patch flow (Step 12), reported apart from native structural changes

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

Only on an explicit request, after the Step 13 acceptance. Apply the commit rule in `bootstrap-patch.md` step 5f to the upgrade's approved paths: the baseline, the empty index, the content and mode checks, the staged-content check, and the ban on `git add -A`, `git add .`, `git add -f`, `git reset`, and `git restore --staged`. Commit message: `chore: upgrade AI instructions to toolkit <version>`.

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
