---
name: factory
description: Opt-in software factory for feature-sized work. Runs one job through intake questions, a spec gate, a plan gate, build in an isolated git worktree (or in place on request), parallel reviews by lens, approval, and then a merge: local, or a merge request on the forge. Feature docs live in the feature folders, job state in factory/jobs/, and tickets (when the project tracks them) follow the job. Invoked as /factory with a request (intake), start, approve, rework, abandon, status, watch, archive, or prune. Quick fixes stay direct.
---

# Factory (orchestrator)

One orchestrator session runs a feature through intake → spec → plan → build → review → approve → merge. Agents get their context from files and each agent writes only its own file. You are the orchestrator: you ask the intake questions, dispatch agents, read their files, rewrite `job.json`, run the gates with the operator, handle tickets, and run the merge. You never write code, specs, plans, reviews, or `qa.md` yourself. Exceptions: you write `intake.md` from the operator's answers, `spec-<k>.md` and `plan-<k>.md` from the operator's change requests, `tasks.md` ticket keys, the feature folder rename and copy, the feature docs commit on the job branch, worktree and branch removal, the moves and branch deletions in Archive, `decision.md` with `ESCALATE` when retries run out, `merge-conflict.md` on a merge conflict, `bootstrap.md` on a failed worktree bootstrap step, the push and merge request in `push-mr` mode (see Merge procedure), and `rework-<k>.md` from the user's note.

The factory is opt-in and sits alongside Feature Builder and TDD. Nothing runs unless the user invokes `/factory`.

## Placeholders

Bootstrap replaces these when it adopts the template. The names below have no braces, so bootstrap and doctor skip them. Wherever this skill uses a name from the table wrapped in double curly braces, the project's value replaces it. Any other double-curly-brace token in this skill is an error.

| Placeholder | Meaning | Default |
| --- | --- | --- |
| DEFAULT_BRANCH | Branch jobs start from and merge into | `main` |
| FACTORY_PORT_BASE | Base dev-server port for job ports | `5100` |
| APPROVAL_MODE | `human` stops at `awaiting-human`; `auto` merges on `APPROVE` | `human` |
| FACTORY_REVIEW_LENSES | Comma list drawn from `code, security, ux, ui` | `code, security` |
| FACTORY_FEATURE_PATHS | Feature-folder roots, comma list, relative to the repo root. A `*` matches one folder name. Intake, Start, and Status search every root. A new feature goes to the first root without `*`, or to a `*` root when its code sits in exactly one app (see Feature folders) | monorepo: `apps/*/docs/features, docs/features`; repo: `docs/features` |
| MERGE_MODE | `local`: `--no-ff` merge on this machine, never pushed. `push-mr`: push `factory/<id>` and open a merge or pull request with the forge CLI; the forge merges. Any other value is `local` | `local` |

## When to use

- **Use** for feature-sized work: several files, needs a spec and review.
- **Stay direct** for quick fixes, typos, single-file edits, and mechanical refactors. Ponytail applies to everything: the spec asks for the minimum, and the builder ships the shortest working diff.
- **Prerequisite:** the target project's `AGENTS.md` documents setup, dev, test, lint, and build commands, plus how the dev server takes a port flag or env var. In a monorepo, that includes the root commands and the filtered form for each app and package. Agents read those commands there. If any are missing, stop and ask the user to add them. The `ux` and `ui` lenses also need a browser tool available to the harness (for example a browser MCP server). Without one they report `Not verified`.

## Invocations

| Invocation | Action |
| --- | --- |
| `/factory [--in-place] <request>` | Intake (see Intake): read the project, ask only glaring questions, then continue as `start` |
| `/factory start [--in-place] <request \| KEY \| slug \| job-id>` | Resolve the feature folder, or resume its open job (see Start). `--in-place` applies only to a new job |
| `/factory approve <job-id>` | Merge a job in `awaiting-human` or `needs-human` (`local`), or push it and open its merge request (`push-mr`, see Merge procedure). In `push-mr`, approving an `awaiting-human` job whose request is open finishes it once the forge has merged it. On a `merged` job, move its tickets to Done |
| `/factory rework <job-id> <note>` | Write a rework note, start a fresh builder, reset the retry budget |
| `/factory abandon <job-id>` | Close a job that will not continue. Nothing is merged. The worktree and branch are removed only when the branch has no unmerged commits (see Abandon) |
| `/factory status [--all]` | Summarize open jobs from their `job.json` (read-only). Closed jobs are hidden unless `--all` (see Status) |
| `/factory watch [--all]` | Show the status table, then the command for the live view to run in a terminal (read-only). `--all` as for status |
| `/factory archive [--all] [--dry-run]` | Move closed jobs to `factory/archive/` (see Archive). Open jobs never move |
| `/factory prune [--all] [--abandoned] [--dry-run]` | Permanently delete closed jobs from `factory/jobs/` and `factory/archive/` (see Prune). Open jobs and feature folders are never touched |

A first argument of `start`, `approve`, `rework`, `abandon`, `status`, `watch`, `archive`, or `prune` selects its row. Anything else is a request for intake. A bare job id that matches an existing `factory/jobs/<id>/` or `factory/archive/<id>/` is not a request: it goes to Start. An archived job is closed. `rework` and `abandon` refuse it. `approve` on an archived `merged` job only moves its tickets to Done, and merges nothing.

## Layout

```
<feature root>/<KEY>-<slug>/  tracked by the project; feature docs (roots: {{FACTORY_FEATURE_PATHS}})
  spec.md                    spec-writer, spec mode (from the feature spec template)
  plan.md                    spec-writer, plan mode: approach, steps, and the **Size:** line
  tasks.md                   spec-writer, plan mode, large work only
  qa.md                      builder, on the branch: suggested manual checks (not a gate)
factory/
  README.md                  setup and reference
  .gitignore                 ignores jobs/ and archive/
  worktree-bootstrap.md      project-owned steps run in each new worktree (see Worktree)
  jobs/                      runtime state, ignored by git
    <NNN-slug>/
      job.json               orchestrator only; rewrite the whole file
      intake.md              you, from the intake questions and answers (only when asked)
      spec-<k>.md            you, from the operator's change request at the spec gate
      plan-<k>.md            you, from the operator's change request at the plan gate
      build.md               builder; cumulative round log
      round-<N>/review-<lens>.md   one per configured lens
      decision.md            approver (or you, on escalation)
      merge-conflict.md      you, on a merge conflict (blocks approve)
      bootstrap.md           you, on a failed worktree bootstrap step (blocks the build)
      rework-<k>.md          you, from the user's note
      main-copies/           feature docs moved aside at merge (see Merge procedure)
  archive/                   closed jobs moved here by /factory archive, ignored by git
    <NNN-slug>/              same layout as jobs/; never resumed
```

`<KEY>` is an issue key in the project's issue key format (`^[A-Z][A-Z0-9]+-\d+$`, as in `PROJ-1234`, the format `AGENTS.md` documents). Without a ticket, the folder is `<root>/<slug>/` and gets its key later if tracking starts.

### Feature folders

