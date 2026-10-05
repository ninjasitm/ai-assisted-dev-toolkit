You are helping to patch AI instructions by comparing against supported toolkit v4.x templates from the ai-assisted-dev-toolkit repository's `v4.x` branch and merging updates into this project.

## OpenCode version preflight (before any changes)

- Confirm OpenCode use from actual session/runtime evidence or ask the user; directory presence alone is not proof. If only other harnesses are used, skip this preflight and all OpenCode steps.
- For confirmed OpenCode use, run `opencode --version` before any project writes. Trim output and parse numeric major/minor/patch components, accepting an optional leading `v`; toolkit 4.x requires `major >= 2`.
- If OpenCode V1 (`major < 2`) is detected, **STOP** before customizing/migrating OpenCode files or writing `.toolkit-version` as `4.0.0`. Ask the user to upgrade OpenCode to V2 or remain on toolkit 3.x.
- If the CLI is missing, fails, or output is unparseable, **STOP OpenCode steps** and leave the version marker unchanged; ask the user to confirm/install a supported OpenCode version, then rerun this check. Never assume V2.
- If oh-my-opencode-slim >=3.0.0 is used or planned, require OpenCode >=2.0.7 (compare version components numerically); otherwise **STOP** before changes and ask to upgrade. Proceed only after this gate passes.

## Orchestrator Checkpoint

> **🛑 Before starting**: This command involves fetching, diffing, and applying changes across many files.
> Complete Step 1's source/version gates before dispatching parallel diff agents for independent file groups (rules, commands, prompts, instructions, skills, agents).
> See `.claude/rules-snippets/subagent-workflow.md` for patterns.

## Usage

```
/bootstrap-patch
/bootstrap-patch --dry-run
/bootstrap-patch --category rules
/bootstrap-patch --category commands,prompts
```

## Process

**Codex invocation and scope:** `/bootstrap-patch` is not a native Codex command. Ask Codex to read and follow this snippet as a task document. Identify the actual harness from session/runtime evidence or ask; scaffold directories do not prove use. Codex targets root/nested `AGENTS.md`, `.agents/skills/`, and optional `.codex/config.toml`. Include `.github/instructions/` and `.claude/rules-snippets/` solely as AGENTS-linked standards and their wrapper sources for Codex-scoped installs, not automatically loaded rules or evidence of Copilot/Claude use. Only include other harness command, agent, and config categories when those harnesses are confirmed in use.

**Codex merge guardrails:** preserve existing TOML and inherited user defaults. The shipped `.codex/config.toml` is comment-only; parse it as TOML, do not add model/provider, approval, sandbox, security, feature, self-trust, or active MCP settings. Project config is loaded only after explicit user trust. MCP uses native `[mcp_servers.name]` TOML, not `.mcp.json`; do not migrate or activate servers automatically. Claude/Copilot frontmatter and OpenCode permission blocks are not Codex agent definitions; no Codex custom-agent format is shipped here.

1.  **Fetch Latest Templates**:

    Fetch only the supported `v4.x` source branch:

    ```bash
    set -e
    TOOLKIT_TEMP=$(mktemp -d)
    git clone --depth 1 --branch v4.x https://github.com/ninjasitm/ai-assisted-dev-toolkit.git "$TOOLKIT_TEMP"
    ```

    **Source availability gate:** If the clone fails or `v4.x` is unavailable (for example, not yet published), **STOP** before diff/apply/version marking. Do not fall back to the default branch or V3, and do not push/publish a branch to unblock this task; ask for an approved available v4.x source.

    Determine the correct source path based on project structure:
    - **Single repo**: Use `$TOOLKIT_TEMP/src/repo/`
    - **Monorepo**: Use `$TOOLKIT_TEMP/src/monorepo/`

    Detection heuristic:
    - If `apps/` and `packages/` directories exist at root → monorepo
    - Otherwise → single repo

    **Detect Toolkit Version:**

    Check for a `.toolkit-version` file in the project root:
    - If exists: Read the version string (e.g., `2.0.10`, `3.0.0`)
    - If missing: Verify the installed version or legacy state with the user; absence alone does not prove a pre-3.0 installation

    Read the toolkit's version from the `version` field in `$TOOLKIT_TEMP/package.json` to compare; `.toolkit-version` tracks the target project's installed version.

    **Source version guard (before diff/apply/version marking):** Parse source/target versions as SemVer and compare them (major/minor/patch numerically). If the fetched package's major is not `4`, or its version is older than the target `.toolkit-version`, **STOP** without diffing, applying changes, or updating the marker. Unknown/unparseable versions must also **STOP** and ask rather than guess. Never auto-downgrade.

    **Version Comparison:**
    - **Same version**: No structural changes expected
    - **Newer version**: Check for structural changes (new directories, renamed files, format changes)

