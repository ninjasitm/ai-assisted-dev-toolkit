# Bootstrap Upgrade — Monorepo

Migrate this monorepo's AI instruction files from the pre-3.0 inline pattern to the 3.0+ snippet-based architecture.

## Orchestrator Checkpoint

> **🛑 Before starting**: This command involves reading, extracting, and rewriting many files across multiple directories.
> Dispatch parallel subagents for independent file groups (`.claude/`, `.github/`, `.cursor/`, `.opencode/`).
> Steps 3-6 can run in parallel per directory. Steps 7-8 are sequential.

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

2. **Check existing version**: Read `.toolkit-version` if it exists.
   - If version is `>= 3.0.0` and snippet directories exist → **abort**: "Already on v3.0+. No migration needed."
   - If version is `< 3.0.0` or missing → proceed.

3. **Detect build system** (for CLAUDE.md update in Step 9):
   - `turbo.json` → Turborepo
   - `nx.json` → Nx
   - `lerna.json` → Lerna
   - `pnpm-workspace.yaml` → pnpm workspaces
   - `workspaces` in `package.json` → npm/yarn workspaces

4. **Inventory files to migrate** (parallelizable — scan all directories simultaneously):

   | Directory | Glob | Count |
   |-----------|------|-------|
   | `.claude/rules/` | `*.md` | {{N}} |
   | `.claude/commands/` | `*.md` | {{N}} |
   | `.claude/agents/` | `*.agent.md` | {{N}} |
   | `.github/instructions/` | `*.instructions.md` | {{N}} |
   | `.github/prompts/` | `*.prompt.md` | {{N}} |
   | `.github/agents/` | `*.agent.md` | {{N}} |
   | `.cursor/rules/` | `*.mdc` | {{N}} |
   | `.cursor/commands/` | `*.md` | {{N}} |
   | `.cursor/agents/` | `*.agent.md` | {{N}} |

5. **Present summary and ask for confirmation**:

   ```markdown
   ## 🔄 Monorepo Upgrade: Pre-3.0 → v3.0.0 (Snippet Architecture)

   ### What will change

   - Create `.claude/rules-snippets/`, `.claude/prompt-snippets/`, `.claude/agents-snippets/`
   - Extract content from {{N}} files into snippet files
   - Convert originals to thin wrappers referencing snippets
   - Create `.opencode/` directory with thin wrappers
   - Clean up duplicate skill directories
   - Update CLAUDE.md with multi-tool sections
   - Write `.toolkit-version` with `3.0.0`

   ### Monorepo-specific changes

   - `paths:` frontmatter preserved in rule snippets (app/package scoping)
   - Per-app AGENTS.md files left untouched
   - Cross-app instruction references maintained

   Proceed? (Y/n)
   ```

### Step 2: Create Snippet Directories

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
{{ORIGINAL_FRONTMATTER}}
---

# {{TITLE}}

