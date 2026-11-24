# Bootstrap Upgrade — Monorepo

Upgrade this monorepo to toolkit <version> (the installed package version), including native OpenCode V2 for confirmed OpenCode users (toolkit 4.0.0 and later). For pre-3.0 installations, also migrate inline content to snippet-based architecture. Only modify confirmed harness targets; preserve unrelated harness/Codex behavior.

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

The native migration (Steps 2–11, for the selected route) runs first. The pinned CLI refresh of the version marker (Step 12) runs second. Each phase has its own approval, given after the independent reviewer has passed that phase's set:

1. **Scope, before any write (read-only):** first pass the source gate in `bootstrap-patch.md` step 1, or reuse the source already verified in this run (minimum 5.2.0). If the gate fails, run no CLI invocation at all; the native-only path may continue only on its own required evidence and authority, which the failure does not grant. Then run `node "$SOURCE_ROOT/bin/cli.js" patch --dry-run` with the fixed invocation from `bootstrap-patch.md` step 5 and record it as the current CLI preview. List every native file operation with its target, exact change, before-state (absent, or sha256), and backup. State the expected CLI effects after the native changes, reconcile them with the approved additions and overlaps, and name each known difference with the native change that causes it.
2. **Review both candidate sets** (the native set and the expected CLI set) with the same independent reviewer, per `bootstrap-patch.md` steps 4–5. If the CLI path is barred, the independently approved structural path still proceeds on its own approval.
3. **Approve and apply the native set.** Revalidate, back up, then apply exactly the listed native operations.
4. **Check the CLI set against the actual state** after the native apply (Step 12, item 1), before the refresh is approved.
5. **Approve and apply the refresh** (Step 12): a separate user approval scoped to the CLI set.

Rules:
- Alignment is not repeated when the scope is unchanged. Any changed write needs review and its own approval. An earlier approval never covers a changed write.
- A `--dry-run` executes no native operation and no CLI apply. It runs only the read-only preview in step 1.
- Category-level permission to inspect is not write approval.
- v3 snippet bodies, frontmatter, and existing wrappers stay byte-for-byte. A protected mutation in the CLI preview bars the CLI path only.

## OpenCode migration guardrails

Back up V1; native-converted files are incompatible with V1. Preserve models/providers/user-global plugins. The OpenCode Ponytail plugin (`@dietrichgebert/ponytail`) is installed globally by the operator and is never registered by templates or project config; obsolete toolkit-local Ponytail copies are removed only after backup and approval (Step 7), with no API port or bridge. Keep `opentmux` commented as V1-only. Only with approval, merge pinned `"plugins": ["oh-my-opencode-slim@3.0.0"]` locally without replacing other registrations. Slim's separate strict schema retains `prompt`/`permission`/`variant`; do not host-migrate it or silently upgrade the separate external starter. Activate on the next run/restart; plugin/runtime integration is untested.

## Orchestrator Checkpoint

> **🛑 Before starting**: This command involves reading, extracting, and rewriting many files across multiple directories.
> Complete version routing above before parallel dispatch; only the verified legacy route may dispatch Steps 3–6, for confirmed harnesses. Applicable Steps 7–15 are sequential.

## Usage

```
/bootstrap-upgrade
/bootstrap-upgrade --dry-run
/bootstrap-upgrade --verbose
```

- `--dry-run`: Show what would be changed without writing files
- `--verbose`: Log every file read/write operation

## Process

### Step 1: Pre-flight Checks

1. **Confirm monorepo structure**: resolve the layout as the CLI does (an explicit flag; otherwise a `workspaces` field in a readable `package.json`, or both `apps/` and `packages/` at root). If it is not a monorepo, abort and suggest using the single-repo upgrade command instead.

2. **Check existing version**: Apply the route selected above; inventory and confirm only its applicable steps and confirmed harness targets.

3. **Detect build system** (for CLAUDE.md update in Step 10):
   - `turbo.json` → Turborepo
   - `nx.json` → Nx
   - `lerna.json` → Lerna
   - `pnpm-workspace.yaml` → pnpm workspaces
   - `workspaces` in `package.json` → npm/yarn workspaces

