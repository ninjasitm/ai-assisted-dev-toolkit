You are helping to patch AI instructions by comparing against the published toolkit templates for the target version (4.0.0 or later) from npm or the ai-assisted-dev-toolkit repository's `<version>` git tag, and merging updates into this project.

## OpenCode version preflight (before any changes)

- Confirm OpenCode use from actual session/runtime evidence or ask the user; directory presence alone is not proof. If only other harnesses are used, skip this preflight and all OpenCode steps.
- For confirmed OpenCode use, run `opencode --version` before any project writes. Trim output and parse numeric major/minor/patch components, accepting an optional leading `v`; toolkit 4.0.0 and later require `major >= 2`.
- If OpenCode V1 (`major < 2`) is detected, **STOP** before customizing/migrating OpenCode files or writing `.toolkit-version` as 4.0.0 or later. Ask the user to upgrade OpenCode to V2 or remain on toolkit 3.x.
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

The CLI runs the same patch flow without an AI session: `npx nitm-ai-dev-toolkit patch --dry-run` previews changes, `--only <categories>` and `--exclude <categories>` narrow the scope, and `npx nitm-ai-dev-toolkit upgrade@<version>` (or `--version <version>`) pins the target version. Pinning a version does not skip the gates in Step 1.

## Process

**Codex invocation and scope:** `/bootstrap-patch` is not a native Codex command. Ask Codex to read and follow this snippet as a task document. Identify the actual harness from session/runtime evidence or ask; scaffold directories do not prove use. Codex targets root/nested `AGENTS.md`, `.agents/skills/`, and optional `.codex/config.toml`. Include `.github/instructions/` and `.claude/rules-snippets/` solely as AGENTS-linked standards and their wrapper sources for Codex-scoped installs, not automatically loaded rules or evidence of Copilot/Claude use. Only include other harness command, agent, and config categories when those harnesses are confirmed in use.

**Codex merge guardrails:** preserve existing TOML and inherited user defaults. The shipped `.codex/config.toml` is comment-only; parse it as TOML, do not add model/provider, approval, sandbox, security, feature, self-trust, or active MCP settings. Project config is loaded only after explicit user trust. MCP uses native `[mcp_servers.name]` TOML, not `.mcp.json`; do not migrate or activate servers automatically. Claude/Copilot frontmatter and OpenCode permission blocks are not Codex agent definitions; no Codex custom-agent format is shipped here.

1.  **Fetch Latest Templates**:

    **Resolve versions before any download.**
    - **Installed version**: read `.toolkit-version` in the project root. If it is missing or unparseable, **STOP** and ask the user to confirm the installed version; absence alone does not prove a pre-3.0 installation.
    - **Target version**: use the version the user pinned (`upgrade@<version>` or `--version <version>` in the CLI, or the version given to this task), validated as SemVer `X.Y.Z`. Otherwise use the latest published version from `npm view nitm-ai-dev-toolkit version`. If npm is unreachable or the output is unparseable, **STOP** and ask. Never guess a version.

    **Fetch the matching release.** Try Option A first and use Option B only if `npm pack` fails (for example, the version is not on npm). Each download goes into a new, empty directory:

    ```bash
    set -e
    TOOLKIT_TEMP=$(mktemp -d)   # removed in step 6
    mkdir "$TOOLKIT_TEMP/pack" "$TOOLKIT_TEMP/unpacked"
    # Option A (preferred): the published package, the same artifact users install
    if (cd "$TOOLKIT_TEMP/pack" && npm pack "nitm-ai-dev-toolkit@<version>"); then
      tar -xzf "$TOOLKIT_TEMP/pack/nitm-ai-dev-toolkit-<version>.tgz" -C "$TOOLKIT_TEMP/unpacked"
      SOURCE_ROOT="$TOOLKIT_TEMP/unpacked/package"
    else
      # Option B (fallback): the git tag for that release (tags have no "v" prefix)
      git clone --depth 1 --branch "<version>" https://github.com/ninjasitm/ai-assisted-dev-toolkit.git "$TOOLKIT_TEMP/git"
      SOURCE_ROOT="$TOOLKIT_TEMP/git"
    fi
    ```

    **Source availability gate:** If both `npm pack` and the tag clone fail (the version is unpublished and the tag is missing), **STOP** before diff/apply/version marking. Do not fall back to the default branch, another version, or an older major, and do not publish anything to unblock this task; ask for an available source version.

    Determine the correct source path based on project structure, under `$SOURCE_ROOT`:
    - **Single repo**: `$SOURCE_ROOT/src/repo/`
    - **Monorepo**: `$SOURCE_ROOT/src/monorepo/`

    Detection heuristic:
    - If `apps/` and `packages/` directories exist at root → monorepo
    - Otherwise → single repo

    **Source version gate (before diff/apply/version marking):** Read the `version` field in `$SOURCE_ROOT/package.json` and parse it as SemVer. The fetched version must equal the target version exactly, its major must be greater than or equal to the installed major from `.toolkit-version`, and it must not be older than the installed `.toolkit-version`. If any check fails, or a version is unknown or unparseable, **STOP** without diffing, applying changes, or updating the marker. Never auto-downgrade, and never hard-code a major.

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

    - Use `agents`/`system`, ordered `permissions` (`action`/`resource`/`effect`, `shell`/`subagent`, last match wins), `commands`/`subagent`, `plugins` with `{ "package": "…", "options": {} }`, skill-directory arrays, and `mcp.servers` with inverse `disabled` and `timeout.catalog`/`timeout.execution`.
    - The version preflight must pass before changes. Back up V1 before native conversion (converted files are incompatible with V1). Preserve models/providers/user-global plugins. Only with approval, merge `"plugins": ["oh-my-opencode-slim@3.0.0"]` locally. Slim's separate strict schema keeps `prompt`/`permission`/`variant`; do not host-migrate it or silently upgrade the separate external starter.
    - **Obsolete Ponytail cleanup (plan here; apply after backup and approval in Step 5):** Remove only known obsolete toolkit-owned `.opencode/plugins/ponytail.js`, `.opencode/plugins/ponytail.mjs`, and `.opencode/plugins/ponytail.ts` copies. Preserve unrelated local plugins. The OpenCode Ponytail plugin is installed globally by the operator; never add it to project config. If it is not installed globally, tell the operator to install it globally. Do not edit global config. Keep `opentmux` commented as V1-only. Do not port local APIs or add bridges; runtime integration is untested.
    - Ambient root/nested `AGENTS.md` works. `instructions` entries load only when the runtime injects them (OpenChamber does; other hosts may not), so do not rely on them: write explicit "Read and follow" wrappers regardless. `@refs` are ordinary text: explicitly read snippets. Do not set a temperature; the current runner does not send one. Preserve `lsp: true`; use workspace lint/typecheck/compiler commands (no V2 LSP tools/diagnostics currently).
    - `--env opencode` supplies minimal shared references without other harness activation. Activate on the next run/restart and report only installed-V2 checks actually run, not assumed runtime validation.

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
      d. **OpenCode plugins**: Apply only the approved obsolete Ponytail cleanup above after backing up the known obsolete toolkit copies and local config; preserve all unrelated local/global plugins. Never add Ponytail to project config.
      e. **Toolkit version**: Keep the `.toolkit-version` value the CLI writes for the verified target version (the installed package version, 4.0.0 or later; never hard-coded) only after the approved migration and OpenCode preflight pass (or OpenCode is confirmed out of scope).
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