Feature folders live under the roots in `{{FACTORY_FEATURE_PATHS}}`, relative to the repository root. Every root is searched. Where a new folder goes:

- **Literal root** (no `*`): the first literal root is the home for cross-cutting features. In a single-package repo, that is the only root.
- **Per-app root** (`apps/*/docs/features`): a new feature goes there when the request's code sits in exactly one app directory the glob matches. Intake or Start names that app, creates `apps/<app>/docs/features/` if it is missing, and says the chosen folder in chat before creating anything. Code in several apps, or none, goes to the first literal root.
- **Existing folders** keep their place, wherever they were created. A feature is found by its folder name, not by its root.
- **Feature-root excludes**: git pathspec excludes for the feature folders. For each root, `':(exclude,glob)<root>'`, so `apps/*/docs/features` becomes `':(exclude,glob)apps/*/docs/features'`. Wherever this skill says "feature-root excludes", use one per root.

`job.json` records the chosen folder in `feature_dir`.

### job.json

```json
{
  "id": "001-onboarding-bootstrap",
  "feature": "Onboarding bootstrap for new workspaces",
  "feature_dir": "docs/features/PROJ-1234-onboarding-bootstrap",
  "issue_key": "PROJ-1234",
  "size": "large",
  "tracking": "tracked",
  "tracker_states": { "in_progress": "In Progress", "in_review": "In Review", "done": "Done" },
  "tracker_errors": [],
  "branch": "factory/001-onboarding-bootstrap",
  "worktree": true,
  "worktree_path": "/abs/path/to/repo-factory/001-onboarding-bootstrap",
  "mr": null,
  "failed_stage": null,
  "stage": "awaiting-plan",
  "round": 1,
  "lenses": ["code", "security"],
  "reviews": { "code": "pending", "security": "pending" },
  "approvalMode": "human",
  "createdAt": "2026-10-20T09:00:00Z",
  "updatedAt": "2026-10-20T09:05:00Z"
}
```

- `feature_dir`: repo-relative path of the feature folder. It changes only on the key rename (see Tracking).
- `issue_key`: the job's ticket key, or `null` when the job has none. A job started from a key has it from the start. A parent ticket created at the plan gate sets it.
- `size`: `small`, `large`, or `unclear`. Set from `plan.md` (see Plan).
- `tracking`: `none` or `tracked`.
- `tracker_states`: the project's status names, asked once when tracking first needs them. `null` until then.
- `tracker_errors`: failed ticket transitions or creations, as short strings. Reported, never blocking.
- `worktree`: `true` (default) builds in a git worktree. `false` builds in place in the main checkout (see In-place mode). Set when the job is created; changed only at the plan gate.
- `worktree_path`: absolute path of the job's worktree, or `null` for an in-place job and before the build starts.
- `mr`: URL of the merge or pull request opened in `push-mr` mode, or `null`. Set once; later approvals read its state (see Merge procedure).
- `failed_stage`: `spec` or `plan` when the job is `needs-human` because its spec or plan agent failed, else `null`. `/factory start` reruns that stage (see Start).
- `reviews` values are `pending`, `PASS`, or `CHANGES`.

Stages, in order: `spec` (spec-writer running), `awaiting-spec` (spec gate), `plan` (plan writer running), `awaiting-plan` (plan gate), `build`, `review`, `approve`, `awaiting-human`, `merged`, `needs-human`. In `push-mr` mode, `awaiting-human` with `mr` set means the request is open on the forge and waiting for its merge. `abandoned` is set by `/factory abandon`, from any open stage. Set `updatedAt` on every write. Use `date -u +%Y-%m-%dT%H:%M:%SZ`.

A job is **closed** when its stage is `merged` or `abandoned`. Every other job is **open**, and every open-job check in this skill uses that definition. Closed jobs that `/factory archive` moved to `factory/archive/` are archived (see Archive). A job **holds its build location** when it is open and has reached the build: its stage is `build`, `review`, `approve`, or `awaiting-human`, or `needs-human` with `failed_stage` `null`. A worktree job holds a worktree, and an in-place job holds the main checkout, for as long as it holds its build location.

## Intake

`/factory <request>` starts here. Intake writes nothing until its questions are answered, so the operator can answer before any folder, job, or spec exists.

1. **Analyze, read-only.** Read the project's `AGENTS.md`. List every feature root in `{{FACTORY_FEATURE_PATHS}}` (a `*` root expands to the app folders that exist) and read the title and Summary of each `spec.md` whose name or text matches the request's keywords, looking for related or overlapping features. Skim the code the request touches with glob and grep, and note which app directories it sits in. Work out the feature folder the way Start steps 1 and 2 would, without creating anything.
2. **Ask only glaring questions.** Ask at most five, in chat, as a numbered list, then wait. Ask only when one of these holds:
   - The scope is ambiguous: two readings lead to different specs.
   - The request conflicts with or duplicates an existing feature in a feature root.
   - A `*` root in `{{FACTORY_FEATURE_PATHS}}` applies, and the request's code sits in several apps or none, so the folder is not clear (see Feature folders). Ask which folder.
   - The target user, page, or system is missing.
   - No acceptance is implied: there is no way to tell when it is done.

   Do not ask about details the spec writer can decide and flag as `[PRODUCT DECISION]`, and do not ask for taste. If nothing is glaring, say so in one line ("No glaring questions; starting the job.") and continue to step 4. If the request resolves to an existing feature folder, still ask, then continue that feature.
3. **Intake gate.** Only when questions were asked. Once the operator has answered, show the questions and answers and ask in chat as a numbered choice:
   1. Continue to spec and plan.
   2. Make changes: the operator types them.

   Changes → revise the Q&A with the operator's text, show it, and ask again. Nothing is created until the operator picks 1.
4. **Continue as Start.** Treat the answers as clarifications of the request. Run Start from step 1 with the request text. Once the job folder exists (Start step 4), write `factory/jobs/<id>/intake.md` with the questions as asked and the answers, verbatim, one question and answer each. Skip the file when nothing was asked. The spec writer reads it (paths block). If Start resumes an open job instead of creating one, say the answers were not applied. Changes after the spec go through the spec gate, the plan gate, or `/factory rework`.

`--in-place` on the command, or the operator's answer saying so, sets `worktree` to `false` on the new job (see In-place mode).

## Start

Start runs for `/factory start <request | KEY | slug | job-id>`, and intake runs it after its gate.

### 1. Classify the argument

Strip a leading `--in-place` first. It is a flag, not part of the argument. Then check in this order:

1. No argument: ask for a request, key, slug, or job id.
2. A job id (`^\d{3,}-[a-z0-9-]+$`) with a folder at `factory/jobs/<id>/`: resume that job, or report that it is closed (see the resume table). A job id with a folder at `factory/archive/<id>/` is archived: say so and stop. Archived jobs are not resumable. To work on the feature again, `/factory start <slug or KEY>` creates a new job.
3. An issue key (`^[A-Z][A-Z0-9]+-\d+$`): match `<root>/<KEY>-*/` in every feature root of the main checkout.
4. A kebab slug (`^[a-z0-9]+(-[a-z0-9]+)*$`): match `<root>/<slug>/` or `<root>/<KEY>-<slug>/` in every feature root, where `<KEY>` has the key format in step 3.
5. Anything else is a free-text request. Derive a 2–4 word kebab slug from it, then match as in step 4.