4. **Inventory files to migrate** (parallelizable — scan all directories simultaneously):

   | Directory               | Glob                | Count |
   | ----------------------- | ------------------- | ----- |
   | `.claude/rules/`        | `*.md`              | {{N}} |
   | `.claude/commands/`     | `*.md`              | {{N}} |
   | `.claude/agents/`       | `*.agent.md`        | {{N}} |
   | `.github/instructions/` | `*.instructions.md` | {{N}} |
   | `.github/prompts/`      | `*.prompt.md`       | {{N}} |
   | `.github/agents/`       | `*.agent.md`        | {{N}} |
   | `.cursor/rules/`        | `*.mdc`             | {{N}} |
   | `.cursor/commands/`     | `*.md`              | {{N}} |
   | `.cursor/agents/`       | `*.agent.md`        | {{N}} |

5. **Present summary and ask for confirmation**:

   ```markdown
    ## 🔄 Monorepo Upgrade: toolkit <version>

    **Selected route**: verified legacy | v3 native OpenCode

    ### What will change (omit skipped steps for the selected route)

    - Verified legacy only: create missing snippet directories, extract inline content from {{N}} files, and convert confirmed harness wrappers (Steps 2–6)
    - Confirmed OpenCode only: merge native V2 host files and approved missing wrappers (Step 7)
    - Verified legacy only: approved hook installation and verified identical duplicate skill cleanup (Steps 8–10); preserve custom skills
    - Merge only applicable missing documentation and validate the selected route; v3 keeps existing snippet bodies/frontmatter unchanged
   - Record the `.toolkit-version` marker through the guided patch flow (Step 12), after the approved migration

   ### Monorepo-specific changes

   - `paths:` frontmatter preserved in rule snippets (app/package scoping)
   - Per-app AGENTS.md files left untouched
   - Cross-app instruction references maintained

   Scope only: no approval is given here. Approval comes per phase (see Migration order and approvals).
   ```

### Step 2: Create Snippet Directories

**Steps 2–6 are verified-legacy-only.** Skip this entire block for v3; never extract or rewrite existing snippet bodies/frontmatter. Process only confirmed harness targets.

Create these directories if they don't exist:

```bash
mkdir -p .claude/rules-snippets
mkdir -p .claude/prompt-snippets
mkdir -p .claude/agents-snippets
```

### Step 3: Extract Content from .claude/ (Primary Source of Truth)

> **Parallelizable**: Process rules, commands, and agents in parallel.

For each `.claude/rules/*.md`:

1. Read the file
2. Parse frontmatter (between `---` delimiters) — **preserve `paths:` and `applyTo:` fields**
3. Extract the body (everything after the closing `---`)
4. Write to `.claude/rules-snippets/<name>.md` — include the frontmatter fields (`paths:`, `applyTo:`, `description:`) at the top of the snippet

For each `.claude/commands/*.md`:

1. Read the file
2. Extract body content (after frontmatter)
3. Write to `.claude/prompt-snippets/<name>.md`

For each `.claude/agents/*.agent.md`:

1. Read the file
2. Parse frontmatter — preserve `user-invocable`, `agents`, `mode`, `model`, `temperature`, `permission` fields
3. Extract body content
4. Write to `.claude/agents-snippets/<name>.md`

### Step 4: Convert .claude/ Files to Thin Wrappers

> **Parallelizable**: Process rules, commands, and agents in parallel.

**Rules** — Replace each `.claude/rules/*.md` body with:

```markdown
---
{ { ORIGINAL_FRONTMATTER } }
---

# {{TITLE}}

Follow the rules defined in [.claude/rules-snippets/{{NAME}}.md](../rules-snippets/{{NAME}}.md).
```

**Commands** — Replace each `.claude/commands/*.md` body with:

```markdown
---
{ { ORIGINAL_FRONTMATTER } }
---

# {{TITLE}}

Follow the prompt defined in [.claude/prompt-snippets/{{NAME}}.md](../prompt-snippets/{{NAME}}.md).
```

**Agents** — Replace each `.claude/agents/*.agent.md` body with:

```markdown
---
{ { ORIGINAL_FRONTMATTER } }
---

# {{AGENT_NAME}}

Follow the agent definition in [.claude/agents-snippets/{{NAME}}.md](../agents-snippets/{{NAME}}.md).
```

### Step 5: Convert .github/ Files to Thin Wrappers

> **Parallelizable**: Process instructions, prompts, and agents in parallel.

**Instructions** — For each `.github/instructions/*.instructions.md`:

1. Check if a matching snippet exists in `.claude/rules-snippets/`
2. If no matching snippet: extract body content → create `.claude/rules-snippets/<name>.md`
3. Replace body with thin wrapper preserving `applyTo:` and `description:` frontmatter:

