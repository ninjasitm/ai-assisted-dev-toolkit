You are helping to patch AI instructions in this project by comparing against the latest templates from the ai-assisted-dev-toolkit repository and applying any updates.

## Orchestrator Checkpoint

> **🛑 Before starting**: This command involves fetching, diffing, and applying changes across many files.
> Dispatch parallel subagents for independent file groups (rules, commands, prompts, instructions, skills, agents).
> See `.claude/rules-snippets/subagent-workflow.md` for patterns.

## Usage

```
/bootstrap-patch
/bootstrap-patch --dry-run
/bootstrap-patch --category rules
/bootstrap-patch --category commands,prompts
```

## Process

1. **Fetch Latest Templates**:

   Clone or fetch the latest ai-assisted-dev-toolkit templates:

   ```bash
   TOOLKIT_TEMP=$(mktemp -d)
   git clone --depth 1 https://github.com/ninjasitm/ai-assisted-dev-toolkit.git "$TOOLKIT_TEMP"
   ```

   Determine the correct source path based on project structure:
   - **Single repo**: Use `$TOOLKIT_TEMP/src/repo/`
   - **Monorepo**: Use `$TOOLKIT_TEMP/src/monorepo/`

    Detection heuristic:
    - If `apps/` and `packages/` directories exist at root → monorepo
    - Otherwise → single repo

    **Detect Toolkit Version:**

    Check for a `.toolkit-version` file in the project root:
    - If exists: Read the version string (e.g., `2.0.10`, `3.0.0`)
    - If missing: Assume legacy version (pre-3.0.0)

    Read the toolkit's version from `$TOOLKIT_TEMP/.toolkit-version` to compare.

    **Version Comparison:**
    - **Same version**: No structural changes expected
    - **Newer version**: Check for structural changes (new directories, renamed files, format changes)

2. **Inventory Current State**:

   Scan the project's AI configuration directories:

   | Category         | Project Paths                                                 | Template Source Paths                       |
   | ---------------- | ------------------------------------------------------------- | ------------------------------------------- |
   | **Cursor Rules** | `.cursor/rules/*.mdc`                                         | `src/{type}/.cursor/rules/*.mdc`            |
   | **Cursor Cmds**  | `.cursor/commands/*.md`                                       | `src/{type}/.cursor/commands/*.md`           |
   | **Cursor Agents**| `.cursor/agents/*.agent.md`                                   | `src/{type}/.cursor/agents/*.agent.md`       |
   | **GH Prompts**   | `.github/prompts/*.prompt.md`                                 | `src/{type}/.github/prompts/*.prompt.md`     |
   | **GH Instrs**    | `.github/instructions/*.instructions.md`                      | `src/{type}/.github/instructions/*.instructions.md` |
   | **GH Agents**    | `.github/agents/*.agent.md`                                   | `src/{type}/.github/agents/*.agent.md`       |
   | **Claude Rules** | `.claude/rules/*.md`                                          | `src/{type}/.claude/rules/*.md`              |
   | **Claude Cmds**  | `.claude/commands/*.md`                                       | `src/{type}/.claude/commands/*.md`           |
   | **Claude Agents**| `.claude/agents/*.agent.md`                                   | `src/{type}/.claude/agents/*.agent.md`       |
   | **Skills**       | `.agents/skills/*/SKILL.md`                                   | `src/{type}/.agents/skills/*/SKILL.md`       |
    | **AGENTS.md**    | `AGENTS.md`                                                   | `src/{type}/AGENTS.md`                       |
    | **CLAUDE.md**    | `CLAUDE.md`                                                   | `src/{type}/CLAUDE.md`                       |
    | **Claude Rules Snippets** | `.claude/rules-snippets/*.md`                          | `src/{type}/.claude/rules-snippets/*.md`     |
    | **Claude Prompt Snippets** | `.claude/prompt-snippets/*.md`                       | `src/{type}/.claude/prompt-snippets/*.md`    |
    | **Claude Agent Snippets** | `.claude/agents-snippets/*.md`                        | `src/{type}/.claude/agents-snippets/*.md`    |
     | **OpenCode Config** | `.opencode/opencode.json`                                | `src/{type}/.opencode/opencode.json`         |
     | **OpenCode Commands** | `.opencode/commands/*.md`                               | `src/{type}/.opencode/commands/*.md`         |
     | **OpenCode Rules** | `.opencode/rules/*.md`                                   | `src/{type}/.opencode/rules/*.md`            |
     | **OpenCode Agents** | `.opencode/agents/*.md`                                 | `src/{type}/.opencode/agents/*.md`           |
     | **OpenCode Plugins** | `.opencode/plugins/*.mjs`                             | `src/{type}/.opencode/plugins/*.mjs`         |
     | **Hooks**           | `hooks/*.{js,sh,ps1}`                                    | `src/{type}/hooks/*.{js,sh,ps1}`              |
     | **Agent Rules**     | `.agents/rules/*.md`                                     | `src/{type}/.agents/rules/*.md`               |
      | **Toolkit Version** | `.toolkit-version`                                      | `.toolkit-version` (root of toolkit)         |

   **⚠️ OpenCode `opencode.json` Schema Validation:**

   When patching `.opencode/opencode.json`, **only add or modify supported top-level keys**. The schema is defined at `https://opencode.ai/config.json`. Do NOT add unsupported keys.

   **Supported top-level keys:** `$schema`, `instructions`, `skills`, `agent`, `default_agent`, `model`, `small_model`, `provider`, `mcp`, `tools`, `permission`, `lsp`, `formatter`, `server`, `shell`, `command`, `plugin`, `watcher`, `snapshot`, `share`, `autoupdate`, `compaction`, `attachment`, `logLevel`, `disabled_providers`, `enabled_providers`, `tool_output`, `enterprise`, `experimental`

       **Do NOT add** keys like `rules`, `agents`, `commands`, `prompts` as top-level keys — OpenCode uses the `.opencode/` directory structure and `instructions` array instead.

   > **Watch out:** the ponytail template uses the `plugin` key (singular). If you see `plugins` (plural) in your `opencode.json`, that's a typo and the plugin won't load.