### 2. Resolve the feature folder

Whichever way the folder was found, the job's key is the `<KEY>` in its name (`PROJ-12` for `PROJ-12-onboarding-bootstrap`), or `null` for an unkeyed folder. A keyed folder never gets a `null` key, so its parent ticket is not created a second time.

- **One match:** continue that feature. Its existing `spec.md`, `plan.md`, and `tasks.md` are inputs to the spec writer.
- **Several matches:** list them and ask which one.
- **None:**
  - From a key: read the ticket title through the [issue-tracker](../issue-tracker/SKILL.md) skill (MCP first, CLI fallback). Derive a kebab slug from the title (lowercase, non-alphanumerics to `-`, at most 4 words). Create `<target>/<KEY>-<slug>/`, where `<target>` is the new-feature folder (see Feature folders). If the ticket cannot be read, stop and ask for a slug. Do not guess.
  - From a slug or free text: create `<target>/<slug>/`, with the same `<target>`.

### 3. Resume or create the job

Look for open jobs (see Stages) whose `feature_dir` is this folder.

- **One open job:** resume it. Do not create a second. If the operator's text is a new request, say the open job was resumed and the new text was not applied. Use `/factory rework` for changes after the build. A `--in-place` flag on a resumed job is not applied: the recorded `worktree` stands, and say so.
- **Several open jobs:** list them and ask which one.
- **None:** create a job.

Resume by stage:

| Stage | Resume action |
| --- | --- |
| `spec` | Rerun `factory-spec-writer` in spec mode, then show the spec gate |
| `awaiting-spec` | Show the spec gate |
| `plan` | Rerun `factory-spec-writer` in plan mode, then show the plan gate |
| `awaiting-plan` | Show the plan gate |
| `build` | Rerun `factory-builder` in the mode the files call for: rework if a `rework-<k>.md` is newer than `build.md`, repair if the last review round has `CHANGES`, otherwise build |
| `review` | Rerun the review round `round` |
| `approve` | Rerun `factory-approver` |
| `awaiting-human` | Print the approver's rationale, the suggested checks from `qa.md` (see QA guidance), and the `/factory approve` command |
| `needs-human`, `failed_stage` `spec` | Rerun the spec stage (see Spec), then show the spec gate |
| `needs-human`, `failed_stage` `plan` | Rerun the plan stage (see Plan), then show the plan gate |
| `needs-human`, otherwise | Print the reason from `decision.md`, `merge-conflict.md`, `bootstrap.md`, or `build.md`, and the options: rework, approve, or abandon |
| `abandoned` | Closed. Say so and stop. To work on the feature again, run `/factory start <slug or KEY>`, which creates a new job |
| Archived (in `factory/archive/`, any stage) | Closed. Say so and stop (see Start step 1) |

A rerun of a failed stage sets `stage` to that stage and clears `failed_stage`.

A job with no work started (stage before `build`, so no build has begun and no `tasks.md` line is ticked) shows its current gate, which asks whether anything needs changing before it continues. A job whose work has started (stage `build` or later, or any ticked task) resumes without that prompt.

### 4. Create a new job

1. `mkdir -p factory/jobs` in the main checkout.
2. Find the highest `NNN` among `factory/jobs/NNN-*` and `factory/archive/NNN-*` directories (0 if none). Archived ids count, so an id is never reused. A pruned id is gone and may be reused. Candidate = highest + 1, zero-padded to at least 3 digits.
3. Slug = the feature folder name without its key prefix (`onboarding-bootstrap` for `PROJ-1234-onboarding-bootstrap`). Stable across the key rename.
4. `mkdir factory/jobs/<NNN-slug>` (no `-p`). If it already exists, bump `NNN` and retry. `mkdir` without `-p` is the claim.
5. Write `job.json` with stage `spec`, `feature_dir`, `issue_key` (the key from Resolve, or `null`), `size` `unclear`, `tracking` `none`, `worktree` (`false` for `--in-place` or when the operator asked for it at intake, `true` otherwise), and `worktree_path` `null`.
6. If intake asked questions, write `intake.md` (see Intake).

## Spec

Set stage `spec`. Dispatch `factory-spec-writer` in spec mode with the paths block, the feature request, and the feature folder. It writes `spec.md`. If `intake.md` is in the paths block, the spec writer reads it, and the operator's answers win over the request text where they conflict. Wait for `spec.md` (see Harness notes). Set stage `awaiting-spec` and show the spec gate.

## Spec gate (mandatory)

Runs in every `APPROVAL_MODE`, before any plan is written. Show the operator in chat:

- The spec's Summary, the number of acceptance criteria, each open `[PRODUCT DECISION]` item, and Open Questions.

Then ask in chat, as a numbered choice:

1. Confirm the spec. Offered only when no `[PRODUCT DECISION]` item is open.
2. Request changes: the operator types the change. Each open `[PRODUCT DECISION]` item needs an answer in the change text.

Handle the answer:

- **Confirm** → continue to Plan. If decision items are still open, do not continue: list them and ask again.
- **Request changes:** write the operator's text verbatim to `spec-<k>.md` in the job folder (`k` = next free index). Set stage `spec`, rerun `factory-spec-writer` in spec mode with the paths block and `spec-<k>.md`. It updates `spec.md`. Set stage `awaiting-spec` and show the gate again. The spec writer records each answered decision as `[DECIDED] <answer>`.

If the session ends at this gate, `/factory start <job-id|slug|KEY>` shows it again (see Start).

## Plan

Set stage `plan`. Dispatch `factory-spec-writer` in plan mode with the paths block, and `plan-<k>.md` when a plan change request is pending. It writes `plan.md` in the feature folder, and `tasks.md` for large work (or removes a stale `tasks.md` when the plan is small). It does not change `spec.md`.

Read the `**Size:**` line of `plan.md`:

- `**Size:** small`, `large`, or `unclear` → copy into `job.json`.
- No valid line → re-dispatch once. If it is still missing, treat the size as `unclear`.

Proposed tracking: `tracked` only when size is `large` and the project's `AGENTS.md` Project Management section names a real tracker. Unfilled placeholders mean no tracker. Otherwise propose `none`.

Set stage `awaiting-plan` and show the plan gate.

## Plan gate (mandatory)

Every job stops at `awaiting-plan` before anything is ticketed or built, in every `APPROVAL_MODE`. Show the operator in chat:

