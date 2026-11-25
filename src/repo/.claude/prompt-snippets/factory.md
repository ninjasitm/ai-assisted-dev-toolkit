---
description: "Run an opt-in factory job: intake, spec and plan gates, build in a worktree or in place, reviews, approval, merge (local, or a merge request on the forge)"
---

You are the factory orchestrator for this session. Arguments: $ARGUMENTS

Follow the [factory orchestrator skill](../../.agents/skills/factory/SKILL.md) exactly. It defines every invocation (`<request>` for intake, `start`, `approve [QA answer]`, `rework`, `abandon`, `status [--all]`, `watch [--all]`, `archive [--all] [--dry-run]`, `prune [--all] [--abandoned] [--dry-run]`), intake questions, feature folder resolution, the job layout, the spec and plan gates, tickets, the stages, the verdict rules, the paths block, and the merge procedure.

Ground rules:

- Run the orchestrator in this session. Dispatch the agents named in the Factory skill's Subagent dispatch table, which is canonical, for every spec, plan, build, review, and approval step, and do not write their files yourself. Reviewers and the approver return their reports, which you save.
- Use the Factory skill's write boundaries for the current command and role. The orchestrator persists the lane, review, fit, classification, decision, and recovery records that the skill assigns to it. In the job folder's `build.md`, make only the orchestrator entries the skill explicitly requires, including bounded preview evidence and the operator's verbatim QA answer. Never edit `qa.md`.
- Intake asks in chat before any folder, job, or spec exists. Hold the intake gate: nothing is created until the operator picks to continue.
- Spec before plan, on the spec route only: the spec gate holds the spec, and no plan is written until the operator confirms it in chat. Drafting a spec is not approval.
- Plan before ticket or build, on either route: the plan gate holds the plan, and nothing is ticketed or built until the operator confirms it in chat. Drafting a plan is not approval. The spec cannot be confirmed while a `[PRODUCT DECISION]` item is open.
- `--in-place` on the command, or the operator saying in place, builds in the main checkout instead of a worktree. Only a new job takes it.
- `--retro` on the command, or the operator asking for it at intake, sets `retro` on the new job. Retro runs once after each valid `decision.md`, inline, and writes only its `round-<R>/retro-<D>.md` report in the job folder. It never changes a gate, stage, verdict, or approval.
- `--learn` on the command, or the operator asking for it at intake, sets `learn` on the new job. Learn runs once after the job is merged through a verified merge and before cleanup, only for an `APPROVE` decision, and writes only `learn.md`. It never changes a gate, stage, verdict, approval, or merge.
- Autonomous build permissions: for a finished BLOCKED build with valid parked records, read-only Oracle may be asked once per technical blocker key, and only about in-scope questions. Its answer is advice, saved in `build.md` under `## Oracle advice`. Oracle's only Factory checking role is goal-fit checks A–C; this blocker consultation is separate, read-only, and never authorizes anything. It never approves, never answers a human-only item, a gate, a check, or the meaning of a requirement, and never changes a goal. A parked item keeps the job from READY.
- `abandon <job-id>` closes a job without merging it. Ask first when an agent may still be running.
- Local merges never push. With `MERGE_MODE` set to `push-mr`, the branch is pushed and its merge request opened only on `/factory approve` or an `auto` APPROVE, and never force-pushed.
- `archive` moves closed jobs only, to `factory/archive/`. It deletes an abandoned job's branch and worktree only after the operator says yes.
- `prune` permanently deletes closed jobs from `factory/jobs/` and `factory/archive/`, after one confirmation in chat: merged jobs by default, and abandoned jobs too with `--abandoned`. It never touches an open job or the feature folders.
- If `$ARGUMENTS` is empty, show the invocation list from the skill and ask which one the user wants.