```markdown
---
applyTo: "{{ORIGINAL_APPLY_TO}}"
description: "{{ORIGINAL_DESCRIPTION}}"
---

# {{TITLE}}

Follow the rules defined in [.claude/rules-snippets/{{NAME}}.md](../../.claude/rules-snippets/{{NAME}}.md).
```

**Prompts** — For each `.github/prompts/*.prompt.md`:

1. Check if a matching snippet exists in `.claude/prompt-snippets/`
2. If no matching snippet: extract body → create `.claude/prompt-snippets/<name>.md`
3. Replace body with thin wrapper:

```markdown
---
{ { ORIGINAL_FRONTMATTER } }
---

# {{TITLE}}

Follow the prompt defined in [.claude/prompt-snippets/{{NAME}}.md](../../.claude/prompt-snippets/{{NAME}}.md).
```

**Agents** — For each `.github/agents/*.agent.md`:

1. Check if a matching snippet exists in `.claude/agents-snippets/`
2. If no matching snippet: extract body → create `.claude/agents-snippets/<name>.md`
3. Replace body with thin wrapper:

```markdown
---
{ { ORIGINAL_FRONTMATTER } }
---

# {{AGENT_NAME}}

Follow the agent definition in [.claude/agents-snippets/{{NAME}}.md](../../.claude/agents-snippets/{{NAME}}.md).
```

### Step 6: Convert .cursor/ Files to Thin Wrappers

> **Parallelizable**: Process rules, commands, and agents in parallel.

**Rules** — For each `.cursor/rules/*.mdc`:

1. Check if a matching snippet exists in `.claude/rules-snippets/`
2. If no matching snippet: extract body → create `.claude/rules-snippets/<name>.md`
3. Replace body with thin wrapper preserving original `.mdc` frontmatter:

```markdown
---
{ { ORIGINAL_MDC_FRONTMATTER } }
---

# {{TITLE}}

Follow the rules defined in [.claude/rules-snippets/{{NAME}}.md](../../.claude/rules-snippets/{{NAME}}.md).
```

**Commands** — For each `.cursor/commands/*.md`:

1. Check if a matching snippet exists in `.claude/prompt-snippets/`
2. If no matching snippet: extract body → create `.claude/prompt-snippets/<name>.md`
3. Replace body with thin wrapper referencing `../../.claude/prompt-snippets/{{NAME}}.md`

**Agents** — For each `.cursor/agents/*.agent.md`:

1. Check if a matching snippet exists in `.claude/agents-snippets/`
2. If no matching snippet: extract body → create `.claude/agents-snippets/<name>.md`
3. Replace body with thin wrapper referencing `../../.claude/agents-snippets/{{NAME}}.md`

### Step 7: Create .opencode/ Directory (confirmed OpenCode use only)

Create wrappers below only for entries the patch plan classifies *add* (never retired or not-relevant snippets). Each wrapper stays thin (see Thin Wrapper Policy in `bootstrap.md`).

For the v3 route, merge only relevant native OpenCode host fields; preserve existing wrapper bodies, modes, unrelated frontmatter, and shared snippet bodies/frontmatter. The wrapper examples below apply only to approved missing files, not replacement of existing wrappers.