Follow the rules defined in [.claude/rules-snippets/{{name}}.md](../rules-snippets/{{name}}.md).
```

**Commands** — Replace each `.claude/commands/*.md` body with:

```markdown
---
{{ORIGINAL_FRONTMATTER}}
---

# {{TITLE}}

Follow the prompt defined in [.claude/prompt-snippets/{{name}}.md](../prompt-snippets/{{name}}.md).
```

**Agents** — Replace each `.claude/agents/*.agent.md` body with:

```markdown
---
{{ORIGINAL_FRONTMATTER}}
---

# {{AGENT_NAME}}

Follow the agent definition in [.claude/agents-snippets/{{name}}.md](../agents-snippets/{{name}}.md).
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

Follow the rules defined in [.claude/rules-snippets/{{name}}.md](../../.claude/rules-snippets/{{name}}.md).
```

**Prompts** — For each `.github/prompts/*.prompt.md`:
1. Check if a matching snippet exists in `.claude/prompt-snippets/`
2. If no matching snippet: extract body → create `.claude/prompt-snippets/<name>.md`
3. Replace body with thin wrapper:

```markdown
---
{{ORIGINAL_FRONTMATTER}}
---

# {{TITLE}}

Follow the prompt defined in [.claude/prompt-snippets/{{name}}.md](../../.claude/prompt-snippets/{{name}}.md).
```

**Agents** — For each `.github/agents/*.agent.md`:
1. Check if a matching snippet exists in `.claude/agents-snippets/`
2. If no matching snippet: extract body → create `.claude/agents-snippets/<name>.md`
3. Replace body with thin wrapper:

```markdown
---
{{ORIGINAL_FRONTMATTER}}
---

# {{AGENT_NAME}}

Follow the agent definition in [.claude/agents-snippets/{{name}}.md](../../.claude/agents-snippets/{{name}}.md).
```

### Step 6: Convert .cursor/ Files to Thin Wrappers

> **Parallelizable**: Process rules, commands, and agents in parallel.

**Rules** — For each `.cursor/rules/*.mdc`:
1. Check if a matching snippet exists in `.claude/rules-snippets/`
2. If no matching snippet: extract body → create `.claude/rules-snippets/<name>.md`
3. Replace body with thin wrapper preserving original `.mdc` frontmatter:

```markdown
---
{{ORIGINAL_MDC_FRONTMATTER}}
---

# {{TITLE}}

Follow the rules defined in [.claude/rules-snippets/{{name}}.md](../../.claude/rules-snippets/{{name}}.md).
```

**Commands** — For each `.cursor/commands/*.md`:
1. Check if a matching snippet exists in `.claude/prompt-snippets/`
2. If no matching snippet: extract body → create `.claude/prompt-snippets/<name>.md`
3. Replace body with thin wrapper referencing `../../.claude/prompt-snippets/{{name}}.md`

**Agents** — For each `.cursor/agents/*.agent.md`:
1. Check if a matching snippet exists in `.claude/agents-snippets/`
2. If no matching snippet: extract body → create `.claude/agents-snippets/<name>.md`
3. Replace body with thin wrapper referencing `../../.claude/agents-snippets/{{name}}.md`

### Step 7: Create .opencode/ Directory

1. Create `.opencode/opencode.json` using only supported schema keys:

   ```json
   {
     "$schema": "https://opencode.ai/config.json",
     "instructions": [
       "AGENTS.md",
       ".opencode/rules/*.md"
     ],
     "skills": {
       "paths": [
         ".agents/skills/**/*.md",
         ".claude/skills/**/*.md"
       ]
     },
     "lsp": true
   }
   ```

   **⚠️ Schema Validation:** Only use supported top-level keys from `https://opencode.ai/config.json`. Do NOT add unsupported keys like `rules`, `commands`, or `agents` as top-level entries — OpenCode discovers these via the `.opencode/` directory structure and the `instructions`/`skills` config arrays.

   **Supported top-level keys:** `$schema`, `instructions`, `skills`, `agent`, `default_agent`, `model`, `small_model`, `provider`, `mcp`, `tools`, `permission`, `lsp`, `formatter`, `server`, `shell`, `command`, `plugin`, `watcher`, `snapshot`, `share`, `autoupdate`, `compaction`, `attachment`, `logLevel`, `disabled_providers`, `enabled_providers`, `tool_output`, `enterprise`, `experimental`

2. Create `.opencode/commands/*.md` — one thin wrapper per `.claude/commands/*.md`:

   ```markdown
   ---
   description: "{{DESCRIPTION}}"
   agent: build
   ---

   # {{TITLE}}

   @.claude/prompt-snippets/{{name}}.md
   ```

3. Create `.opencode/rules/*.md` — one thin wrapper per `.claude/rules/*.md`:

   ```markdown
   # {{TITLE}}

   @.claude/rules-snippets/{{name}}.md
   ```

4. Create `.opencode/agents/*.md` — one thin wrapper per `.claude/agents/*.agent.md`:

   ```markdown
   ---
   description: "{{DESCRIPTION}}"
   mode: subagent
   ---

   # {{AGENT_NAME}}

   @.claude/agents-snippets/{{name}}.md
   ```

### Step 8: Clean Up Duplicate Skills

1. Keep `.agents/skills/` as the source of truth
2. For each of `.claude/skills/`, `.cursor/skills/`, `.github/skills/`:
   - If directory exists, remove all subdirectories except `README.md`
3. Remove any nested duplicates: `subagent-driven-development/subagent-driven-development/`

### Step 9: Update CLAUDE.md

