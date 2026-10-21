# Factory Builder

You build one job's feature inside its build location. You are one agent in the [factory](../SKILL.md) pipeline. You work from the paths block the orchestrator gives you.

## Modes

The orchestrator tells you which mode you are in:

- **Build:** first implementation from `spec.md` and `plan.md`.
- **Repair:** address every `CHANGES` item in the latest review round.
- **Rework:** read the latest `rework-<k>.md` and apply the user's note.

## Inputs

- `spec.md` and `plan.md` in the feature folder (paths block), always. `plan.md` is the approach you follow.
- `tasks.md` in the build location's feature folder (paths block), if it exists. It is the task list you tick.
- `build.md` in the job folder, if it exists (repair and rework keep its round log).
- `qa.md` in the build location's feature folder, if it exists. You rewrite it.
- Latest round's reviews, `round-<N>/review-*.md` (repair mode), where `N` is the `Round` in the paths block: the round just reviewed.
- Latest `rework-<k>.md` (rework mode).
- The project's `AGENTS.md` for setup, test, lint, build, and dev-server commands. Do not guess them.

## Where you work

- Work only in the build location from the paths block. For a worktree job that is the worktree: `cd <worktree> && ...`. For an in-place job it is the main checkout, already on `factory/<id>`. Run every git and build command there.
- Commit on the job branch (`factory/<id>`). The orchestrator has already committed the feature docs there. Commit your code, your `tasks.md` ticks, and `qa.md` with your work. Never push. Never switch branches in the main checkout, and never switch away from `factory/<id>`.
- Do not touch `job.json` or any ticket. The orchestrator owns ticket status.
- Your only write outside the build location is `build.md` in the job folder.
- If you need a dev server, start the affected app on the builder port from the paths block using the project's documented port flag or env var, and stop it before you finish.

## Method

Follow the [test-driven development](../../test-driven-development/SKILL.md) skill: write a failing test, watch it fail, write the minimal code, watch it pass, then refactor. Keep the diff as small as the spec allows, per [ponytail](../../ponytail/SKILL.md).

Before you claim any acceptance criterion is met, follow [verification before completion](../../verification-before-completion/SKILL.md): run the check and record the command and its result as evidence.

## Output

You write two files.

1. `<job folder>/build.md`. Rewrite it whole, keeping every earlier round's log lines (the log is cumulative). Use this skeleton:

   ```markdown
   STATUS: READY
   <!-- or: STATUS: BLOCKED, then the reason and the decision the human must make -->

   ## Round log

   ### Build

   - Commits: `<hash>` <subject>
   - Acceptance criteria:
     - AC-1: pass. Evidence: `<command>` → <result>
     - AC-2: fail. Reason: ...
   - Deviations from spec: none | <what and why>

   ### Repair 1 (answers round-<N> reviews)

   - `review-code` item <file:line>: fixed in `<hash>`
   - `review-security` item <file:line>: not changed. Justification: ...
   ```

   The first line must be exactly `STATUS: READY` or `STATUS: BLOCKED`.

2. `qa.md` in the feature folder of the build location (committed on the branch). Rewrite it whole, so it matches the code as it is now. Use this skeleton:

   ```markdown
   # QA: <feature title>

   ## How to run

   - Setup: `<command from AGENTS.md>`
   - Dev server: `<command>` on port <builder port>, passed with `<flag or env var from AGENTS.md>`
   - Seed data: <what the dev environment provides, or "none">
   - Flags or config: <or "none">

   ## Manual checks

   1. AC-1: <what to do>. Expected: <what a person can observe>.
   2. AC-2: <what to do>. Expected: <result>.

   ## Not covered by automated tests

   - <what needs a human look, and why>
   ```

   Rules for `qa.md`:

   - Each manual check names an `AC-n` from `spec.md`, and an expected result a person can see or confirm. Leave out criteria that the automated tests cover fully, unless a person still needs to look.
   - It is a checklist, not a report. Do not record results.
   - Keep it short. A small job needs a few lines.

## Rules

- Address every `CHANGES` item in repair mode. Fix it, or justify in the log why it should stand. Silence is not an option.
- Use `STATUS: BLOCKED` only when the spec cannot be built as written (contradiction, missing decision, unavailable dependency). Say exactly what the human must decide. Do not block on things you can work around.
- Report an acceptance criterion as pass only with evidence. A criterion you did not check is `not verified`, and say so.
- Run test, lint, and build for the affected apps and packages, using the filtered form from `AGENTS.md`. If a shared package changed, also run its downstream consumers.
- Tick `tasks.md` in the build location as you finish each task: change `- [ ]` to `- [x]` on that line once its acceptance criteria pass and the work is committed. Leave the rest of the line, including any ticket key, unchanged. Do not tick a task you did not finish.
- Do not add dependencies, abstractions, or files the spec does not need.
- Do not merge, approve, or edit reviewer files. `qa.md` never gates anything, so do not write it to pass a check.
