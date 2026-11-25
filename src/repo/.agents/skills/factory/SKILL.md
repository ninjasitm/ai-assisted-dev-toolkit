---
name: factory
description: "Opt-in software factory for feature-sized work. Runs one job through intake questions, a spec gate, a plan gate, build in an isolated git worktree (or in place on request), parallel reviews by lens, approval, and then a merge: local, or a merge request on the forge. Feature docs live in the feature folders, job state in factory/jobs/, and tickets (when the project tracks them) follow the job. Invoked as /factory with a request (intake), start, approve, rework, abandon, status, watch, archive, or prune. Quick fixes stay direct."
---

# Factory (orchestrator)

One orchestrator session runs a feature through intake → spec → plan → build → review → approve → merge. Agents get their context from files. Builders and spec writers write their own files; reviewers and the approver return their report, and you save it (see Subagent dispatch). You are the orchestrator: you ask the intake questions, dispatch agents, read their files, rewrite `job.json`, run the gates with the operator, handle tickets, and run the merge. You never write code, specs, plans, reviews, or `qa.md` yourself. Exceptions: you write `intake.md` from the operator's answers, `retro-*.md` from the retro procedure (see Retro), `spec-<k>.md` and `plan-<k>.md` from the operator's change requests, `tasks.md` ticket keys, the feature folder rename and copy, the feature docs commit on the job branch, worktree and branch removal, the moves and branch deletions in Archive, the review files and `decision.md` from the reviewers' and approver's replies (see Subagent dispatch), and `decision.md` with `ESCALATE` when retries run out, `merge-conflict.md` on a merge conflict, `bootstrap.md` on a failed worktree bootstrap step, the push and merge request in `push-mr` mode (see Merge procedure), and `rework-<k>.md` from the user's note, It also appends the user's QA answer, verbatim, to `build.md` (see Functional QA).

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
- **Prerequisite:** the target project's `AGENTS.md` documents setup, dev, test, lint, and build commands, plus how the dev server takes a port flag or env var. Agents read those commands there. If any are missing, stop and ask the user to add them. The `ux` and `ui` lenses also need a browser tool available to the harness (for example a browser MCP server). Without one they report `Not verified`.

## Invocations

| Invocation | Action |
| --- | --- |
| `/factory [--in-place] [--retro] [--learn] <request>` | Intake (see Intake): read the project, ask only glaring questions, then continue as `start` |
| `/factory start [--in-place] [--retro] [--learn] <request \| KEY \| slug \| job-id>` | Resolve the feature folder, or resume its open job (see Start). `--in-place`, `--retro`, and `--learn` apply only to a new job |
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
  spec.md                    spec-writer, spec mode (from the feature spec template); spec route only
  plan.md                    spec-writer, plan mode: approach, steps, and the **Size:** line
  tasks.md                   spec-writer, plan mode, large work only
  qa.md                      builder, on the branch: functional QA record (plan, runs, results) and the human handoff (see Functional QA)
factory/
  README.md                  setup and reference
  .gitignore                 ignores jobs/ and archive/
  worktree-bootstrap.md      project-owned steps run in each new worktree (see Worktree)
  jobs/                      runtime state, ignored by git
    <NNN-slug>/
      job.json               orchestrator only; rewrite the whole file
      intake.md              you: the original request verbatim under `## Original request`, the questions and answers (when asked), the `## Spec route` (when a route was proposed), and `## Baseline confirmed` (when needed)
      spec-<k>.md            you, from the operator's change request at the spec gate
      plan-<k>.md            you, from the operator's change request at the plan gate
      build.md               builder; cumulative round log; you append the user's QA answer blocks (kept on rewrite)
      round-<N>/review-<lens>.md   one per configured lens
      round-<N>/lanes-<w>.md   build batch record: dispatch rows and status (see Build lanes)
      round-<N>/alignment-A-<j>.md   checkpoint A replies, one file each, never overwritten (see Alignment checkpoint A)
      decision.md            approver (or you, on escalation)
      merge-conflict.md      you, on a merge conflict (blocks approve)
      bootstrap.md           you, on a failed worktree bootstrap step (blocks the build)
      rework-<k>.md          you, from the user's note
      alignment-B-<b>.md     you, checkpoint B reply on a rework note, with its reserved file indices (see Rework)
      main-copies/           feature docs moved aside at merge (see Merge procedure)
      round-<R>/retro-<D>.md  retro report, opt-in and advisory (see Retro)
      learn.md               Learn report, opt-in and advisory (see Closeout)
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
  "spec_route": "spec",
  "size": "large",
  "tracking": "tracked",
  "tracker_states": { "in_progress": "In Progress", "in_review": "In Review", "done": "Done" },
  "tracker_errors": [],
  "branch": "factory/001-onboarding-bootstrap",
  "worktree": true,
  "worktree_path": "/abs/path/to/repo/.worktrees/001-onboarding-bootstrap",
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
- `spec_route`: `spec` or `plan-only`. Set at intake (see Intake, Spec route). A job without it is the spec route, so legacy jobs keep their spec. A plan-only job starts at stage `plan`. Changed only by Plan-only re-entry.
- `retro`: `true` when the job opted in to advisory retro reports (see Retro). Absent means off, which is every legacy job.
- `learn`: `true` when the job opted in to the advisory Learn report after a verified merge (see Closeout). Absent means off, which is every legacy job. It is independent of `retro`.
- `size`: `small`, `large`, or `unclear`. Set from `plan.md` (see Plan).
- `tracking`: `none` or `tracked`.
- `tracker_states`: the project's status names, asked once when tracking first needs them. `null` until then.
- `tracker_errors`: failed ticket transitions or creations, as short strings. Reported, never blocking.
- `worktree`: `true` (default) builds in a git worktree. `false` builds in place in the main checkout (see In-place mode). Set when the job is created; changed only at the plan gate.
- `worktree_path`: absolute path of the job's worktree, or `null` for an in-place job and before the build starts.
- `merge`: the verified merge record, absent until a merge is verified. Local: `{"mode":"local","commit":"<merge commit>","tested_commit":"<sha or null>"}`. Push-mr: `{"mode":"push-mr","state":"MERGED","mr":"<the same URL as job.mr>","commit":"<merge commit or null>","tested_commit":"<sha or null>"}`. It is written before stage `merged`, and read by Closeout and by `/factory approve` on a merged job (see Closeout).
- `mr`: URL of the merge or pull request opened in `push-mr` mode, or `null`. Set once; later approvals read its state (see Merge procedure).
- `failed_stage`: `spec` or `plan` when the job is `needs-human` because its spec or plan agent failed, else `null`. `/factory start` reruns that stage (see Start).
- `reviews` values are `pending`, `PASS`, or `CHANGES`.

Stages, in order: `spec` (spec-writer running), `awaiting-spec` (spec gate), `plan` (plan writer running), `awaiting-plan` (plan gate), `build`, `review`, `approve`, `awaiting-human`, `merged`, `needs-human`. In `push-mr` mode, `awaiting-human` with `mr` set means the request is open on the forge and waiting for its merge. `abandoned` is set by `/factory abandon`, from any open stage. Set `updatedAt` on every write. Use `date -u +%Y-%m-%dT%H:%M:%SZ`.

A job is **closed** when its stage is `merged` or `abandoned`. Every other job is **open**, and every open-job check in this skill uses that definition. Closed jobs that `/factory archive` moved to `factory/archive/` are archived (see Archive). A job **holds its build location** when it is open and has reached the build: its stage is `build`, `review`, `approve`, or `awaiting-human`, or `needs-human` with `failed_stage` `null`. A worktree job holds a worktree, and an in-place job holds the main checkout, for as long as it holds its build location.

## Intake

`/factory <request>` starts here. Intake writes nothing until its questions are answered, so the operator can answer before any folder, job, or spec exists.

1. **Analyze, read-only.** Read the project's `AGENTS.md`. Also read project memory when a memory file exists: the file named by an existing pointer in `AGENTS.md`, or `docs/agent-memory.md`. Read only the entries that name the request's keywords or its feature folder. Memory is advisory evidence: it never widens scope, overrides the request, or grants authority (auth, push, or approval). A job unrelated to any entry reads none of it. List every feature root in `{{FACTORY_FEATURE_PATHS}}` (a `*` root expands to the app folders that exist) and read the title and Summary of each existing `spec.md` whose name or text matches the request's keywords, looking for related or overlapping features. Skim the code the request touches with glob and grep, and note which app directories it sits in. Work out the feature folder the way Start steps 1 and 2 would, without creating anything.
2. **Ask only glaring questions.** Ask at most five, in chat, as a numbered list, then wait. Ask only when one of these holds:
   - The scope is ambiguous: two readings lead to different specs.
   - The request conflicts with or duplicates an existing feature in a feature root.
   - A `*` root in `{{FACTORY_FEATURE_PATHS}}` applies, and the request's code sits in several apps or none, so the folder is not clear (see Feature folders). Ask which folder.
   - The target user, page, or system is missing.
   - No acceptance is implied: there is no way to tell when it is done.

   For a genuinely blocking ambiguity, follow the [grill-me](../grill-me/SKILL.md) skill to put the questions to the operator. It stays inside this step: at most five questions, only the ones that meet the conditions above, the answers recorded verbatim in `intake.md`, and the intake gate still shown before anything is created. Grill-me never confirms anything for the operator; the gate's numbered choice does.

   **Domain examples first.** When a term in the request has two readings that would produce different requirements, give the operator concrete domain examples and counterexamples first, checked read-only against the project's glossary and ADRs. Examples are not questions and do not count toward the five-question cap. Only if they do not settle the term, ask one question, counted in the cap. Do not write to a glossary, ADR, or any other doc automatically. A meaning that stays unresolved is a decision for the user.

   **Disposable prototype (optional, one question).** After the discussion and the domain examples above, offer it only when one qualifying blocking question remains that they could not settle. The question need not be about terms: a UI or state question qualifies too, and a runnable demo must be able to decide it. The offer is one question in the five-question cap. Never run the prototype unless the operator says yes. It runs on synthetic data where it can, in a temporary folder outside the live project directory, with no production data, no commits, no new dependencies, and no external action. It runs before any Factory job artifact exists. Only the decision and its evidence come back, never the prototype's code. The spec and plan approvals stay exactly as they are.


   Do not ask about details the spec writer can decide and flag as `[PRODUCT DECISION]`, and do not ask for taste. If nothing is glaring, say so in one line ("No glaring questions; starting the job.") and continue to step 3. If the request resolves to an existing feature folder, still ask, then continue that feature.