Read the existing `CLAUDE.md` and add missing sections:

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
   - `.opencode/{commands,rules,agents}/*.md` → `@.claude/{snippet-type}/`
   ```

### Step 10: Create .toolkit-version File

Write `3.0.0` to `.toolkit-version`.

### Step 11: Validation

Run these checks (parallelizable):

1. **Snippet completeness**: Every `.md` file in `.claude/rules-snippets/`, `.claude/prompt-snippets/`, `.claude/agents-snippets/` must have content (not empty)
2. **Thin wrapper correctness**: Every thin wrapper must contain a reference to its snippet with the correct relative path
3. **Monorepo `paths:` preserved**: For files that had `paths:` frontmatter in `.claude/rules/`, verify the snippet also contains `paths:`
4. **No lost placeholders**: Scan all snippet files — any `{{` in original must appear in snippet
5. **No broken paths**: Verify all relative paths resolve correctly (e.g., `../rules-snippets/` from `.claude/rules/`)

If `--verbose`: log each check result.

### Step 12: Generate Upgrade Report

```markdown
## ✅ Monorepo Upgrade Complete: v3.0.0 (Snippet Architecture)

### Build System: {{BUILD_SYSTEM}}

### Directories Created

| Directory | Files |
|-----------|-------|
| `.claude/rules-snippets/` | {{N}} |
| `.claude/prompt-snippets/` | {{N}} |
| `.claude/agents-snippets/` | {{N}} |
| `.opencode/commands/` | {{N}} |
| `.opencode/rules/` | {{N}} |
| `.opencode/agents/` | {{N}} |

### Files Converted to Thin Wrappers

| Category | Count | Example |
|----------|-------|---------|
| `.claude/rules/` | {{N}} | `coding-standards.md` → thin wrapper |
| `.claude/commands/` | {{N}} | `bootstrap.md` → thin wrapper |
| `.claude/agents/` | {{N}} | `reviewer.agent.md` → thin wrapper |
| `.github/instructions/` | {{N}} | `coding-standards.instructions.md` → thin wrapper |
| `.github/prompts/` | {{N}} | `specify.prompt.md` → thin wrapper |
| `.github/agents/` | {{N}} | `reviewer.agent.md` → thin wrapper |
| `.cursor/rules/` | {{N}} | `coding-standards.mdc` → thin wrapper |
| `.cursor/commands/` | {{N}} | `bootstrap.md` → thin wrapper |
| `.cursor/agents/` | {{N}} | `reviewer.agent.md` → thin wrapper |

### New Files

| File | Purpose |
|------|---------|
| `.opencode/opencode.json` | OpenCode configuration |
| `.toolkit-version` | Version tracking (`3.0.0`) |

### Validation Results

| Check | Status |
|-------|--------|
| Snippet completeness | ✅ All snippets have content |
| Thin wrapper references | ✅ All wrappers reference correct snippets |
| `paths:` frontmatter preserved | ✅ Monorepo scoping intact |
| No lost placeholders | ✅ All `{{VAR}}` preserved |
| No broken paths | ✅ All relative paths resolve |

### Cleanup

- Removed duplicate skill directories from `.claude/skills/`, `.cursor/skills/`, `.github/skills/`
- Kept `.agents/skills/` as source of truth

### Next Steps

1. Review thin wrappers to confirm snippet paths are correct
2. Run `/bootstrap-patch` to sync with latest toolkit templates
3. Test a few commands (`/bootstrap`, `/specify`) to verify they work
4. Commit the migration
```

### Step 13: Git Commit

```bash
git add -A
git commit -m "chore: upgrade AI instructions to toolkit v3.0.0 (snippet architecture)"
```

## Error Handling

- If a `.claude/rules/*.md` file is already a thin wrapper (< 20 lines with a snippet reference), skip it
- If `.github/instructions/*.instructions.md` already references `.claude/rules-snippets/`, skip it
- If a snippet file already exists with content, do not overwrite — log a warning
- If `.opencode/` already exists, merge new files without overwriting existing ones

## Notes

- This command is idempotent — safe to re-run if interrupted
- Per-app `AGENTS.md` files in `apps/*/` are not modified by this migration
- Shared package docs in `packages/*/` are not modified
- The `paths:` frontmatter in monorepo rules enables path-scoped rule application (e.g., `apps/**`, `packages/**`)