- The plan's approach and steps from `plan.md`.
- The size and the reason from `plan.md`.
- For large work, the lines of `tasks.md`.
- The tracking proposal: create tickets in the tracker under the parent (the job's key, or a new parent), or no tickets (`tasks.md` only), or no tickets at all.
- The build mode: `worktree` (default) or `in-place`, as set in `job.json`.

Then ask in chat, as a numbered choice:

1. Confirm the plan.
2. Request changes: the operator types the change.
3. If size is `unclear`: answer `small` or `large`.
4. Change tracking: `tracked` or `none`.
5. Change build mode: `worktree` or `in-place`.

Handle the answer:

- **Confirm** with size known → continue to Tracking. If size is still `unclear`, ask again.
- **Request changes:** write the operator's text verbatim to `plan-<k>.md` (`k` = next free index). Set stage `plan`, rerun `factory-spec-writer` in plan mode with the paths block and `plan-<k>.md`. Show the gate again. If the change touches the spec itself, send it through the spec gate instead: write it to `spec-<k>.md`, rerun spec mode, show the spec gate, then plan again.
- **Change size only:** the operator's answer to choice 3 sets `size` in `job.json`. The plan does not change.
- **Change tracking only:** update `tracking` in `job.json`. Do not rerun the spec writer.
- **Change build mode only:** update `worktree` in `job.json`. Do not rerun the spec writer. In-place is checked when the build starts (see In-place mode).

If the session ends at the gate, nothing is lost. `/factory start <job-id|slug|KEY>` returns to this gate (see Start).

## Tracking

Runs once, after the operator confirms the plan and before the build location is created. Skip it when `tracking` is `none`. Keys written in earlier attempts make each step idempotent, so a rerun picks up where it stopped. A re-plan keeps the keys already written: a line with a key is never ticketed again, and tickets for lines a re-plan removes are left as they are and reported.

1. **Tracker states.** If `tracker_states` is `null`, ask once for the project's status names for In Progress, In Review, and Done. The names come from the project's `AGENTS.md` or the issue-tracker skill. Record them in `job.json`.
2. **Parent.** If `issue_key` is set, that ticket is the parent. Otherwise create the parent ticket. Set `issue_key` to its key.
3. **Sub-tasks.** Run the `/assign-tasks` flow on the feature's `tasks.md`, with the issue-tracker skill's epic discovery and the flow's consolidation rules. Create one ticket per `tasks.md` line that has no key yet, under the parent.
4. **Write keys.** Append ` — <KEY>` to each line as its ticket is created. Lines that already have a key are skipped.
5. **Rename.** If the folder had no key, rename `<parent>/<slug>/` to `<parent>/<KEY>-<slug>/`, where `<parent>` is the feature root that holds it (the parent of `feature_dir`). Use `git mv` when git tracks the folder, `mv` otherwise. Stop if the target exists. Then update `feature_dir` in `job.json`. The rename is committed on the job branch with the feature docs (see Feature docs commit).

If a ticket cannot be created, stop at `awaiting-plan`. Report the lines that have keys and the error, and record it in `tracker_errors`. The operator can fix the cause and run `/factory start <job-id>`, or switch tracking to `none`.

## Worktree

The default build location. Use the [using-git-worktrees](../using-git-worktrees/SKILL.md) skill for its safety checks only. Its directory selection does not apply: the path below overrides it. Never edit `.gitignore` for the worktree.

- Branch `factory/<id>` from `{{DEFAULT_BRANCH}}`.
- Path `../<repo-name>-factory/<id>/` relative to the main checkout, where `<repo-name>` is the basename of the main checkout. Record it in `worktree_path`.
- Create it at the start of the build stage, after the plan gate and tracking. Reuse it if it exists (rework and repair).
- Copy the job's `spec.md`, `plan.md`, and `tasks.md` (if any) from the main checkout's feature folder into the same relative path in the worktree. The builder ticks `tasks.md` there. Then run the bootstrap (next subsection) and make the feature docs commit.
- Job state stays in the main checkout's `factory/jobs/<id>/`, never in the worktree.

### Worktree bootstrap

Each new worktree needs its own setup: dependencies or vendored packages, local env files, and a database for the job. The project lists those steps in `factory/worktree-bootstrap.md`, one shell command per line, in order. Comment lines are notes, and the default file has no active steps. The project edits the file; this skill only runs it.

- Run each step from the worktree root, after the copy above and before the feature docs commit. A reused worktree (rework, repair) reruns the steps, so they must be safe to run again.
- Each step gets these variables: `FACTORY_JOB_ID` (the job id, for names such as a per-job database), `FACTORY_PORT_BUILDER` (the builder's dev-server port), `FACTORY_WORKTREE` (the worktree path), and `FACTORY_MAIN_CHECKOUT` (the main checkout, where ignored local files such as `.env` live).
- A step that fails stops the build before the builder is dispatched. Write `bootstrap.md` in the job folder with the step, its exit code, and the last lines of its output; set stage `needs-human`. The worktree stays. The operator fixes the cause, then runs `/factory rework <id>`, which reruns the bootstrap before the builder. Delete `bootstrap.md` once every step passes.
- In-place builds do not bootstrap. The main checkout is the environment, so run the steps by hand there if it lacks them.

## Feature docs commit

Runs once the job's branch exists, in its build location (the worktree, or the main checkout for an in-place job), before the builder is dispatched. It puts the job's feature docs on the branch, so the main checkout can stay clean and the merge carries them:

1. Remove the old unkeyed folder when the feature folder was renamed to its keyed name: `git rm -r -q --ignore-unmatch -- <parent>/<slug>`, where `<parent>` is the parent of `feature_dir`. Skip it when `feature_dir` is `<parent>/<slug>`.
2. `git add -A -- <feature_dir>`.
3. `git diff --cached --quiet || git commit -q -m "docs: feature docs for <id>"`. Nothing is committed when nothing is staged.

It stages only the job's own paths. Other features' doc edits in the main checkout are left alone. Merge procedure step 3 reconciles the main checkout's copies.

## In-place mode

Used only when `worktree` is `false`: the operator asked for it with `--in-place`, at intake, or at the plan gate. The build then runs in the main checkout. Nothing is copied: the feature docs commit puts them on the branch.

Create the branch at build start, after the plan gate and tracking, only when all four checks pass. If one fails, stay at `awaiting-plan` and tell the operator which one:

- The main checkout is on `{{DEFAULT_BRANCH}}`.
- `git status --porcelain --untracked-files=no -- . <feature-root excludes>` is empty. The feature docs are excluded because the spec writer and tracking write there, and the feature docs commit carries them onto the branch.
- No other job with `worktree` `false` is open (not `merged` or `abandoned`).
- No job with `worktree` `true` holds its build location.

Then run `git switch -c factory/<id> {{DEFAULT_BRANCH}}` in the main checkout, or `git switch factory/<id>` if the branch exists. Then make the feature docs commit. Keep `worktree_path` `null`. The Worktree line of the paths block is the main checkout.

While the job is open, the main checkout stays on `factory/<id>`. Say so at `awaiting-human` and `needs-human`. Before rework, repair, or a resume, switch the main checkout to `factory/<id>` if it is not already there, after the dirty-tree check above.

## Ports

For job number `n` (the integer of `NNN`):

- builder dev server: `{{FACTORY_PORT_BASE}} + 10n`
- ux reviewer: builder port + 1
- ui reviewer: builder port + 2

## Paths block

Every subagent prompt starts with this block, filled in:

```
PATHS
- Main checkout (absolute): <abs>
- Job folder (absolute): <abs>/factory/jobs/<id>
- Feature folder (absolute, main checkout): <abs>/<feature_dir>
- Worktree (absolute): <abs>/../<repo-name>-factory/<id>   (in-place: the main checkout)
- Feature folder in worktree (absolute): <worktree>/<feature_dir>   (in-place: the main checkout's)
- qa.md (absolute, build location): <worktree>/<feature_dir>/qa.md
- Branch: factory/<id>
- Default branch: {{DEFAULT_BRANCH}}
- Intake answers (absolute, only when intake.md exists): <job folder>/intake.md
- Round: <N>
- Ports: builder <p>, ux <p+1>, ui <p+2>
```

Agents read their inputs and write their one output file by these absolute paths. The spec-writer works in the main-checkout feature folder. Reviewers and the approver read the spec and plan there. The builder reads them there and ticks `tasks.md` in the build location's copy. Reviewers read `qa.md` at the paths block's `qa.md` line, for context only.

## Loop

Let `N` be the current round, starting at `1` for a new job.

1. **Spec.** Dispatch `factory-spec-writer` in spec mode (see Spec).
2. **Spec gate.** Show the gate and wait for the operator's confirmation (see Spec gate). Do not continue until the operator confirms.
3. **Plan.** Dispatch `factory-spec-writer` in plan mode (see Plan). Set stage `awaiting-plan`.
4. **Plan gate.** Show the gate and wait for the operator's confirmation (see Plan gate). Do not continue until the operator confirms.
5. **Tracking and build location.** Run Tracking if `tracking` is `tracked`. Create the build location: the worktree and its copy of the feature docs (see Worktree), or the in-place branch (see In-place mode). Set `worktree_path` if a worktree was made. Set stage `build`. Move any tracked tickets to In Progress (see Ticket lifecycle).
6. **Build.** Dispatch `factory-builder` in build mode. Wait (see Harness notes), then read the first line of `build.md`:
   - `STATUS: READY` → continue.
   - `STATUS: BLOCKED` → stage `needs-human`. Tell the user the reason from `build.md`. Stop.
   - Anything else → treat as BLOCKED with reason "builder wrote no valid status".
7. **Review round N.** Set stage `review`, `round` to `N`, and every configured lens to `pending` in `reviews`. Move tracked tickets to In Review. Dispatch the lenses from `{{FACTORY_REVIEW_LENSES}}` in two stages, each with the paths block:
   - **Stage A:** `code` → `factory-reviewer-code` and `security` → `factory-reviewer-security`. Dispatch both in one parallel batch (one message with multiple agent calls) when the harness can.
   - **Stage B:** `ux` → `factory-reviewer-ux` and `ui` → `factory-reviewer-ui`, the browser lenses. Start them only after every stage A review is written. The code reviewer's build runs in the shared build location and would clobber the browser lenses' dev servers. The two browser lenses use separate ports and may run in parallel with each other.

   If the harness cannot dispatch in parallel, run the lenses one at a time, in the order above.

   Wait for every `round-N/review-<lens>.md` (see Harness notes). Each must have a first line `VERDICT: PASS` or `VERDICT: CHANGES`. A reviewer that returns without a valid file is re-dispatched alone, once. If it still fails, stage `needs-human`. Never resume the builder during a review round. Update `reviews` from the verdicts.
8. **Verdicts.** Check in this order:
   - Any blocking item titled `Not verified:`, from any lens: no repair. Stage `needs-human`. Tell the user the `Not verified` items. Stop.
   - Any `CHANGES`, and the cycle has used fewer than 3 review rounds: run a builder repair (below) with `Round` set to `N`, the round just reviewed. Then set `N` to `N + 1` and go to step 7.
   - Any `CHANGES` on the third review round of the cycle: write `decision.md` with first line `ESCALATE` and the reason ("retries exhausted after round N; open items: …", listing the blocking items). Stage `needs-human`. Tell the user. Stop.
   - All `PASS`: go to step 9.

   A review cycle is the rounds since the job started, or since the latest `rework-<k>.md` (see Rework). "Third review round of the cycle" means two repairs have already been made in this cycle. The rework note records where its cycle starts.
9. **Approve.** Set stage `approve`. Dispatch `factory-approver` with the paths block. Wait for `decision.md` (see Harness notes). Its first line must be `APPROVE` or `ESCALATE`. If the line is missing or invalid, re-dispatch once, then stage `needs-human`.
   - `ESCALATE` → stage `needs-human`. Tell the user the rationale. Stop.
   - `APPROVE` and `{{APPROVAL_MODE}}` is exactly `auto` → run the merge procedure.
   - `APPROVE` otherwise: stage `awaiting-human`. Print the suggested checks (see QA guidance). Tell the user to run `/factory approve <id>` after reviewing the branch. Stop. Any value other than exactly `auto` is treated as `human`.

### Repair

Dispatch `factory-builder` in repair mode with the paths block, where `Round` is the round just reviewed (the `N` from step 7, before it increments). It reads `spec.md`, `plan.md`, `build.md`, and `round-<Round>/review-*.md`. It must address every `CHANGES` item or justify it in `build.md`. It also rewrites `qa.md`. Wait for `build.md` (see Harness notes) and check its first line again (step 6 rules).

### Builder continuity

The builder keeps its context across repairs by whichever mechanism the harness offers:

- Resume the same builder session for repairs only where the harness supports it (Claude). Otherwise use the fresh-builder fallback below.
- Launch a fresh builder and point it at `spec.md`, `plan.md`, `build.md`, and the latest round's reviews. The files are the memory. The session is only a convenience.

Either way the builder runs only between reviews, never during one.

### Failures

- Missing or unreadable `AGENTS.md` commands → stop and ask the user to add them. Do not guess commands.
- An agent that finishes without its expected file → re-dispatch that agent once, then `needs-human`. For a spec or plan agent, set `failed_stage` to `spec` or `plan` with it.
- An agent that times out is not re-dispatched (see Harness notes).

## Ticket lifecycle

Tickets follow the job. The parent and every sub-task listed in `tasks.md` move together. Tickets exist only when `tracking` is `tracked`.

| Event | Tickets move to |
| --- | --- |
| Build starts, including rework | In Progress |
| Review round starts | In Review |
| The merge completes: the local merge, or in `push-mr` the finish step after the forge merged the request (`/factory approve`) | Done |
| `/factory approve` on a `merged` job (for example after `auto` merged it) | Done |
| `push-mr` opens or updates the request | In Review (no change) |
| `/factory abandon` | Left as they are. The report lists their keys |

Rules:

- Use the names in `tracker_states`. Ask once if unknown (see Tracking).
- A failed transition is appended to `tracker_errors`, reported to the user, and never blocks the pipeline. Repeat transitions to the same status are harmless.
- `needs-human`, `awaiting-human`, and `abandoned` leave the tickets where they are. Only the operator's approval moves them to Done.
- The approver never transitions tickets.

## Rework

`/factory rework <job-id> <note>`:

1. Refuse unless stage is `awaiting-human` or `needs-human`, and the build location still exists (the worktree, or the branch for an in-place job). If a timed-out agent may still be running (see Harness notes), first confirm with the operator that it has stopped.
2. `k` = next free index of `rework-<k>.md` in the job folder, starting at 1.
3. Let `N` = `round + 1`. Write `rework-<k>.md`:

   ```
   Starts at round N.

   <the user's note, verbatim>
   ```

4. Set `round` to `N`, stage `build`. Move tracked tickets to In Progress. For an in-place job, switch the main checkout to `factory/<id>` if needed (see In-place mode). For a worktree job, rerun the bootstrap first (see Worktree bootstrap); a failed step stops the rework the way it stops a build. Dispatch a fresh `factory-builder` in rework mode. It reads the latest `rework-<k>.md` and rewrites `qa.md`. Wait for it. Then continue from step 6's status check on `build.md` (do not dispatch the builder again), and run review round `N` from step 7.

The new cycle starts with a fresh repair budget. Old rounds and reviews are kept, not overwritten.

## QA guidance (non-gating)

The builder writes `qa.md` in the feature folder of its build location (the worktree's copy, or the main checkout's for an in-place job). It is committed with the work. It is the operator's checklist for a human look before approval:

- How to run the feature: setup, dev-server command and port, seed data, flags.
- Numbered manual checks, each tied to an `AC-n` in `spec.md`, with the expected result.
- "Not covered by automated tests" items.

The builder rewrites it on repair and rework rounds. A small job can have a few lines.

Rules:

- `qa.md` never affects a verdict. Reviewers may read it for context. The approver ignores it.
- A missing `qa.md` is noted, never blocking.
- When the job reaches `awaiting-human` or `needs-human`, and after an auto merge, print `qa.md` (from the build location before the merge, from the main checkout's feature folder after it). Then print the `## Not verified` items from the latest round's reviews. Put this line before them: `Suggested checks before /factory approve — not a gate`. If `qa.md` is missing, print `No qa.md: no suggested checks.` in its place.

## Approve

`/factory approve <job-id>`:

1. If stage is `merged`: move the job's tickets to Done (if tracked), report, and stop. Do not merge again.
2. Otherwise refuse unless stage is `awaiting-human` or `needs-human`. The user's explicit command is the approval. Do not re-run the approver.
3. Refuse unless the first line of `build.md` is exactly `STATUS: READY`. A job that failed before its build has no `build.md`: say so, and point to `/factory start <job-id>` (for a failed spec or plan step) or `/factory abandon <job-id>`.
4. Refuse while `merge-conflict.md` exists in the job folder. The user resolves the conflict on the branch, then removes that file.
5. Print the reason the job stopped before merging, so the user sees what they approve: the `ESCALATE` rationale in `decision.md`, the `Not verified` items, or the failed agent. For `awaiting-human`, print the approver's rationale.
6. Run the merge procedure for `{{MERGE_MODE}}`. In `push-mr`, a job with `mr` set takes the finish path there instead.

## Abandon

`/factory abandon <job-id>` closes a job that will not continue, such as one stopped before its build or one the operator no longer wants. It merges nothing and pushes nothing. If the job has `mr` set, the report gives its URL: abandon does not close the request, so the operator closes it on the forge.

1. Refuse if the stage is already `merged` or `abandoned`. If an agent for the job may still be running (stage `spec`, `plan`, `build`, `review`, or `approve`), confirm with the operator in chat first, because the agent may still write its file.
2. Set stage `abandoned`, `failed_stage` `null`, and `updatedAt`.
3. If the job holds a build location (see Stages), let `U` be `git rev-list --count {{DEFAULT_BRANCH}}..factory/<id>`, the branch's commits that the default branch lacks. `U` is zero when the branch does not exist.
   - `U` is zero: a worktree job runs `git worktree remove <worktree_path>`, then `git branch -d factory/<id>`. An in-place job, when the main checkout is on `factory/<id>`, runs `git switch {{DEFAULT_BRANCH}}`, then `git branch -d factory/<id>`.
   - `U` is above zero: keep the worktree and the branch, so the commits are not lost. An in-place job still switches the main checkout back to `{{DEFAULT_BRANCH}}` when it is clean, so the main checkout is free.
   - Use `-d` and never `--force`. A step that fails (uncommitted changes, a dirty checkout) is left in place and reported.
   Every job that reached its build has the feature docs commit, so its `U` is above zero and its branch and worktree stay. That is expected.
4. Leave the tickets where they are and do not transition them. List their keys in the report.
5. Report what was removed, what was kept and why, and the ticket keys.

## Merge procedure

Mode: `{{MERGE_MODE}}`. Exactly `push-mr` runs the forge procedure, after the local merge below. Any other value runs the local merge, the default and the only mode that never pushes.

### Local merge

Local only. **Never push.** Never force-delete a branch or worktree.

1. **Preconditions.** Worktree jobs: the main checkout is on `{{DEFAULT_BRANCH}}`. In-place jobs: the main checkout is on `factory/<id>`. For both, `git status --porcelain --untracked-files=no -- . <feature-root excludes>` is empty. Feature docs are excluded here, through the feature-root excludes, because step 3 reconciles them. Untracked files, including ignored `factory/jobs/**`, do not block. Worktree jobs also stop while another in-place job holds its build location (see Stages). Say which job it is: "In-place job `<id>` holds the main checkout; approve or abandon it first." If a precondition fails, stop and tell the user. Do not change the stage. For an in-place job, once the checks pass, run `git switch {{DEFAULT_BRANCH}}`. The branch stays in place.
2. Record `PRE=$(git rev-parse HEAD)`.
3. **Feature docs.** The branch already carries the job's feature docs (see Feature docs commit), so the main checkout's copies are set aside and its feature paths return to the `{{DEFAULT_BRANCH}}` state. Let `P` be `<feature_dir>`, plus `<parent>/<slug>` (the parent of `feature_dir`) when that differs:
   - Copy each path that `git status --porcelain --untracked-files=all -- <P>` lists into `factory/jobs/<id>/main-copies/`, keeping its path. For a rename, copy the new path. Skip paths that no longer exist.
   - `git reset -q -- <P>`, then `git clean -fdq -- <P>`. This removes only the untracked copies made above.
   - If `git ls-tree -r --name-only {{DEFAULT_BRANCH}} -- <P>` lists files, `git checkout -- <P>` restores them.

   This is a move, not a delete. Git refuses a merge that would overwrite local or untracked files, so this step must come first.
4. `git merge --no-ff factory/<id> -m "Merge factory/<id>: <feature>"`. On conflict run `git merge --abort`, copy the `main-copies/` files back to their paths, write `merge-conflict.md` in the job folder listing the conflicting files, set stage `needs-human`, and report them.
5. Run the test commands from `AGENTS.md`'s Commands table in the main checkout, scoped to the change. Map the paths in `git diff --name-only $PRE HEAD` to their apps and packages, and run the test command of each one. A changed shared package also runs the test command of every workspace that depends on it (the package manifests show which). Run the root test command too when the table lists one. On failure run `git reset --keep $PRE` (this undoes the merge), copy the `main-copies/` files back to their paths, set stage `needs-human`, and report the failing output. For an in-place job, the main checkout stays on `{{DEFAULT_BRANCH}}` and the branch stays for inspection.
6. Worktree jobs: `git worktree remove <worktree>`, then `git branch -d factory/<id>`. In-place jobs: skip the worktree removal and run only `git branch -d factory/<id>`. `-d` refuses unless the branch is merged, which is the safety check. If either fails after the merge succeeded, do not undo the merge. Continue to step 7 and report the leftover worktree or branch path for the user to remove.
7. Set stage `merged`. If the merge came from `/factory approve`, move the job's tickets to Done (if tracked). After an `auto` merge they stay In Review; tell the user to run `/factory approve <id>` to move them to Done. Report that the merge is local and was not pushed. Print the suggested checks (see QA guidance).

On any `needs-human` outcome, leave the branch and worktree in place so the user can inspect them.

### Push and merge request (`push-mr`)

Runs in place of the local merge, when `{{MERGE_MODE}}` is `push-mr` and the approval is an `/factory approve` or an `auto` APPROVE. It pushes the branch and opens one merge request (GitLab) or pull request (GitHub). The forge's review and merge are the final gate, so nothing merges locally, the main checkout is not touched, and force-push is never used.

1. **Forge and preconditions.** Pick the forge from `git remote get-url origin`: a GitHub host uses `gh`, a GitLab host uses `glab`. Stop and tell the operator if that CLI is missing or its auth check fails (`gh auth status` or `glab auth status`). The build location must have no tracked changes: `git -C <build location> status --porcelain --untracked-files=no` is empty. Do not change the stage on a failed precondition.
2. **Test gate.** Run the test commands of the local merge, step 5, in the build location on the branch, before any push. A failure sets stage `needs-human`, reports the output, and pushes nothing.
3. **Push.** `git -C <build location> push -u origin factory/<id>`. A rejected push stops here: set stage `needs-human` and report the message. Do not force.
4. **Open the request, once.** Skip this step when `mr` is already set. Otherwise:
   - GitHub: `gh pr create --base {{DEFAULT_BRANCH}} --head factory/<id> --title "<feature>" --body-file <job folder>/decision.md`
   - GitLab: `glab mr create --source-branch factory/<id> --target-branch {{DEFAULT_BRANCH}} --title "<feature>" --description-file <job folder>/decision.md --yes`

   Record the URL the command prints in `mr`. A failed command sets stage `needs-human` and reports the error. Nothing is recorded, and rerunning approve retries from step 1.
5. **Stage.** Set stage `awaiting-human`. Tickets stay In Review. Print the request URL and say: "Review and merge it on the forge, then run `/factory approve <id>` to finish." Under `auto`, the same message applies: the forge merge stays the human gate.
6. **Finish (`/factory approve` with `mr` set).** Run `git fetch origin`, then read the request's state: `gh pr view <mr> --json state --jq .state`, or `glab mr view <mr> --output json` and its `state` field. If the CLI's flags differ, check its `--help` first.
   - **Merged:** a worktree job runs `git worktree remove <worktree_path>`. An in-place job runs `git switch {{DEFAULT_BRANCH}}` in the main checkout when it is on `factory/<id>`. Then `git branch -D factory/<id>`. This is the one place the local merge's `-d` rule does not apply: `-d` refuses after a squash merge, and the forge's merge is the proof. If the removal fails, keep what remains and report the path. Then set the main checkout's feature copies aside with local merge step 3, so the default branch's merged docs can arrive on pull, and tell the operator to pull `{{DEFAULT_BRANCH}}`. Set stage `merged`, move tickets to Done (if tracked), and report.
   - **Open:** if `git rev-parse factory/<id>` differs from `git rev-parse origin/factory/<id>`, the job has commits the request lacks (for example after a rework). Run steps 2 and 3 to update it, and report that the request was updated. Otherwise report that it is still open, and stop. Nothing else changes.
   - **Closed without merge:** keep stage `awaiting-human`, report it, and offer rework, reopening the request on the forge, or abandon.

## Status

Read each `factory/jobs/*/job.json`. Print one row per open job: id, stage, round, reviews, issue key, size, tracking, updatedAt, and the next action for that stage. Write nothing.

Closed jobs (`merged` or `abandoned`) are hidden by default. Print one line in their place: `N closed jobs hidden (--all to show)`. With `--all`, show the closed jobs too, and the archived jobs from `factory/archive/`. The table below lists every stage, closed ones included.

| Stage | Next action |
| --- | --- |
| `spec` | Wait, or `/factory start <id>` to resume if the session ended |
| `awaiting-spec` | `/factory start <id>` to review the spec and confirm it |
| `plan` | Wait, or `/factory start <id>` to resume if the session ended |
| `awaiting-plan` | `/factory start <id>` to review the plan and confirm it |
| `build`, `review`, `approve` | Wait, or `/factory start <id>` to resume if the session ended |
| `awaiting-human` | Review the branch and its `qa.md` (suggested checks, not a gate), then `/factory approve <id>`. In `push-mr` with `mr` set: merge the request on the forge, then `/factory approve <id>` to finish. Print the request URL |
| `needs-human` | Read the reason. A failed spec or plan step: `/factory start <id>` reruns it. After a build: `/factory rework <id> <note>` or `/factory approve <id>`. Either way, `/factory abandon <id>` closes the job |
| `abandoned` | Nothing: the job is closed. To work on the feature again, `/factory start <slug or KEY>` creates a new job |
| `merged` | Nothing, unless tickets are not Done yet: `/factory approve <id>` |

## Watch

`/factory watch` is read-only. It changes no stage and dispatches nothing.

1. Run `npx nitm-ai-dev-toolkit factory status` from the main checkout and show its table in chat. Pass `--all` when the operator asked for it.
2. Tell the operator to copy this exact command into a real terminal for the live view. Like status, it hides closed jobs unless `--all` is added:

   `npx nitm-ai-dev-toolkit factory watch`

The live view needs an interactive terminal, which agent shells do not have, so do not run `watch` yourself. If the CLI cannot run, read each `job.json` and print the same table, as `/factory status` does.

## Archive

`/factory archive [--all] [--dry-run]` archives closed jobs. It moves them from `factory/jobs/<id>/` to `factory/archive/<id>/` and never touches an open job. Archived jobs are not resumable.

1. **Move.** Run `npx nitm-ai-dev-toolkit factory archive [--all] [--dry-run]` from the main checkout and show its output. It moves folders and touches no git state. If the CLI cannot run, do the same moves directly:
   - A job is closed when its stage is `merged` or `abandoned`. Any other stage is open: skip it and count it.
   - Default: move closed jobs whose `updatedAt` is more than 7 days before now (`date -u`). A closed job with no valid `updatedAt` is not moved. `--all`: move every closed job.
   - Move with `mkdir -p factory/archive`, then `mv factory/jobs/<id> factory/archive/<id>`. If `factory/archive/<id>` already exists, skip the job and report it. Never overwrite.
   - `--dry-run`: list the jobs that would move, move nothing, and skip step 2.
2. **Abandoned branches.** For each archived `abandoned` job whose branch `factory/<id>` still exists, ask the operator once per branch, in chat, as a numbered choice:
   1. Delete the branch and its worktree.
   2. Keep both.

   Before asking, show the branch, the worktree path from `job.json` (`worktree_path`) when `git worktree list` still shows it, and `U`, the count of unmerged commits (see Abandon).

   On yes: if the worktree still exists, run `git worktree remove <worktree_path>` without `--force`. Then run `git branch -D factory/<id>`. This is the one place the skill uses `-D`, because the operator has just seen the `U` commits that will be lost. If the worktree removal fails, keep the branch and report why. On no, leave both in place.
3. **Merged branches.** Never delete a branch of a merged job here. Merge removes it when it can. List each `factory/<id>` branch that still belongs to an archived `merged` job, and say that `git branch -d` removes it once the operator has checked it.
4. **Report.** Give the moved count, the open-job count, the jobs skipped (archive folder already present, or no valid `updatedAt`), the branches deleted, the branches kept and why, and the merged leftovers. Never push.

## Prune

`/factory prune [--all] [--abandoned] [--dry-run]` permanently deletes closed jobs from both `factory/jobs/` and `factory/archive/`. By default only `merged` jobs are deleted. `--abandoned` also deletes `abandoned` jobs. A pruned job cannot be recovered. It never deletes an open job, and it never touches a feature folder.

The age rule is the same as Archive: by default only jobs whose `updatedAt` is more than 7 days ago, and `--all` drops the age limit. A job with no valid `updatedAt` is not selected. `--abandoned` adds `abandoned` jobs under the same rule. Without it, abandoned jobs are never selected, and the list counts the ones it kept.

1. **List.** Run `npx nitm-ai-dev-toolkit factory prune [--all] [--abandoned]` from the main checkout, without `--yes`, using the flags the operator asked for. It lists the candidates and deletes nothing. Show the list in chat. If the list has abandoned candidates, read each one's `job.json` and keep its id, its `worktree_path`, and whether branch `factory/<id>` still exists. This must happen before any delete, because the folder and its `job.json` are gone afterwards. If the list kept abandoned jobs because `--abandoned` was not passed, say how many and offer once, in chat, to rerun the list with `--abandoned`. Do not add the flag without a yes.
   With `--dry-run`, stop after this step. Nothing is deleted, and no question or branch question is asked.
2. **Confirm.** Ask once in chat, as a numbered choice:
   1. Permanently delete the listed jobs.
   2. Cancel.

   Nothing is deleted without a yes. On cancel, stop and report that nothing changed.
3. **Delete.** On yes, run `npx nitm-ai-dev-toolkit factory prune [--all] [--abandoned] --yes` with the same flags as step 1. It deletes the listed jobs. If the CLI cannot run, delete directly: first recompute the selection with the same rules. If it differs from the list shown, stop and show the new list again. Otherwise `rm -rf` each listed folder, one exact path at a time: `factory/jobs/<id>` or `factory/archive/<id>`. Never use a glob, and never delete a path outside those two folders.
4. **Branches.** Only when `--abandoned` was used and abandoned jobs were pruned. For each pruned abandoned job whose branch existed in step 1, run the branch step of Archive (step 2) with the `worktree_path` recorded in step 1. The question, the `U` count, the `-D` rule, and the worktree rule are the same. Merged branches are listed, never deleted (Archive step 3). If no abandoned job was pruned, skip this step.
5. **Report.** Give the count pruned from `factory/jobs/` and from `factory/archive/`, the open jobs skipped, the abandoned jobs kept (when `--abandoned` was not passed), the branches deleted and kept (with why, when this step ran), and the merged leftovers. Never push.

## Subagent dispatch

Dispatch with the paths block first, then the task line, then the files to read. The task line names the mode when the agent has one (spec or plan for the spec writer; build, repair, or rework for the builder). The dispatch primitive is the Claude Agent tool, the Copilot `agent` tool, or the harness's own subagent mechanism elsewhere.

Each harness has its own wrappers. Every wrapper points to its snippet in `.claude/agents-snippets/`:

| Harness | Agent wrappers | Entry point |
| --- | --- | --- |
| Claude Code | `.claude/agents/factory-*.agent.md` | `.claude/commands/factory.md` |
| GitHub Copilot | `.github/agents/factory-*.agent.md` | `.github/prompts/factory.prompt.md` |
| Cursor | `.cursor/agents/factory-*.agent.md` | `.cursor/commands/factory.md` |
| OpenCode | `.opencode/agents/factory-*.md` | `.opencode/commands/factory.md` |
| Codex | none | this skill |

Codex has no wrappers. Run each `.claude/agents-snippets/factory-*.md` as a delegated or fresh session, passing the paths block first. If the harness gives you one session only, use single-session mode (see Harness notes).

Dispatch each agent by its kebab-case name, for example `factory-builder`. Copilot may show a display name in its agent list; pick the agent with that name.

## Harness notes

The loop is the same in every harness. Use a parallel lens batch where the harness offers one, otherwise run the lenses in order. If dispatch is background-only, poll each expected file for a valid first line until the timeout, then apply Failures. Builder resume is under Builder continuity; wrappers are under Subagent dispatch.

- **Timeout.** The default is 15 minutes per agent. The operator can set another value for one run by saying so in the request, for example `timeout 30 min`.
- **A timed-out agent is never re-dispatched.** It may still be running, and a second run could write the same file. Stage `needs-human` with the reason "`<agent>` timed out after `<N>` min; it may still be running". For a spec or plan agent, also set `failed_stage`. Tell the operator to check the job folder and the build location, and to confirm the agent has stopped, before `/factory start` or `/factory rework`.

**Single-session mode (Codex).** Codex has no wrappers, so one session plays every role. The orchestrator switches roles one at a time. For each agent it reads only that role's snippet and input files, writes only that role's output, and keeps the same write boundaries. The rule "never write code" applies per role: as orchestrator it writes only orchestrator files, and it writes code only as the builder, and only in the build location. Lenses run in order (stage A, then stage B). The security reviewer judges the diff, not the builder's account. A timed-out role is handled as above; a role that ends without its file is re-run once, then `needs-human`.

## Limits

File-write boundaries are prompt conventions, not enforced isolation. Nothing physically stops an agent from writing outside its file. The real gates are the spec and plan gates, the reviewer verdicts, the approver's rules and dry-run merge check, and the merge procedure's preconditions and test run. Ticket updates are best-effort and never gate the pipeline. `qa.md` is advisory and gates nothing.

## Related

- [Feature spec template](../../../templates/feature-spec.template.md)
- [Feature docs convention](../../../.claude/rules-snippets/documentation.md)
- [Issue tracker](../issue-tracker/SKILL.md)
- [Test-driven development](../test-driven-development/SKILL.md)
- [Git worktrees](../using-git-worktrees/SKILL.md)
- [Security review](../security-reviewer/SKILL.md)
- [Requesting code review](../requesting-code-review/SKILL.md)
- [Verification before completion](../verification-before-completion/SKILL.md)
- [Ponytail](../ponytail/SKILL.md)
- [Factory README](../../../factory/README.md)
