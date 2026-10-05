# Bootstrap Upgrade — Monorepo

Upgrade this monorepo to toolkit 4.0.0, including native OpenCode V2 for confirmed OpenCode users. For pre-3.0 installations, also migrate inline content to snippet-based architecture. Only modify confirmed harness targets; preserve unrelated harness/Codex behavior.

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

1. **Confirm monorepo structure**: Verify `apps/` and `packages/` directories exist at root. If not, abort and suggest using the single-repo upgrade command instead.

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
    ## 🔄 Monorepo Upgrade: toolkit v4.0.0

    **Selected route**: verified legacy | v3 native OpenCode

    ### What will change (omit skipped steps for the selected route)

    - Verified legacy only: create missing snippet directories, extract inline content from {{N}} files, and convert confirmed harness wrappers (Steps 2–6)
    - Confirmed OpenCode only: merge native V2 host files and approved missing wrappers (Step 7)
    - Verified legacy only: approved hook installation and verified identical duplicate skill cleanup (Steps 8–10); preserve custom skills
    - Merge only applicable missing documentation and validate the selected route; v3 keeps existing snippet bodies/frontmatter unchanged
   - Write `.toolkit-version` with `4.0.0` after the approved migration

   ### Monorepo-specific changes

   - `paths:` frontmatter preserved in rule snippets (app/package scoping)
   - Per-app AGENTS.md files left untouched
   - Cross-app instruction references maintained

   Proceed? (Y/n)
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

For the v3 route, merge only relevant native OpenCode host fields; preserve existing wrapper bodies, modes, unrelated frontmatter, and shared snippet bodies/frontmatter. The wrapper examples below apply only to approved missing files, not replacement of existing wrappers.

1. Merge `.opencode/opencode.jsonc` using native V2 fields:

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

   `instructions` entries are accepted but not loaded; ambient root/nested `AGENTS.md` works. `@refs` are ordinary text, not attachments: wrappers must explicitly tell agents to read referenced snippets. `request.body.temperature` remains in config, but the current runner does not send it. Preserve `lsp: true`; use workspace lint/typecheck/compiler commands (no current V2 LSP tools/diagnostics). `--env opencode` supplies minimal shared references without other harness activation. Verify using installed V2 after the next run/restart; report only checks actually run.

2. **Replace obsolete toolkit Ponytail (backup and approval only)**:
   - Back up the local config and known obsolete toolkit-owned `.opencode/plugins/ponytail.js`, `.opencode/plugins/ponytail.mjs`, and `.opencode/plugins/ponytail.ts` copies; obtain approval before removing only those copies. Preserve unrelated local plugins.
   - Merge/deduplicate the author's native V2 `@dietrichgebert/ponytail@4.12.0` package in the local `plugins` array where appropriate, preserving other registrations/options. Do not edit global config or overwrite global plugins. Keep `opentmux` commented as V1-only; do not copy local Ponytail source, port APIs, or introduce bridges. Native local discovery needs no duplicate explicit registration; runtime integration remains untested.

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

### Step 9: Install Project Hooks

1. Create `hooks/` directory in the target project
2. Copy all files from the template's `hooks/*` directory (preserve sub-structure)
3. Make `.js` files executable on Unix: `chmod +x hooks/*.js`

### Step 10: Clean Up Duplicate Skills

- Merge approved `.agents/rules/*.md` additions without overwriting custom content; skip this step on the v3 route.
- Preserve custom, unmatched, modified, and nested skill content; name or location alone does not prove duplication.
- A candidate in a confirmed harness skill directory may be removed only after the same-name canonical `.agents/skills/<skill-name>/` copy exists and a complete recursive comparison (`diff -qr` or equivalent, including nested content) proves them identical. Missing canonical copy, differences, or comparison errors mean preserve and report, not delete.
- Back up the verified identical duplicate and obtain explicit approval before removing only that duplicate; keep the canonical copy intact. No bulk deletion or name/location-based nested cleanup.

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

Write `4.0.0` to `.toolkit-version` only after the approved migration and OpenCode preflight pass (or OpenCode is confirmed out of scope).

### Step 13: Validation

Run only checks applicable to the selected route and confirmed harnesses (parallelizable); on v3 compare retained snippet bodies/frontmatter to backups:

1. **Snippet completeness**: Every `.md` file in `.claude/rules-snippets/`, `.claude/prompt-snippets/`, `.claude/agents-snippets/` must have content (not empty)
2. **Thin wrapper correctness**: Every thin wrapper must contain a reference to its snippet with the correct relative path
3. **Monorepo `paths:` preserved**: For files that had `paths:` frontmatter in `.claude/rules/`, verify the snippet also contains `paths:`
4. **No lost placeholders**: Scan all snippet files — any `{{` in original must appear in snippet
5. **No broken paths**: Verify all relative paths resolve correctly (e.g., `../rules-snippets/` from `.claude/rules/`)
6. **Custom skills preserved**: Only approved verified identical duplicates were removed; canonical copies and custom, unmatched, and nested content remain

If `--verbose`: log each check result.

### Step 14: Generate Upgrade Report

Include only operations/checks actually performed for the selected route; omit legacy extraction/cleanup rows on v3 and never pre-mark skipped checks as passed.

```markdown
## ✅ Monorepo Upgrade Complete: v4.0.0

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
| `.toolkit-version`         | Version tracking (`4.0.0`) |

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
4. Commit the migration
```

### Step 15: Git Commit

```bash
git add -A
git commit -m "chore: upgrade AI instructions to toolkit v4.0.0"
```

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