3. **Diff Analysis** (parallelizable — dispatch one subagent per category):

   For each category, compare template files against project files:

   a. **Classify each file**:
      - **🆕 New**: Exists in template but not in project → candidate for addition
      - **📝 Updated**: Exists in both but template has newer content → candidate for merge
      - **✅ Current**: Exists in both and content matches → no action needed
      - **🔧 Customized**: Exists in both, project version has non-placeholder customizations → careful merge
      - **⚠️ Missing in Template**: Exists in project but not in template → project-specific, keep as-is

   b. **For updated files, generate a structured diff**:
      - Preserve project-specific `{{PLACEHOLDER}}` replacements (already-bootstrapped values)
      - Identify structural additions (new sections, new rules, new steps)
      - Identify structural removals (deprecated guidance, removed sections)
      - Identify content updates (changed instructions, improved wording)

   c. **Smart Merge Rules**:
      - **Never overwrite** project-specific values that replaced `{{PLACEHOLDER}}`
      - **Always add** new files that don't exist in the project
      - **Merge structural additions** into existing customized files
      - **Flag for review** any removals from files that have been customized
      - **Preserve custom agents/skills** that were added by the project

4. **Generate Patch Report**:

   ```markdown
   ## 🩹 Bootstrap Patch Report

   **Toolkit Version**: [commit hash] ([date])
   **Project Type**: repo | monorepo
   **Categories Scanned**: [list]

   ### 🆕 New Files (X files)

   | File | Category | Description |
   | ---- | -------- | ----------- |
   | `.cursor/rules/new-rule.mdc` | Rules | New coding standard rule |

   ### 📝 Updated Files (X files)

   | File | Changes | Risk |
   | ---- | ------- | ---- |
   | `.cursor/commands/implement.md` | Added orchestrator checkpoint | Low - additive |
   | `.github/instructions/subagent-workflow.instructions.md` | Added parallelization analysis | Low - additive |

   ### ✅ Current Files (X files)
   [No action needed]

   ### 🔧 Customized Files Requiring Review (X files)

   | File | Template Changes | Project Customizations | Merge Strategy |
   | ---- | ---------------- | ---------------------- | -------------- |
   | `AGENTS.md` | New section added | Has project-specific content | Manual merge |

   ### Summary
   - **Auto-apply**: X new files + Y updated files with no conflicts
   - **Review needed**: Z customized files with structural changes
   - **No action**: W files already current
   ```

5. **Confirm and Apply**:

   - If `--dry-run` flag: Output the report without making changes
   - Otherwise: Present the report and ask the user to confirm with (Y/n)
   - On confirmation:
     a. **New files**: Copy directly from template
     b. **Updated files (no customization)**: Replace with template version
     c. **Updated files (customized)**: Apply structural additions while preserving project values
     d. **Git commit**: Stage and commit all changes with message:
        ```bash
        git add -A
        git commit -m "chore: patch AI instructions from toolkit [$(date +%Y-%m-%d)]"
        ```

6. **Cleanup**:

   ```bash
   rm -rf "$TOOLKIT_TEMP"
   ```

7. **Post-Patch Validation**:

   - Verify no `{{PLACEHOLDER}}` syntax was accidentally re-introduced
   - Confirm all files are valid (no broken frontmatter, no syntax errors)
   - List any new placeholders that need manual `bootstrap` to fill

## Smart Merge Strategy

### Preserving Project Values

When a file has been bootstrapped (placeholders replaced with real values), the patch must:

1. **Detect replaced placeholders**: Compare file against template, identify where `{{VAR}}` was replaced with a concrete value
2. **Build a replacement map**: `{"{{PROJECT_NAME}}": "my-app", "{{FRAMEWORK}}": "Next.js", ...}`
3. **Apply template structural changes**: Add new sections, update instructions
4. **Re-apply replacement map**: Restore project-specific values in the updated content

### Conflict Resolution

- **Additive changes** (new sections, new steps): Auto-merge
- **Modified instructions** (changed wording in existing sections): Replace template text, re-apply value map
- **Removed sections**: Flag for user review — project may depend on removed guidance
- **Structural reorganization**: Replace entire file, re-apply value map, flag for review

## Guidelines

- **Non-destructive by default**: Always show changes before applying
- **Preserve customizations**: Never lose project-specific configuration
- **Incremental**: Only apply what's changed, don't re-bootstrap everything
- **Auditable**: Commit message includes date for tracking patch history
