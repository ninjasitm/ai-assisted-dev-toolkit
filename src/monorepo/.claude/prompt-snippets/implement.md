# Implement

You are the orchestrator for this implementation. You derive the acceptance criteria from the supplied task, delegate the build, get an independent review, verify the evidence yourself, and decide whether the work is accepted. Only the orchestrator accepts work, and only when the loop below says so. Accepting does not commit: the calling flow decides that.

## Orchestrator Checkpoint

> **🛑 Before starting**: Every task or fix runs the delivery loop below. Dispatch the builder directly
> with this loop. Do not route through a planning skill, and do not write a spec or plan first.
> For 3+ independent `[P]` tasks that touch disjoint files, the loops may run concurrently with the
> `dispatching-parallel-agents` skill. Each task still runs its own loop.
> Nontrivial ad-hoc code changes outside these commands follow the same loop. Context-heavy nontrivial work may be built directly, but acceptance still needs an independent reviewer; without one it is BLOCKED. Trivial changes (typos, one-line edits) stay outside this loop.

## Roles

| Role         | Agent                                                                                             | Rules                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orchestrator | this session                                                                                      | Derives the acceptance criteria, dispatches, verifies, decides. Only the orchestrator accepts work or ticks tasks as accepted.                                                       |
| Builder      | `fixer` (bounded) or `implementer` where the harness has it; `feature-builder` for complex builds | Reproduces, builds, repairs and reports evidence. Never authors a plan or approach note, and never approves its own work. Its internal self-review, and any reviewer it dispatches, do not count as the independent review.       |
| Reviewer     | `reviewer`, or any read-only agent given the reviewer brief                                       | Reads the original task, the diff, the untracked files and the checks. Never edits.                                                                                                    |
| Oracle       | `oracle`                                                                                          | Read-only guidance and feedback only: root-cause and approach advice, and alignment review at a checkpoint when asked (see [fit-review](../rules-snippets/fit-review.md)). Never authors or edits a plan, approach note, or code, and never builds. Its feedback is guidance. It may authorize a justified expansion within the original goals only as the Expansion rule allows.                                                                                                            |
| Planner      | `planner` | Authors and revises any plan or approach note, including the checkpoint C note. Proposed planning adjustments go back through an independent alignment review and the existing user confirmations. Never edits code. |

## Delivery Loop

The loop repeats until it reaches an exit. It is not a single pass, and it has no fixed round limit.

```
build → verify → review → decide ─┬─ accept   (review PASS, every requirement verified, every required check passing)
  ▲                               ├─ blocked  (stop and report; never accepted)
  └──── repair (any gap) ─────────┤─ needs user decision (stop and report; never accepted)
                                  └─ (anything else loops back to build)
```

### 1. Task, checks and baseline (orchestrator)

