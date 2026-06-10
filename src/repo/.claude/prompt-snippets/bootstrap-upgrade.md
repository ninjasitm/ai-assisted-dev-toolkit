# Bootstrap Upgrade to v3.0

One-time migration from pre-3.0 inline pattern to 3.0+ snippet-based architecture. Converts all tool directories (`.claude/`, `.github/`, `.cursor/`) to thin wrappers referencing centralized snippets, creates `.opencode/` directory, and cleans up duplicate skills.

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
> Steps 3–6 are **parallelizable** — dispatch one subagent per directory tree (rules, commands, agents, instructions, prompts).
> See `.github/instructions/subagent-workflow.instructions.md` for patterns.

## Process

### 1. Pre-flight Checks

Run all checks before making any changes:

1. **Detect project type**:
   - If `apps/` and `packages/` directories exist at root → `monorepo` (use `src/monorepo/` templates)
   - Otherwise → `repo` (use `src/repo/` templates)

2. **Check toolkit version**:
   - If `.toolkit-version` exists and contains `3.0.0` or higher → **abort** with message: "Project already on v3.0+. Run `/bootstrap-patch` for incremental updates."
   - If `.toolkit-version` exists with a version below `3.0.0` → migration needed
   - If `.toolkit-version` is missing → migration needed (legacy project)

3. **Confirm migration scope**:

   ```markdown
   ## 🔄 Bootstrap Upgrade: pre-3.0 → 3.0+

   **Project type**: repo | monorepo
   **Current version**: <version or "none (legacy)">

   ### What will happen:

   1. Create snippet directories: `.claude/rules-snippets/`, `.claude/prompt-snippets/`, `.claude/agents-snippets/`
   2. Extract content from `.claude/` files → snippet files
   3. Convert `.claude/` files to thin wrappers
   4. Convert `.github/` files to thin wrappers
   5. Convert `.cursor/` files to thin wrappers
   6. Create `.opencode/` directory with config and wrappers
   7. Clean up duplicate skill directories
   8. Update `CLAUDE.md` with multi-tool sections
   9. Create `.toolkit-version` with `3.0.0`
   10. Commit all changes

   Proceed? (Y/n)
   ```

   If `--dry-run`: show the report and **stop** — do not write any files.

### 2. Create Snippet Directories

```bash
mkdir -p .claude/rules-snippets
mkdir -p .claude/prompt-snippets
mkdir -p .claude/agents-snippets
```

### 3. Extract Content from `.claude/` → Snippet Files

**Parallelizable**: Process rules, commands, and agents independently.

**Frontmatter extraction rule**: Content between the first `---` and the second `---` is frontmatter. Everything after the second `---` (including leading newline) is the body.

| Source | Destination | Example |
|--------|-------------|---------|
| `.claude/rules/*.md` body | `.claude/rules-snippets/<name>.md` | `coding-standards.md` |
| `.claude/commands/*.md` body | `.claude/prompt-snippets/<name>.md` | `bootstrap.md` |
| `.claude/agents/*.agent.md` body | `.claude/agents-snippets/<name>.md` | `reviewer.agent.md` |

For each file: read → extract body after frontmatter → write to snippet destination. **Preserve all `{{PLACEHOLDER}}` values exactly.**

### 4. Convert `.claude/` Files to Thin Wrappers

**Parallelizable**: Process rules, commands, and agents independently.

Replace each file's body with a wrapper that preserves frontmatter and references the snippet:

| File Type | Frontmatter to Keep | Reference Line |
|-----------|---------------------|----------------|
| `.claude/rules/*.md` | `applyTo`, `description` | `Follow the rules defined in [../rules-snippets/<name>.md](../rules-snippets/<name>.md).` |
| `.claude/commands/*.md` | `description`, `allowed-tools`, `argument-hint` | `Follow the prompt defined in [../prompt-snippets/<name>.md](../prompt-snippets/<name>.md).` |
| `.claude/agents/*.agent.md` | `name`, `description`, `tools` | `Follow the agent definition in [../agents-snippets/<name>.md](../agents-snippets/<name>.md).` |

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

| Source | Frontmatter | Snippet Target | Reference Path |
|--------|-------------|----------------|----------------|
| `.github/instructions/*.instructions.md` | `applyTo`, `description` | `.claude/rules-snippets/<name>.md` | `../../.claude/rules-snippets/<name>.md` |
| `.github/prompts/*.prompt.md` | `description` | `.claude/prompt-snippets/<name>.md` | `../../.claude/prompt-snippets/<name>.md` |
| `.github/agents/*.agent.md` | `name`, `description`, `tools` | `.claude/agents-snippets/<name>.md` | `../../.claude/agents-snippets/<name>.md` |

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

| Source | Snippet Target | Reference Path |
|--------|----------------|----------------|
| `.cursor/rules/*.mdc` | `.claude/rules-snippets/<name>.md` | `../../.claude/rules-snippets/<name>.md` |
| `.cursor/commands/*.md` | `.claude/prompt-snippets/<name>.md` | `../../.claude/prompt-snippets/<name>.md` |
| `.cursor/agents/*.agent.md` | `.claude/agents-snippets/<name>.md` | `../../.claude/agents-snippets/<name>.md` |

For `.cursor/rules/*.mdc`: preserve the original frontmatter exactly (it may use different field names than `.claude/` rules).

### 7. Create `.opencode/` Directory