1. Merge `.opencode/opencode.jsonc` using native V2 fields:

   ```json
   {
     "$schema": "https://opencode.ai/config.json",
      "instructions": ["AGENTS.md", ".opencode/rules/*.md"],
      "skills": [".agents/skills"],
      "lsp": true
   }
   ```

   Follow official V2 [migration](https://opencode.ai/v2/docs/migrate-v1), [config](https://opencode.ai/v2/docs/config), [agents](https://opencode.ai/v2/docs/agents), and [plugins](https://opencode.ai/v2/docs/build/plugins) docs. The published schema may describe V1; do not use it or a V1 API fetch as native V2 validation authority. Use `agents`/JSON `system` (Markdown bodies for file agents), ordered `permissions` (`action`/`resource`/`effect`, `shell`/`subagent`, last match wins), `commands`/`subagent`, `plugins` with `{ "package": "…", "options": {} }`, skill-directory arrays, and `mcp.servers` with inverse `disabled` and `timeout.catalog`/`timeout.execution`.

   Ambient root/nested `AGENTS.md` works. `instructions` entries load only when the runtime injects them (OpenChamber does; other hosts may not), so do not rely on them: write explicit "Read and follow" wrappers regardless. `@refs` are ordinary text, not attachments: wrappers must explicitly tell agents to read referenced snippets. Do not set a temperature; the current runner does not send one. Preserve `lsp: true`; use workspace lint/typecheck/compiler commands (no current V2 LSP tools/diagnostics). `--env opencode` supplies minimal shared references without other harness activation. Verify using installed V2 after the next run/restart; report only checks actually run.

2. **Replace obsolete toolkit Ponytail (backup and approval only)**:
   - Back up the local config and known obsolete toolkit-owned `.opencode/plugins/ponytail.js`, `.opencode/plugins/ponytail.mjs`, and `.opencode/plugins/ponytail.ts` copies; obtain approval before removing only those copies. Preserve unrelated local plugins.
   - The OpenCode Ponytail plugin (`@dietrichgebert/ponytail`) is installed globally by the operator. Never add or pin it in the local `plugins` array. Check whether it is installed globally; if not, tell the operator to install it globally. Do not edit global config or overwrite global plugins. Keep `opentmux` commented as V1-only; do not copy local Ponytail source, port APIs, or introduce bridges. Runtime integration remains untested.

3. Create `.opencode/commands/*.md` — one thin wrapper per `.claude/commands/*.md`:

   ```markdown
   ---
   description: "{{DESCRIPTION}}"
   agent: build
   ---

   # {{TITLE}}

   Read and follow `.claude/prompt-snippets/{{NAME}}.md` before executing this command.
   ```

4. Create `.opencode/rules/*.md` — one thin wrapper per `.claude/rules/*.md`:

   ```markdown
   # {{TITLE}}

   Read and follow `.claude/rules-snippets/{{NAME}}.md` when these standards apply.
   ```

5. Create `.opencode/agents/*.md` — one thin wrapper per `.claude/agents/*.agent.md`:

   ```markdown
   ---
   description: "{{DESCRIPTION}}"
   mode: subagent
   ---

   # {{AGENT_NAME}}

   Read and follow `.claude/agents-snippets/{{NAME}}.md` before performing this role.
   ```

### Step 8: Install Pre-Commit Hook

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

### Step 9: Install Project Hooks (only with approval)

The `hooks/` files are Claude Code plugin hooks (`${CLAUDE_PLUGIN_ROOT}`) and the Ponytail runtime. They fire only when installed through the Ponytail plugin, not from project settings. Copy only the files the operator approves for a project that uses that plugin, and never overwrite an existing hook file.

1. Create `hooks/` in the target project when copying
2. Copy the approved files from the template's `hooks/*` directory (preserve sub-structure); skip any file that already exists
3. On Unix, make executable only the exact `.js` paths this step copied, one `chmod +x <path>` each. No wildcard.

### Step 10: Clean Up Duplicate Skills

- Merge approved `.agents/rules/*.md` additions without overwriting custom content; skip this step on the v3 route.
- Preserve custom, unmatched, modified, and nested skill content; name or location alone does not prove duplication.
- A candidate in a confirmed harness skill directory may be removed only after the same-name canonical `.agents/skills/<skill-name>/` copy exists and a complete recursive comparison (`diff -qr` or equivalent, including nested content) proves them identical. Missing canonical copy, differences, or comparison errors mean preserve and report, not delete.
- Back up the verified identical duplicate and obtain explicit approval before removing only that duplicate; keep the canonical copy intact. No bulk deletion or name/location-based nested cleanup.
- Removal also needs an independent review PASS of the exact candidate (the `bootstrap-patch.md` review loop) and the explicit consent above. Retiring a skill in `.nitm/retired.json` is never removal.

### Step 11: Update CLAUDE.md

If `CLAUDE.md` is an applicable confirmed harness target, merge only missing relevant sections; preserve existing bodies/frontmatter:

1. **Multi-tool sections** — add if missing:
   - GitHub Copilot section (references `.github/instructions/`, `.github/prompts/`, `.github/agents/`)
   - Cursor IDE section (references `.cursor/rules/`, `.cursor/commands/`, `.cursor/agents/`)
   - OpenCode section (references `.opencode/`)

2. **Monorepo-specific sections** — preserve existing or add if missing:
   - Apps section (references per-app `AGENTS.md` files)
   - Packages section
   - Build system section ({{BUILD_SYSTEM}} detected in Step 1)

3. **Snippet architecture section** — add:

   ```markdown
   ## Snippet Architecture

   Content lives in `.claude/{rules,prompt,agents}-snippets/`. All tool configs are thin wrappers:

   - `.claude/rules/*.md` → `.claude/rules-snippets/`
   - `.claude/commands/*.md` → `.claude/prompt-snippets/`
   - `.claude/agents/*.agent.md` → `.claude/agents-snippets/`
   - `.github/instructions/*.md` → `.claude/rules-snippets/`
   - `.github/prompts/*.md` → `.claude/prompt-snippets/`
   - `.github/agents/*.agent.md` → `.claude/agents-snippets/`
   - `.cursor/rules/*.mdc` → `.claude/rules-snippets/`
   - `.cursor/commands/*.md` → `.claude/prompt-snippets/`
   - `.cursor/agents/*.agent.md` → `.claude/agents-snippets/`
   - `.opencode/{commands,rules,agents}/*.md` → explicit read instructions for `.claude/{snippet-type}/` (no automatic `@ref` attachment)
   ```

### Step 12: Create .toolkit-version File

This is phase 2 of the Migration order: the pinned CLI refresh of the marker, with its own approval.

1. Use the same verified source and the same invocation as `bootstrap-patch.md` step 5. Run `node "$SOURCE_ROOT/bin/cli.js" patch --dry-run` from the target directory against the actual post-native state, and compare it with the reviewed expected CLI set and before-state for this phase, not with the earlier pre-native output. Do not download a second copy, and do not use an unpinned `npx` command.
2. **STOP** before any CLI write if the preview shows a protected v3 mutation (any `update` or `overwrite` of an existing snippet, wrapper, or other v3 file), or any difference, overlap, or conflict that was not reviewed and approved. Re-enter planning, review, and consent for the changed set, or leave the refresh pending. The approved native structural path is unaffected.
3. If the set matches, run the approved apply with the same invocation. The CLI writes `.toolkit-version`, `.nitm/manifest.json`, `.nitm/toolkit.json` (only when a new selection was chosen), and `.nitm/BOOTSTRAP.md`. Keep the `.toolkit-version` value the CLI writes (the installed package version, 4.0.0 or later; never hard-coded). Never write `.toolkit-version` by hand.
4. **Handoff backup (recorded action):** read the handoff action the dry run recorded for this phase: `create`, `replace (old copy backed up)`, or `no change`. For `replace`, exactly one new `BOOTSTRAP.<UTC stamp>[-N].md` must appear in `.nitm/backups/`, and its sha256 must equal the before-state of `.nitm/BOOTSTRAP.md` recorded in the write set. For `create` or `no change`, zero new automatic handoff backups must appear. Any other count or hash is **STOP** and report. This is separate from the guide's own backup.
5. Keep the temp source from `bootstrap-patch.md` step 1 until its terminal cleanup. If it is gone on resume, re-verify its identity before reuse.
6. Report the native and marker outcomes separately, with any pending calibration. Never mark the migration complete from the marker alone.

### Step 13: Validation

Run only checks applicable to the selected route and confirmed harnesses (parallelizable); on v3 compare retained snippet bodies/frontmatter to backups:

1. **Snippet completeness**: Every `.md` file in `.claude/rules-snippets/`, `.claude/prompt-snippets/`, `.claude/agents-snippets/` must have content (not empty)
2. **Thin wrapper correctness**: Every thin wrapper must contain a reference to its snippet with the correct relative path
3. **Monorepo `paths:` preserved**: For files that had `paths:` frontmatter in `.claude/rules/`, verify the snippet also contains `paths:`
4. **No lost placeholders**: Scan all snippet files — any `{{` in original must appear in snippet
5. **No broken paths**: Verify all relative paths resolve correctly (e.g., `../rules-snippets/` from `.claude/rules/`)
6. **Custom skills preserved**: Only approved verified identical duplicates were removed; canonical copies and custom, unmatched, and nested content remain

**Independent review of the actual outcome.** Dispatch the same independent read-only reviewer used in Migration order step 2, on the actual applied outcome: the native set plus the CLI refresh when it was applied, or the native set alone when the refresh was barred. Follow the post-apply loop in `bootstrap-patch.md` step 6: a CHANGES repair stays within the approved scope, and any follow-up write is a new proposal. Required calibration that is still unmet stays blocked pending calibration and does not block the independent native path. Report **reviewer-accepted** only for a current, scoped outcome with a PASS and verified evidence; otherwise report applied or pending. A preview is never reported as applied. No commit is implied; the commit rule is `bootstrap-patch.md` step 5f.

If `--verbose`: log each check result.

### Step 14: Generate Upgrade Report

Include only operations/checks actually performed for the selected route; omit legacy extraction/cleanup rows on v3 and never pre-mark skipped checks as passed.

```markdown
## Monorepo Upgrade Status: toolkit <version> (write only after Step 13 verification)

### Build System: {{BUILD_SYSTEM}}

**Selected route**: verified legacy | v3 native OpenCode

### Directories Created

| Directory                  | Files |
| -------------------------- | ----- |
| `.claude/rules-snippets/`  | {{N}} |
| `.claude/prompt-snippets/` | {{N}} |
| `.claude/agents-snippets/` | {{N}} |
| `.opencode/commands/`      | {{N}} |
| `.opencode/rules/`         | {{N}} |
| `.opencode/agents/`        | {{N}} |

### Files Converted to Thin Wrappers

| Category                | Count | Example                                           |
| ----------------------- | ----- | ------------------------------------------------- |
| `.claude/rules/`        | {{N}} | `coding-standards.md` → thin wrapper              |
| `.claude/commands/`     | {{N}} | `bootstrap.md` → thin wrapper                     |
| `.claude/agents/`       | {{N}} | `reviewer.agent.md` → thin wrapper                |
| `.github/instructions/` | {{N}} | `coding-standards.instructions.md` → thin wrapper |
| `.github/prompts/`      | {{N}} | `specify.prompt.md` → thin wrapper                |
| `.github/agents/`       | {{N}} | `reviewer.agent.md` → thin wrapper                |
| `.cursor/rules/`        | {{N}} | `coding-standards.mdc` → thin wrapper             |
| `.cursor/commands/`     | {{N}} | `bootstrap.md` → thin wrapper                     |
| `.cursor/agents/`       | {{N}} | `reviewer.agent.md` → thin wrapper                |

### New Files

| File                       | Purpose                    |
| -------------------------- | -------------------------- |
| `.opencode/opencode.jsonc` | OpenCode configuration     |
| `.toolkit-version`         | Version tracking (installed package version) |

### Validation Results

| Check                          | Status                                     |
| ------------------------------ | ------------------------------------------ |
| Snippet completeness           | Report actual applicable checks            |
| Thin wrapper references        | Report actual applicable checks            |
| `paths:` frontmatter preserved | Report actual checks; v3 snippets unchanged |
| No lost placeholders           | Report actual `{{VAR}}` preservation checks |
| No broken paths                | Report actual applicable checks            |

### Cleanup

- Removed only verified identical duplicates after comparison, backup, and approval (if performed)
- Preserved custom, unmatched, and nested skill content and canonical `.agents/skills/` copies

### Next Steps

1. Review thin wrappers to confirm snippet paths are correct
2. Run `/bootstrap-patch` to sync with latest toolkit templates
3. Test a few commands (`/bootstrap`, `/specify`) to verify they work
4. Commit the migration only if you ask, with approved paths only
```

### Step 15: Git Commit

Only on an explicit request, after the Step 13 acceptance. Apply the commit rule in `bootstrap-patch.md` step 5f to the upgrade's approved paths: the baseline, the empty index, the content and mode checks, the staged-content check, and the ban on `git add -A`, `git add .`, `git add -f`, `git reset`, and `git restore --staged`. Commit message: `chore: upgrade AI instructions to toolkit <version>`.

If `--dry-run`: skip commit, note in report: "Dry run — no changes committed."

## Error Handling

- If a `.claude/rules/*.md` file is already a thin wrapper (< 20 lines with a snippet reference), skip it
- If `.github/instructions/*.instructions.md` already references `.claude/rules-snippets/`, skip it
- If a snippet file already exists with content, do not overwrite — log a warning
- If `.opencode/` already exists, add missing files and propose native V2 conversion of existing host files; preserve customizations and skip files already migrated

## Notes

- This command is idempotent — safe to re-run if interrupted
- Per-app `AGENTS.md` files in `apps/*/` are not modified by this migration
- Shared package docs in `packages/*/` are not modified
- The `paths:` frontmatter in monorepo rules enables path-scoped rule application (e.g., `apps/**`, `packages/**`)
