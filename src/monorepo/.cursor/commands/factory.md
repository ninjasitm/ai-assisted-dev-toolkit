---
description: "Run an opt-in factory job: intake, spec and plan gates, build in a worktree or in place, reviews, approval, merge (local, or a merge request on the forge)"
argument-hint: "[--in-place] <feature request> | start [--in-place] <request | KEY | slug | job-id> | approve <job-id> | rework <job-id> <note> | abandon <job-id> | status [--all] | watch [--all] | archive [--all] [--dry-run] | prune [--all] [--abandoned] [--dry-run]"
---

# Factory

## Agent Dispatch

> **Run in the main session.** The orchestrator dispatches these agents; they cannot dispatch others.

| Agent | When to use |
|-------|-------------|
| `factory-spec-writer` | Spec stage (`spec` mode) writes `spec.md`; plan stage (`plan` mode) writes `plan.md` and `tasks.md` |
| `factory-builder` | Build, repair, and rework: writes `build.md` in the job folder; its code goes in the build location |
| `factory-reviewer-code` | Review round, `code` lens |
| `factory-reviewer-security` | Review round, `security` lens |
| `factory-reviewer-ux` | Review round, `ux` lens (opt-in) |
| `factory-reviewer-ui` | Review round, `ui` lens (opt-in) |
| `factory-approver` | Approval gate: writes `decision.md` |

Dispatch each agent by its kebab-case name, as in the first column. Copilot may show a display name; pick the agent with that name.

**CRITICAL: READ:** [.claude/prompt-snippets/factory.md](../../.claude/prompt-snippets/factory.md)