3. **Spec route.** Decide the route before the gate. Propose plan-only (no `spec.md`, no spec gate) only when every check below holds. Any miss, a total near the budget or not estimable, and an unknown route, mean the spec route:
   - **New feature only.** The feature folder does not exist yet, and no open or archived job names it. A request that resolves to an existing folder, spec, plan, or job always takes the spec route. A route is never overwritten on resume.
   - **Small.** The request is one or two plan steps, the same `small` as the plan's `**Size:**` line (see Plan). This estimate is provisional: the planner's Size line can still send the job back (see Plan-only re-entry).
   - **Clear requirements and acceptance criteria.** The request or the answers state them, and each criterion is testable. A criterion that must be derived is labelled `Derived:` and shown at the gate for confirmation.
   - **No ambiguity and no product decision.** Two readings would not lead to different plans, and nothing needs a product owner's decision.
   - **Total context fits.** Estimate the total working context a builder would carry for this job: the instructions in use (this skill, the role brief, the project's `AGENTS.md` commands), the request and answers, the requirements and plan, the files the change reads or edits, and the tool results and expected outputs (test runs, the diff, the QA evidence). Plan-only needs that total to sit confidently below the 100,000-token budget with a reasonable margin. The estimate is judgment, not a tokenizer or a tool. If the estimate is near the budget, or cannot be made, the spec route applies. It is not the current session usage or the model window, and the budget is not enforced across harnesses.

   The budget applies to the total, not the request text alone. If the total is too large, say so and suggest splitting the request into smaller features, on either route. Never skip the spec to fit a large total, and never propose plan-only then. Without questions and on the spec route, no gate is shown: go to step 5.

4. **Intake gate.** Shown when questions were asked or a plan-only route is proposed. Once the operator has answered, show the questions and answers, and the route with its basis, and ask in chat as a numbered choice:
   1. Continue to spec and plan, or to plan only when plan-only is proposed.
   2. Make changes: the operator types them.
   3. Use the spec route instead. Offered only when plan-only is proposed; the skip is then not confirmed.

   Changes → revise the Q&A with the operator's text, show it, and ask again. Nothing is created until the operator picks 1 or 3. Picking 3 sets the route to the spec route and continues. Picking 1 with a plan-only route confirms the skip.
5. **Continue as Start.** Treat the answers as clarifications of the request. Run Start from step 1 with the request text. Once the job folder exists (Start step 4), add the questions as asked and the answers to `factory/jobs/<id>/intake.md`, verbatim, one question and answer each. Always write `intake.md` when the request text was typed: its `## Original request` section is the verbatim request, even with no questions and on the spec route. Also add the `## Spec route` section (the route, its basis, and any `Derived:` criteria the operator confirmed) when a route was proposed. The spec writer or planner reads it (paths block). If Start resumes an open job instead of creating one, say the answers were not applied. Changes after the spec go through the spec gate, the plan gate, or `/factory rework`.

`--in-place` on the command, or the operator's answer saying so, sets `worktree` to `false` on the new job (see In-place mode). `--retro` on the command, or the operator's answer saying so at intake, sets `retro` to `true` on the new job (see Retro). `--learn` works the same way and sets `learn` (see Closeout).

## Start

Start runs for `/factory start <request | KEY | slug | job-id>`, and intake runs it after its gate.

### 1. Classify the argument

Strip leading `--in-place`, `--retro`, and `--learn` first. They are flags, not part of the argument. Then check in this order:

1. No argument: ask for a request, key, slug, or job id.
2. A job id (`^\d{3,}-[a-z0-9-]+$`) with a folder at `factory/jobs/<id>/`: resume that job, or report that it is closed (see the resume table). A job id with a folder at `factory/archive/<id>/` is archived: say so and stop. Archived jobs are not resumable. To work on the feature again, `/factory start <slug or KEY>` creates a new job.
3. An issue key (`^[A-Z][A-Z0-9]+-\d+$`): match `<root>/<KEY>-*/` in every feature root of the main checkout.
4. A kebab slug (`^[a-z0-9]+(-[a-z0-9]+)*$`): match `<root>/<slug>/` or `<root>/<KEY>-<slug>/` in every feature root, where `<KEY>` has the key format in step 3.
5. Anything else is a free-text request. Derive a 2–4 word kebab slug from it, then match as in step 4.

### 2. Resolve the feature folder

Whichever way the folder was found, the job's key is the `<KEY>` in its name (`PROJ-12` for `PROJ-12-onboarding-bootstrap`), or `null` for an unkeyed folder. A keyed folder never gets a `null` key, so its parent ticket is not created a second time.

- **One match:** continue that feature. Whichever of its `spec.md`, `plan.md`, and `tasks.md` exist are inputs to the spec writer or planner. A missing `spec.md` on a plan-only feature is expected.
- **Several matches:** list them and ask which one.
- **None:**
  - From a key: read the ticket title through the [issue-tracker](../issue-tracker/SKILL.md) skill (MCP first, CLI fallback). Derive a kebab slug from the title (lowercase, non-alphanumerics to `-`, at most 4 words). Create `<target>/<KEY>-<slug>/`, where `<target>` is the new-feature folder (see Feature folders). If the ticket cannot be read, stop and ask for a slug. Do not guess.
  - From a slug or free text: create `<target>/<slug>/`, with the same `<target>`.

### 3. Resume or create the job

Look for open jobs (see Stages) whose `feature_dir` is this folder.

- **One open job:** resume it. Do not create a second. If the operator's text is a new request, say the open job was resumed and the new text was not applied. Use `/factory rework` for changes after the build. A `--in-place`, `--retro`, or `--learn` flag on a resumed job is not applied: the recorded `worktree` stands, and say so.
- **Several open jobs:** list them and ask which one.
- **None:** create a job.

Resume by stage:

| Stage | Resume action |
| --- | --- |
| `spec` | Rerun `planner` in spec mode (brief `roles/spec.md`), then show the spec gate |
| `awaiting-spec` | Show the spec gate (it runs the fit review first) |
| `plan` | Rerun `planner` in plan mode (brief `roles/spec.md`), then show the plan gate |
| `awaiting-plan` | Show the plan gate (it runs the fit review first) |
| `build` | Build state resume, by its dispatch priority (see Resume of build and review state below): a newer rework note reruns the builder in rework mode; a READY `build.md` goes to checkpoint A without a rerun; a BLOCKED `build.md` with valid parked records newer than every rework note re-enters the Autonomous pass; otherwise an interrupted build runs the Build lanes procedure in build mode (brief `roles/build.md`) |
| `review` | Review and alignment state resume (see Resume of build and review state below) |
| `approve` | Review and alignment state resume (see Resume of build and review state below). Only after an explicit PASS, rerun the approval (`reviewer` in approval mode, brief `roles/approve.md`) |
| `awaiting-human` | Print the approver's rationale, the QA record and any human handoff from `qa.md` (see QA guidance). Check the current alignment record first: print the `/factory approve` command only when it is an applicable PASS; otherwise print its remediation (see Approve step 3) |
| `needs-human`, `failed_stage` `spec` | Rerun the spec stage (see Spec), then show the spec gate |
| `needs-human`, `failed_stage` `plan` | Rerun the plan stage (see Plan), then show the plan gate |
| `needs-human`, `build.md` `STATUS: BLOCKED` with valid parked records, `failed_stage` null | Parked-task resume, not a rerun: re-enter the Autonomous pass at its step 7. No full rerun, repair, or review runs. The pass may dispatch the builder in autonomous mode through the Build lanes procedure for tasks made eligible by a RESOLVED answer, once each per cycle, and nothing else |
| `needs-human`, otherwise | Print the reason from `decision.md`, `merge-conflict.md`, `bootstrap.md`, `build.md`, or the current `round-<N>/alignment-A-<j>.md`, and the options: rework, approve, or abandon. If a human check is pending, print its exact handoff from `qa.md` first |
| `abandoned` | Closed. Say so and stop. To work on the feature again, run `/factory start <slug or KEY>`, which creates a new job |
| Archived (in `factory/archive/`, any stage) | Closed. Say so and stop (see Start step 1) |

### Resume of build and review state

Resume is one branch. It starts by capturing the persisted values: `R` = `round`, `S` = `stage`, and `failed_stage`. Nothing is written until a branch below says so. Never add 1 to `round` on resume, because `round` already holds the round in progress. A resume caller runs checkpoint A without step 0: it keeps `round` and `stage` as persisted, so an interrupted check leaves the job as it was.

For a job with a batch record, no rule in this skill uses modification times or a READY in `build.md` as evidence of a result: the batch record decides (Build lanes, Resume).

**Stop first.** If any of these holds, print the reason and its remediation, and stop. Do not repair, do not run checkpoint A, and do not change `S`:

- a `Not verified:` item in any `round-R/review-*.md`;
- `decision.md` starts with `ESCALATE` and belongs to the current cycle. Its round `N` is the one in its `Round: N` line or in `retries exhausted after round N`. It belongs to the current cycle when `N` is at least the cycle start: the `Starts at round` value of the latest `rework-<k>.md`, or round 1 when there is none. An earlier cycle's `ESCALATE` is historical: it does not stop a newer rework that has started, and it stays in `decision.md` or its `decision-<R>.md` copy;
- step 8's third-review-round rule applies to `R` (`CHANGES` with the retries already used);
- the current alignment record for `R` is `CHANGES` with a user decision. The operator answers with `/factory rework <id> <note>` or `/factory abandon <id>`.
- a batch row is `launched` with no recorded reply, and the operator has not confirmed in this request that its agent stopped (Build lanes, step 5). Print the token and its remedy. Do not relaunch, reroute, repair, classify `build.md`, or change `S`.

**Then, by the captured stage:**

- **`build`.** Dispatch priority, first match wins. Rules 1, 2, and 4 apply to stage `build` only. `needs-human` with `failed_stage` null uses rule 3 alone, because its builds are resumed through `/factory rework`:
  0. A job with a batch record resumes by its rows, for any stage (Build lanes, step 10). Rules 1 to 4 apply to legacy jobs (no batch record) only.
  1. A `rework-<r>.md` newer than `build.md` is an accepted rework note the builder has not built. Run the Build lanes procedure in rework mode. Any older BLOCKED status, parked list, or advice in `build.md` belongs to a superseded build and is not used.
  2. A valid `STATUS: READY` newer than `job.json`: the builder finished this round. Do not rerun it: go to step 6's READY path (checkpoint A for `U = R`, then step 7).
  3. A valid `STATUS: BLOCKED` with parked records, newer than every `rework-<k>.md`: the builder finished and the autonomous pass is due. Do not rerun the builder. Re-enter the Autonomous pass at its step 7.
  4. Otherwise the build was interrupted or never finished: rerun `implementer` in the mode the files call for, with rework if a `rework-<r>.md` is newer than `build.md`, otherwise build, through the Build lanes procedure.

- **`needs-human` with `failed_stage` null.** A valid BLOCKED `build.md` with parked records is the parked-task resume, not an alignment stop: rule 3 above for legacy jobs, or the BLOCKED final of its batch (Build lanes, step 9) for a job with a batch record, then the Autonomous pass, step 7. Otherwise resume only an alignment stop: the current record for `R` is missing or `BLOCKED`, or it is an alignment timeout the operator has confirmed stopped (see the timeout rule). Then run checkpoint A fresh as a resume caller. A `launched` row (Build lanes, step 5) is resumed only after the operator confirms its agent stopped, and not through checkpoint A. Any other reason prints its remediation and waits. A `needs-human` stop is never converted into a repair on start.
- **`review`, `approve`, or `awaiting-human`.** Look at `round-R/` first:
  - **Repair finished.** `round-R/` holds a `review-*.md` with `VERDICT: CHANGES`, and `build.md` starts with `STATUS: READY` and is newer than those reviews. Set `round` to `R + 1` and stage `review` (persist), then run checkpoint A for `U = R + 1` as a normal review-repair caller. On PASS, step 7 runs for `U`.
  - **Repair not finished.** The same `CHANGES` reviews, with no newer READY `build.md`. The stop rules above already passed, so the repair is authorized: rerun it with `Round` `R` (step 8), then checkpoint A for `R + 1` as a normal caller. Its repair runs the Build lanes procedure first.
  - **No review yet for `R`.** Checkpoint A owns round `R` (a first build, or a review repair that persisted `U`). Read its record. None, or `BLOCKED`: run checkpoint A fresh as a resume caller. `CHANGES` with only repairable findings: restore its findings, repair with `Round` `R` (Build lanes procedure first), then checkpoint A again for `R`. `PASS`, or a `Skipped:` line that names a current PASS: run step 7 for `R`, the captured action.
  - **Reviews exist for `R`.** An explicit PASS is needed before any review or approval. Run checkpoint A fresh for `R` as a resume caller, then:
    - `CHANGES` with a user decision: stop (see Stop first).
    - `CHANGES` with only repairable findings: restore its findings, repair with `Round` `R`, set `repaired` to yes, and run checkpoint A fresh for `R` again. Its repair runs the Build lanes procedure first.
    - `BLOCKED`: stage `needs-human` with the alignment reason. Retry with `/factory start <id>` after the cause is fixed.
    - `PASS`: resume the captured action. `review` reruns the review round `R` (step 7). `approve` reruns the approval (`reviewer` in approval mode, brief `roles/approve.md`). `awaiting-human` prints the handoff and the `/factory approve` command, and reruns nothing. If `repaired` is yes, the code changed after the reviews, so the captured action becomes a rerun of the reviews for `R` (step 7), whatever `S` was.
- **Timeout rule.** A timed-out alignment reviewer is never re-dispatched. Set `needs-human`, `failed_stage` `null`, and the reason `alignment reviewer timed out after <N> min; it may still be running`. The operator confirms it has stopped, then `/factory start <id>` runs the resume above, which writes a new `j`.

**Route and missing files.** A resumed job keeps its recorded route: resume never rewrites `spec_route`, and only Plan-only re-entry changes it. A job without `spec_route` is on the spec route, so legacy jobs keep their spec. On the plan-only route, a missing `spec.md` is expected: never report it as missing, and never rerun the spec stage for it. On the spec route, a missing `spec.md` is a missing required file: rerun the spec stage (see Spec), then show the spec gate, and say which file was missing. A missing `plan.md` is a missing required file on any route: rerun the plan stage (see Plan).

A rerun of a failed stage sets `stage` to that stage and clears `failed_stage`.

A job with no work started (stage before `build`, so no build has begun and no `tasks.md` line is ticked) shows its current gate, which asks whether anything needs changing before it continues. A job whose work has started (stage `build` or later, or any ticked task) resumes without that prompt.

### 4. Create a new job

1. `mkdir -p factory/jobs` in the main checkout.
2. Find the highest `NNN` among `factory/jobs/NNN-*` and `factory/archive/NNN-*` directories (0 if none). Archived ids count, so an id is never reused. A pruned id is gone and may be reused. Candidate = highest + 1, zero-padded to at least 3 digits.
3. Slug = the feature folder name without its key prefix (`onboarding-bootstrap` for `PROJ-1234-onboarding-bootstrap`). Stable across the key rename.
4. `mkdir factory/jobs/<NNN-slug>` (no `-p`). If it already exists, bump `NNN` and retry. `mkdir` without `-p` is the claim.
5. Write `job.json` with stage `plan` when intake confirmed plan-only, otherwise `spec`; `spec_route` (the confirmed route, `spec` when intake did not run); `feature_dir`; `issue_key` (the key from Resolve, or `null`); `size` `unclear`; `tracking` `none`; `worktree` (`false` for `--in-place` or when the operator asked for it at intake, `true` otherwise); and `worktree_path` `null`. Add `"retro": true` and `"learn": true` only when the operator asked for them (see Retro and Closeout); omit them otherwise. Start without intake always records the spec route.
6. Write `intake.md` (see Intake): when the request text was typed, the original request verbatim under `## Original request`. For a key or slug start, write no original request section; the Fit review baseline step asks the operator for it. Add the questions and answers when intake asked. Add the `## Spec route` section when a route was proposed.

## Spec

Spec route only. A plan-only job skips this section and goes to Plan. Set stage `spec`. Dispatch `planner` in spec mode (brief `roles/spec.md`) with the paths block, the feature request, and the feature folder. It writes `spec.md`. If `intake.md` is in the paths block, the spec writer reads it, and the operator's answers win over the request text where they conflict. Wait for `spec.md` (see Harness notes). Set stage `awaiting-spec` and show the spec gate.

## Spec gate (mandatory, spec route only)

Spec route only. Runs in every `APPROVAL_MODE`, before any plan is written. A plan-only job has no spec gate. Every time the gate is shown (first time, after each change request, and on resume), run the fit review first (see Fit review). Show the operator in chat:

- The spec's Summary, the number of acceptance criteria, each open `[PRODUCT DECISION]` item, and Open Questions.
- The fit review's verdict, its blocking findings, and its decisions for the user.

Then ask in chat, as a numbered choice:

1. Confirm the spec. Offered only when no `[PRODUCT DECISION]` item is open and the current fit review is an explicit `VERDICT: PASS`.
2. Request changes: the operator types the change. Each open `[PRODUCT DECISION]` item needs an answer in the change text.

Handle the answer:

- **Confirm** → continue to Plan. If decision items are still open, or the current fit review is not an explicit `VERDICT: PASS`, do not continue: list them and ask again.
- **Request changes:** write the operator's text verbatim to `spec-<k>.md` in the job folder (`k` = next free index). Set stage `spec`, rerun `planner` in spec mode (brief `roles/spec.md`) with the paths block and `spec-<k>.md`. It updates `spec.md`. Set stage `awaiting-spec` and show the gate again. The spec writer records each answered decision as `[DECIDED] <answer>`.

If the session ends at this gate, `/factory start <job-id|slug|KEY>` shows it again (see Start).

## Plan

Set stage `plan`. Dispatch `planner` in plan mode (brief `roles/spec.md`) with the paths block, and `plan-<k>.md` when a plan change request is pending. It writes `plan.md` in the feature folder, and `tasks.md` for large work (or removes a stale `tasks.md` when the plan is small). It does not change `spec.md`. On a plan-only route it also writes the `## Requirements Source` and `## Acceptance Criteria` sections (see its brief); no `spec.md` exists, and none is expected.

Read the `**Size:**` line of `plan.md`:

- `**Size:** small`, `large`, or `unclear` → copy into `job.json`.
- No valid line → re-dispatch once. If it is still missing, treat the size as `unclear`.
- On a plan-only route, a size other than `small`, or an open `[PRODUCT DECISION]` item in the plan, triggers Plan-only re-entry instead of the plan gate.

Proposed tracking: `tracked` only when size is `large` and the project's `AGENTS.md` Project Management section names a real tracker. Unfilled placeholders mean no tracker. Otherwise propose `none`.

Set stage `awaiting-plan`. The plan gate runs the fit review before it is shown.

## Plan gate (mandatory)

Every job stops at `awaiting-plan` before anything is ticketed or built, in every `APPROVAL_MODE` and on either route. On plan-only, the fit review checks the plan against the original request and its `## Requirements Source`, and the confirmation is the same. Every time the gate is shown (first time, after each change request, and on resume), run the fit review first (see Fit review), against the goal sources (see Fit review), the accepted spec (spec route) or the plan's requirements sections (plan-only), and the plan. Show the operator in chat:

- The plan's approach and steps from `plan.md`.
- The size and the reason from `plan.md`.
- The fit review's verdict, its blocking findings, and its decisions for the user.
- For large work, the lines of `tasks.md`.
- The tracking proposal: create tickets in the tracker under the parent (the job's key, or a new parent), or no tickets (`tasks.md` only), or no tickets at all.
- The build mode: `worktree` (default) or `in-place`, as set in `job.json`.

Then ask in chat, as a numbered choice:

1. Confirm the plan. Offered only when the current fit review is an explicit `VERDICT: PASS`. On plan-only, also only when size is `small`.
2. Request changes: the operator types the change.
3. If size is `unclear`: answer `small` or `large`.
4. Change tracking: `tracked` or `none`.
5. Change build mode: `worktree` or `in-place`.

Handle the answer:

- **Confirm** with size known → continue to Tracking. If size is still `unclear`, or the current fit review is not an explicit `VERDICT: PASS`, ask again. On plan-only, a size other than `small` is not confirmed: run Plan-only re-entry.
- **Request changes:** write the operator's text verbatim to `plan-<k>.md` (`k` = next free index). Set stage `plan`, rerun `planner` in plan mode (brief `roles/spec.md`) with the paths block and `plan-<k>.md`. Show the gate again. If the change touches the spec itself, send it through the spec gate instead (on plan-only, that is Plan-only re-entry): write it to `spec-<k>.md`, rerun spec mode, show the spec gate, then plan again.
- **Change size only:** the operator's answer to choice 3 sets `size` in `job.json`. The plan does not change.
- **Change tracking only:** update `tracking` in `job.json`. Do not rerun the spec writer.
- **Change build mode only:** update `worktree` in `job.json`. Do not rerun the spec writer. In-place is checked when the build starts (see In-place mode).

If the session ends at the gate, nothing is lost. `/factory start <job-id|slug|KEY>` returns to this gate (see Start).

## Plan-only re-entry

Plan-only is a route, not a shortcut around review. It returns the job to the spec route, before the build, when any of these holds:

- the plan's size is not `small` (`large` or `unclear`), whether the planner wrote it or the operator changed it;
- the plan writer found an open `[PRODUCT DECISION]` item, or a change request touches the requirements or acceptance criteria;
- the fit review finds that the plan-only route was wrong: the scope broadened past the original request, or a finding marked `requires user decision` concerns scope.

To re-enter: set `spec_route` to `spec` and stage `spec`, and tell the operator the reason in chat. Write any operator change text to `spec-<k>.md`. Rerun `planner` in spec mode from the original request, the intake answers, and that text, since a plan-only job has no `spec.md` to update. Show the spec gate. Once it is confirmed, plan again and show the plan gate. Earlier plan confirmations, fit PASS results, and the plan-only requirements sections are not reused: the plan gate's confirmation is asked again for the new plan. After the build has started, use `/factory rework` instead: checkpoint B classifies the note, and a `spec then plan` route sets `spec_route` to `spec` first.

## Fit review (spec and plan gates)

Read and follow the goal-fit brief: [fit-review](../../../.claude/rules-snippets/fit-review.md). It is a read-only goal-fit review, separate from the reviewer lenses. It runs every time a spec or plan gate is shown: after each planner run, after each change request, after each repair, and on resume.

- **Baseline first.** No review runs without the original request. Check `intake.md` for an `## Original request` section or a `## Baseline confirmed` section. If neither exists (a key or slug start, a legacy job, or a sparse one), the orchestrator promotes nothing. It shows the candidate sources it found (the existing `intake.md`, the tracker description when `issue_key` is set, and the existing `spec.md`), each labelled as a candidate and not a requirement. It asks the operator, as a numbered choice: (1) confirm one candidate as the original request, or (2) paste the original request. It writes the confirmed text to `intake.md` under `## Baseline confirmed`, naming its source. Until then the gate reports `NEEDS-DECISION: baseline missing`, and Confirm is not offered.
- **Source priority.** Highest first: (1) the verbatim original request and every explicit amendment; (2) the accepted spec, or on a plan-only route the plan's `## Requirements Source` and `## Acceptance Criteria`. Each must quote (1) and is checked against it. A copy that differs is a conflict: report it with both quotes, and repair it to the verbatim text as a scoped repair; (3) the plan, and at build checkpoints the build, which are traced against (1) and (2) and never override them.
- **Goal sources in every dispatch.** Pass them as text, not as paths alone, with the job's overall summary and goals as context (never as authority): the verbatim original request (from `## Original request` or `## Baseline confirmed`), and every explicit amendment (the intake answers, and the operator's `spec-<k>.md`, `plan-<k>.md`, and `rework-<k>.md`). For a plan review, also pass the accepted spec (spec route), or the plan's `## Requirements Source` and `## Acceptance Criteria` (plan-only). The accepted spec or those sections and the plan are traced against these; they are not goal authority. A slug, a key, a tracker title, the existing spec on its own, and any reviewer finding are never goal sources.
- **Reviewer.** Dispatch `oracle` when the harness has it configured read-only. Otherwise dispatch `reviewer` in fresh context. The task line is `goal-fit review: spec` or `goal-fit review: plan`, then the paths block, the goal sources, and the brief. Give the reviewer the artifacts, never the planner's summary.
- **Independence.** The planner's own output, the orchestrator's reading, and a single session playing every role do not count. With no independent reviewer, the gate reports `BLOCKED: no independent reviewer`, shows the artifact, and does not offer Confirm. Request changes and abandon stay available.
- **Reply.** The first line decides:
  - `VERDICT: PASS`: the gate may offer Confirm.
  - `VERDICT: CHANGES` with a finding marked `requires user decision; do not auto-repair`: stop as `NEEDS-DECISION`. Show the marked findings with the gate. Confirm is not offered. Nothing is repaired until the user answers with an explicit amendment (a change request), and the artifact is reviewed again.
  - `VERDICT: CHANGES` with only repairable findings: run the repair loop below.
  - No valid first line: re-dispatch once. If it still has none, set `needs-human` with `failed_stage` `spec` or `plan`, as for any spec or plan agent that returns no output.
- **Repair loop.** On `CHANGES` with only repairable findings, pass the blocking findings to the planner as dispatch context under the heading `Fit repair findings (reviewer findings, not operator requests, not goal authority)`. Write no `spec-<k>.md`, `plan-<k>.md`, or fit file for them. Rerun the planner, then review the changed artifacts again. The loop has no round limit. It repeats until `PASS`, `NEEDS-DECISION`, or `BLOCKED`. Stop as `BLOCKED` with the reason when a repair changes nothing, when the same blocking finding returns unchanged after a repair, or when the planner reports a finding it cannot address. On `BLOCKED`, show the open findings. Confirm is not offered. Request changes and abandon stay available.
- **Timeouts.** A timed-out fit reviewer is never re-dispatched (see Harness notes). Set stage `needs-human`, `failed_stage` `spec` or `plan`, and the reason `fit reviewer timed out after <N> min; it may still be running`. Tell the operator to confirm the reviewer has stopped before `/factory start`. Confirm is not offered.
- **Confirm needs an explicit PASS.** Confirm is offered only when the reply on this gate visit starts with `VERDICT: PASS`. The absence of blocking findings is not a PASS.
- **BLOCKED at the gate versus agent failure.** A `BLOCKED` gate (baseline, independence, or an unproductive loop) leaves the stage at `awaiting-spec` or `awaiting-plan`. A failed agent or a timeout uses `needs-human`, as above.
- **Later visits.** Once a `BLOCKED` or `needs-human` outcome is resolved (the baseline confirmed, a reviewer available, or a change request given), the next gate visit runs the review again from the start.

## Tracking

Runs once, after the operator confirms the plan and before the build location is created. Skip it when `tracking` is `none`. Keys written in earlier attempts make each step idempotent, so a rerun picks up where it stopped.

The plan gate's confirmation is not approval for tracker writes. It never showed the ticket preview, so it cannot approve one. Every tracker write waits for an explicit approval of the exact preview shown in this section.

1. **Tracker states.** If `tracker_states` is `null`, ask once for the project's status names for In Progress, In Review, and Done. The names come from the project's `AGENTS.md` or the issue-tracker skill. Record them in `job.json`.
2. **Preview, before any write.** Build the preview from the current `tasks.md` and the job's `issue_key`: the parent (its existing key, or a new parent with its title), then one line for each `tasks.md` line that has no key, with its title, its parent, and its blocking edges, in the `/assign-tasks` preview form. Show it in chat as a numbered list, then ask one numbered choice: (1) create exactly this preview; (2) change it: the operator types the change, and the preview is rebuilt and shown again; (3) cancel tracking for this job, which sets `tracking` to `none`.
3. **Approved writes.** Only on choice 1, run the `/assign-tasks` flow's Create Tickets step on the feature's `tasks.md`, with the issue-tracker skill's epic discovery. The preview in step 2 is that flow's preview-and-approve step, so the flow does not ask a second time. Create the parent if it has no key, then one ticket per line that has no key, under the parent, in the flow's hierarchy and dependency order. A rerun resumes from the keys already written. If a line or the parent changed after the approval, stop, show a new preview, and ask again.
4. **Write keys.** Append ` — <KEY>` to each line as its ticket is created. Lines that already have a key are skipped. Set `issue_key` in `job.json` when the parent is created.
5. **Rename.** If the folder had no key, rename `<parent>/<slug>/` to `<parent>/<KEY>-<slug>/`, where `<parent>` is the feature root that holds it (the parent of `feature_dir`). Use `git mv` when git tracks the folder, `mv` otherwise. Stop if the target exists. Then update `feature_dir` in `job.json`. The rename is committed on the job branch with the feature docs (see Feature docs commit).

If a ticket cannot be created, stop at `awaiting-plan`. Report the lines that have keys and the error, and record it in `tracker_errors`. The operator can fix the cause and run `/factory start <job-id>`, or switch tracking to `none`.

## Worktree

The default build location. Follow the [using-git-worktrees](../using-git-worktrees/SKILL.md) skill. Factory always takes its project-local `.worktrees/` default and never the global `~/.worktrees` option, without asking.

- Branch `factory/<id>` from `{{DEFAULT_BRANCH}}`.
- Path `.worktrees/<id>/` at the root of the main checkout (inside the repo folder). The folder is named by the job id, never by the branch: branch `factory/<id>` must not produce `.worktrees/factory/<id>`. Record its absolute path in `worktree_path`.
- `factory/worktree-bootstrap.md` replaces the worktree skill's project-setup and baseline-test steps. Factory does not run those.
- Before the first worktree, run that skill's `.gitignore` check. If it had to add `.worktrees/`, commit that on `{{DEFAULT_BRANCH}}` or tell the operator to.
- Create it at the start of the build stage, after the plan gate and tracking. Reuse it if it exists (rework and repair).
- Copy the job's `spec.md` (when it exists), `plan.md`, and `tasks.md` (if any) from the main checkout's feature folder into the same relative path in the worktree. The builder ticks `tasks.md` there. Then run the bootstrap (next subsection) and make the feature docs commit.
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
- Worktree (absolute): <abs>/.worktrees/<id>   (in-place: the main checkout)
- Feature folder in worktree (absolute): <worktree>/<feature_dir>   (in-place: the main checkout's)
- qa.md (absolute, build location): <worktree>/<feature_dir>/qa.md
- Branch: factory/<id>
- Default branch: {{DEFAULT_BRANCH}}
- Intake answers (absolute, only when intake.md exists): <job folder>/intake.md
- Spec route: `spec` or `plan-only`. On plan-only there is no `spec.md`, and its absence is expected.
- Round: <N>
- Ports: builder <p>, ux <p+1>, ui <p+2>
```

Agents read their inputs by these absolute paths. Builders and spec writers write their output files there; reviewers and the approver return their report instead (see Subagent dispatch). The spec-writer works in the main-checkout feature folder. Reviewers and the approver read the spec (spec route only) and the plan there. The builder reads them there and ticks `tasks.md` in the build location's copy. Reviewers read `qa.md` at the paths block's `qa.md` line. The code lens checks its functional QA record. The other lenses read it for context only. The approver checks the record (see Functional QA).

## Build lanes

Every builder dispatch in the build path runs this procedure with its mode, paths block, and brief `roles/build.md`: the initial build (Loop step 6), repairs and checkpoint A repairs, the Autonomous pass's re-dispatch and parked-task resume, rework (Rework step 4), and resumes that rerun or repair the builder. The procedure is the dispatch, and its phases are dispatches. It runs on both routes, adds no approval, confirmation, or stop, and never asks the operator. Stage, mode, round, Oracle, approval, and guided-attempt budgets are unchanged.

1. **Split and settle.** Apply [subagent-workflow](../../../.claude/rules-snippets/subagent-workflow.md#split-before-dispatch). Split broad approved work into units; a repair unit groups findings by root cause. A unit is ready when its inputs are settled, its owned paths are literal paths or one canonical directory, and its focused check is named. Anything else waits for the planner or owner.
2. **Batch record.** Before the first dispatch of a batch, write `round-<K>/lanes-<w>.md` (`K` is the paths block's `Round`; `w` is the next free index in the job, never reused). The header holds the mode, round, stage at start, input (findings or task ids with their files), return (the step after the owner's final), and the guided-attempt state from `build.md`. Each dispatch has a row with its token `W<w>.<plan | L<n> | integrate | single>`, its owned paths, the dirty paths found at launch, and one status:
   - `launched`: written before dispatch. No reply is recorded, so the writer may still be running.
   - `returned`: the reply is recorded with its paths and check results.
   - `done`: the owner's return step has been applied to a final.
   - `stopped`: the operator confirmed the agent stopped. Its unit is parked.
3. **Parallel lanes.** Dispatch every ready unit whose owned paths do not intersect another open unit's paths, as one batch. On a serial host, run them one at a time and say so. Intersecting units wait until the other unit is integrated or parked. Independent lanes never wait for a stalled one.
4. **Owner.** One integration owner for the job, the only writer of `qa.md`, `tasks.md`, commits, and `build.md`. Its phases are plan, lanes, integrate, and single. Plan writes the QA plan, and lanes start only after its reply and the planned rows in `qa.md`. Integrate runs only when no row is `launched`: no writer is live, and nothing new is dispatched while it runs.
5. **Stalled writers.** A `launched` row with no reply may still be running, so its unit is held. All other ready, disjoint work still runs and returns first. Only when no such work remains does the batch stop as `needs-human`: `<lane or owner> has no recorded reply for <token>`. Remedy: the operator stops the agent, confirms it in the resume request, and runs `/factory start <id>`. The row becomes `stopped`, and its partial paths stay in place, parked: never reverted, restored, or committed.
6. **Lane results.** A lane writes only its owned paths, runs its focused checks on them, and replies with its token, its changed paths, and each check with its command and exit. The owner accepts a reply only with the current token. A changed path outside the reply's paths, or a dirty path present at launch that is not named as a baseline, parks the unit. A stopped lane's partial work becomes a baseline only through an authorized rework note. The next batch records each baseline path with its expected content (blob id), mode, and index state (absent, or the staged blob id), and checks each entry against the current state before dispatch. A path that cannot be ascertained, or that differs, parks the unit, and nothing is dispatched on it. Attribution judges the lane's delta from that recorded baseline against its claim, never equality with the baseline after the lane's writes.
7. **Commit a unit (owner, literal paths).** For each accepted unit, in order:
   1. `git --literal-pathspecs add -- <paths>`. This stages only the unit's paths, including new and deleted ones.
   2. Freeze the candidate: `git --literal-pathspecs diff --cached --binary --full-index -- <paths>`. It must exit 0, be non-empty, and match the reply's paths and statuses. Hold it for this commit only, as transient evidence; it is never written to the job folder.
   3. The working tree must equal the index for the unit's paths: `git --literal-pathspecs diff --binary --full-index -- <paths>` is empty. Run the focused check (and any check that needs the shared server or a database, with no lane live). It must exit 0, and the same empty diff must hold after it. A success from before a change does not count.
   4. Re-capture the staged patch. It must be byte-identical to the frozen candidate, and `git --literal-pathspecs diff --cached --name-status` must show the same entries as before step 1 for every path outside the unit.
   5. `git --literal-pathspecs commit -m <subject> -- <paths>`. It commits only those paths, and other staged entries stay staged.
   6. Verify: `git --literal-pathspecs show --name-status --format= HEAD` lists exactly the unit's paths, and `git --literal-pathspecs diff HEAD~1 HEAD --binary --full-index -- <paths>` is byte-identical to the frozen candidate. Only then, and only on the task-list route where the unit's `tasks.md` line exists, tick it. On plan-only, never create `tasks.md`; the reply records the commit and the plan step ID.

   On any mismatch, park the unit and do not undo: no reset, restore, checkout, or stash. Never use `git add -A`, `git commit -a`, a path-less commit, `reset`, `stash`, `checkout`, or a forced operation.
8. **Finish.** When no ready unit remains, the owner runs the shared checks and the functional QA once, after the last commit. It then rewrites `qa.md` and `build.md`, with `Dispatch: <token>` in the round log.
9. **Results.** The owner's reply is either `ready: <ids>` or the final. A `ready` reply is a next-batch result: write the next batch at once, with the same mode, input, return, and budget, and no stop. The final must carry the current token and its `Dispatch:` marking. READY runs the recorded return, valid BLOCKED runs the bounded autonomous path, and malformed or missing is `needs-human`. After the return's stage write, mark the row `done`. A `build.md` on disk is not a result without its token.
10. **Resume.** Dispatch priority and Stop first send a job with a batch record here, before `build.md` is read. Act on its rows:
    - `launched` with no reply: wait for the confirmation of step 5. Nothing is replayed.
    - A recorded `returned` plan reply: launch only lanes with no row yet. A `returned` lane row is never re-dispatched. Its recorded reply stays its result, and it integrates only if the handoff is clear: the reply carries the current token, its paths match its row, and no later row touches them. Otherwise park it as `needs-human`, remedy `/factory rework <id> <note>`.
    - A `ready` reply with no later batch: write the next batch.
    - No stop is requested for a returned writer. Only a `launched` row with no reply needs confirmation (step 5).
    - A `returned` final that is not `done`: the return may or may not have run, and the record cannot prove which. Park as `needs-human`, remedy `/factory rework <id> <note>`. Never rerun the return.
    - A `done` final: resume from the persisted stage (review, approval, or human handoff).

    Anything unclear preserves every edit and index entry, and parks the affected work. Nothing is retried, committed, ticked, or bypassed automatically, and a resume grants no approval, Oracle ask, or budget. A job with no batch record is legacy and keeps the earlier rules.
11. **Scheduling.** Units come from settled inputs and owned paths, not `[P]` markers, so add no markers. The Autonomous pass's Scheduling section does not apply.

## Loop

Let `N` be the current round, starting at `1` for a new job.

1. **Spec.** On the spec route, dispatch `planner` in spec mode (brief `roles/spec.md`) (see Spec). A plan-only route goes straight to step 3.
2. **Spec gate** (spec route only). Show the gate and wait for the operator's confirmation (see Spec gate). Do not continue until the operator confirms.
3. **Plan.** Dispatch `planner` in plan mode (brief `roles/spec.md`) (see Plan). Set stage `awaiting-plan`.
4. **Plan gate.** Show the gate and wait for the operator's confirmation (see Plan gate). Do not continue until the operator confirms.
5. **Tracking and build location.** Run Tracking if `tracking` is `tracked`. Create the build location: the worktree and its copy of the feature docs (see Worktree), or the in-place branch (see In-place mode). Set `worktree_path` if a worktree was made. Set stage `build`. Move any tracked tickets to In Progress (see Ticket lifecycle).
6. **Build.** Run the Build lanes procedure in build mode (brief `roles/build.md`, paths block). It is the builder dispatch, in phases (see Build lanes). Read [autonomous-mode](../autonomous-mode/SKILL.md) before dispatch: it is the procedure this build follows. Its units are the approved `tasks.md` lines, or on a plan-only job (no `tasks.md`) the approved plan's numbered Steps. Wait (see Harness notes), then classify the matching final's `build.md` with the Build status rules in Autonomous pass (a `ready:` reply is a next-batch result, Build lanes, step 9):
   - Valid `READY` → run alignment checkpoint A (see Alignment checkpoint A), then step 7.
   - Valid `BLOCKED` with parked records → run the Autonomous pass (see below). Do not set `needs-human` before the pass ends.
   - Anything else, including a missing, mismatched-token, or malformed final → stage `needs-human` with the reason the Build status rules give (for example "builder wrote no valid status"). No pass runs, because there is no valid parked list to work from.

7. **Review round N.** Set stage `review`, `round` to `N`, and every configured lens to `pending` in `reviews`. Move tracked tickets to In Review. Dispatch the lenses from `{{FACTORY_REVIEW_LENSES}}` in two stages, each with the paths block:
   - **Stage A:** `code` → `reviewer` (brief `roles/review-code.md`) and `security` → `reviewer`, in fresh context (brief `roles/review-security.md`). Dispatch both in one parallel batch (one message with multiple agent calls) when the harness can.
   - **Stage B:** `ux` → `reviewer` (brief `roles/review-ux.md`) and `ui` → `reviewer` (brief `roles/review-ui.md`), the browser lenses. Start them only after every stage A review is written. The code reviewer's build runs in the shared build location and would clobber the browser lenses' dev servers. The two browser lenses use separate ports and may run in parallel with each other.

   If the harness cannot dispatch in parallel, run the lenses one at a time, in the order above.

   Wait for every reviewer's reply, and save each as `round-N/review-<lens>.md` (see Harness notes). Each must have a first line `VERDICT: PASS` or `VERDICT: CHANGES`. A reviewer whose reply has no valid first line is re-dispatched alone, once. If it still fails, stage `needs-human`. Never resume the builder during a review round. Update `reviews` from the verdicts.
8. **Verdicts.** Check in this order:
   - Any blocking item titled `Not verified:`, from any lens: no repair. Stage `needs-human`. Tell the user the `Not verified` items. Stop.
   - Any `CHANGES`, and the cycle has used fewer than 3 review rounds: run a builder repair (Repair below, which runs the Build lanes procedure first) with `Round` set to `N`, the round just reviewed. Then set `N` to `N + 1` (the upcoming review round `U`), run checkpoint A for `U` when the repair requires it (see Repair), and go to step 7.
   - Any `CHANGES` on the third review round of the cycle: write `decision.md` with first line `ESCALATE` and the reason ("retries exhausted after round N; open items: …", listing the blocking items), with the acceptance basis header under the first line (`Round: N` and `Tested commit: <sha|none>`, as in step 9). Then run the Retro hook (see Retro) for this `ESCALATE`, round `N`. Stage `needs-human`. Tell the user. Stop.
   - All `PASS`: go to step 9.

   A review cycle is the rounds since the job started, or since the latest `rework-<k>.md` (see Rework). "Third review round of the cycle" means two repairs have already been made in this cycle. The rework note records where its cycle starts.
9. **Approve.** Set stage `approve`. Dispatch `reviewer` in approval mode (brief `roles/approve.md`, fresh context) with the paths block. Wait for the approver's reply and save it as `decision.md` (see Harness notes). Write the acceptance basis header under the first line, for both `APPROVE` and `ESCALATE`: line 2 `Round: <N>` (the round just approved, so resume and Retro can tell which cycle it belongs to), and line 3 `Tested commit: <sha|none>`, where `<sha>` is the `Tested commit:` value in the build location's `qa.md`, or `none` when it names none. The approver's first line stays the exact token, and its rationale follows the header. Its first line must be `APPROVE` or `ESCALATE`. If the line is missing or invalid, re-dispatch once, then stage `needs-human`. Once the decision is valid and saved, run the Retro hook (see Retro) before the routing below. It runs for both `APPROVE` and `ESCALATE`.
   - `ESCALATE` → stage `needs-human`. Tell the user the rationale. Stop.
   - `APPROVE` and `{{APPROVAL_MODE}}` is exactly `auto` → run the merge procedure, unless the job has a `human` criterion (see Functional QA). Such a job stops at `awaiting-human` even under `auto`, as below.
   - `APPROVE` otherwise: stage `awaiting-human`. Print the QA guidance, with the human handoff when there is one (see QA guidance). Tell the user to run `/factory approve <id>` after reviewing the branch. Stop. Any value other than exactly `auto` is treated as `human`.

### Repair

Run the Build lanes procedure in repair mode (brief `roles/build.md`, paths block), where `Round` is the round just reviewed (the `N` from step 7, before it increments). It reads `spec.md` (spec route only), `plan.md`, `build.md`, and `round-<Round>/review-*.md`. It must address every `CHANGES` item or justify it in `build.md`. It also rewrites `qa.md`. Wait for its terminal reply (see Harness notes) and check the matching final's first line again (step 6 rules). Here `Round` is the round just reviewed (`R`). The upcoming review round is `U` (step 8 sets it). Classify the result with the Build status rules, as step 6 does. A valid `READY`: run alignment checkpoint A for `U` before step 7, unless the repair is a mechanical change after an applicable `PASS` (fit-review Freshness). A valid `BLOCKED` with parked records: run the Autonomous pass for round `U`, with the same bounds and permissions, and after its valid `READY`, run checkpoint A for `U` before step 7. Anything else: stage `needs-human` as in step 6. Never reuse a PASS after a `CHANGES`.

### Autonomous pass

Runs from step 6 when `build.md` is a valid BLOCKED with parked records, from Repair for the same case, and from the parked-task resume (step 7). It finishes the work that can still move, asks read-only Oracle only about technical blockers, and gives the operator one grouped list for the rest. It adds no stage and no retry loop. It never changes a goal, the spec or plan, a gate, or an approval, and its advice is never an approval. Its bounds: one Oracle ask per task per cycle, one guided re-dispatch per task per cycle, and no re-ask without a rework.

Classification comes from [autonomous-mode](../autonomous-mode/SKILL.md), section Canonical Blocker Classification, and its Oracle Semantics. Each blocker gets one class. Only Technical-unknown is `technical`, and only that class reaches Oracle. Requirement meaning, Role or permission, Undefined check command, and Human approval or decision are `human-only`. A blocker that fits both a human class and a technical class is `human-only`. Do not apply its Scheduling section. Factory scheduling is the Build lanes procedure: the pass's newly eligible items are split into lanes and dispatched there, in ready batches.

**Build status rules.** Read `build.md`'s first line and its `## Parked items` section. A parked record is one line in this form, which the builder writes exactly (see `roles/build.md`):

`- T<n> | technical|human-only | cites: <refs> | blocker: <one line> | dependents: <ids, or none>`

`cites` names what the blocker rests on: a repo path (with `:line` when known), `plan step <n>`, `AC-<n>`, or `T<n>`. A record is valid only when it has a task id, one tag from that list, at least one cite, a blocker line, and a dependents field, and it still contains no `<` or `>` from the template. Classify `build.md`:

- `STATUS: READY` and no `## Parked items` heading: READY.
- `STATUS: READY` with a `## Parked items` heading: invalid. Stage `needs-human` with reason "READY with a Parked items section: the builder must rewrite it as BLOCKED with valid records, or remove it". No pass.
- `STATUS: BLOCKED` with at least one valid record and no invalid one: the pass.
- `STATUS: BLOCKED` with an invalid record: stage `needs-human` with reason "parked record invalid: <the line>". No pass. `STATUS: BLOCKED` with no parked records is not a pass: it stops at `needs-human` with the reason in `build.md`, as before.
- Anything else: stage `needs-human` with reason "builder wrote no valid status". No pass.

**Advice rows.** `## Oracle advice` in `build.md` holds one row per task, written only by the orchestrator, in this form:

`- T<n> | key: <key> | state: asked | evidence: none`

The states are `asked`, `RESOLVED`, `INCONCLUSIVE`, `dispatched`, and `not asked: <reason>`. They move only forward: `asked` to `RESOLVED` or `INCONCLUSIVE`, and `RESOLVED` to `dispatched`. `not asked` is final. Rows are rewritten with `build.md` and never deleted.

**Key.** A key is the task id plus the content identity of each cite. It is computed once when the pass starts and kept for the whole pass. For a repo path it is the git blob id of the committed file, from `git rev-parse HEAD:<path>` (read-only). A blob id changes only when the file's content changes. A missing path is `missing:<path>`. For a `plan step`, `AC`, or `T` cite it is the blob id of the approved document that holds it: `plan.md` for plan steps, `spec.md` for AC on the spec route (`plan.md` on plan-only), and `tasks.md` for `T`. For a check cite it is the check's command text and its recorded pass or fail, never its full output. The blocker's free text, citation-free text, and the build location's HEAD are never part of the key.

**Ask budget.** A task gets one Oracle ask per cycle. `/factory rework <id> <note>` starts a new cycle, and it is the only renewal. After a rework, a task whose current key differs from its recorded key may be asked once more. A task whose key is unchanged is not asked. Without a rework, a changed cited input is reported under `## Needs you` as renewed evidence, and is not asked.

1. **Reclassify.** Read each `technical` item against Canonical Blocker Classification, sources first. A builder's `technical` tag does not stand unless the blocker is Technical-unknown. A requirement meaning, a role, permission, credential, or environment the flow does not grant, an undefined check command, a human approval or decision, a `requires user decision` finding, a push or external publication, or a manual QA check is `human-only`, and it is never sent to Oracle. A Technical-unknown item with in-scope cites stays `technical`.
2. **Global gates.** A `human-only` item stops its dependents at once, with reason "blocked by gate <id>". Items independent of it stay eligible.
3. **Oracle, once per task.** For each eligible `technical` task that the ask budget allows:
   - No row: write `- T<n> | key: <key> | state: asked | evidence: none` into `## Oracle advice`, then dispatch one read-only Oracle. If no read-only Oracle is configured for the harness, write the row with `state: not asked: no read-only Oracle configured` and park the item. Never use a reviewer fallback.
   - A row found at `asked` on entry means the session ended during the call. Make it `state: INCONCLUSIVE | evidence: no recorded reply`, and do not ask again.
   - The dispatch carries the paths block, the verbatim goal sources, the accepted plan (and the accepted spec on the spec route), the task, its cites, and the relevant files. Oracle's permissions are fixed: read-only, advice only. It never edits, never approves, never changes a goal, a gate, or a check, and never answers a human-only item.
   - Oracle's first line is `RESOLVED` or `INCONCLUSIVE`. `RESOLVED` must cite in-scope evidence: an approved plan step, an acceptance criterion, or a file and line that settles the blocker. An expansion, a new file outside the approved plan, or a changed goal is out of scope, so the answer is `INCONCLUSIVE`. Rewrite the row as `state: RESOLVED | evidence: <cites>` or `state: INCONCLUSIVE | evidence: none`, and put "Guidance, not goal authority. Not an approval." under the heading.
4. **Guided re-dispatch, once.** Executable advice: a task is executable only when it is parked, tagged `technical`, its row is `RESOLVED` with cited evidence, and the row's `key` equals that task's current key (computed at pass start, or now on resume). A row whose key differs is not executable: the task stays parked with reason "advice key no longer matches current inputs; rework to ask again", and it is listed in `## Needs you`. Dependent candidates are the tasks named under the `dependents:` of all executable roots in this batch, and only those that are parked. A candidate stays parked, with its real blocker, while any unresolved blocker outside this batch remains, including a stale row on its own blocker. Before dispatch, rewrite each executable root's row to `state: dispatched` in `build.md`. Run the Build lanes procedure in `autonomous` mode (brief `roles/build.md`, paths block) over the executable roots, their advice lines, and their dependents. A dependent enters only after its prerequisites are finished and committed. A dependent starts only after every one of its prerequisites is verified finished and committed: already finished and committed before this run (listed under `## Completed`), or finished and committed earlier in this run. If a prerequisite stays blocked, the dependent does not start and is recorded under that prerequisite's actual blocker. If a root stays blocked, its dependents do not run at all. A dependent that hits a real new blocker records it normally, and that blocker goes through steps 1 to 3. Then classify `build.md` again with the Build status rules. A root whose row is `dispatched` and is still parked stays parked, with reason "guided attempt spent: still parked after RESOLVED", and is never dispatched again in this cycle. A dependent that was not started is not dispatched again in this cycle unless its own blocker gets a new `RESOLVED` row. Return to step 1 for tasks that have no row yet. Each return either removes a `RESOLVED` row or adds rows for tasks that had none, and rows never move back, so the loop ends.

5. **Inconclusive.** An `INCONCLUSIVE` answer, or a `RESOLVED` answer without in-scope evidence, leaves the item parked with reason "Oracle: <one line>".
6. **Outcome.** A valid READY coming back goes to step 6's READY path. Otherwise, when no eligible work remains, stage `needs-human` with reason "autonomous pass parked <N> items; <M> need you". Write `## Needs you` in `build.md` and print it in chat: one line per parked item, as an exact next step. For a `human-only` item, the step is the human action, then `/factory rework <id> <note>` naming the resolution, which is the explicit path that starts a fresh builder round. For a technical item Oracle could not settle, the step names the decision it needs, with what Oracle said. Then the existing `needs-human` routing stands: rework, approve (refused while the build is not READY), or abandon.
7. **Resume (parked-task resume).** Applies when the dispatch priority (Resume of build and review state) selects it: `/factory start <id>` on stage `build`, or on `needs-human` with `failed_stage` null, with a valid BLOCKED `build.md` that has records and is newer than every rework note (legacy jobs; a job with a batch record resumes as Build lanes, step 10 directs). It re-enters at step 1, and it never runs a full rerun, a repair, or a review. The builder runs only in autonomous mode, through the Build lanes procedure, for the tasks in step 4. First check the build location. If it has uncommitted changes, they are operator state the builder did not write, so do not run the pass. Print them, and say: "uncommitted operator state in the build location: commit it and run `/factory start <id>`, or hand it to the builder with `/factory rework <id> <note>`." Otherwise:
   - Keys are computed now. Rows are handled as in step 3 and step 4: an `asked` row becomes `INCONCLUSIVE`, and a `dispatched` row whose task is still parked is parked for the cycle, with reason "guided re-dispatch was interrupted or spent: rerun with /factory rework <id> <note> if needed".
   - A changed key is reported in `## Needs you`, and it is asked only after a rework (see Ask budget).
   - A human-only item stays parked until the operator reworks it. A human resolution is recorded through `/factory rework <id> <note>`, which starts a fresh builder round. Nothing else makes it eligible.
   - Print `## Needs you` and the recorded advice rows, with the same options as any `needs-human` stop.

### Alignment checkpoint A

Runs before the upcoming review round `U` starts: after the first build (`U` is `N`), and after a review repair (`U` is the incremented `N`, see step 8). Resume also runs it, as a resume caller (see Resume of build and review state). Read and follow [fit-review](../../../.claude/rules-snippets/fit-review.md) for checkpoint A. The goal sources are the original request and every explicit amendment, and the accepted spec (spec route) or the plan's `## Requirements Source` and `## Acceptance Criteria` (plan-only), and the plan, are traced against them.

0. Normal callers only (the initial build and a review repair). Persist first: set `round` to `U` and stage `review` in `job.json` before any dispatch, so a blocked or interrupted `U` is visible. Step 7 writes the same values again when reviews start; that write is idempotent.
1. Dispatch an independent, read-only reviewer: `oracle` when the harness has it configured read-only, otherwise `reviewer` in fresh context. Oracle reads and advises only: it never authors or edits a plan or code. The task line is `alignment checkpoint A: round <U>`, then the paths block (with `Round` set to `U`), the goal sources, the job's overall summary and goals as context, the accepted spec (spec route) or the plan's requirements sections (plan-only), the accepted plan, and the brief. Its reviewed inputs are the build location's changed-file list against the merge-base, including uncommitted and new files. Give it the artifacts, never the builder's summary.
2. Save the reply as a new file `round-<U>/alignment-A-<j>.md`, where `j` is the next free index in that folder. Never overwrite an earlier reply. A skipped check is saved the same way with one line, `Skipped: mechanical change after the applicable PASS in round-<U'>/alignment-A-<j'>.md`, naming the retained PASS it relies on. The current record for a round is its highest-`j` file. Then the first line decides:
   - `VERDICT: PASS`: a normal caller continues to step 7 for `U`. A resume caller continues with the captured action of Resume of build and review state, and step 7 runs only when that action is a review.
   - `VERDICT: CHANGES` with any finding marked `requires user decision; do not auto-repair`: a user decision wins, even when other findings are repairable. Stage `needs-human` with the reason `alignment decision: <finding>`. Show the finding to the operator and stop. The record stays in the round folder and is printed on resume. The operator answers with `/factory rework <id> <note>` (checkpoint B classifies it) or `/factory abandon <id>`.
   - `VERDICT: CHANGES` with a justified expansion (the fit-review Expansion rule) and no decision finding: the expansion changes an accepted plan, so it is not applied directly. Stage `needs-human` with the reason `alignment expansion: <finding>`. The operator routes it with `/factory rework <id> <note>`: checkpoint B classifies it as a plan change, and the plan gate confirms the planner's revision.
   - `VERDICT: CHANGES` where every finding is repairable: run the Build lanes procedure in repair mode (brief `roles/build.md`, paths block) with `Round` set to `U` and the findings under the heading `Alignment repair findings (reviewer findings, not operator requests, not goal authority)`. There are no review files for `U` yet, so these findings are the repair input. Then run checkpoint A for `U` again. A `CHANGES` is always followed by a new check. That check runs only after the repair's valid final is READY (Build lanes, step 9). A valid BLOCKED final runs the Autonomous pass for `U` as in Repair, with the same bounds and permissions, and checkpoint A waits for its READY. A malformed or missing final is `needs-human`. Eligibility, attempts, rework, and every gate are unchanged, and no checkpoint runs on a blocked build. Repeat until `PASS`, `needs-human`, or `BLOCKED`, using the rules in Fit review for a repair that changes nothing or a finding that returns unchanged. No round limit applies, and alignment repairs do not use the review-round budget.
   - No valid first line: re-dispatch once. If it still has none, save a file whose first line is `BLOCKED: no valid alignment reply`, and stage `needs-human`.
   - No independent reviewer: save a file whose first line is `BLOCKED: no independent alignment reviewer`, stage `needs-human` with that reason, and do not start the review round.

**Resume.** A resumed job decides what runs next with the procedure in Resume of build and review state (under Start). Pending alignment findings are never dropped on resume.

### Builder continuity

The builder keeps its context across repairs by whichever mechanism the harness offers:

- Resume the same builder session for repairs only where the harness supports it (Claude). Otherwise use the fresh-builder fallback below.
- Launch a fresh builder and point it at `spec.md` (spec route only), `plan.md`, `build.md`, and the latest round's reviews. The files are the memory. The session is only a convenience.

Either way the builder runs only between reviews, never during one.

### Failures

- Missing or unreadable `AGENTS.md` commands → stop and ask the user to add them. Do not guess commands.
- An agent that finishes without its expected output (a file, or for a reviewer or the approver, a reply with a valid first line) → re-dispatch that agent once, then `needs-human`. For a spec or plan agent, set `failed_stage` to `spec` or `plan` with it.
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
   **Checkpoint B (before any file is written).** Read and follow the [fit-review](../../../.claude/rules-snippets/fit-review.md) brief for checkpoint B. Dispatch the independent read-only reviewer (`oracle` when available read-only, otherwise `reviewer` in fresh context) with the original request and every explicit amendment verbatim, the job's overall summary and goals as context, `spec.md` (spec route only), `plan.md`, the latest `build.md`, and the note verbatim. It classifies the note as `repair`, `plan change`, or `spec change`, and it does not repair the note. Reserve the next free index `b` of `alignment-B-<b>.md`, and the next free index of each family the route might write (`rework-<r>.md`, `spec-<s>.md`, `plan-<p>.md`). Save the reply as `alignment-B-<b>.md` with a header line `Note: <first line of the note>`, the reserved indices, and `Starts at round <N>`, where `N` = `round + 1` from `job.json` as it is now. The gates never change `round`, so this value stays valid until the continuation below persists it. Each family keeps its own index, and no existing file of any family is overwritten. Then:
   - `VERDICT: PASS` with `Classification: repair`: continue with steps 2 to 4.
   - A finding marked `requires user decision; do not auto-repair`, or any `plan change` or `spec change`: do not start the rework. Show the operator the classification and the finding, and ask as a numbered choice: (1) spec change: the spec gate, then the regenerated plan gate; (2) plan change: the plan gate; (3) leave the job as it is. A spec change always takes choice 1. On a plan-only job, choice 1 first sets `spec_route` to `spec` (see Plan-only re-entry). Add a `Route: spec then plan` or `Route: plan` line to `alignment-B-<b>.md`.
      - Route `spec then plan`: write the note verbatim to the reserved `spec-<s>.md`, set stage `spec`, rerun `planner` in spec mode, and show the spec gate. Its Confirm reruns `planner` in plan mode, so the plan is regenerated from the confirmed spec. The plan gate then shows the regenerated plan, and its Confirm is required again.
      - Route `plan`: write the note verbatim to the reserved `plan-<p>.md`, set stage `plan`, rerun `planner` in plan mode, and show the plan gate.
      - Continuation: a routed rework continues from the plan gate's Confirm. It is pending while the newest `alignment-B-<b>.md` has a `Route:` line and `job.round` is lower than its `Starts at round` value. Once `round` is persisted, it is no longer pending and the job resumes as an ordinary build. Its Confirm does not run Start's create or resume path, and it does not run the initial build-location setup. It runs this procedure in order:
        1. **Tracking first** when `tracking` is `tracked`: write missing keys and rename the folder in the main checkout (this updates `feature_dir`). Only then sync the docs, so keys and the rename are carried.
        2. **Validate the build location from `job.json`**, independently of the gate. `worktree` `true`: `worktree_path` must be set to an existing worktree on `factory/<id>`. `worktree` `false` (in-place): `worktree_path` must be `null` and the main checkout must be on `factory/<id>`, and the In-place dirty check must pass. That check excludes the feature roots, so the new spec and plan do not trip it. A failed check stops the continuation and reports the reason. Never run checkout, reset, stash, or clean to pass a check, so newly edited docs are never lost.
        3. **Doc sync**, for a worktree job only. An in-place job's main checkout is its location, so only the Feature docs commit runs there. Carry the renamed folder: if the worktree still has the old unkeyed folder, `git mv` its `qa.md` into `feature_dir` when that folder has none; if both have one, stop and ask. Copy `spec.md` (when the main checkout has it) and `plan.md` from the main checkout's `feature_dir` over the worktree's copies. Copy `tasks.md` when the main checkout has it; when the main checkout lacks it and the worktree has one, remove only that worktree `tasks.md`. Never copy, delete, or overwrite `qa.md` or any other file. Then run the Feature docs commit: its step 1 removes the old unkeyed folder only after `qa.md` has moved.
        4. **Round and note.** Set `N` = `round + 1` from `job.json` now. Compare it with `Starts at round` in `alignment-B-<b>.md`; if they differ, stop and ask. Write the reserved `rework-<r>.md` if it does not exist yet: `Starts at round N.`, then `The operator's note is in spec-<s>.md or plan-<p>.md, as named by alignment-B-<b>.md. The confirmed spec and plan are the inputs.`
        5. Continue with Rework step 4 below. It persists `round` = `N` and stage `build`, which ends the pending state. Steps 1 to 4 are idempotent, so a crash before that persist reruns them safely.
      - A routed job at `awaiting-spec` or `awaiting-plan` resumes at its gate, and its Confirm follows this procedure.
   - No independent reviewer: stop with `BLOCKED: no independent reviewer`. The stage stays where it was, and no rework starts.
   - No valid first line: re-dispatch once. If it still has none, stop and report it. The stage stays where it was.

2. `r` = the reserved index of `rework-<r>.md` from checkpoint B's header. Each family keeps its own index, and an existing file is never overwritten.
3. Let `N` = `round + 1`. Write `rework-<r>.md`:

   ```
   Starts at round N.

   <the user's note, verbatim>
   ```

4. Set `round` to `N`, stage `build`. If `decision.md` exists and `decision-<R>.md` does not, copy `decision.md` unchanged to `decision-<R>.md`, where `R` is the round it names. This is a copy, never a deletion, so the historical decision stays. Move tracked tickets to In Progress. For an in-place job, switch the main checkout to `factory/<id>` if needed (see In-place mode). For a worktree job, rerun the bootstrap first (see Worktree bootstrap); a failed step stops the rework the way it stops a build. Run the Build lanes procedure in rework mode (brief `roles/build.md`, paths block), as a fresh builder. It reads the latest `rework-<k>.md` and rewrites `qa.md`. Wait for it. Then classify the matching final as step 6 does (do not dispatch the builder again), and run review round `N` from step 7 only after a READY final.

The new cycle starts with a fresh repair budget. Old rounds and reviews are kept, not overwritten.

## Functional QA

Functional QA means the changed behavior was run, not only built. The rules are the shared loop's [Functional QA](../../../.claude/prompt-snippets/implement.md#functional-qa): automated checks for every AC, a human check only where a person must judge, the plan before the build, recorded runs, safety, identity and freshness, and the handoff. This section adds the Factory mechanics. Gates use only the existing verdicts and stages.

- **Plan.** Before writing code, the builder writes the QA table into `qa.md` in the build location: one row per AC and check, with its kind (`local`, `covered`, `human`, or `na`), its exact command or fixture, and its expected result. A human check is an extra row on its AC, never a replacement for the automated rows. Observed and Result start as `-` and `planned`.
- **Run.** The order is fixed: the code commit, then the runs on that commit, then the evidence commit. After the final code commit, the builder runs each automated check and each cited `covered` test, fills in Observed and Result, records `Tested commit: <hash>` (the code commit), and commits `qa.md` with the work. A `human` row is never recorded as passed.
- **Review.** The code lens re-runs each automated command from the table and each cited `covered` test, and compares the results with the recorded ones (see the code brief). A failed row, a missing feasible automated check, or a label without its reason is a `VERDICT: CHANGES` item, repaired within the usual three review rounds. A check that could not run because a credential, data, or environment is missing is a blocking item titled `Not verified: functional QA <AC-n>: <reason>`. It sends the job to `needs-human`, and nothing is repaired for it.
- **Approve.** The approver checks the record (see its brief) and escalates on a failed, missing, or not-run automated check, or on stale evidence. Evidence is stale when the build location has uncommitted changes, or when a committed change since `Tested commit` touches a file that an automated check runs or covers. The only exempt change is a record-only edit to `qa.md`, one that changes the Observed, Result, or Tested commit cells and nothing else. Changes to files that no check runs or covers do not stale the record. A changed criterion, command, expected result, or evidence line does. The approver does not count human rows or the manual checklist.
- **Human checks.** For an AC with a human check, the handoff is the `## Manual checks` section of `qa.md`: numbered steps, each with its AC and expected result, plus the fields from implement.md's Functional QA (tested commit, setup and test accounts by name, seeded prerequisites, what was already tested, cleanup, and the response template). The orchestrator prints it at `awaiting-human`, even under `auto`, and the job waits there. Acceptance needs `PASS` and an explicit `accept` for the tested commit named in the handoff (Approve step 6). `not run` with `accept` stays pending. `reject` or `FAIL` means rework. The answer is saved verbatim in `build.md` as a `## Human QA answer` block. After any rework or any change to a checked file, the tested commit changes, and a new handoff is printed. Ask the user with the harness's native question tool when one exists, and only when no independent authorized work remains or a gate needs the answer; otherwise ask in chat at that point. Resume restores the exact pending handoff from `qa.md`, not a summary of it.
- **Unavailable user.** Nothing repeats or loops. The job stays at `awaiting-human`, the handoff stays in `qa.md`, the status table shows it, and other jobs continue. Absence is never signoff.
- **Where the evidence lives.** `qa.md` is on the job branch in the build location: the worktree path from the paths block, or the main checkout for an in-place job. The orchestrator reads it there before the merge, and from the main checkout's feature folder after it. Answers are in `build.md` in the job folder, which git ignores, so they survive worktree removal. The builder keeps those blocks when it rewrites `build.md`.
- **Missing record.** A missing `qa.md`, or a missing `## Functional QA` section, escalates when the job has any automated or human check. Otherwise it is only noted.
- **Optional checks.** They are listed under `## Not covered by automated tests`, each with its reason. They never block.

## QA guidance

The builder writes `qa.md`, committed with the work. It holds the functional QA record, the human handoff when there is one, and the operator's checklist. It rewrites it on repair and rework rounds. A small job can have a few lines.

When the job reaches `awaiting-human` or `needs-human`, and after an auto merge, print (from the build location before the merge, from the main checkout's feature folder after it):

- First, the mandatory items: every `## Not verified` item from the latest round's reviews, and every failed, not-run, or stale automated check from the record. These are blocking and never sit under the optional line.
- If a human check is pending: `Human QA required before /factory approve: answer the handoff below`, then the handoff.
- The `## Functional QA` table with its results.
- Under the line `Suggested checks before /factory approve — not a gate`, the `## Not covered by automated tests` items.
- If `qa.md` is missing: `No qa.md: no QA record or suggested checks.`

Rules:

- Only the checklist and the limitations are optional. They never change a verdict.
- A missing `qa.md`, or a missing `## Functional QA` section, escalates only when the job has an automated or human check. Otherwise it is noted.

## Retro (opt-in, advisory)

Retro saves a short, advisory friction report for one acceptance decision. It never changes a stage, verdict, approval, gate, or merge. The procedure is in the [retro skill](../retro/SKILL.md), which you run inline. This section says when and where.

- **Opt-in.** Only a job whose `job.json` has `"retro": true` runs retro. Set it with `--retro` on a new job, or when the operator asks for it at intake. Absent or any other value is off, which is every legacy job. Resume never changes it.
- **When.** Once for each saved decision, right after a valid `decision.md` is written and before the job routes on. That is approve step 9, for both `APPROVE` and `ESCALATE`, and the retries-exhausted `ESCALATE` in step 8, where `decision.md` is written directly. Every approval mode and merge mode gets it, including no-merge outcomes.
- **Never again.** Retro does not run at `/factory approve`, inside a merge, or after a push.
- **Acceptance basis header.** `decision.md` carries it under its first line (Loop step 9): `Round: <N>` and `Tested commit: <sha|none>`. Every retro report starts with the same basis, in this shape, which the retro skill writes:

  ```
  Decision: <APPROVE|ESCALATE>, round <R>
  Tested commit: <sha|none>
  ```

  `R` and the tested commit are copied from `decision.md`'s header. The tested commit is the feature commit that the review and QA tested. It is never the merge commit, which differs from it, and a forge squash can remove it.
- **Where.** The report is `round-<R>/retro-<D>.md` in the job folder, where `D` is `approve` or `escalate`. A round has one decision on the normal path, and a repair or rework starts a new round with its own report.
- **Current decision and resume.** Build the two expected header lines from the current `decision.md`. If `round-<R>/retro-<D>.md` exists and its first two lines equal them, skip the write: it was saved for this decision and tested commit. If it exists with different lines, do not overwrite it, and print `Retro skipped: existing report does not match current decision`. Reports are never copied between decisions.
- **Unavailable.** If a read fails or the retro procedure cannot finish, say `Retro skipped: <reason>` in chat and continue routing. Write no report.
- **Limits.** Retro reads only the job's artifacts. It runs no tests, lint, build, git command, or tracker call, and it does not scrape stdout or logs. Its findings are advice.
- **Redaction.** Secrets, tokens, credentials, personal data, and connection strings in the artifacts are written as `[redacted]`.
- **Soft enforcement.** Nothing mechanical runs this section. The orchestrator follows it by instruction.

## Closeout (opt-in Learn)

Closeout runs once, after a merge is verified and recorded, and before cleanup removes the branch or worktree. It is advisory: it never changes a stage, verdict, approval, merge, checkout, ticket, or cleanup. A skip or failure never blocks cleanup, and nothing retries.

**Merge record.** The merge steps write `merge` and stage `merged` in one job.json update, rewriting the whole file once (Local merge step 6; push-mr Merged). The fields are in job.json, above.

**Gate.** Run Closeout only when all of these hold:

- `job.json` has `"learn": true` (independent of `retro`);
- `decision.md` starts with `APPROVE`;
- `merge` is present, and it is either `mode` `local` with a `commit`, or `mode` `push-mr` with `state` `MERGED` and `mr` equal to `job.mr`;
- `learn.md` does not exist yet.

Otherwise do nothing, except a printed skip reason when the job opted in.

1. **Mandatory proof and optional evidence.** The mandatory proof is the gate above: the current `APPROVE` and a verified merge record. If it fails, print `Learn skipped: <reason>` and stop. Everything else is optional evidence, and each input is read only from a location that proves it belongs to this job:
   - `local`: the main checkout's feature folder. Its `qa.md` counts only when the main checkout's HEAD equals `merge.commit` (read-only `git rev-parse HEAD`) and `qa.md`'s `Tested commit:` equals `merge.tested_commit`.
   - `push-mr`: the build location, and only while `git -C <build location> symbolic-ref --short HEAD` prints `factory/<id>` (read-only). For a worktree job that location is `worktree_path`, which must exist. For an in-place job it is the main checkout, which after cleanup may sit on the default branch. Its `qa.md` counts only when its `Tested commit:` equals `merge.tested_commit`.
   - The default branch's files are never read: no `git show`, no checkout. A copy that fails its identity check is treated as missing, never as evidence.
   - A retro report passes to Learn only when its two header lines equal the current `decision.md` header. A `none` tested commit is no identity, so Learn gets no retro.
2. **Missing optional inputs.** Name each missing optional input in the report and continue with what remains, as the learn skill allows. Skip (`Learn skipped: <reason>`, nothing written) only when the mandatory proof is missing, or the learn skill cannot read any artifact.
3. **Scoped project guidance.** Learn reads `AGENTS.md` and the project memory file it names, as advice, under its own rules.
4. **Run Learn inline.** Follow [learn](../learn/SKILL.md). The only git commands are the read-only identity checks in step 1. Run no test, lint, build, or tracker command, and make no fetch, checkout, or network call. Learn writes `learn.md` only.
5. **Failure.** If Learn cannot finish, print `Learn skipped: <reason>` and write no `learn.md`. The merge stands, and cleanup runs anyway.
6. **Approved changes are separate.** Learn proposes and never applies. An approved memory entry or diff is a later input, applied outside Closeout after the operator's exact approval.

**Recovery (`/factory approve` on a merged job).** Approve runs this recovery only when the job opted in, `learn.md` is absent, and the gate holds. It runs steps 1 to 5 with the evidence that still passes its identity check, and nothing else: no merge, no cleanup, no approval, no tests, no fetch, no checkout. An in-place push-mr job whose main checkout has moved off `factory/<id>` skips with `Learn skipped: evidence no longer accessible`, as does a worktree job whose `worktree_path` was removed. A merged job with no `merge` record (for example a legacy job) skips with `Learn skipped: no persisted merge evidence`. An existing `learn.md` is reused, never recomputed.

## Approve

`/factory approve <job-id>`:

1. If stage is `merged`: move the job's tickets to Done (if tracked) and report. Do not merge again, clean up again, or approve again. Say whether `worktree_path` or branch `factory/<id>` still exists (read-only), so the operator can remove what is left. Then run the bounded Closeout recovery (see Closeout) when the job opted in to Learn and has no `learn.md`. Stop.
2. Otherwise refuse unless stage is `awaiting-human` or `needs-human`. The user's explicit command is the approval. Do not re-run the approver.
3. Refuse unless the first line of `build.md` is exactly `STATUS: READY`, and `build.md` has no parked record (a READY with a `## Parked items` section refuses too; see Build status rules). Also refuse, in every mode and from `needs-human` too, unless the current alignment record passes: the highest-`j` `round-<round>/alignment-A-<j>.md` for the job's `round` has first line `VERDICT: PASS`, or is a `Skipped:` line that names a `VERDICT: PASS` file. A `CHANGES` record, a `BLOCKED` record, a missing record, or a record made stale by a later change that needs a new checkpoint under fit-review Freshness refuses. Name the record and what is missing. Remediation: a missing, stale, `BLOCKED`, or repairable `CHANGES` record is fixed with `/factory start <job-id>` (see Resume of build and review state). A decision `CHANGES` is answered with `/factory rework <job-id> <note>` or `/factory abandon <job-id>`. A job that failed before its build has no `build.md`: say so, and point to `/factory start <job-id>` (for a failed spec or plan step) or `/factory abandon <job-id>`.
4. Refuse while `merge-conflict.md` exists in the job folder. The user resolves the conflict on the branch, then removes that file.
5. **Required QA evidence.** Refuse, in every mode and from `needs-human` too, while the functional QA record in `qa.md` shows a failed, not-run, or missing automated check or covered test, or stale evidence (see Functional QA, Approve). Name the row and what the user must supply. Do not waive this with the approve command: the fix is rework, or a builder repair followed by review. The existing overrides for other items are unchanged.
6. **Human QA.** Only when the job has a `human` check (see Functional QA). The command alone is not enough for it. If no answer is recorded for the tested commit, print the handoff from `qa.md` and ask in chat for the answer in the response template, then stop. When the answer comes, append it verbatim to `build.md` as a `## Human QA answer (<tested commit>)` block. Proceed only when every human check reads `PASS` with an explicit `accept` for that commit. A `FAIL` or `reject` does not merge: tell the user to run `/factory rework <job-id> <note>` naming the row. `defer`, `not run`, or no answer leaves the job at `awaiting-human`. A job with no `human` check skips this step.
7. Print the reason the job stopped before merging, so the user sees what they approve: the `ESCALATE` rationale in `decision.md`, the `Not verified` items, the current alignment record's blocker, or the failed agent. For `awaiting-human`, print the approver's rationale.
8. Run the merge procedure for `{{MERGE_MODE}}`. In `push-mr`, a job with `mr` set takes the finish path there instead.

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
5. Run the test command from `AGENTS.md` in the main checkout. On failure run `git reset --keep $PRE` (this undoes the merge), copy the `main-copies/` files back to their paths, set stage `needs-human`, and report the failing output. For an in-place job, the main checkout stays on `{{DEFAULT_BRANCH}}` and the branch stays for inspection.
6. **Verify and persist the merge.** Once step 5's tests pass, the merge commit is `git rev-parse HEAD`, the commit the tests ran on. Write `merge` and stage `merged` in one job.json update, rewriting the whole file once with both (see Closeout, Merge record): `merge` has `mode` `local`, `commit` that SHA, and `tested_commit` the `Tested commit:` value in the decision's header (`none` becomes `null`). Writing this before cleanup means an interruption leaves a merged job with its evidence, not a job whose branch is already gone.
7. **Closeout.** Run Closeout (see Closeout) now, before cleanup, so it can read the branch's worktree and feature evidence. Closeout is advisory: a skip or failure never changes steps 8 and 9.
8. **Cleanup.** Worktree jobs: `git worktree remove <worktree>`, then `git branch -d factory/<id>`. In-place jobs: skip the worktree removal and run only `git branch -d factory/<id>`. `-d` refuses unless the branch is merged, which is the safety check. If either fails after the merge succeeded, do not undo the merge. Report the leftover worktree or branch path for the user to remove, and continue.
9. **Finish.** If the merge came from `/factory approve`, move the job's tickets to Done (if tracked). After an `auto` merge they stay In Review; tell the user to run `/factory approve <id>` to move them to Done. Report that the merge is local and was not pushed. Print the suggested checks (see QA guidance).

On any `needs-human` outcome, leave the branch and worktree in place so the user can inspect them.

### Push and merge request (`push-mr`)

Runs in place of the local merge, when `{{MERGE_MODE}}` is `push-mr` and the approval is an `/factory approve` or an `auto` APPROVE. It pushes the branch and opens one merge request (GitLab) or pull request (GitHub). The forge's review and merge are the final gate, so nothing merges locally, the main checkout is not touched, and force-push is never used.

1. **Forge and preconditions.** Pick the forge from `git remote get-url origin`: a GitHub host uses `gh`, a GitLab host uses `glab`. Stop and tell the operator if that CLI is missing or its auth check fails (`gh auth status` or `glab auth status`). The build location must have no tracked changes: `git -C <build location> status --porcelain --untracked-files=no` is empty. Do not change the stage on a failed precondition.
2. **Test gate.** Run the test commands of the local merge, step 5, in the build location on the branch, before any push. A failure sets stage `needs-human`, reports the output, and pushes nothing.
3. **Push.** `git -C <build location> push -u origin factory/<id>`. On success, record the pushed SHA (the build location's `HEAD`) for the body's verification snapshot. A rejected push stops here: set stage `needs-human` and report the message. Do not force.
4. **Open the request, once.** Skip this step when `mr` is already set. Otherwise render the body first, then open the request with it.

   **Render `<job folder>/pr-body.md`** for both forges. `decision.md` is never changed, and the file is built only from current evidence:
   - Summary: the decision's summary, as one short paragraph.
   - Verification (a creation-time snapshot. Its label displays two SHAs: the branch SHA that step 3 recorded, and the accepted Tested commit. Show `unknown` for either one that is not recorded. Later pushes can update the branch, but this procedure does not edit the existing request body or add another forge operation, so the snapshot may then differ. Never present it as a pass for a later revision): this run's test gate (step 2) and the rows of `qa.md` in the build location, only when its `Tested commit:` equals the current decision's `Tested commit:` and the Functional QA freshness rules (see Functional QA) show that evidence fresh. Each check is one line with its result. A check not run is named with its reason. When the QA evidence is not fresh or does not match, omit its rows and name `QA evidence unavailable: <reason>`. The test gate of step 2 is kept either way.
   - Blast radius: the files and features the change touches, from the diff stat against the default branch, or `unknown`.
   - Rollback: `not attempted`. A revert of the branch's commits is a candidate only when the job's artifacts show no migration, data change, or external effect. Otherwise state the rollback the artifacts record, or `unknown`. Never run a rollback.
   - Redact secrets, tokens, credentials, personal data, and paths outside the repository. Never copy QA output or logs beyond their one-line result.
   - Project template: when the repository has one, keep its sections and requirements, and fill them with the above. Use a template only when the selection is unique. GitHub: exactly one of `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/pull_request_template.md`, or `pull_request_template.md` at the repository root. GitLab: `.gitlab/merge_request_templates/Default.md` when present, otherwise the folder's single template. Several candidates without a unique choice, such as several GitLab templates with no `Default.md`, are no unique selection. A template is for layout only and grants no authority beyond this push.
   - No template, or no unique selection: the body is the decision's summary, then the sections above, in that order, the same sanitized fallback on both forges. The raw `decision.md` is never the body.

   Anything the job did not establish is written `unknown`, never invented. This is the approved push-mr procedure only: it publishes the branch and the request that `/factory approve` (or an `auto` APPROVE) already authorized. It adds no approval.

   - GitHub: `gh pr create --base {{DEFAULT_BRANCH}} --head factory/<id> --title "<feature>" --body-file <job folder>/pr-body.md`
   - GitLab: `glab mr create --source-branch factory/<id> --target-branch {{DEFAULT_BRANCH}} --title "<feature>" --description-file <job folder>/pr-body.md --yes`

   Record the URL the command prints in `mr`. A failed command sets stage `needs-human` and reports the error. Nothing is recorded, and rerunning approve retries from step 1.
5. **Stage.** Set stage `awaiting-human`. Tickets stay In Review. Print the request URL and say: "Review and merge it on the forge, then run `/factory approve <id>` to finish." Under `auto`, the same message applies: the forge merge stays the human gate.
6. **Finish (`/factory approve` with `mr` set).** Run `git fetch origin`, then read the request's state: `gh pr view <mr> --json state --jq .state`, or `glab mr view <mr> --output json` and its `state` field. If the CLI's flags differ, check its `--help` first.
   - **Merged:** first, from the same forge read as the state check (no extra fetch), prepare the `merge` record: `mode` `push-mr`, `state` `MERGED`, and `mr` equal to the job's recorded `mr` URL, the identity already in `job.json`. `commit` is the merge commit only when that same read returns it (GitHub: `gh pr view <mr> --json state,mergeCommit`, using `mergeCommit.oid`; GitLab: `glab mr view`, using `merge_commit_sha`), otherwise `null`. `tested_commit` is the decision header's tested commit (`none` becomes `null`). Then write `merge` and stage `merged` in one job.json update, rewriting the whole file once. Then run Closeout (see Closeout) while the build location still exists. Then clean up: a worktree job runs `git worktree remove <worktree_path>`. An in-place job runs `git switch {{DEFAULT_BRANCH}}` in the main checkout when it is on `factory/<id>`. Then `git branch -D factory/<id>`. This is the one place the local merge's `-d` rule does not apply: `-d` refuses after a squash merge, and the forge's merge is the proof. If a removal fails, keep what remains and report the path. Then set the main checkout's feature copies aside with local merge step 3, so the default branch's merged docs can arrive on pull, and tell the operator to pull `{{DEFAULT_BRANCH}}`. Move tickets to Done (if tracked), and report.

   - **Open:** if `git rev-parse factory/<id>` differs from `git rev-parse origin/factory/<id>`, the job has commits the request lacks (for example after a rework). Run steps 2 and 3 to update it, and report that the request was updated. Otherwise report that it is still open, and stop. Nothing else changes.
   - **Closed without merge:** keep stage `awaiting-human`, report it, and offer rework, reopening the request on the forge, or abandon.

## Status

Read each `factory/jobs/*/job.json`. Print one row per open job: id, stage, round, reviews, issue key, size, tracking, updatedAt, and the next action for that stage. Write nothing.

Closed jobs (`merged` or `abandoned`) are hidden by default. Print one line in their place: `N closed jobs hidden (--all to show)`. With `--all`, show the closed jobs too, and the archived jobs from `factory/archive/`. The table below lists every stage, closed ones included. A plan-only job never enters `spec` or `awaiting-spec`, so its row uses the `plan` and `awaiting-plan` actions.

| Stage | Next action |
| --- | --- |
| `spec` | Wait, or `/factory start <id>` to resume if the session ended |
| `awaiting-spec` | `/factory start <id>` to review the spec and confirm it |
| `plan` | Wait, or `/factory start <id>` to resume if the session ended |
| `awaiting-plan` | `/factory start <id>` to review the plan and confirm it |
| `build`, `review`, `approve` | Wait, or `/factory start <id>` to resume if the session ended |
| `awaiting-human` | Review the branch and the QA record in `qa.md`. Answer any pending `human` check in its handoff, then `/factory approve <id>`. A `reject` means `/factory rework <id> <note>`. In `push-mr` with `mr` set: merge the request on the forge, then `/factory approve <id>` to finish. Print the request URL |
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

Dispatch with the paths block first, then the task line, then the role brief and the files to read. The task line names the mode when the agent has one (spec or plan for the spec writer; build, repair, rework, or autonomous for the builder; the lens for a reviewer; approval for the approver). A builder task line under Build lanes also names its phase or lane and its dispatch token.

Every dispatch of the planner, builder, reviewers, and approver also passes the goal sources as text, not as paths alone: the confirmed original request and every explicit user amendment (see Fit review: Baseline first and Goal sources). This applies to first runs, reruns, repairs, rework, and resumes alike. If a job has no confirmed baseline, run the Baseline first procedure of Fit review before dispatching, and do not invent goals or omit these inputs. Reviewer findings passed as dispatch context are never goal sources.

Factory adds no agents of its own. Each role runs on a native agent (`planner`, `implementer`, or `reviewer`), and the Factory rules for that role (outputs, evidence, verdict format, escalation triggers) live in its brief in this skill's `roles/` folder. Every dispatch tells the agent to read the matching brief first. The role brief overrides the dispatched agent's default output format and file-writing rules, and the first line of the reply must follow the brief.

| Role | Native agent | Task line | Brief | Fresh context | Output |
| --- | --- | --- | --- | --- | --- |
| Spec writer | `planner` | `spec` or `plan` mode | `roles/spec.md` | no | writes `spec.md`, or `plan.md` and `tasks.md` |
| Builder | `implementer` | `build`, `repair`, `rework`, or `autonomous` mode | `roles/build.md` | no | writes `build.md` and `qa.md` |
| Code reviewer | `reviewer` | lens `code` | `roles/review-code.md` | no | returns its review |
| Security reviewer | `reviewer` | lens `security` | `roles/review-security.md` | yes | returns its review |
| UX reviewer | `reviewer` | lens `ux` | `roles/review-ux.md` | no | returns its review |
| UI reviewer | `reviewer` | lens `ui` | `roles/review-ui.md` | no | returns its review |
| Approver | `reviewer` | `approval` mode | `roles/approve.md` | yes | returns its decision |

Reviewers and the approver return their report in their final reply and do not write files. You save the reply: the review as `round-<N>/review-<lens>.md`, the decision as `decision.md`. The first line of the reply is the verdict or decision, and that is what you check.

Each harness dispatches the native agent by name:

| Harness | How to dispatch | Entry point |
| --- | --- | --- |
| Claude Code | the Agent tool, naming the agent | `.claude/commands/factory.md` |
| GitHub Copilot | the `agent` tool, naming the agent | `.github/prompts/factory.prompt.md` |
| Cursor | the agent by name from `.cursor/agents` | `.cursor/commands/factory.md` |
| OpenCode | the agent by name from `.opencode/agents` | `.opencode/commands/factory.md` |
| Codex | none: run the brief directly | this skill |

Codex has no agent files. Run each role brief directly, as a delegated or fresh session, passing the paths block first. If the harness gives you one session only, use single-session mode (see Harness notes).

In OpenCode with the Slim plugin, `oracle` (security or approval) and `designer` (ux or ui) are optional alternatives to the native agents. Use them only if you have configured them as edit-denied reviewers. The native agents above are the default.

Copilot may show a display name in its agent list; pick the agent with the name above.

## Handoff summary

Give a handoff summary only when the job crosses a human or tool boundary: its state must reach a person or a tool that is not the orchestrator. Ordinary reviewer and approver dispatches, and routine resumes, are not handoffs. The summary names the owner of the next step (the operator, a reviewer, or a tool), the artifact paths, the redacted evidence it shares, what is proved and what is unknown, the blockers, and the next action that owner is authorized to take. Never send it automatically. It can stay in chat or in an existing artifact, and it creates no artifact or stage.

## Harness notes

The loop is the same in every harness. Use a parallel lens batch where the harness offers one, otherwise run the lenses in order. If dispatch is background-only, poll each expected file for a valid first line until the timeout, then apply Failures. For a builder, the completion signal is its terminal reply carrying its dispatch token (Build lanes, step 9), never `build.md`. A reviewer or approver reply arrives as its result; check its first line the same way. Builder resume is under Builder continuity; agent names are under Subagent dispatch.

- **Timeout.** The default is 15 minutes per agent. The operator can set another value for one run by saying so in the request, for example `timeout 30 min`.
- **A timed-out agent is never re-dispatched.** It may still be running, and a second run could write the same file. Stage `needs-human` with the reason "`<agent>` timed out after `<N>` min; it may still be running". For a spec or plan agent, also set `failed_stage`. Tell the operator to check the job folder and the build location, and to confirm the agent has stopped, before `/factory start` or `/factory rework`.

**Single-session mode (Codex).** Codex has no agent files, so one session plays every role. The orchestrator switches roles one at a time. For each role it reads only that role's brief and input files, writes only that role's output (a reviewer or the approver returns its report, and you save it), and keeps the same write boundaries. The rule "never write code" applies per role: as orchestrator it writes only orchestrator files, and it writes code only as the builder, and only in the build location. Lenses run in order (stage A, then stage B). The security reviewer judges the diff, not the builder's account. A timed-out role is handled as above; a role that ends without its file is re-run once, then `needs-human`. Fit review is the exception: one session is not independent, so the spec and plan gates report `BLOCKED` instead (see Fit review).

## Limits

File-write boundaries are prompt conventions, not enforced isolation. Nothing physically stops an agent from writing outside its file. The real gates are the spec and plan gates, the reviewer verdicts, the approver's rules and dry-run merge check, and the merge procedure's preconditions and test run. Ticket updates are best-effort and never gate the pipeline. The `## Functional QA` record in `qa.md` gates through the code lens and the approver. The manual checklist gates nothing. A pending `human` check gates the merge only through approval (see Functional QA).

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
- [Retro](../retro/SKILL.md)
- [Learn](../learn/SKILL.md)
- [Autonomous mode](../autonomous-mode/SKILL.md)
- [Factory README](../../../factory/README.md)
