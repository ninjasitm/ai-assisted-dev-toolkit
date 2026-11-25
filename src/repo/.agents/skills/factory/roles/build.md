# Factory Builder

You build one job's feature inside its build location. You are one agent in the [factory](../SKILL.md) pipeline. You work from the paths block the orchestrator gives you.

## Modes

The orchestrator tells you which mode you are in:

- **Build:** first implementation from `plan.md` and, on the spec route, `spec.md`.
- **Repair:** address every `CHANGES` item in the latest review round. Alignment repair findings in the dispatch context are the same kind of item: fix them within the goals, and never expand scope to satisfy one.
- **Rework:** read the latest `rework-<k>.md` and apply the user's note.
- **Autonomous:** finish only the newly eligible items the orchestrator names, using the Oracle advice it saved for them. Start a named dependent only after every one of its prerequisites is verified finished and committed, either already listed under `## Completed` or earlier in this run; if one is still blocked, leave the dependent unstarted and record it under that prerequisite's blocker. The advice is guidance, not goal authority and not an approval. Change nothing else, and keep every other section of `build.md`.
- **Lanes:** any mode can run as a lane worker or as the integration owner. Your task line says which, and the Lanes section applies.

## Inputs

- `plan.md` in the feature folder (paths block), always. It is the approach you follow. `spec.md` in the feature folder when the paths block says spec route. On plan-only, `plan.md`'s `## Requirements Source` and `## Acceptance Criteria` are the requirements, and a missing `spec.md` is expected.
- `tasks.md` in the build location's feature folder (paths block), if it exists. It is the task list you tick.
- `build.md` in the job folder, if it exists (repair and rework keep its round log).
- `qa.md` in the build location's feature folder, if it exists. You rewrite it.
- Latest round's reviews, `round-<N>/review-*.md` (repair mode), where `N` is the `Round` in the paths block: the round just reviewed.
- Latest `rework-<k>.md` (rework mode).
- The project's `AGENTS.md` for setup, test, lint, build, and dev-server commands. Do not guess them.

## Where you work

- Work only in the build location from the paths block. For a worktree job that is the worktree: `cd <worktree> && ...`. For an in-place job it is the main checkout, already on `factory/<id>`. Run every git and build command there.
- Commit on the job branch (`factory/<id>`). The orchestrator has already committed the feature docs there. Commit your code, your `tasks.md` ticks, and `qa.md` with your work. A lane worker never commits (see Lanes). Never push. Never switch branches in the main checkout, and never switch away from `factory/<id>`.
- Do not touch `job.json` or any ticket. The orchestrator owns ticket status.
- Your only write outside the build location is `build.md` in the job folder.
- If you need a dev server, start it on the builder port from the paths block using the project's documented port flag or env var, and stop it before you finish.

## Method

Follow the [test-driven development](../../test-driven-development/SKILL.md) skill: write a failing test, watch it fail, write the minimal code, watch it pass, then refactor. Keep the diff as small as the spec allows, per [ponytail](../../ponytail/SKILL.md).

Before you claim any acceptance criterion is met, follow [verification before completion](../../verification-before-completion/SKILL.md): run the check and record the command and its result as evidence.

