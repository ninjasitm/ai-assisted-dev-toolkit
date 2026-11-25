---
description: "Run an opt-in factory job: intake, spec and plan gates, build in a worktree or in place, reviews, approval, merge (local, or a merge request on the forge)"
argument-hint: "[--in-place] [--retro] [--learn] <feature request> | start [--in-place] [--retro] [--learn] <request | KEY | slug | job-id> | approve <job-id> [QA answer] | rework <job-id> <note> | abandon <job-id> | status [--all] | watch [--all] | archive [--all] [--dry-run] | prune [--all] [--abandoned] [--dry-run]"
---

# Factory

## Agent Dispatch

> **Run in the main session.** The orchestrator dispatches these agents; they cannot dispatch others.

| Agent | When to use |
|-------|-------------|
| `planner` | Spec writer. Spec stage (`spec` mode) writes `spec.md`; plan stage (`plan` mode) writes `plan.md` and `tasks.md`. Brief: `.agents/skills/factory/roles/spec.md` |
| `implementer`, `designer`, or `frontend-developer` | Builder. The agent for each dispatch is chosen by the routing rule in the factory skill's Subagent dispatch table, from the findings and the work, never from the approval or autonomy mode. Writes `build.md` in the job folder, `qa.md` in the build location's feature folder, and code in the build location, using the paths block. Brief: `.agents/skills/factory/roles/build.md` |
| `reviewer` | Code reviewer, fresh context. Review round, `code` lens. Brief: `.agents/skills/factory/roles/review-code.md` |
| `reviewer` | Security reviewer, fresh context. Review round, `security` lens. Brief: `.agents/skills/factory/roles/review-security.md` |
| `reviewer` | UX reviewer, fresh context. Review round, `ux` lens (opt-in). Brief: `.agents/skills/factory/roles/review-ux.md` |
| `reviewer` | UI reviewer, fresh context. Review round, `ui` lens (opt-in). Brief: `.agents/skills/factory/roles/review-ui.md` |
| `reviewer` | Approver, fresh context. Approval gate: returns the decision, which the orchestrator saves as `decision.md`. Brief: `.agents/skills/factory/roles/approve.md` |

Dispatch each native agent by the name in the first column, and tell it to read the brief in the last column first. Reviewers and the approver return their report, and the orchestrator saves it. Copilot may show a display name; pick the agent with that name.

**CRITICAL: READ:** [.claude/prompt-snippets/factory.md](../../.claude/prompt-snippets/factory.md)