1. **Create `.opencode/opencode.json`**:
   ```json
   {
     "$schema": "https://opencode.ai/schema.json",
     "rules": [".opencode/rules/*.md"],
     "commands": [".opencode/commands/*.md"],
     "agents": [".opencode/agents/*.md"]
   }
   ```

2. **Create wrappers using `@` import syntax** — one file per snippet:

   | Directory | Source Snippets | Wrapper Body |
   |-----------|-----------------|--------------|
   | `.opencode/commands/*.md` | `.claude/prompt-snippets/` | `@.claude/prompt-snippets/<name>.md` |
   | `.opencode/rules/*.md` | `.claude/rules-snippets/` | `@.claude/rules-snippets/<name>.md` |
   | `.opencode/agents/*.md` | `.claude/agents-snippets/` | `@.claude/agents-snippets/<name>.md` |

   Wrapper format for all three:
   ```markdown
   ---
   description: "<description from snippet frontmatter>"
   ---

   # <Title>

   @.claude/<snippet-type>/<name>.md
   ```

### 8. Clean Up Duplicate Skills

**Source of truth**: `.agents/skills/` — all other skill directories are duplicates.
**Parallelizable with Steps 3–6**: Skill cleanup is independent of file conversion.

```bash
# Remove duplicate skill subdirs (keep README.md if present)
find .claude/skills -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +
find .cursor/skills -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +
find .github/skills -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +

# Remove nested duplicates (e.g., subagent-driven-development/subagent-driven-development/)
rm -rf .agents/skills/subagent-driven-development/subagent-driven-development/
```

### 9. Update `CLAUDE.md`

If `CLAUDE.md` is a thin redirect to `AGENTS.md`, add these sections if missing:

1. **Snippet Directories** section with links to `rules-snippets/`, `prompt-snippets/`, `agents-snippets/`
2. **Multi-Tool Support** section with links to `.github/`, `.cursor/`, `.opencode/`
3. **Related Documentation** entries for snippet dirs, `.opencode/`, and `.toolkit-version`

See existing `CLAUDE.md` in the toolkit template (`src/repo/CLAUDE.md`) for the exact format.

### 10. Create `.toolkit-version` File

```bash
echo "3.0.0" > .toolkit-version
```

### 11. Validation

Run all checks after writing files:

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Snippet files exist | `ls -la .claude/{rules,prompt,agents}-snippets/` | All files > 0 bytes |
| Thin wrappers reference correct paths | Grep each wrapper for its reference line | Every reference points to an existing snippet |
| No `{{PLACEHOLDER}}` lost | `grep -r '{{' .claude/*-snippets/` | Count matches original files |
| No broken relative paths | For each wrapper, verify linked snippet exists | All links resolve |
| `.opencode/` complete | Check `opencode.json` + one file per snippet in commands/, rules/, agents/ | Counts match |
| Duplicate skills removed | No subdirs in `.claude/skills/`, `.cursor/skills/`, `.github/skills/` (except README.md) | Clean |

If `--verbose`: log each check result with file paths.

### 12. Generate Upgrade Report

Output the report to stdout (and optionally to `docs/upgrade-report-v3.md`):

```markdown
## 🚀 Bootstrap Upgrade Report

**From**: pre-3.0 (inline pattern)
**To**: 3.0+ (snippet-based architecture)
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
- Removed X duplicate skill directories
- Removed X nested duplicates

### Files Created
- `.toolkit-version` — 3.0.0

### Validation
- [x] All snippet files exist and have content
- [x] All thin wrappers reference correct snippets
- [x] No {{PLACEHOLDER}} syntax lost
- [x] No broken relative paths
- [x] .opencode/ directory complete
- [x] Duplicate skills removed
```

If `--verbose`: include a file-by-file log of every operation.

### 13. Git Commit

If not `--dry-run`, stage and commit all changes:

```bash
git add -A
git commit -m "chore: upgrade AI instructions to toolkit v3.0.0 (snippet architecture)"
```

If `--dry-run`: skip commit, note in report: "Dry run — no changes committed."

## Parallelization Summary

Steps that can run in parallel (dispatch subagents):

| Step | Parallelizable Groups |
|------|-----------------------|
| 3 | rules extraction ‖ commands extraction ‖ agents extraction |
| 4 | rules wrappers ‖ commands wrappers ‖ agents wrappers |
| 5 | instructions wrappers ‖ prompts wrappers ‖ agents wrappers |
| 6 | rules wrappers ‖ commands wrappers ‖ agents wrappers |
| 8 | Independent of 3–6 — can run in parallel with file conversion |

Steps that must be sequential: 1 → 2 → (3‖4‖5‖6‖8) → 7 → 9 → 10 → 11 → 12 → 13.

## Error Handling

- If a file has no frontmatter: treat entire file as body content, create wrapper with empty frontmatter fields
- If a snippet file already exists: **skip** with warning (do not overwrite)
- If `.opencode/` already exists: merge — add missing files, skip existing ones
- If git commit fails: show error, suggest manual commit
- If any validation check fails: report the failure but continue with remaining checks

## Notes

- This is a **one-time operation** — running it again on an already-migrated project should be a no-op (pre-flight check aborts)
- All `{{PLACEHOLDER}}` values are preserved exactly — this migration changes file structure, not content
- Project-specific customizations in file bodies are preserved in the extracted snippets
- After upgrade, use `/bootstrap-patch` for incremental template updates