2.  **Inventory Current State**:

    Scan the project's AI configuration directories:

    | Category                   | Project Paths                            | Template Source Paths                               |
    | -------------------------- | ---------------------------------------- | --------------------------------------------------- |
    | **Cursor Rules**           | `.cursor/rules/*.mdc`                    | `src/{type}/.cursor/rules/*.mdc`                    |
    | **Cursor Cmds**            | `.cursor/commands/*.md`                  | `src/{type}/.cursor/commands/*.md`                  |
    | **Cursor Agents**          | `.cursor/agents/*.agent.md`              | `src/{type}/.cursor/agents/*.agent.md`              |
    | **GH Prompts**             | `.github/prompts/*.prompt.md`            | `src/{type}/.github/prompts/*.prompt.md`            |
    | **GH Instrs**              | `.github/instructions/*.instructions.md` | `src/{type}/.github/instructions/*.instructions.md` |
    | **GH Agents**              | `.github/agents/*.agent.md`              | `src/{type}/.github/agents/*.agent.md`              |
    | **Claude Rules**           | `.claude/rules/*.md`                     | `src/{type}/.claude/rules/*.md`                     |
    | **Claude Cmds**            | `.claude/commands/*.md`                  | `src/{type}/.claude/commands/*.md`                  |
    | **Claude Agents**          | `.claude/agents/*.agent.md`              | `src/{type}/.claude/agents/*.agent.md`              |
    | **Skills**                 | `.agents/skills/*/SKILL.md`              | `src/{type}/.agents/skills/*/SKILL.md`              |
    | **AGENTS.md**              | `AGENTS.md`                              | `src/{type}/AGENTS.md`                              |
    | **Codex Config**           | `.codex/config.toml`                     | `src/{type}/.codex/config.toml`                     |
    | **CLAUDE.md**              | `CLAUDE.md`                              | `src/{type}/CLAUDE.md`                              |
    | **Claude Rules Snippets**  | `.claude/rules-snippets/*.md`            | `src/{type}/.claude/rules-snippets/*.md`            |
    | **Claude Prompt Snippets** | `.claude/prompt-snippets/*.md`           | `src/{type}/.claude/prompt-snippets/*.md`           |
    | **Claude Agent Snippets**  | `.claude/agents-snippets/*.md`           | `src/{type}/.claude/agents-snippets/*.md`           |
    | **OpenCode Config**        | `.opencode/opencode.jsonc`               | `src/{type}/.opencode/opencode.jsonc`               |
    | **OpenCode Commands**      | `.opencode/commands/*.md`                | `src/{type}/.opencode/commands/*.md`                |
    | **OpenCode Rules**         | `.opencode/rules/*.md`                   | `src/{type}/.opencode/rules/*.md`                   |
    | **OpenCode Agents**        | `.opencode/agents/*.md`                  | `src/{type}/.opencode/agents/*.md`                  |
    | **OpenCode Local Plugins** | `.opencode/plugins/*.{js,mjs,ts}`        | Inventory only; preserve unrelated plugins         |
    | **Hooks**                  | `hooks/*.{js,sh,ps1}`                    | `src/{type}/hooks/*.{js,sh,ps1}`                    |
    | **Agent Rules**            | `.agents/rules/*.md`                     | `src/{type}/.agents/rules/*.md`                     |
    | **Toolkit Version**        | `.toolkit-version`                       | `package.json` `version` (toolkit root)             |

    **OpenCode native V2 merge checks (confirmed OpenCode use only):**

    Follow official V2 [migration](https://opencode.ai/v2/docs/migrate-v1), [config](https://opencode.ai/v2/docs/config), [agents](https://opencode.ai/v2/docs/agents), and [plugins](https://opencode.ai/v2/docs/build/plugins) docs. The published schema may describe V1; neither it nor a V1 API fetch validates native V2. Plural keys are intentional.

    - Use `agents`/`system`, `request.body.temperature`, ordered `permissions` (`action`/`resource`/`effect`, `shell`/`subagent`, last match wins), `commands`/`subagent`, `plugins` with `{ "package": "…", "options": {} }`, skill-directory arrays, and `mcp.servers` with inverse `disabled` and `timeout.catalog`/`timeout.execution`.
    - The version preflight must pass before changes. Back up V1 before native conversion (converted files are incompatible with V1). Preserve models/providers/user-global plugins. Only with approval, merge `"plugins": ["oh-my-opencode-slim@3.0.0"]` locally. Slim's separate strict schema keeps `prompt`/`permission`/`variant`; do not host-migrate it or silently upgrade the separate external starter.
    - **Ponytail replacement (plan here; apply after backup and approval in Step 5):** Remove only known obsolete toolkit-owned `.opencode/plugins/ponytail.js`, `.opencode/plugins/ponytail.mjs`, and `.opencode/plugins/ponytail.ts` copies. Preserve unrelated local plugins. Merge/deduplicate the author's native V2 `@dietrichgebert/ponytail@4.12.0` registration in the local `plugins` array where appropriate, retaining other registrations/options; do not edit global config. Keep `opentmux` commented as V1-only. Do not port local APIs or add bridges; runtime integration is untested. Native local discovery needs no duplicate registration.
    - `instructions` entries are accepted but not loaded; ambient root/nested `AGENTS.md` works. `@refs` are ordinary text: explicitly read snippets. `request.body.temperature` remains in config, but the current runner does not send it. Preserve `lsp: true`; use workspace lint/typecheck/compiler commands (no V2 LSP tools/diagnostics currently).
    - `--env opencode` supplies minimal shared references without other harness activation. Activate on the next run/restart and report only installed-V2 checks actually run, not assumed runtime validation. Publishing 4.0.0 has not been executed.

3.  **Diff Analysis** (parallelizable — dispatch one subagent per category):

    For each category, compare template files against project files:

    a. **Classify each file**:
    - **🆕 New**: Exists in template but not in project → candidate for addition
    - **📝 Updated**: Exists in both but template has newer content → candidate for merge
    - **✅ Current**: Exists in both and content matches → no action needed
    - **🔧 Customized**: Exists in both, project version has non-placeholder customizations → careful merge
    - **⚠️ Missing in Template**: Exists in project but not in template → project-specific, keep as-is except the approved obsolete toolkit Ponytail removal above

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

4.  **Generate Patch Report**:

    ```markdown
    ## 🩹 Bootstrap Patch Report

    **Toolkit Version**: [commit hash] ([date])
    **Project Type**: repo | monorepo
    **Categories Scanned**: [list]

    ### 🆕 New Files (X files)

    | File                         | Category | Description              |
    | ---------------------------- | -------- | ------------------------ |
    | `.cursor/rules/new-rule.mdc` | Rules    | New coding standard rule |

    ### 📝 Updated Files (X files)

    | File                                                     | Changes                        | Risk           |
    | -------------------------------------------------------- | ------------------------------ | -------------- |
    | `.cursor/commands/implement.md`                          | Added orchestrator checkpoint  | Low - additive |
    | `.github/instructions/subagent-workflow.instructions.md` | Added parallelization analysis | Low - additive |

    ### ✅ Current Files (X files)

    [No action needed]

    ### 🔧 Customized Files Requiring Review (X files)

    | File        | Template Changes  | Project Customizations       | Merge Strategy |
    | ----------- | ----------------- | ---------------------------- | -------------- |
    | `AGENTS.md` | New section added | Has project-specific content | Manual merge   |

    ### Summary

    - **Auto-apply**: X new files + Y updated files with no conflicts
    - **Review needed**: Z customized files with structural changes
    - **No action**: W files already current
    ```

5.  **Confirm and Apply**:
    - If `--dry-run` flag: Output the report without making changes
    - Otherwise: Present the report and ask the user to confirm with (Y/n)
    - On confirmation:
      a. **New files**: Copy directly from template
      b. **Updated files (no customization)**: Replace with template version
      c. **Updated files (customized)**: Apply structural additions while preserving project values
      d. **OpenCode plugins**: Apply only the approved Ponytail replacement above after backing up the known obsolete toolkit copies and local config; preserve all unrelated local/global plugins.
      e. **Toolkit version**: Update `.toolkit-version` to the fetched toolkit version (`4.0.0` for this migration) only after the approved migration and OpenCode preflight pass (or OpenCode is confirmed out of scope).
      f. **Git commit**: Stage and commit all changes with message:
      ```bash
      git add -A
      git commit -m "chore: patch AI instructions from toolkit [$(date +%Y-%m-%d)]"
      ```

6.  **Cleanup**:

    ```bash
    rm -rf "$TOOLKIT_TEMP"
    ```

7.  **Post-Patch Validation**:
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
