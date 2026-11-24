# Implement Feature

Implement a feature by completing tasks sequentially with proper tracking.

## Usage

```
/implement-feature {{ISSUE_KEY}}-123
/implement-feature apps/{{APP_NAME}}/docs/features/{{FEATURE_NAME}}/tasks.md
```

## Orchestrator Checkpoint

> **🛑 Before starting**: Every task and the whole feature run the delivery loop in
> [implement.md](implement.md). Dispatch the builder directly with that loop. Do not route through a
> planning skill, and do not write a spec or plan first. **Feature Builder** may be the builder for a
> task, but its own review never replaces the independent review, and only the orchestrator accepts.

## Process

1. **Load Feature Context**:
   - The supplied feature text or task list is the requirement. Do not require a spec or plan first.
   - If `apps/{{APP_NAME}}/docs/features/{{ISSUE_ID}}-{{FEATURE_NAME}}/` exists, read whichever of `spec.md`, `plan.md` and `tasks.md` it contains as context. Skip any that are absent.
   - Review `AGENTS.md` for project patterns.
   - Turn every requirement of the feature into an acceptance criterion and discover the real checks, as in [implement.md](implement.md) step 1.
   - Preserve the original full-feature text, acceptance criteria, and real checks separately for aggregate feature review; task-local inputs must not overwrite them.

2. **Parallelization Analysis**:
   - Scan task list for `[P]` markers and independent tasks
   - Group tasks by domain (backend, frontend, docs, tests)
   - Tasks that touch **different files with no shared state** → run their loops in parallel
   - Tasks with dependencies or shared files → keep sequential
   - Tasks with an unknown or undeclared write set → keep sequential until the scope is established
   - Use `dispatching-parallel-agents` skill when 3+ independent tasks exist
   - Once the task list and plan are approved, schedule the ready tasks with [autonomous-mode](../../.agents/skills/autonomous-mode/SKILL.md): run every dependency-ready task, park only a blocked task and its dependents, and queue human-only items for the developer last. Checkpoint C still gates each task's first build, and checkpoint D still runs before aggregate review.

3. **Create Feature Branch** (before any build):

   ```bash
   git checkout -b feature/{{FEATURE_NAME}}
   git pull origin {{DEFAULT_BRANCH}}
   ```

   Then take the baseline snapshot as in implement.md step 1, before any build.

4. **Task Implementation** (sequential or parallel per analysis):

   For each task, in dependency order:

   a. **Mark Task In Progress**

   b. **Research & Understand**:
   - Search codebase for similar patterns
   - Review referenced files
   - Understand dependencies
   - Before entering the task's delivery loop, bind the current task's original text unchanged, task-local acceptance criteria, and applicable real checks as in implement.md step 1. Use these inputs for the builder, verification, independent reviewer, and acceptance in steps 2–5. Do not use another task's criteria or require later tasks to pass. Each task's checkpoint C also receives the full-feature summary and goals as context, not only the task. Keep the saved baseline unchanged.

   c. **Delivery loop for the task** (implement.md steps 2–5):
   - Builder: write the failing test first, watch it fail for the right reason, make the minimal change to pass, then refactor (TDD). Update the docs the task requires in its app or package.
   - Orchestrator: verify the checks yourself, dispatch the independent read-only reviewer, then decide.
   - Repair goes back to the builder. Repeat until the task is accepted or blocked. Do not commit or tick the task before acceptance. A blocked task parks itself and its dependents only (autonomous-mode); a parked mandatory task is never ticked or reported complete.

   d. **Commit the Task** (after acceptance, only when there are accepted changes): stage only this task's paths, never `git add -A` or a foreign change, then commit. Skip the commit when nothing is staged.

   ```bash
   git commit -m "feat({{SCOPE}}): {{DESCRIPTION}}"
   ```

   e. **Mark Task Complete** (after the commit):
   - Slim `tasks.md`: tick `- [x]` on the task's line
   - Legacy `tasks.md`: tick `- [x]` only on checkboxes under the current task's heading (until the next heading). Never tick checkboxes under other headings. If that heading has no checkboxes, report "no checkboxes under <heading>; nothing ticked" and continue