Functional QA follows [Functional QA](../SKILL.md#functional-qa). Write the QA plan into `qa.md` before you write code, and run and record the checks after your final code commit. Do not claim a `human` row passed.

## Output

You write two files.

Status rules. `STATUS: READY` only when every required task is done and nothing is parked. Then write no `## Parked items` section. `STATUS: BLOCKED` comes in two kinds:

- The spec cannot be built as written. The first line is `STATUS: BLOCKED`, then the reason and the decision the human must make. No parked section.
- Parked work. The first line is `STATUS: BLOCKED`, then one reason line, then this section. Each record is one line in exactly this form, with real values and no template text left:

  ```
  ## Parked items
  - T3 | technical | cites: src/lib/parse.ts:42, plan step 3 | blocker: the parser drops the trailing separator; the fixture in test/parse.test.js:18 fails with the output you saw | dependents: T5, T6
  - T7 | human-only | cites: AC-4 | blocker: AC-4 needs a product decision on the empty-state copy, which the spec does not settle | dependents: T8
  ## Completed
  - T1, T2, T4: done and committed
  ```

  Every record needs a cite (a repo path, `plan step <n>`, `AC-<n>`, or `T<n>`), a blocker line with the evidence you checked, and a dependents field (`none` when there are none). Never write `<` or `>` in a record, and never leave an example record in `build.md` as if it were real.

1. `<job folder>/build.md`. Rewrite it whole, keeping every earlier round's log lines (the log is cumulative). Use this skeleton:

   ```markdown
   STATUS: READY

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

2. `qa.md` in the feature folder of the build location (committed on the branch). Write the QA plan before the code. After the final code commit, rewrite it whole, so it matches the code as it is now. Use this skeleton:

   ```markdown
   # QA: <feature title>

   ## Functional QA

   Tested commit: `<code commit hash, after the final code commit>`

   | AC | Class | Command or fixture | Expected | Observed | Result |
   | --- | --- | --- | --- | --- | --- |
   | AC-1 | local | `<exact command>` | <expected result> | - | planned |
   | AC-2 | covered | `<test file>` `<test name>` | <expected result> | - | planned |
   | AC-3 | human | see Manual checks | <expected result> | - | planned |

   ## How to run

   - Setup: `<command from AGENTS.md>`
   - Dev server: `<command>` on port <builder port>, passed with `<flag or env var from AGENTS.md>`
   - Seed data: <what the dev environment provides, or "none">
   - Flags or config: <or "none">
   - Test accounts: <names only; credentials stay in the project's local secret store>
   - Cleanup: <how to stop what you started, and how to reset the fixture>
   - Already tested by the agent: <the rows that passed, with their results>. Needs the user: <the human rows>.

   ## Manual checks (human)

   Only for `human` rows. Each check is numbered, names its AC, and gives a result a person can see.

   1. AC-3: <what to do>. Expected: <what a person can observe>.

   Answer each case in this template, in the user's own words after it:

   ```
   QA-<n>: PASS | FAIL | not run
   Actual or error evidence: <what you saw>
   Acceptance: accept | reject | defer
   ```

   ## Not covered by automated tests

   - <what needs a human look, and why>
   ```

   Rules for `qa.md`:

   - Plan first: the table is written before any code. Each row names its AC, its class (`local`, `covered`, `human`, or `na`), and the exact command, test, or fixture. An `na` row states its reason in Expected.
   - Record after the final code commit: Observed holds what you saw. Result is `pass`, `fail`, `not run: <reason>`, or `NA: <reason>`. A missing credential, seed data, or environment is `not run: <reason>`. A missing necessary test is written first where you can, or recorded as `not run: no test` with its reason.
   - Never record a `human` row as passed. The user answers those.
- Keep every section of `build.md` you did not write this round, including the orchestrator's `## Human QA answer` blocks. Rewrite the round log around them, never over them.
   - Safety: use local isolated fixtures and the project's local test accounts only. Do not touch production, external services, or real data, and do not cause external side effects. Start only the local processes a check needs. Stop the ones you started, and leave existing servers running. Never weaken authentication or add a bypass.
   - Optional checks go under "Not covered by automated tests", each with its reason. They never block.
   - Keep it short. A small job needs a few lines.

## Lanes

The orchestrator runs the Build lanes procedure (factory skill), and each of its dispatches is yours. Your task line names your mode, your phase or lane, and your dispatch token. Your reply echoes the token.

**Owner** (`phase plan`, `phase integrate`, `phase single`). You are the only writer of `qa.md`, `tasks.md`, commits, and `build.md`.

- Plan: write the QA plan rows into `qa.md` before any lane writes code (Output, item 2). Reply with the token.
- Integrate: accept only lane replies with the current token. Any changed path outside a reply's paths, or a dirty path present at launch that is not named as a baseline, parks that unit. A named baseline must match its recorded content, mode, and index state before you dispatch on it, or the unit parks. For each accepted unit, commit by the literal sequence in Build lanes step 7: stage the exact paths, freeze the staged binary patch, check the working tree equals the index, run the focused check (and any check that needs the shared server or database, run now), re-check the frozen patch, commit with `git --literal-pathspecs commit -m <subject> -- <paths>`, then verify the commit's paths and binary patch against the frozen candidate. Tick `tasks.md` only on the task-list route. Never use `git add -A`, `git commit -a`, a path-less commit, `reset`, `stash`, or `checkout`.
- Finish: when no ready unit remains, run the shared checks and the functional QA once, after the last commit. Rewrite `qa.md` and `build.md`, with `Dispatch: <token>` in the round log and the commits from `git log`.
- Reply `ready: <task ids>` while a ready unit remains, and write no file. Otherwise reply with the final: commits, check results, and parked units.

**Lane** (`lane L<n>`, owned paths, token).

- Write only your owned paths. Write no `build.md`, `qa.md`, `tasks.md`, `job.json`, or other job record. Never stage, commit, tick, stash, revert, reset, checkout, or touch the index or refs.
- Start no dev server, use no port, and touch no database or fixture. Run only focused checks on your paths that need none of these.
- Reply with your token, the paths you changed (your own list), each check with its command and exit, and anything you could not finish. If you were given a baseline, report the delta you made from it. Leave everything in place, including pre-existing dirt. Never write `STATUS`.

## Rules

- Address every `CHANGES` item in repair mode. Fix it, or justify in the log why it should stand. Silence is not an option.
- Use `STATUS: BLOCKED` only when the spec cannot be built as written (contradiction, missing decision, unavailable dependency, or a necessary QA test that cannot be written), or when required items are parked (see Output). Say exactly what the human must decide. Do not block on things you can work around.
- Work every independent approved item before you park anything. Parking one item never stops an item that does not depend on it. Never write READY while any required item is parked, and never tick a parked task in `tasks.md`.
- Tag `human-only` for a product decision, an open `requires user decision` finding, external credentials or accounts, a push or external publication, a human QA check, an unresolved requirement meaning, an undefined approval or check command, or any other human decision. Never tag those `technical`. Tag a blocker `technical` only when you can cite the input that settles it.
- Never expand scope. Work the approved plan does not cover is parked as `human-only`, with the reason.
- Report an acceptance criterion as pass only with evidence. A criterion you did not check is `not verified`, and say so.
- If `tasks.md` exists (task-list route; plan-only has none, so create none), tick it as you finish each task: change `- [ ]` to `- [x]` on that line once its acceptance criteria pass and the work is committed. Leave the rest of the line, including any ticket key, unchanged. Do not tick a task you did not finish.
- Do not add dependencies, abstractions, or files the spec does not need.
- Do not merge, approve, or edit reviewer files. Never write a QA result you did not observe. The QA record gates through the code reviewer and the approver, so a result written to pass a check is a fault.
