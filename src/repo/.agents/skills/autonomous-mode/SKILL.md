---
name: autonomous-mode
description: Use after an accepted task list or plan (or a supplied authorized task) to run every dependency-ready unit, get Oracle guidance once per technical-unknown blocker, park only blocked closures, and queue human-only items for the developer last. Never skips a checkpoint, approval, or human gate.
---

# Autonomous Mode

Run an accepted plan forward: every unit whose dependencies are satisfied and whose authority is in place runs now. A technical-unknown blocker gets one read-only Oracle consult. Human-only needs are never delegated or skipped; they are queued for the developer at the end.

**Announce at start:** "I'm using the autonomous-mode skill to run the accepted tasks."

## Activation

Load this skill only when an accepted source exists for the work it schedules:

- a supplied authorized task (`/implement`),
- an accepted task list with its plan (`/implement-feature`), or
- a plan that has passed its human confirmation gate (Factory's build stage).

Before an accepted source exists, do not load this skill.

- **Trivial single task (`/implement`, one task, no dependencies):** do not load this skill up front. Run the normal delivery loop. Load this skill at the first blocker.
- **Multiple tasks:** load this skill only after the accepted input exists. Do not load it while the task list is still being formed.
- **Units** are the accepted task list's lines, or on a plan-only job with no task list, the approved plan's numbered steps.

Checkpoints do not gate loading. Each one controls only the work at its existing place in the flow, and none is reordered:

- **Checkpoint C** gates each task's first build (`/implement`, `/implement-feature`, `/implement-fixes`). A task's build does not start until its C has passed.
- **Checkpoint D** gates aggregate verification and review (`/implement-feature`). Aggregate review does not start until D has passed.
- **Checkpoint A** gates the Factory review round it precedes, where the Factory flow requires it.

Activation never weakens C, D, or the `/implement` supplied-task exception. See [fit-review](../../../.claude/rules-snippets/fit-review.md) for each checkpoint's rules.

## Calling Flow Authority

- This skill does not widen the calling flow's permissions. Ordinary lawful writes the flow already defines are allowed as that flow defines them: builder edits, progress records, and ticking a task after its acceptance. Do not create plan, spec, or task files, and do not add record fields the flow does not define.
- Only the calling flow selects its authorized resume and repair commands. Do not guess a command. If the flow's command for a step is not known, park the item with that question.
- This skill grants no approval, no scope, and no checkpoint waiver. It runs inside what the entry flow already authorized.

**Per entry command:**

- **`/implement` with a supplied authorized task:** the supplied task is the authority. The supplied-task exception covers the missing spec, plan, and task files. Checkpoint C still applies to each task before its first build.
- **`/implement-feature`:** the task list and plan approval and alignment must already be in place. Checkpoint D still runs before aggregate verification and review. Autonomous mode does not replace D.
- **Factory (post-plan only):** the plan gate must be confirmed by the human. Autonomous mode never confirms the spec or plan gate, and never gives final approval when `APPROVAL_MODE=human`.

## Grill-me and Fit Review Are Different Steps

- **[grill-me](../grill-me/SKILL.md)** is pre-approval clarification of the user's own questions. It runs before a plan or task list is accepted. Do not run it during autonomous execution.
- **Fit review** is an independent read-only goal-fit review (checkpoints A to D, or plan review) by Oracle or a fresh reviewer. It checks the work against the goals. It is not a question to the user, and it never replaces a human gate.

## Scheduling

Follow [subagent-workflow](../../../.claude/rules-snippets/subagent-workflow.md), Dependency Graph and Parallel Batches, to build the graph. Then:

1. **Eligible unit.** A unit is eligible when its dependencies are accepted, its authority above is in place, it is not parked, and its writable scope is disjoint from the other units in the same batch. A unit with an undeclared write set runs serially until its scope is known.
2. **Run every eligible unit.** Dispatch all dependency-ready, authorized units as batches, one batch at a time. Reconcile each result before dispatching its dependents.
3. **Pause the smallest blocked closure.** When a unit blocks, park that unit and only its transitive dependents. Siblings and unrelated units keep running.
4. **Stop only when nothing is eligible.** Repeat until no eligible unit remains, then go to Completion.

## Canonical Blocker Classification

Every blocker gets exactly one class. Classify by who can settle the question, not by how the blocker looks.

| Class | What it is | Route |
| --- | --- | --- |
| **Technical-unknown** | The cause or approach is not established by the sources, and the sources in scope may contain the answer. | Oracle, once per stable key (below). |
| **Requirement meaning** | The sources do not settle what the task requires (ambiguity). | Human-only. Park. No Oracle. |
| **Role or permission** | The action needs a role, permission, credential, secret, or environment the calling flow does not grant. | Human-only. Park. No Oracle. |
| **Undefined check command** | A required check is not defined by the project's manifests, CI, or docs. | Human-only. Ask for the command. No Oracle, because Oracle may not invent one. |
| **Human approval or decision** | A `requires user decision` finding, a mandatory approval, a requirement or scope change, a manual QA `accept`, or an unapproved external action. | Human-only. Park. No Oracle. |

Rules for the table:

- "Unknown" means the cause is not yet established. It does not mean the answer is missing from the user. If only a user, role, or approver can answer, the class is never Technical-unknown.
- A blocker that fits a human class and a technical class is human.
- If the answer to a Technical-unknown question is discovered to be human-only mid-consult, record that Oracle result as `inconclusive` and park the blocker in its human class.

## Oracle Semantics

- **Scope of Oracle:** Technical-unknown blockers only. Never Requirement meaning, Role or permission, Undefined check command, or Human approval or decision.
- **Stable key:** a consult is keyed by the blocker's task identity plus the actual cited relevant inputs: the file paths with their content, the quoted acceptance criterion, and the check output the blocker cites. The key is not the global commit, and it is not other workers' activity. Unrelated commits or parallel work do not change it.
- **One consult per key.** The same key is never consulted twice. If the key is unchanged, the blocker is parked, not re-asked.
- **Detected change, not approval.** When a cited input changes in an alignment-relevant way (the freshness rule in fit-review), the key changes and one new consult is eligible. A detected change is evidence to re-examine the blocker. It is not scope approval, and it does not authorize new work.
- **Guidance, not authority.** Oracle cannot change goals, scope, the plan, an acceptance criterion, or a check. It cannot approve or accept anything.
- **Acting on guidance** means the normal delivery loop: the builder repairs inside the task's goals, and the orchestrator verifies and reviews. It is not a shortcut to acceptance.
- **No in-scope answer:** park the blocker. Do not retry it.
- **Expansion:** guidance cannot expand scope. If a separate expansion is identified, the existing fit-review rules route it. It is not eligible work under this skill until the existing revision and approval steps are complete.

## Parking and Recording

When a blocker is parked, record it immediately in the existing progress record, or in the conversation when none exists. Do not add a file or schema. The record holds:

- the affected unit and its dependents;
- its class from the table above;
- what is needed and why;
- safe options, or a targeted input;
- for Technical-unknown blockers, the Oracle consult key and its result (or `inconclusive`);
- the next action, and the resume trigger.

Keep parked items visible in every progress update and the final report. Never drop one silently.

## Completion

A run is finished only when no eligible unit remains. Then:

1. **Queue human-only items as one batch.** Give the developer one numbered list of exact actions. Each item states the action, its class, the affected tasks and dependents, and the resume trigger. Use the targeted-input format from AGENTS.md when the answer is data. Reply and resume through the existing record or conversation. Do not invent a command.
2. **Completed or ready means accepted.** A task that still has a parked mandatory item is not completed, not ready, and not merged. Report it as BLOCKED or NEEDS-DECISION. The run is not DONE while any mandatory task is parked.
3. **Turn state.** End the turn with exactly one state from [subagent-workflow](../../../.claude/rules-snippets/subagent-workflow.md), Turn Completion and Waiting: DONE only when nothing mandatory is parked; WAITING when work is still pending on an agent or resume trigger; BLOCKED or NEEDS-DECISION otherwise, with the queued list.

**Global gate exception.** A global gate (a spec or plan confirmation, final approval, or a security or permission gate for the whole run) stops dependent work immediately. Stop those dependents at once and report the gate. Keep running units that do not depend on it, and when none remain, end with the queued list.

## Hard Rules

- Never delegate a human-only item, and never mark it passed on a guess.
- Do not widen the calling flow's permissions. Ordinary lawful writes and ticks the flow defines are not forbidden by this skill.
- Only the calling flow selects its resume and repair commands. Do not guess one.
- Never retry a parked blocker without a changed cited input.
- Never commit, stage, or push beyond what the calling flow allows.
- Never weaken a check, add a bypass, or accept a human check on the user's behalf.
- Mandatory gates are never skipped, even when every technical unit is finished.
