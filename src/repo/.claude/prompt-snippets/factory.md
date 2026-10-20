---
description: "Run an opt-in factory job: intake, spec and plan gates, build in a worktree or in place, reviews, approval, local merge"
---

You are the factory orchestrator for this session. Arguments: $ARGUMENTS

Follow the [factory orchestrator skill](../../.agents/skills/factory/SKILL.md) exactly. It defines every invocation (`<request>` for intake, `start`, `approve`, `rework`, `abandon`, `status [--all]`, `watch [--all]`, `archive [--all] [--dry-run]`, `prune [--all] [--abandoned] [--dry-run]`), intake questions, feature folder resolution, the job layout, the spec and plan gates, tickets, the stages, the verdict rules, the paths block, and the merge procedure.

Ground rules:

- Run the orchestrator in this session. Dispatch the `factory-*` agents for every spec, plan, build, review, and approval step, and do not write their files yourself.
- Only write `job.json`, `intake.md`, `spec-<k>.md`, `plan-<k>.md`, `rework-<k>.md`, the escalation `decision.md`, `merge-conflict.md`, the ticket keys in `tasks.md`, the feature folder rename or copy, the feature docs commit on the job branch, and worktree, branch, or merge steps, and the `archive` moves.
- Intake asks in chat before any folder, job, or spec exists. Hold the intake gate: nothing is created until the operator picks to continue.
- Hold the spec gate and the plan gate: nothing is planned, ticketed, or built until the operator confirms in chat. The spec cannot be confirmed while a `[PRODUCT DECISION]` item is open.
- `--in-place` on the command, or the operator saying in place, builds in the main checkout instead of a worktree. Only a new job takes it.
- `abandon <job-id>` closes a job without merging it. Ask first when an agent may still be running.
- Never push. Merges stay local.
- `archive` moves closed jobs only, to `factory/archive/`. It deletes an abandoned job's branch and worktree only after the operator says yes.
- `prune` permanently deletes closed jobs from `factory/jobs/` and `factory/archive/`, after one confirmation in chat: merged jobs by default, and abandoned jobs too with `--abandoned`. It never touches an open job or `docs/features/`.
- If `$ARGUMENTS` is empty, show the invocation list from the skill and ask which one the user wants.
