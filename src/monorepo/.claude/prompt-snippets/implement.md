# Implement

You are the orchestrator for this implementation. You derive the acceptance criteria from the supplied task, delegate the build, get an independent review, verify the evidence yourself, and decide whether the work is accepted. Only the orchestrator accepts work, and only when the loop below says so. Accepting does not commit: the calling flow decides that.

## Orchestrator Checkpoint

> **🛑 Before starting**: Every task or fix runs the delivery loop below. Dispatch the builder directly
> with this loop. Do not route through a planning skill, and do not write a spec or plan first.
> For 3+ independent `[P]` tasks that touch disjoint files, the loops may run concurrently with the
> `dispatching-parallel-agents` skill. Each task still runs its own loop.

## Roles

| Role         | Agent                                                                                             | Rules                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orchestrator | this session                                                                                      | Derives the acceptance criteria, dispatches, verifies, decides. Only the orchestrator accepts work or ticks tasks as accepted.                                                       |
| Builder      | `fixer` (bounded) or `implementer` where the harness has it; `feature-builder` for complex builds | Reproduces, builds, repairs and reports evidence. Never approves its own work. Its internal self-review, and any reviewer it dispatches, do not count as the independent review.       |
| Reviewer     | `reviewer`, or any read-only agent given the reviewer brief                                       | Reads the original task, the diff, the untracked files and the checks. Never edits.                                                                                                    |
| Oracle       | `oracle`                                                                                          | Advises on approach or root cause before a build. Does not build or review.                                                                                                            |

## Delivery Loop

The loop repeats until it reaches an exit. It is not a single pass, and it has no fixed round limit.

```
build → verify → review → decide ─┬─ accept   (review PASS, every requirement verified, every required check passing)
  ▲                               ├─ blocked  (stop and report; never accepted)
  └──── repair (any gap) ─────────┤─ needs user decision (stop and report; never accepted)
                                  └─ (anything else loops back to build)
```

### 1. Task, checks and baseline (orchestrator)

- The original supplied task (request, task list entry, or fix description) is the requirement. Keep its text and give it to the builder and the reviewer unchanged. Do not require a new spec or plan first, and do not write one.
- Turn every requirement in the supplied task into an acceptance criterion, `AC-1`, `AC-2`, ... There is no fixed count: one criterion per requirement, however many there are. Do not add requirements the task does not state.
- Each AC names its check. Discover the real checks; do not assume them. Read the project's manifests (for example `package.json` scripts, `Makefile`, `pyproject.toml`, `Cargo.toml`, `go.mod`), its CI configuration (for example `.github/workflows`), its README, and `AGENTS.md`. Use the commands the project actually runs.
- A documentation criterion may be checked by direct inspection: open the file and confirm the content, and quote what you found as evidence.
- A required check that cannot be discovered, or cannot be run, is a gap. It is not a pass, and it is not a bypass. Stop and ask the user for the command (see the Blocked exit in step 5).
- Ask only when the task is unclear in a way that changes what gets built: two readings lead to different code, or a needed fact is missing. Ask one targeted question, offering the options, and wait.
- Take a baseline snapshot once, before any build. It is a plain copy of the state the task starts from, kept in a temporary directory outside the repository:
  - `git rev-parse HEAD`: the base commit.
  - `git status --porcelain > <tmp>/baseline/status.txt`: which files were already changed, staged or untracked.
  - `git diff --binary HEAD > <tmp>/baseline/tracked.patch`: a record of the preexisting tracked changes, staged and unstaged. It is for reference only. The review never subtracts it.
  - A copy of the content of every preexisting dirty tracked file and every preexisting untracked file, under `<tmp>/baseline/files/<path>`.
- Preexisting untracked files the task would change are out of scope until the user agrees to that scope. If the task must touch one, stop before the overlap, ask, and continue only with the agreed scope. Hashes alone do not show which lines changed, so the saved copy is the comparison point.

### 2. Build or repair (builder)

**Round 1 (build):** dispatch one builder, directly, with the original task text, the AC list, the discovered checks, the base commit, and the baseline snapshot. The builder must:

- For a bug, first write a failing test that reproduces it, and watch it fail for the right reason. Then make the minimal change that passes it. For a feature, follow TDD: failing test, minimal code, then refactor. Keep the diff as small as the task allows.
- Leave all its changes uncommitted and unstaged, including new files, so the review sees them. Do not commit.
- Report each AC as `pass` with the command and result, or `not verified` with the reason. List every changed and new file.
- Report `BLOCKED` with the decision the human must make if the task cannot be built as written.

**Later rounds (repair):** dispatch the same builder again with only the open items: every blocking review item, every AC that is not `pass`, and every check that failed or did not run. It must fix each item, or say in its report why it should stand. It must not expand scope.

### 3. Verify (orchestrator)

Every round, run every check that covers an AC, using the commands from step 1. Treat the builder's report as a lead, not as evidence. For each AC, record `pass` with the command and result from this round, or `not verified` or `fail` with the reason. Docs criteria are recorded with the quoted content.

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

### 5. Decide (orchestrator)

Pick one outcome per round:

- **Repair (back to step 2):** the review is `VERDICT: CHANGES`, **or** any AC is `not verified` or `fail`, **or** a required check failed or did not run. Send the open items to the builder, then run steps 3, 4 and 5 again on the current tree.
- **Accept (exit):** all of these hold on this round's verify and review: the review is `VERDICT: PASS`; every requirement has an AC marked `pass` with evidence from this round; every required check ran and passed; an independent reviewer produced the verdict; and the builder did not report `BLOCKED`. Then report `ACCEPTED` with the AC evidence. A review PASS alone never accepts.
- **Blocked (exit):** the builder reports `BLOCKED`, or a required check cannot be discovered or run, or no independent reviewer is available. Stop, report `BLOCKED` with the blocker and what would unblock it. Never mark blocked work accepted.
- **Needs user decision (exit):** the task is unclear in a way only the user can settle. Stop, report `NOT ACCEPTED: needs decision` with the question. This is not acceptance.

No other exit exists. An unmet requirement, a failing check, or a `not verified` result always loops back to repair. There is no round limit to escape the loop.

### Commit (only when the calling flow asks)

The loop never commits by itself. Accepting reports the result; it does not create a commit. The calling command decides whether accepted work is committed, and only when its own flow says so and the user has not asked otherwise. When it does commit:

- Stage only the paths this task changed, taken from the builder's list and checked against the baseline. Never `git add -A`, and never stage a preexisting or foreign change.
- Skip the commit when nothing is staged. Do not create empty commits, and do not create a separate commit for each repair round.

### Limits

- **No independent reviewer means BLOCKED.** The orchestrator may run its own verify and report the evidence, but it cannot accept the work on its own review. Report `BLOCKED`, and stop.
- A self-review is never presented as an independent review.

## Your Task

1. **Analyze**: identify the files to create or modify, the dependencies between tasks, and the `[P]` tasks.
   Dispatch `[P]` tasks in parallel only when they touch different files with no shared state. Otherwise keep them sequential.
2. **Run the delivery loop** for each task, in dependency order, until it exits as accepted, blocked, or needs a user decision.
3. **Track progress**: tick a task only after the orchestrator accepts it. Report blockers and summarize the accepted changes.

## Guidelines

- Follow patterns from `AGENTS.md`
- Keep changes focused and atomic
- Write tests for new functionality
- Update documentation as needed
- Use conventional commit messages when a commit is requested
