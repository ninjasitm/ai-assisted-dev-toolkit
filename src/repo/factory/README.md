# Factory (opt-in)

A file-driven pipeline for feature-sized work. One orchestrator session runs a feature through intake → spec → plan → build → review → approve → merge. Agents get their context only from files, and each agent writes only its own file. Feature docs live in feature folders (see Feature folders), and job state lives here in `factory/jobs/`.

The factory is **opt-in**. It sits alongside Feature Builder and TDD and changes nothing they do. Nothing runs until you invoke `/factory`. Quick fixes stay direct.

Orchestrator: [.agents/skills/factory/SKILL.md](../.agents/skills/factory/SKILL.md). It runs on the native `planner`, `implementer`, and `reviewer` agents, and its role briefs live in `.agents/skills/factory/roles/`. See [Harnesses](#harnesses).

## Install

1. **Install it.** The toolkit installer copies this folder into your project root as `factory/`.
2. **Document your commands in `AGENTS.md`.** Agents read setup, dev, test, lint, and build commands from there, and the dev command must document how to pass a port (a flag or an env var). Without them the factory stops and asks you. Edit `factory/worktree-bootstrap.md` for the setup each new worktree needs (see Build location).
3. **Replace the placeholders** below in `.agents/skills/factory/SKILL.md` and `.agents/skills/factory/roles/*.md`. Bootstrap does this when it runs.
4. **Commit** `factory/README.md`, `factory/.gitignore`, and the factory skill with its role briefs. Runtime state is ignored (see Layout). Feature docs in the feature folders are committed with the code.
5. **Run it** from your harness: `/factory <feature request>` to start from a request, or `/factory start <KEY | slug | job-id>` to pick up an existing feature. See [Harnesses](#harnesses) for each entry point.

## Placeholders

| Placeholder | Meaning | Default |
| --- | --- | --- |
| DEFAULT_BRANCH | Branch jobs start from and merge into | `main` |
| FACTORY_PORT_BASE | Base dev-server port. Job `n` uses builder `base + 10n`, ux `+1`, ui `+2` | `5100` |
| APPROVAL_MODE | `human`: stop at `awaiting-human` for `/factory approve`. `auto`: merge on `APPROVE` | `human` |
| FACTORY_REVIEW_LENSES | Comma list from `code, security, ux, ui` | `code, security` |
| FACTORY_FEATURE_PATHS | Feature-folder roots, comma list, relative to the repo root. `*` matches one folder name. Search covers every root. New folders go to the first root without `*`, or to a `*` root when the request's code sits in one app | `docs/features` |
| MERGE_MODE | `local`: `--no-ff` merge here, never pushed. `push-mr`: push and open a merge or pull request (see Merge modes). Any other value is `local` | `local` |

`ux` and `ui` need browser tooling to verify anything. Without it they report every check as `Not verified`, and the job goes straight to `needs-human`. Enable them only when your agents can drive a browser.

## Invocations

| Command | What it does |
| --- | --- |
| `/factory <request>` | Intake: the orchestrator reads the project and the features it touches, asks only the glaring questions, then asks you to continue or change the answers. Nothing is created before that |
| `/factory start <request \| KEY \| slug \| job-id>` | Find or create the feature folder, then start a job, or resume the open job for it (for example one waiting at a gate) |
| `/factory approve <job-id>` | Merge a job in `awaiting-human` or `needs-human` (`local`), or open its merge request (`push-mr`; approve again once the forge has merged it, to finish). On a `merged` job, moves its tickets to Done |
| `/factory rework <job-id> <note>` | Start a fresh builder with your note and a fresh retry budget |
| `/factory abandon <job-id>` | Close a job that will not continue. Nothing is merged. Removes its worktree and branch only when the branch has no unmerged commits. Tickets stay as they are |
| `/factory status [--all]` | Summarize open jobs from their `job.json` files. Closed jobs are hidden unless `--all` |
| `/factory watch [--all]` | Show the status table, then print the command for the live view to run in a terminal (read-only). Closed jobs are hidden unless `--all` |
| `/factory archive [--all] [--dry-run]` | Move closed jobs to `factory/archive/`. Open jobs never move. See [Archive](#archive) |
| `/factory prune [--all] [--abandoned] [--dry-run]` | Permanently delete closed jobs from `factory/jobs/` and `factory/archive/`, after one confirmation. Open jobs and feature folders are never touched. See [Prune](#prune) |

`--in-place` can follow either form (`/factory --in-place <request>`, `/factory start --in-place <...>`). It builds in the main checkout instead of a worktree. See [In-place builds](#in-place-builds).

There is no queue. Start each feature with a request, a ticket key, or a slug.

## Harnesses

The orchestrator and agents are the same in every harness. Each harness has its own entry point. Every role runs on a native agent: `planner` for the spec writer, `implementer` for the builder, and `reviewer` for each review lens and the approver, with the lens or approval mode named in the dispatch. The role briefs in `.agents/skills/factory/roles/` hold the Factory rules.

| Harness | Entry point | Native agents |
| --- | --- | --- |
| Claude Code | `/factory` (`.claude/commands/factory.md`) | `.claude/agents/` |
| GitHub Copilot | `/factory` prompt (`.github/prompts/factory.prompt.md`) | `.github/agents/` |
| Cursor | `/factory` (`.cursor/commands/factory.md`) | `.cursor/agents/` |
| OpenCode | `/factory` (`.opencode/commands/factory.md`) | `.opencode/agents/` |
| Codex | The factory skill (`.agents/skills/factory/SKILL.md`) | None. Runs each role brief directly, one role at a time in one session (see Harness notes in SKILL.md) |

In OpenCode with the Slim plugin, `oracle` and `designer` are optional alternatives to `reviewer`, if you configure them as edit-denied. The default is the native agents.

## Feature folders and sizing

Each job belongs to a feature folder, `docs/features/<KEY>-<slug>/` (or `docs/features/<slug>/` before a ticket exists). The spec writer puts `spec.md` there. Then the plan step adds `plan.md`, which carries the size, and, for large work, a slim `tasks.md`, one line per task:

```
- [ ] T1 <one-line task> [P] — PROJ-1235
```

Sizing is decided in `plan.md`:

- **Small** (one or two steps): `spec.md` and `plan.md` only, no tickets.
- **Large**: `tasks.md` plus tickets, when your `AGENTS.md` documents a project management tool. Otherwise `tasks.md` only.
- **Unclear**: the orchestrator asks you at the plan gate.

## Gates

Every job stops twice, in every approval mode, before anything is ticketed or built:

1. **Spec gate** (`awaiting-spec`). You read the spec summary, the acceptance criteria count, each open `[PRODUCT DECISION]` item, and open questions. Answer every open decision before you confirm: answers go in your change request, are saved as `spec-<k>.md`, and the spec writer records each one as `[DECIDED]`.
2. **Plan gate** (`awaiting-plan`). You read the plan, the tasks, the size, the tracking proposal, and the build mode. Confirm, request changes (saved as `plan-<k>.md`), or change size, tracking, or build mode. Requests that touch the spec go back through the spec gate.

Session ended at a gate? `/factory start <job-id | slug | KEY>` shows that gate again. A job whose build has started resumes without the prompt. A job that stopped before its build because a spec or plan step failed reruns that step with `/factory start <job-id>`.

## Approval modes

- **`human`** (default). An approved job stops at `awaiting-human`. Read the branch and `qa.md`, then run `/factory approve <job-id>`.
- **`auto`**. An approved job merges automatically. The approver still escalates anything touching auth, payments, data security, deployment, migrations, email, production data, new dependencies, or unresolved product decisions. Its tickets stay In Review until you run `/factory approve <job-id>`, which then moves them to Done.

Any value other than exactly `auto` is treated as `human`.

## Build location

By default each job builds in its own git worktree on branch `factory/<id>`, so the main checkout stays free. A job's `job.json` records this in `worktree` (`true`) and the worktree path in `worktree_path`. Worktrees live in `.worktrees/<id>/` at the repo root; the factory adds `.worktrees/` to `.gitignore` if it is missing.

Tools that do not honor `.gitignore` (Jest/Vitest test discovery, ESLint, `tsc`, workspace globs) should exclude `.worktrees/`. The local merge runs tests in the main checkout while other job worktrees may still exist.

### Worktree bootstrap

Before the builder starts in a new worktree, the factory runs the steps listed in `factory/worktree-bootstrap.md`: one shell command per line, in order, from the worktree root. Typical steps install dependencies or vendored packages, copy `.env` from the main checkout, and create or migrate a database for the job. The file ships with no active steps, so edit it for your project. Each step receives `FACTORY_JOB_ID`, `FACTORY_PORT_BUILDER`, `FACTORY_WORKTREE`, and `FACTORY_MAIN_CHECKOUT`.

Steps must be safe to run again, because rework reruns them. A failing step stops the build and writes `bootstrap.md` in the job folder. Fix the cause, then run `/factory rework <job-id>`. In-place builds skip the bootstrap.

### In-place builds

Ask for an in-place build with `--in-place`, or by saying so at intake or at the plan gate. The build then runs in the main checkout, on branch `factory/<id>`.

- The job starts only when the main checkout is on the default branch with no tracked changes outside the feature folders, no other in-place job is open, and no worktree job holds its build location. Otherwise the job waits at the plan gate and says why.
- While the job is open, the main checkout stays on `factory/<id>`. Do not switch it until the job is merged or abandoned.
- The feature docs are committed on the branch when the build starts, so the main checkout has no tracked feature-doc changes to block a merge.
- The merge switches the main checkout back to the default branch and removes only the branch, not a worktree.
- A worktree job cannot merge while an in-place job holds its build location, and an in-place job cannot start while a worktree job holds one. Each refusal names the job in the way.

## Merge modes

Set `MERGE_MODE`. The approval gates are the same in both modes.

- **`local`** (default). The merge runs in the main checkout: `--no-ff`, the test commands, then the worktree and branch are removed. Nothing is pushed. Use it for a solo repo with no forge review.
- **`push-mr`**. Approve pushes `factory/<id>` after a local test run, then opens a merge request (GitLab, `glab mr create`) or a pull request (GitHub, `gh pr create`). The job waits in `awaiting-human` with the request's URL. Review and merge it on the forge, then run `/factory approve <job-id>` again. That run removes the worktree and branch and moves tickets to Done. It needs the matching CLI, authenticated.

`push-mr` suits forge-reviewed setups, where required reviews or CI gates sit on the forge after your approval. It never force-pushes and never merges locally. Under `auto`, approve opens the request without a pause, but the forge merge and the second `/factory approve` stay yours.

## Suggested checks (`qa.md`)

The builder writes `qa.md` in the feature folder, on the job's branch. It has how to run the feature (dev server, port, seed data, flags), numbered manual checks tied to acceptance criteria, and what the automated tests do not cover. When a job waits for you, the orchestrator prints it with the reviewers' `Not verified` items under the line `Suggested checks before /factory approve — not a gate`. It is a checklist. It never affects a verdict, and a missing `qa.md` is only noted.

## Tickets

When a job is tracked, its tickets follow it:

| Job event | Tickets |
| --- | --- |
| Build starts | In Progress |
| Review starts | In Review |
| The merge completes: the local merge, or a `push-mr` request merged and finished with approve | Done |
| Job abandoned | Left as they are |

The parent and every sub-task move together. The orchestrator uses the project's status names, and asks once for them if it does not know them. A failed ticket update is recorded in the job and reported. It never blocks the pipeline.

## How a job runs

1. **Intake.** For `/factory <request>`, the orchestrator reads the project and asks only the glaring questions. You answer them, then choose to continue or change the answers. Nothing is created before you continue.
2. **Spec.** `planner` (spec mode) inspects the code and writes `spec.md` with numbered acceptance criteria.
3. **Spec gate.** You confirm the spec, or request changes.
4. **Plan.** `planner` in plan mode writes `plan.md` (with the size) and `tasks.md` for large work.
5. **Plan gate.** You confirm the plan, or request changes. Nothing is ticketed or built before you confirm.
6. **Tickets and build location.** If tracked, the parent and sub-tasks are created and their keys are written into `tasks.md`. The folder is renamed to carry the key. Then a builder gets its own git worktree on branch `factory/<id>` (bootstrapped first, see Build location), or the in-place branch. The job's feature docs are committed on that branch.
7. **Build.** The builder follows TDD, ticks `tasks.md` as it completes tasks, writes `build.md`, and writes `qa.md`.
8. **Review.** Every configured lens reviews the branch, and each reviewer's report is saved as `round-N/review-<lens>.md` with `VERDICT: PASS` or `VERDICT: CHANGES`.
9. **Repair.** Any `CHANGES` sends the builder back to fix it. Two repairs at most, so three review rounds. Then the job escalates to you.
10. **Approve.** `reviewer` in approval mode (fresh context) returns `APPROVE` or `ESCALATE`, and the orchestrator writes it to `decision.md`.
11. **Merge.** `local` mode: local only, never pushed. `push-mr` mode: push and open the request, then finish on the second approve (see Merge modes). `--no-ff` merge, the project's test command, then the worktree (if any) and branch are removed. Feature docs in the main checkout are set aside first (copies in `main-copies/`), so the merge brings in the branch's committed copies.

Jobs that escalate (`needs-human`) keep their branch and worktree so you can inspect them. Use `/factory rework` or `/factory approve` to continue.

## Abandon

`/factory abandon <job-id>` closes a job that will not continue. It merges nothing. The worktree and branch are removed only when the branch has no unmerged commits. Every job that reached its build keeps its branch and worktree, because its feature-docs commit is unmerged; review them and remove the branch yourself when you are done. Tickets stay where they are, and the report lists their keys. A `push-mr` request stays open on the forge; the report gives its URL for the operator to close. An abandoned job cannot be resumed: `/factory start <slug or KEY>` starts a new one.

## Archive

`/factory archive [--all] [--dry-run]` moves closed jobs (`merged` or `abandoned`) from `factory/jobs/` to `factory/archive/`. Open jobs never move. `npx nitm-ai-dev-toolkit factory archive` makes the same moves on its own. `/factory archive` runs it, then handles branches.

- By default, only jobs last updated more than 7 days ago move. `--all` moves every closed job.
- `--dry-run` lists what would move and moves nothing.
- Archived jobs cannot be resumed. `/factory start <archived-id>` says the job is closed. Their ids still count, so new job ids never repeat until a prune removes them.
- For each archived abandoned job whose branch still exists, the orchestrator asks once whether to delete the branch and its worktree. Nothing is deleted without your yes. Branches of merged jobs are only listed.

## Prune

`/factory prune [--all] [--abandoned] [--dry-run]` permanently deletes closed jobs from `factory/jobs/` and `factory/archive/`. By default only `merged` jobs are deleted; `--abandoned` also deletes `abandoned` jobs. The age rule is the same as archive: jobs last updated more than 7 days ago, and `--all` drops the age limit. The list comes first, and nothing is deleted until you confirm once in chat. A pruned job cannot be recovered. Open jobs and feature folders are never touched.

Without `--abandoned`, abandoned jobs are kept and counted, and the flow offers to rerun with it. When abandoned jobs are pruned, each one whose branch still exists gets the same per-branch question as archive. Merged branches are only listed. `npx nitm-ai-dev-toolkit factory prune` lists by default; add `--yes` to delete (and `--abandoned` to include abandoned jobs).

## Layout

```
<feature root>/           tracked by the project (roots: FACTORY_FEATURE_PATHS)
  <KEY>-<slug>/
    spec.md
    plan.md
    tasks.md              large work only
    qa.md                 builder, on the branch: suggested checks (not a gate)
factory/
  README.md               this file
  .gitignore              ignores jobs/ and archive/
  worktree-bootstrap.md   setup steps run in each new worktree (edit for your project)
  jobs/                   runtime state (ignored by git)
    <NNN-slug>/
      job.json            stage, round, reviews, size, tracking, worktree, mr, failed_stage, approval mode
      intake.md           intake questions and answers (only when asked)
      spec-<k>.md         after a change request at the spec gate
      plan-<k>.md         after a change request at the plan gate
      build.md
      round-<N>/review-<lens>.md
      decision.md
      merge-conflict.md   after a merge conflict; blocks approve
      bootstrap.md        after a failed worktree bootstrap step; blocks the build
      rework-<k>.md
      main-copies/        feature docs moved aside at merge
  archive/                closed jobs moved by /factory archive (ignored by git)
    <NNN-slug>/           same layout as jobs/; never resumed
```

Job folders are ignored by git. They are working state, not history. Copy one out if you want an audit trail.

Stages, in order: `spec`, `awaiting-spec`, `plan`, `awaiting-plan`, `build`, `review`, `approve`, `awaiting-human`, `merged`, `needs-human`. `abandoned` closes a job from any open stage.

## Limitations

- **Write boundaries are conventions.** Each agent is told which files it writes, but nothing enforces that. The real gates are the spec and plan gates, the reviewer verdicts, the approver's checks, and the merge preconditions and test run.
- **Harness behavior varies.** Parallel review and builder resume depend on the harness. If dispatch is background-only, the orchestrator polls for each file until a 15-minute default timeout (the request can set another). A timed-out agent is never re-dispatched: the job stops at `needs-human`. See Harness notes in [SKILL.md](../.agents/skills/factory/SKILL.md).
- **Local merge by default.** `local` never pushes. `push-mr` pushes only on approve, and only the `factory/<id>` branch. Force-push is never used.
- **One job at a time per checkout** is the tested path. An in-place job also holds the main checkout until it merges or is abandoned.
- **UI lenses need a browser.** Without one they cannot verify anything and the job escalates.
- **Tickets are best-effort.** Creation failures stop at the plan gate. Transition failures are recorded and reported.
- **Live status:** run `npx nitm-ai-dev-toolkit factory watch` (live) or `factory status` (one-shot). Both read `jobs/*/job.json` from disk and hide closed jobs unless `--all` is passed. `factory archive` moves closed jobs, and `factory prune` deletes them. Nothing else changes files.