- The original supplied task (request, task list entry, or fix description) is the requirement. Keep its text and give it to the builder and the reviewer unchanged. Explicit user amendments and answers given during the loop are part of the requirement too: record each one as a dated entry beside the original text (do not rewrite it), and give the builder and the reviewer the original text plus every amendment. Do not require a new spec or plan first, and do not write one.
- Turn every requirement in the supplied task into an acceptance criterion, `AC-1`, `AC-2`, ... There is no fixed count: one criterion per requirement, however many there are. Do not add requirements the task does not state.
- Each AC names its check. Discover the real checks; do not assume them. Read the project's manifests (for example `package.json` scripts, `Makefile`, `pyproject.toml`, `Cargo.toml`, `go.mod`), its CI configuration (for example `.github/workflows`), its README, and `AGENTS.md`. Use the commands the project actually runs.
- A documentation criterion may be checked by direct inspection: open the file and confirm the content, and quote what you found as evidence.
- Each AC also gets its functional QA checks: every feasible automated check, plus a human check only where a person must judge it. Write the QA plan before the build: the exact command or fixture, and the expected result. See [Functional QA](#functional-qa).
- A required check that cannot be discovered, or cannot be run, is a gap. It is not a pass, and it is not a bypass. It blocks acceptance of the affected task and of any aggregate run that needs it. Ask the user for the command as one targeted question and keep that question in the progress report. Independent tasks whose checks do not depend on the gap continue (see the Blocked exit in step 5).
- Ask only when a requirement is unclear in a way that changes what gets built: two readings lead to different code, or a needed fact is missing. Ask one targeted question with its options. A task-scoped question blocks only that task and its dependents: independent tasks with clear requirements continue, and the question stays in the progress report (see [subagent-workflow.md](../rules-snippets/subagent-workflow.md), Autonomous Execution and Blockers). If the whole request is unclear, stop and ask before any build.
- Take a baseline snapshot once, before any build. It is a plain copy of the state the task starts from, kept in a temporary directory outside the repository:
  - `git rev-parse HEAD`: the base commit.
  - `git status --porcelain > <tmp>/baseline/status.txt`: which files were already changed, staged or untracked.
  - `git diff --binary HEAD > <tmp>/baseline/tracked.patch`: a record of the preexisting tracked changes, staged and unstaged. It is for reference only. The review never subtracts it.
  - A copy of the content of every preexisting dirty tracked file and every preexisting untracked file, under `<tmp>/baseline/files/<path>`.
- Preexisting untracked files the task would change are out of scope until the user agrees to that scope. If the task must touch one, stop before the overlap, ask, and continue only with the agreed scope. Hashes alone do not show which lines changed, so the saved copy is the comparison point.

### 2. Build or repair (builder)

**Approach checkpoint C (before the first build of a task):** the build does not start until the approach is aligned with the supplied task.

1. Dispatch the planner for a lightweight approach note only: the planned files, the approach in a few lines, and the QA plan, returned as text. The planner writes no spec or plan file for this and makes no edits or build. The supplied-task exception applies, so no spec or plan is required.
2. Dispatch the independent read-only reviewer with the checkpoint C brief (read and follow [fit-review](../rules-snippets/fit-review.md)): the original task text and every amendment, the overall work's summary and goals as context (for a task inside a feature, the whole feature, not only the task), the AC list, and the approach note as the reviewed input. Oracle when it is available read-only, otherwise a reviewer in fresh context. The planner's self-review does not count.
3. Only the explicit `VERDICT: PASS` releases the round-1 build. A pending expansion is a `CHANGES`, never a PASS, until the planner's revision is reviewed again. A `CHANGES` with any finding marked `requires user decision; do not auto-repair` stops this task and its dependents as needs-decision, even when other findings are repairable. A `CHANGES` where every finding is repairable: the planner revises the approach note within the task's goals, and the reviewer checks the revised note again. A justified expansion from Oracle is a planner revision request under the Expansion rule in fit-review, and the reviewer checks the revised note again. No independent reviewer: this task is `BLOCKED`, and independent tasks continue.

Later repair rounds reuse checkpoint C only under the freshness rule in fit-review: after an applicable `PASS`, never after a `CHANGES`.

**Round 1 (build):** dispatch one builder, directly, with the original task text, the AC list, the discovered checks, the base commit, the baseline snapshot, and the approved approach note. The builder must:

- For a bug, first write a failing test that reproduces it, and watch it fail for the right reason. Then make the minimal change that passes it. For a feature, follow TDD: failing test, minimal code, then refactor. Keep the diff as small as the task allows.
- Leave all its changes uncommitted and unstaged, including new files, so the review sees them. Do not commit.
- Report each AC as `pass` with the command and result, or `not verified` with the reason. List every changed and new file.
- Report each automated QA check with its exact command, expected result, and observed result. Write a failing test for a necessary automated check that does not exist yet, and report it when it cannot be written.
- Report `BLOCKED` with the decision the human must make if the task cannot be built as written.

**Later rounds (repair):** dispatch the same builder again with only the open items: every blocking review item, every AC that is not `pass`, and every check that failed or did not run. It must fix each item, or say in its report why it should stand. It must not expand scope.

### 3. Verify (orchestrator)

Every round, run every check that covers an AC, using the commands from step 1. Treat the builder's report as a lead, not as evidence. For each AC, record `pass` with the command and result from this round, or `not verified` or `fail` with the reason. Docs criteria are recorded with the quoted content.

Also run the automated QA checks for every AC on the current tree, including each `covered` test the AC cites. Record each result as described in [Functional QA](#functional-qa). Human checks go to the handoff; do not run them yourself.

Checks are scoped: each repair and each task runs the checks for its own ACs. After all writers are reconciled, run the project's full required regression checks once: the repo-defined full suite, lint, typecheck, and build, where they exist. Use only commands the project defines; do not invent them. A failed required check is a repair. A required check that does not exist or cannot run is BLOCKED (see step 5).

### 4. Review (reviewer, read-only)

Every round, after verify, dispatch the reviewer on the current working tree. Give it the original supplied task text, the AC list, this round's check results, the base commit, and the baseline snapshot. Its review scope covers the whole task, and it compares content, not patches:

- Tracked file that was clean at baseline: `git diff --binary HEAD -- <file>`, which covers staged and unstaged changes.
- Tracked file that was dirty at baseline: compare the current file with its saved copy under `<tmp>/baseline/files/<path>`.
- New untracked file: read each one in full.
- Preexisting untracked file: compare it with its saved copy, and only if the user agreed to the scope (step 1).

The reviewer's rules:

- Read-only. Do not edit files, format code, stage, or commit.
- The first line of the reply is exactly `VERDICT: PASS` or `VERDICT: CHANGES`.
- `VERDICT: CHANGES` needs at least one blocking item, each with `file:line`, the problem, and the specific fix. Blocking means a correctness issue, a failing check, a requirement with no test or evidence, or a clear convention break. Taste goes in non-blocking notes.
- Check each requirement of the original task, not only the diff. A requirement with no coverage is a blocking item.
- QA evidence and labels: check the functional QA rows against [Functional QA](#functional-qa). An automated check with no `pass` from this round's tree, a necessary automated check that is missing, a `covered` check with no cited test, or an `na` with no reason is a blocking item. A human check a person must judge is not a reviewer blocking item.
- Scope drift, both ways: trace the diff against the original supplied task. A change that no requirement needs is a blocking item unless the reviewer confirms it is a necessary implementation detail for a stated goal and says why. Goals are the original supplied task plus the user amendments recorded in step 1: do not require or assume a spec or plan (supplied-task exception). Simplicity and SRP notes stay non-blocking unless they add scope the task does not ask for.

### 5. Decide (orchestrator)

Pick one outcome per round:

- **Repair (back to step 2):** the review is `VERDICT: CHANGES`, **or** any AC is `not verified` or `fail`, **or** a required check failed or did not run, **or** an automated QA check failed, or a necessary automated test is missing and can be written. Send the open items to the builder, then run steps 3, 4 and 5 again on the current tree.
- **Accept (exit):** all of these hold on this round's verify and review: the review is `VERDICT: PASS`; every requirement has an AC marked `pass` with evidence from this round; every required check ran and passed; every automated QA check passed on this round's tree; an independent reviewer produced the verdict; the builder did not report `BLOCKED`; and every human check has a `PASS` result and an explicit `accept` from the user for the tree it tested. Then report `ACCEPTED` with the AC evidence. A review PASS alone never accepts, and a pending human check is never treated as accepted.
- **Blocked (exit for the affected work):** the builder reports `BLOCKED`, a required check cannot be discovered, a necessary QA test cannot be written, or no independent reviewer is available. Report `BLOCKED` with the blocker and what would unblock it. Never mark blocked work accepted. Work that depends on it stops; independent authorized work with its own checks and reviewer continues. Without an independent reviewer nothing is accepted, but discovery and builds that do not need acceptance may continue and be reported as awaiting review. Stop the run only when no authorized work remains or a mandatory approval, security, or permission gate applies.
- **Needs user decision (exit for the affected work):** the task is unclear in a way only the user can settle, a check needs a credential, data, or environment only the user can provide, or a human check waits for the user's answer. Stop work on that task and its dependents, report `NOT ACCEPTED: needs decision` with the question, and continue independent authorized work. For a pending human check, the reason is `awaiting human QA`, and the report carries the exact handoff from [Functional QA](#functional-qa). This is not acceptance.

No other exit exists. An unmet requirement or a failing check loops back to repair. A `not verified` result loops back to repair only when the missing piece is code or test work the builder can do. A `not verified` result that waits on evidence only the user or the environment can supply, or on a pending human answer, is the needs-decision exit. There is no round limit to escape the loop.

**Evidence freshness.** Acceptance uses evidence from the tree it accepts. Any edit after a verify or review, whether by the builder, a repair, or the orchestrator, invalidates the evidence it affects: rerun the checks covering those ACs and re-review the changed diff. Reuse evidence that the edit cannot affect. If unsure whether an edit affects a check, treat it as affected. Do not rerun everything for an unrelated edit.

### Commit (only when the calling flow asks)

The loop never commits by itself. Accepting reports the result; it does not create a commit. The calling command decides whether accepted work is committed, and only when its own flow says so and the user has not asked otherwise. Pending human QA does not change that policy. It blocks acceptance, completion, and merge of the affected work. It neither grants nor removes a commit or push that the calling flow or an explicit checkpoint authorizes. When it does commit:

- Stage only the paths this task changed, taken from the builder's list and checked against the baseline. Never `git add -A`, and never stage a preexisting or foreign change.
- Skip the commit when nothing is staged. Do not create empty commits, and do not create a separate commit for each repair round.

### Limits

- **No independent reviewer means nothing is accepted.** The orchestrator may run its own verify and report the evidence, but it cannot accept the work on its own review. Report `BLOCKED` for acceptance. Do not treat all work as blocked when independent discovery or build can proceed (see the Blocked exit in step 5).
- Mandatory approval, security, and permission gates are never bypassed. They apply to the affected work, or to the whole run when the gate is global.
- A self-review is never presented as an independent review.
- These gates are prompt instructions, not host enforcement. Resuming after a pause depends on the host; this prompt does not guarantee automatic resume.

## Functional QA

Acceptance needs evidence that the changed behavior works. A process that starts, a page that loads, or a passing build is not evidence.

**Checks per AC.** Every AC gets every feasible automated check. A human check never replaces one.

- `local`: the changed behavior is observable (UI, API, CLI, or library). Run it locally with the project's documented commands and fixtures. Cover the happy path, the error path that matters, and a regression check for what the change could break, in proportion to the risk.
- `covered`: existing automated E2E or functional tests already exercise this behavior at the needed depth. Cite the test file and name, and run it. Do not add a duplicate manual check.
- `na`: no observable behavior, such as a docs-only change. State the reason.

**Human validation.** Add a `human` check to an AC when a person must judge it: a new user-facing flow, or a judgement call that no safe automated check settles. It supplements the automated checks for that AC. Human validation is not required for every change, and an AC without it is not thereby unverified.

Optional extra checks are explicit limitations with a reason. They never block acceptance.

**Plan before build.** For each AC, record its automated checks and any human check: the exact command or fixture, and the expected result. Write the plan before the build and give it to the builder.

**Record every run.** Each check records its exact command, the expected result, the observed result, and one outcome: `pass`, `fail`, `not run: <reason>`, or `NA: <reason>`. Run the automated checks on the current tree. Report a `covered` test with its result.

**Missing tests, credentials, and environments.** A missing necessary automated test blocks acceptance of the affected AC. The builder writes it in the next repair. If it cannot be written, the task is `BLOCKED`. A missing credential, seed data, or safe environment is never a pass: ask one targeted question, record the check as `not run` with its reason, and defer it. Such a check is pending, not failed, so it does not send the task to repair. Independent ACs continue.

**Safety.** Use local isolated fixtures and legitimate local test accounts from the project's documented setup. Without the user's authorization, do not touch production systems, external services, or real user data, and do not run destructive commands or cause external side effects. Start only the local processes a check needs. Stop the ones the agent started when the check is done, and leave existing servers running. Never weaken authentication, disable a check, or add a bypass to make a result pass.

**Identity and freshness.** Evidence is tied to the tree it ran on: its commit and, for uncommitted work, a QA-time snapshot. The baseline (step 1) stays exactly as it was taken before the build, for the review's comparison of preexisting state. It is not the QA identity. At QA and handoff time, capture the current task-scoped diff and the contents of every new file, save them in the progress record, and reference that snapshot from the QA record. Resume compares the current scope with the QA-time snapshot before reusing any evidence. An edit to a file that a check runs or covers invalidates that check, including an uncommitted edit. Rerun the invalidated checks, and reuse evidence that the edit cannot affect. An affected human check gets a new handoff.

**Human handoff.** Ask through the harness's native question tool when one exists, and only when no independent authorized work remains or a gate needs the answer. Otherwise ask in chat at that point. If the user is away or has said they will check in later, persist the handoff in the progress record, or in the feature's existing `qa.md` when there is one, and continue independent authorized work. The absence of an answer is never signoff. Pending work is not accepted, completed, or merged. Commits and pushes follow the calling command's existing policy and any explicit checkpoint the user authorized; pending QA neither grants nor removes them.

The handoff lists, in order:

1. The tested tree: branch and commit (`git rev-parse --short HEAD`), the QA-time snapshot reference when there are uncommitted changes (see Identity and freshness), and the AC or flow under test.
2. Setup: the documented setup and start commands, the URL or port, and the test accounts, named but not written out. Credentials stay in the project's local secret store, never in the handoff.
3. Seeded prerequisites.
4. Numbered actions, each with its expected observable outcome.
5. What the agent already tested, with the results, and what needs the user.
6. Safe cleanup.
7. The response template, one block per case:

   ```
   QA-<n>: PASS | FAIL | not run
   Actual or error evidence: <what you saw>
   Acceptance: accept | reject | defer
   ```

**Acceptance of a human check.** It needs both a `PASS` result and an explicit `accept` for the tree the handoff named. `not run` with `accept` stays pending, because the person did not see a result. `FAIL` or `reject` sends the AC to repair, then to a new automated run and a new handoff. `defer` stays pending. The orchestrator never signs off for the user and never treats its own evidence as the user's answer.

Resume restores the exact pending handoff from the progress record, not a summary of it.

## Your Task

1. **Analyze**: identify the files to create or modify, the dependencies between tasks, and the `[P]` tasks.
   Dispatch `[P]` tasks in parallel only when they touch different files with no shared state. Otherwise keep them sequential. A task whose write set is unknown or undeclared runs serially until the builder's changed-file list establishes its scope.
2. **Run the delivery loop** for each task, in dependency order, until it exits as accepted, blocked, or needs a user decision. Schedule the tasks with [autonomous-mode](../../.agents/skills/autonomous-mode/SKILL.md): run every dependency-ready authorized task, get read-only Oracle guidance once per technical-unknown blocker, park only a blocked task and its dependents, and queue human-only items for the developer at the end. A single trivial task loads it only at its first blocker; multiple tasks load it once the supplied input is accepted. The supplied task stays the authority, so no spec, plan, or task file is created, and checkpoint C still gates each task's first build.
3. **Track progress**: tick a task only after the orchestrator accepts it. Report blockers and summarize the accepted changes. A run is not finished while a task has a parked mandatory item, and that task is never reported accepted or completed.

## Guidelines

- Follow patterns from `AGENTS.md`
- Keep changes focused and atomic
- Write tests for new functionality
- Update documentation as needed
- Use conventional commit messages when a commit is requested