5. **Feature Review** (aggregate loop, every round):
   - Restore the saved full-feature text, acceptance criteria, and real checks as the inputs for aggregate verification, independent review, and acceptance.
   - **Alignment checkpoint D** (before aggregate verification and review): read and follow [fit-review](../rules-snippets/fit-review.md) for checkpoint D. Dispatch the independent read-only reviewer with the saved full-feature text and every amendment, the feature's summary and goals as context, the accepted spec and plan when the feature has them, and the reviewed inputs: the changed-file list of the current tree against the merge-base, including uncommitted and new files. Oracle when it is available read-only, otherwise a reviewer in fresh context. Only the explicit `VERDICT: PASS` releases aggregate verification and review. A `CHANGES` with any finding marked `requires user decision; do not auto-repair` stops the feature's aggregate acceptance until the user answers, even when other findings are repairable. A `CHANGES` where every finding is repairable goes to the builder that owns each file, and D runs again on the changed inputs: reuse is never allowed after a `CHANGES`, and a PASS is reused only under the fit-review freshness rule. A justified expansion (the fit-review Expansion rule) is a planner revision request; if the feature has accepted spec or plan files it changes, the user confirms it before the work continues. Unrelated authorized work continues. With no independent reviewer, aggregate acceptance is `BLOCKED`.
   - Run implement.md steps 3, 4 and 5 for the **whole feature**, against every requirement from step 1, not only the last task.
   - Review scope: the current working tree against the merge-base, `git diff $(git merge-base {{DEFAULT_BRANCH}} HEAD)`. This covers committed task work, uncommitted repairs, and new files (read the untracked ones directly). Do not review only `{{DEFAULT_BRANCH}}...HEAD`: it misses uncommitted repairs and new files. Compare preexisting files against the saved baseline copies from step 1, as in implement.md step 4.
   - Repairs go to the builder that owns each file, uncommitted. Then run steps 3–5 again on the current tree.
   - Exits are the same as implement.md step 5: accepted, blocked, or needs a user decision. There is no round limit. Only acceptance ends the feature review successfully.
   - Autonomous mode: start aggregate review only once every mandatory task is accepted. While a mandatory task is parked, the feature is not accepted, and its human-only items go in the queued list from autonomous-mode.

6. **Create Pull Request** (only after the feature review is accepted):

   a. **Final Validation**: after all tasks are reconciled, run the project's full required regression checks once on the final integrated tree (implement.md step 3): the repo-defined full suite, lint, typecheck, and build, where they exist. Every required check must pass on this tree. Any edit after this run requires revalidation.

   b. **Commit and push**: if accepted feature-review changes are still uncommitted, commit them once, staging only the feature's paths, and skip the commit when nothing is staged. Do not create repair-only commits.

   ```bash
   git commit -m "feat({{SCOPE}}): {{DESCRIPTION}}"   # only when there are uncommitted accepted changes
   git push -u origin feature/{{FEATURE_NAME}}
   ```

   - Create PR targeting `{{DEFAULT_BRANCH}}`
   - Include feature summary, the AC evidence, and testing notes

7. **Report Status**:
   - Tasks accepted (count) and any task blocked or awaiting a user decision
   - Feature review verdict and `ACCEPTED` or `BLOCKED` / `NOT ACCEPTED` with the open items
   - PR URL, only when accepted

## Guidelines

- **No Placeholders**: Never implement "Coming Soon" or placeholder functionality
- **Complete Features**: Each task should result in working functionality
- **Test-Driven (mandatory)**: Write failing tests before implementation. Follow red-green-refactor. No production code without a failing test first.
- **Atomic Commits**: One logical change per commit
