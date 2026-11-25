# Bootstrap Patch

Fetch the published toolkit templates for the target version (5.2.0 or later) from npm or the ai-assisted-dev-toolkit repository's `<version>` git tag, and merge updated, new, or missing guidance into this project.

## Load the Completion Contract (before any changes)

1. Before any change, load the `## Completion Contract` section once from `bootstrap.md` and hold that checklist unchanged through apply.
2. Use that copy only when it comes from the same trusted install or copy as this guide: the `bootstrap.md` beside this file (installed or copied together from the same source, including a manual copy without `.nitm/`), or the Completion Contract section of `.nitm/BOOTSTRAP.md` when that handoff is the entry point.
3. If the copy is missing, mismatched, or its origin is uncertain, **STOP** and ask. A manifest mismatch is a reason to ask. A manifest match, `.toolkit-version`, or the target project alone is not proof of origin. Do not run a write to establish proof.
4. The selected target supplies templates and data, not the criteria for judging this work. A historic source (5.2.0 to 5.4.1) may lack the checklist; that alone does not block the patch.

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
/bootstrap-patch --skip-path .nitm/BOOTSTRAP.md --skip-path .github/instructions/testing.instructions.md
```

`--category` narrows only the guided review and agent merge. It never maps to the CLI's `--only` or `--exclude`, which take harness or feature group names (for example `--only factory,prisma`). Use repeatable `--skip-path <literal-repo-relative-file-or-directory>` to omit exact paths for this run without changing saved `.nitm/toolkit.json` categories. It cannot omit protected metadata (`.toolkit-version`, `.nitm/manifest.json`, or `.nitm/toolkit.json`); it cannot be combined with `--only` or `--exclude`. Unknown paths fail. The initial preview command must include the selected layout and every invocation flag, including every `--skip-path`. Preview and apply use the same verified source, layout and flags. A patch-capable preview prints the ordered write set (including metadata), explicit omissions, and `Review token: <64 hex>`. Apply by removing `--dry-run` and adding `--expect <token>` only; if the token is unavailable, stop before any write and choose a supporting release. Never silently regenerate and apply a changed preview. Pinning a version does not skip the gates in Step 1.

## Process

**Codex invocation and scope:** `/bootstrap-patch` is not a native Codex command. Ask Codex to read and follow this snippet as a task document. Identify the actual harness from session/runtime evidence or ask; scaffold directories do not prove use. Codex targets `AGENTS.md`, relevant nested instructions, `.agents/skills/`, and optional `.codex/config.toml`. Include `.github/instructions/` and `.claude/rules-snippets/` solely as AGENTS-linked standards and their wrapper sources for Codex-scoped installs, not automatically loaded rules or evidence of Copilot/Claude use. Only include other harness command, agent, and config categories when those harnesses are confirmed in use.

**Codex merge guardrails:** preserve existing TOML and inherited user defaults. The shipped `.codex/config.toml` is comment-only; parse it as TOML, do not add model/provider, approval, sandbox, security, feature, self-trust, or active MCP settings. Project config is loaded only after explicit user trust. MCP uses native `[mcp_servers.name]` TOML, not `.mcp.json`; do not migrate or activate servers automatically. Claude/Copilot frontmatter and OpenCode permission blocks are not Codex agent definitions; no Codex custom-agent format is shipped here.

1.  **Fetch Latest Templates**:

    **Resolve versions before any download.**
    - **Installed version**: read `.toolkit-version` in the project root. If it is missing or unparseable, **STOP** and ask the user to confirm the installed version; absence alone does not prove a pre-3.0 installation.
    - **Target version**: use the version the user pinned (`upgrade <version>` or `--version <version>` in the CLI, or the version given to this task), validated as SemVer `X.Y.Z`. Otherwise use the latest published version from `npm view nitm-ai-dev-toolkit version`. If npm is unreachable or the output is unparseable, **STOP** and ask. Never guess a version.
    - **Minimum**: the target must be **5.2.0 or later**. 5.2.0 is the first release whose patch honours `.nitm/retired.json` and the relevance plan (`RELEVANCE_MIN` in `bin/cli.js`). 5.0.1 added the dry run and selection flags, but a 5.0.1 to 5.1.x patch ignores retirements, so it is below the guided minimum. The guided workflow also requires a CLI that prints a review token and accepts `--expect`; if the verified source lacks either capability, **STOP before writes** and choose a supporting release rather than passing ignored flags. For an older target, **STOP** and direct the user to that release's own guidance. Do not upgrade automatically.

    **Fetch exactly one source.** Use Option A. Use Option B only if `npm pack` fails. Each download goes into a new, empty directory. Never fall back to another version, a default branch, or a hand-copied file:

    ```bash
    set -e
    TOOLKIT_TEMP=$(mktemp -d)   # removed only at the terminal step 7
    mkdir "$TOOLKIT_TEMP/pack" "$TOOLKIT_TEMP/unpacked"
    # Option A (preferred): the exact published archive, the same artifact users install
    if (cd "$TOOLKIT_TEMP/pack" && npm pack "nitm-ai-dev-toolkit@<version>"); then
      tar -xzf "$TOOLKIT_TEMP/pack/nitm-ai-dev-toolkit-<version>.tgz" -C "$TOOLKIT_TEMP/unpacked"
      SOURCE_ROOT="$TOOLKIT_TEMP/unpacked/package"
      SOURCE_KIND="npm archive nitm-ai-dev-toolkit@<version>"
    else
      # Option B (fallback): the exact tag refs/tags/<version> (no "v" prefix), never a same-named branch
      mkdir "$TOOLKIT_TEMP/git" && git -C "$TOOLKIT_TEMP/git" init -q
      git -C "$TOOLKIT_TEMP/git" fetch --depth 1 https://github.com/ninjasitm/ai-assisted-dev-toolkit.git "refs/tags/<version>:refs/tags/<version>"
      git -C "$TOOLKIT_TEMP/git" -c advice.detachedHead=false checkout --detach "refs/tags/<version>"
      SOURCE_ROOT="$TOOLKIT_TEMP/git"
      SOURCE_KIND="git tag refs/tags/<version>"
    fi
    ```

    **Source availability gate:** If `npm pack` and the exact tag fetch both fail (the version is unpublished and the tag is missing), **STOP** before diff/apply/version marking. Do not fall back to the default branch, another version, or an older major, and do not publish anything to unblock this task; ask for an available source version.

    **Source identity gate (before any command runs from the source):** Record the source kind, and the `name` and `version` from `$SOURCE_ROOT/package.json` (`name` must be `nitm-ai-dev-toolkit`, `version` must equal the target). Confirm `$SOURCE_ROOT/bin/cli.js` exists. Resolve the layout as step 5 defines it, which is the same rule the CLI uses. The source must contain `$SOURCE_ROOT/src/repo/` or `$SOURCE_ROOT/src/monorepo/` for that layout. If any check fails or a value cannot be parsed, **STOP**; do not diff, apply, or mark the version. Record the identity for reuse: npm `npm view "nitm-ai-dev-toolkit@<version>" dist.integrity`, or tag `git -C "$TOOLKIT_TEMP/git" rev-parse "refs/tags/<version>^{commit}"`. Keep the temp source until the terminal cleanup. If it is missing on resume, fetch again and compare with the recorded identity; a mismatch or unavailability is **STOP**.

    **The verified source runs every CLI call.** From the target project directory, run `node "$SOURCE_ROOT/bin/cli.js" patch` for both the preview and the apply, using the one invocation fixed in step 5, including selected layout, env, and exact omissions. Do not use `npx`, which would resolve a second copy. Do not hand-copy template files from the source.

    Determine the source path based on project structure, under `$SOURCE_ROOT`:
    - **Single repo**: `$SOURCE_ROOT/src/repo/`
    - **Monorepo**: `$SOURCE_ROOT/src/monorepo/`

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
    - Ambient `AGENTS.md` works. `instructions` entries load only when the runtime injects them (OpenChamber does; other hosts may not), so do not rely on them: write explicit "Read and follow" wrappers regardless. `@refs` are ordinary text: explicitly read snippets. Do not set a temperature; the current runner does not send one. Preserve `lsp: true`; use project lint/typecheck/compiler commands (no V2 LSP tools/diagnostics currently).
    - `--env opencode` supplies minimal shared references without other harness activation. Activate on the next run/restart and report only installed-V2 checks actually run, not assumed runtime validation.

3.  **Diff Analysis** (parallelizable — dispatch one subagent per category):

    For each category, compare template files against project files:

    a. **Classify each file** (relevance-aware; never a wholesale copy). The preview command is `node "$SOURCE_ROOT/bin/cli.js" patch --<resolved-layout> --dry-run [all selected invocation flags, including each --skip-path]`, from the target directory; substitute the actual `--repo` or `--monorepo` flag and include every chosen environment or omission flag exactly. This makes the CLI classification and prints each reason. Read that plan before deciding anything, and see Relevance and Retirement in `bootstrap.md`:
    - **add**: missing, and it applies to this project (tracker, Playwright, Prisma, UI, and MCP relevance)
    - **update**: the toolkit wrote it and the project has not changed it since; the new template replaces it
    - **current**: identical to the template; no action
    - **needs review**: differs from the template (locally changed), or missing while relevance is undecided; never overwritten, and never added without a decision
    - **not relevant**: does not apply to this project; never added. A present copy is a retirement candidate
    - **retired**: listed in `.nitm/retired.json`; never added, updated or overwritten
    - **⚠️ Missing in Template**: Exists in project but not in template → project-specific, keep as-is except the approved obsolete toolkit Ponytail removal above

    b. **For updated files, generate a structured diff**:
    - Preserve project-specific `{{PLACEHOLDER}}` replacements (already-bootstrapped values)
    - Identify structural additions (new sections, new rules, new steps)
    - Identify structural removals (deprecated guidance, removed sections)
    - Identify content updates (changed instructions, improved wording)

    c. **Smart Merge Rules**:
    - **Never overwrite** project-specific values that replaced `{{PLACEHOLDER}}`
    - **Add only** files classified *add*. Never add a not-relevant or retired file, and never add a file whose relevance is undecided without the operator's decision
    - **Merge structural additions** into existing customized files
    - **Flag for review** any removals from files that have been customized
    - **Preserve custom agents/skills** that were added by the project

4.  **Generate Patch Report**:

    ```markdown
    ## 🩹 Bootstrap Patch Report

    **Toolkit Version**: [commit hash] ([date])
    **Project Type**: repo | monorepo
    **Categories Scanned**: [list]

    ### 🆕 Add (X files; apply to this project)

    | File                         | Category | Description              |
    | ---------------------------- | -------- | ------------------------ |
    | `.cursor/rules/new-rule.mdc` | Rules    | New coding standard rule |

    ### 📝 Update (X files; unchanged since the toolkit wrote them)

    | File                            | Changes                       | Risk           |
    | ------------------------------- | ----------------------------- | -------------- |
    | `.cursor/commands/implement.md` | Added orchestrator checkpoint | Low - additive |

    ### ✅ Current Files (X files)

    [No action needed]

    ### 🔧 Needs Review (X files; locally changed or undecided; not written)

    | File        | Template Changes  | Project Customizations       | Merge Strategy |
    | ----------- | ----------------- | ---------------------------- | -------------- |
    | `AGENTS.md` | New section added | Has project-specific content | Manual merge   |

    ### 🚫 Not Relevant or Retired (X files; not written)

    | File                                   | Reason                              | Action                              |
    | -------------------------------------- | ----------------------------------- | ----------------------------------- |
    | `.claude/commands/playwright-test.md`  | No Playwright setup detected        | Keep out; retire if present (approval) |
    | `.agents/skills/linear-cli/SKILL.md`   | Project tracker is GitHub           | Retire in `.nitm/retired.json`      |

    ### 🩹 Harness Wrappers to Review (X files; proposals only)

    | Wrapper                     | Finding                              | Proposal                                  |
    | --------------------------- | ------------------------------------ | ----------------------------------------- |
    | `.claude/rules/api-server.md` | Policy text outside the snippet link | Move the text into its snippet; keep a thin link |

    ### Summary

    - **Apply after review and user approval**: X add + Y update entries, as printed by the verified source's `patch --dry-run`
    - **Review needed**: Z needs-review files and W wrapper proposals
    - **Not written**: N not-relevant or retired entries
    - **No action**: W files already current
    ```

    **Independent review loop (before any write; a dry run stops after the report):**
    - **Plan first.** Write a short plan in chat: goal, scope (target, resolved layout, and the write categories that may change), and checks. No persistent plan file and no new artifact schema.
    - **Align.** Send the plan and original request to an independent, read-only alignment reviewer (Oracle, or an equivalent read-only reviewer the running harness provides). `ALIGNED` addresses alignment only: it is not approval of the exact write set and grants no permission to expand scope. Any proposed expansion needs the existing human decision and plan revision/review gates. If the independent reviewer is unavailable, report **BLOCKED** and ask; do not start the builder.
    - **Compile one write set.** Before review, build a single proposal from the verified source's dry run and the planned manual work:
      - **CLI-managed:** every ordered write and metadata action, and every omission, printed by `patch --dry-run`, including `.toolkit-version`, `.nitm/manifest.json`, `.nitm/toolkit.json` when applicable, and `.nitm/BOOTSTRAP.md`. Record the preview's review token and each target's before-state (absent, or its sha256). The handoff is added if missing, refreshed only when proven toolkit-owned and unchanged, and otherwise explicitly kept when customized or ownership is unknown. A backup does not permit replacing a customized handoff; patch does not create a handoff backup.
      - **Explicit omissions:** every `--skip-path` is excluded from the entire guided write set, including manual smart merges, wrapper/config edits, cleanup, and backups. Do not reintroduce an omitted path through another step. Changing that decision requires a new preview and the full review and approval gates.
      - **Manual:** every planned merge, addition, deletion, and `.nitm/retired.json` record, and every reference, hook, or config change not explicitly omitted, with its file, exact change, and before-state (absent, or its sha256). Removals follow the Completion Contract.
      - **Backup:** one bounded action for approved manual changes only. Before the first manual content write, copy each affected existing file to `.nitm/backups/patch-<UTC timestamp>/` at its relative path. Never overwrite a backup.
      - **Not written:** `review`, `irrelevant`, and `retired` entries, listed for information only.
    - **Build and review.** The builder (not the reviewer) prepares or repairs that one write set from the report in step 4. The independent read-only reviewer checks the same write set, the source evidence (source kind, package name and version, CLI and layout presence), the dry-run output, and the check results. It returns `VERDICT: PASS` or `VERDICT: CHANGES`; each blocking finding names the file, problem, and required repair. Repair within the actual evidence, rerun the checks, and re-review until PASS.
    - **Stop conditions.** If two consecutive rounds return the same findings with no new evidence, or a finding needs authority or data that cannot be obtained, stop and ask the user. An unavailable reviewer or check is **BLOCKED**, never a pass.
    - **Dry run stops here.** With `--dry-run`, complete the report and the compiled write set from the verified source, then stop. Do not ask to apply, and write nothing.
    - `ALIGNED` and the independent `VERDICT: PASS` are separate guide-specific gates; neither is approval to write. Only the user's explicit approval of this exact write set (step 5) allows writes.

5.  **Confirm and Apply** (only the PASSed write set, after separate human approval):
    - **Ask for approval** of the exact write set, with the reviewed report and answers to any unresolved required question. Identify writes outside the approved categories or selection. A widened category or selection needs a fresh preview and proposal review. A material change (scope, criteria, or source) needs planning, the Oracle alignment, and renewed user consent.
    - **Revalidate immediately before any target write.** Re-check the source (same kind, package, and version), every listed before-state, the exact invocation, and that the token supplied to `--expect` is byte-for-byte the reviewed 64-hex token. The apply must accept that token; do not obtain a replacement token and continue without fresh review and approval. If any check fails, stop with no writes and return to the preview/review gates.
    - **Invocation (resolved once before the preview, then reused unchanged):** run from the target directory with `$SOURCE_ROOT/bin/cli.js`:
      - **Layout:** `--monorepo` or `--repo`, resolved as the CLI does: an explicit flag first; otherwise a readable `package.json` with a `workspaces` field, or both `apps/` and `packages/` at root, means monorepo; otherwise repo.
      - **Environment:** `--env <env>` only when the user confirmed one.
      - **Selection:** `--only` or `--exclude` only when the user chose a new selection for this run. Otherwise pass neither, and both runs use the same saved `.nitm/toolkit.json`. Never pass both flags.
      - Preview: `node "$SOURCE_ROOT/bin/cli.js" patch --monorepo --dry-run [the selected env/skip-path flags]` (use the actual resolved `--repo` or `--monorepo` and every chosen flag). Apply: same source, target directory, and all same flags, removing `--dry-run` and adding `--expect <review-token>`. Do not change source, layout, selection, omissions, or any other flag.
    - **Order of writes:** run the CLI apply with the reviewed token first; it must stop without writes if any reviewed target or protected state changed after preview. Only after successful CLI apply, revalidate each manual-only target against its approved before-state, back up approved manual changes, then perform those writes. Never force, and never write an explicitly omitted path.
    - On confirmation:
      a. **CLI writes**: `node "$SOURCE_ROOT/bin/cli.js" patch` with the same invocation and `--expect <token>`. It writes only the approved preview set. Metadata is previewed; the version marker is written last and only after approved writes succeed. Manifest hashes are recorded only for files matching release bytes; skipped/customized entries remain as previously recorded. Do not copy template files by hand.
      b. **Retirements**: record each approved path in `.nitm/retired.json` with a reason and date. Do not delete files to retire them
      c. **Needs review**: apply each proposed merge only after the operator approves that file. Wrappers that inline policy: propose moving the content into the snippet and reducing the wrapper to a thin link (see Thin Wrapper Policy in `bootstrap.md`)
      d. **OpenCode plugins**: apply only the approved obsolete Ponytail cleanup above, after backing up the known obsolete toolkit copies and local config; preserve all unrelated local/global plugins. Never add Ponytail to project config.
      e. **Toolkit version**: the CLI writes `.toolkit-version` last, only after the approved writes succeed (installed package version; never hard-coded). For confirmed OpenCode use, recording toolkit 4.0.0 or later requires the OpenCode V2 preflight above to pass; review-token support is separate and requires a patch-capable source (5.4.4+).
      f. **Commit** (only on an explicit request, after the step 6 PASS; `bootstrap-upgrade.md` uses this same rule):
         1. Before the first write, record a baseline with `git diff --cached --name-only` and `git status --porcelain`. An approved path that was dirty, staged, or an untracked file before the first write is not a commit candidate: refuse it and report.
         2. The index must be empty now: `git diff --cached --name-only` prints nothing. Otherwise **STOP** and report what is staged. Do not unstage, reset, or commit around it.
         3. Commit only approved paths that are not deletions (**STOP** if the set has one). Each path's content must hash to its after-state from step 6 (`git hash-object -- <path>`), and its mode must match the approved mode (`100644`, or `100755` for an approved executable hook).
         4. Never stage generated backups, local config, or state files outside the set (`.nitm/backups/`, and `.nitm/toolkit.json` unless it is in the set). Never use `-f`.
         5. `git add -- <each approved path>`, by name only.
         6. Verify the staged content, not just the names: each path's staged blob (`git ls-files -s -- <path>`) must equal `git hash-object -- <path>`, and `git diff --cached --name-only` must equal the approved set exactly. A mismatch is **STOP**; do not reset or unstage.
         7. `git commit -m "<message>"`, with no pathspec. Never `git add -A`, `git add .`, `git add -f`, `git reset`, `git restore --staged`, or a commit that includes unrelated staged work.

6.  **Post-Patch Validation and Acceptance**:
    - Verify the applied files against the write set and backups: before-state to after-state for each path, valid frontmatter and syntax (run the applicable checks and report the commands and results, not assumed runtime validation), and the handoff and version marker matching the approved list.
    - **Live placeholders (Completion Contract).** Scan the files written and the active files they link to. For each live `{{PLACEHOLDER}}`:
      - Runtime variable, example, or intentional template text: leave it untouched, and say why.
      - Required and ordinary, in a file this patch wrote: propose the exact repair in a follow-up write set. If the value cannot be cited from the project, ask the user and park the dependent work until answered. Follow-up repairs go through this same loop: review, approval, revalidation, write, and after-state evidence.
      - Required, in a protected or customized file that this patch preserves: leave the file as it is and mark it **blocked pending calibration**. Do not overwrite it, and do not defer it silently to a later bootstrap.
    - A follow-up write set is a new proposal. It never extends the approved set without approval.
    - **Post-apply review loop.** Dispatch the same independent read-only reviewer on the actual applied outcome, its approval scope, and the validation evidence, using the same verdict contract as step 4. Orchestrator verification failures are CHANGES in this same loop, not a new approval vote. On findings or failed checks, repair only within the approved scope, rerun validation, and re-review until PASS. Stop on identical findings with no new evidence, or on a missing authority or data, and ask.
    - Any change outside the approved write set returns to step 4 and needs approval again before it is written.
    - Report two statuses. **Applied**: the write set as written, and anything **pending** (parked, blocked, or waiting on an answer). **Reviewer-accepted**: only when the current outcome has a review PASS and verified evidence for every acceptance check. A missing reviewer or evidence is **BLOCKED**, never completion. For `--dry-run`, report only the reviewed preview: nothing was applied or post-apply verified. Reviewer acceptance does not authorize extra writes, deletions, or a commit, and it needs no separate final human vote.

7.  **Cleanup (terminal)**: keep the temp source until final acceptance or the last rework has passed its scoped checks. Then remove it:

    ```bash
    rm -rf "$TOOLKIT_TEMP"
    ```

    If the temp source is gone when a rework or resume needs it, rerun the source gate: fetch again and compare with the recorded identity (npm `dist.integrity`, or the tag commit) before reuse. A mismatch or an unavailable source is **STOP**.

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
- **Auditable**: Report approved paths, review verdicts, and verification evidence; commit only on explicit request
