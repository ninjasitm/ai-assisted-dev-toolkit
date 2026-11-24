# Subagent Workflow

## 🛑 BEFORE STARTING: Orchestration Checkpoint

**READ THIS SECTION FIRST if you are about to start work.** This instruction file is loaded automatically for multi-step tasks, meaning:

1. **You are likely handling 2+ of:** research, planning, implementation, testing, review, validation
2. **You MUST answer:** Does this task involve independent subtasks or multiple domains?
3. **If YES:** Use a coordinator agent (Feature Builder, TDD, or other) instead of single-agent execution
4. **If NO (single focused task):** Document why you're using a single agent, then proceed

### Signs You Should Use Orchestrator-First

- ✅ Multiple files across different directories
- ✅ Planning phase + implementation phase
- ✅ Multiple independent reviewable chunks
- ✅ Different domain areas (backend + frontend + docs)
- ✅ Test coverage needed alongside changes
- ✅ Architecture decisions before coding
- ✅ Direct code review feedback (no implementation)
- ✅ Research task (no code changes)

### Signs Single Agent Is OK

- ✅ Single file edit
- ✅ Quick typo/syntax fix
- ✅ Small documentation update

**When in doubt, use orchestrator-first.** It is lower-cost than sequential agent work and provides better code review isolation.

---

## Orchestrator-First Principle

**Default to using a coordinator agent for non-trivial work.** Coordinators break complex tasks into focused subtasks and dispatch specialized subagents with context isolation.

### Model Availability Fallback (oh-my-opencode-slim)

Only a confirmed **model unavailable, quota/capacity, or rate-limit** failure qualifies; task, tool, and validation errors do not.

1. Confirm the run is terminal and inspect partial work. Preserve the original agent, task, and context.
2. In the same live OpenCode instance/session and project location, confirm the active Slim preset when runtime access permits. Load the Slim skill, actual user config (`~/.config/opencode/oh-my-opencode-slim.jsonc` or `.json`), and relevant project overrides (known `.opencode/oh-my-opencode-slim.json` or `.jsonc` only). In config, use the ordered `presets.<preset>.<agent>.model` array of `{id, variant}` entries as configured intent; RPC `agentModels` is a map of model strings, not a fallback chain. Do not mistake disk config for merged live state. Resolve conflicting or unknown overrides before proceeding.
3. Verify the next configured model ID and variant with the models tool, then relaunch that same agent/task in the same session once using the explicit `model#variant`. Do not guess IDs, change config, or silently take over. If the fallback cannot be established, runtime/config sources conflict, or the retry fails, report the blocker.

Runtime discovery/authentication must use the active instance and location; never hardcode a host or credentials. **Slim 3.0.7 limitation:** `POST /api/rpc/oh-my-opencode-slim.session-preset.v1/read` (body `{"input":{"sessionID":"<current-session-id>"}}`, current `location[directory]`) returns `output.presetName` and resolved `output.team.agentModels` / `agentVariants`, not the fallback chain. Use these only to confirm the active preset; they do not prove merged effective state or identify the next fallback.

## When to Use Orchestrator + Subagents

- Features spanning multiple files or domains
- Tasks requiring planning → implementation → review cycles
- Work that benefits from domain specialization (backend, frontend, API)
- Any task with 2+ independent subtasks

## When to Use a Single Agent Directly

- Quick one-file fixes or small edits
- Research questions that don't require code changes
- Ad-hoc code reviews (invoke Reviewer directly)
- Simple documentation updates
- Domain-specific advice without implementation

## Available Coordinators

| Coordinator         | Purpose                                      | Dispatches                                                                                                                  |
| ------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Feature Builder** | End-to-end feature development orchestration | Planner, Implementer, Reviewer, Researcher, Backend Architect, Frontend Developer, API Specialist, Admin Portal, Documenter |
| **TDD**             | Red-green-refactor cycle coordination        | Red, Green, Refactor                                                                                                        |

## Domain Specialist Selection

When dispatching implementation tasks, match the specialist to the domain:

| Domain                             | Specialist             |
| ---------------------------------- | ---------------------- |
| API design, databases, system arch | **Backend Architect**  |
| UI components, state, responsive   | **Frontend Developer** |
| API contracts, docs, versioning    | **API Specialist**     |
| Admin dashboards, RBAC, reporting  | **Admin Portal**       |
| Project documentation              | **Documenter**         |
| General / cross-cutting            | **Implementer**        |

## Orchestration Patterns

### Delegation Default

- **Delegate by default.** Hand substantial, safely separable discovery, implementation, test, and review work to subagents. Use a single agent only for trivial work, as listed under "When to Use a Single Agent Directly".
- **The coordinator keeps outcome responsibility.** It defines each task's scope, reconciles every result, makes sure verification runs, and reports the final outcome. A subagent reporting success is not the outcome.
- **Work directly only** for trivial changes (one small edit, a quick answer) or when the context is too heavy to hand off cheaply, such as work that depends on large context the coordinator already holds. Say why when you skip delegation.
- **No delegation capability.** If the host offers no subagent dispatch, say so explicitly in the report. Do permitted direct work where it is safe. Never self-review in place of an independent gate: record the gate as pending and end as BLOCKED or WAITING.

### Dependency Graph and Parallel Batches (REQUIRED before dispatching)

Before dispatching any task list, the orchestrator builds the dependency graph. No `[P]` marker is required. If a task list has `[P]` markers, treat them as hints and verify them.

1. **Read and write sets.** For each task, list the files, directories, or packages it reads and writes.
2. **Exclusive writable scopes.** Each writer gets a scope no other concurrent task writes. Two tasks that share any writable path are dependent. A task whose write set is unknown or undeclared runs serially until its scope is established from the changed-file list.
3. **Data dependencies.** A task that reads what another task writes waits for that task.
4. **Ready batch.** Tasks whose dependencies are satisfied and whose writable scopes are disjoint form one batch. Dispatch the whole batch together. Dependent and shared-write tasks run in later batches, one at a time.
5. **Route by domain.** Backend tasks → Backend Architect; frontend → Frontend Developer; API contracts → API Specialist; docs → Documenter; cross-cutting → Implementer.
6. **Track handles.** Record each dispatched task's handle, agent, writable scope, and status until its result is reconciled.
7. **Reconcile before dependents.** Inspect each result (changed files, summary, verification) before dispatching any task that depends on it. If a result changed a path the graph did not expect, stop the affected tasks and re-plan the batch.
8. **Continue the chain.** When a batch's results are reconciled, compute the next ready batch and dispatch it. Do not wait for the user unless a mandatory gate applies or no authorized, unblocked work remains (see Autonomous Execution and Blockers).

**Dispatch shape:** 3+ independent tasks → `dispatching-parallel-agents`, one agent per task. 2 independent tasks → parallel dispatch. All tasks dependent → sequential with `subagent-driven-development`. Mixed → run each ready batch in parallel, then continue the sequential chain.

```
Example: 5 tasks → T1 (setup) → T2 (backend API) + T3 (frontend UI) + T4 (docs) → T5 (integration tests)
         Batches: [T1] → [T2, T3, T4] → [T5]
         T2, T3, and T4 run together only because their writable scopes are disjoint.
```

## Turn Completion and Waiting

During active multi-step execution, never end a turn silently, and never treat dispatch or partial progress as completion. End each such turn in exactly one of these states. Informational answers need no status line:

- **DONE:** the requested work is complete and verified under Quality Gates. State the outcome and the validation that ran.
- **WAITING:** name each pending task (handle and agent) and its resume trigger, such as a subagent notification or a user reply at a named gate. List what completed and what remains.
- **BLOCKED / NEEDS-DECISION:** state the blocker or decision, what completed, what remains, and the exact next user action.

Resume mechanics depend on the host:

- When the host notifies on subagent completion, reconcile the notified result and continue with the next eligible batch. Check each handle once per notification.
- When the host cannot resume in the background, do not claim that it will. Either run the batch in the foreground and collect the results within the turn, or end as WAITING and say that the user must send a message to resume, naming the exact step.
- Do not busy-poll. Never loop on status checks.

## Autonomous Execution and Blockers

During multi-step execution, work autonomously within the approved goal, scope, and permissions. Autonomy grants no extra authority.

- **A blocker pauses only the affected task and its dependents.** Independent ready work within authority continues in the next batch.
- **Record each unresolved blocker immediately** in the existing progress record or the conversation: the affected task, what is needed and why, safe options or a targeted input, and the next action. Keep it visible in progress updates and the final report. Never drop it silently.
- **Defer non-global blockers** as follow-up questions while work can safely advance.
- **Stop for user input** only when no authorized, unblocked work remains, or when a mandatory approval, security, or permission gate prevents the remaining work. Agents still running are WAITING, not blocked.
- **Ask clearly.** Present the consolidated outstanding questions through the harness's native question or clarification tool when one is available. Do not assume a tool name or support. Without one, give numbered options or a fill-in block in chat.
- **Answers can arrive early.** Do not require a blocking tool prompt while independent work continues. Report deferred questions in progress updates.
- **Never** silently choose a consequential scope or requirement change, bypass a required human approval, or mark a partially blocked task DONE.

## Long-Session Checkpoint

For sessions that span several batches or a context reset:

- Use existing progress records only: a progress section the plan or task list already has, Factory job notes, or task records, when they exist. Keep the approved goal, current step, active task handles, blocker, and next action in those notes or in the conversation.
- Never add fields to structured files such as Factory `job.json` (the job's documented fields, such as `spec_route`, are set only by the Factory skill), never rewrite accepted requirements or spec/plan text, and never replace an authoritative source with a summary.
- If no such records exist, a short checkpoint in the conversation is enough. Do not create new files for trivial work.
- On resume, reread the accepted source (spec, plan, or task text) instead of relying on the checkpoint summary, and check the working tree before dispatching anything.

## Factory Approvals

Spec and plan confirmations remain mandatory human steps; final approval, escalation, and merge behavior follow the job's `APPROVAL_MODE` and `MERGE_MODE`. Delegation, batching, autonomy, and subagent sign-offs never satisfy spec or plan human confirmation, or human final approval when `APPROVAL_MODE=human`. Mode-defined approver behavior is preserved. Stop at the gate and report it as WAITING or BLOCKED.

## Plan and Spec Changes

- **Route by substance.** An ordinary repair (a fix inside the accepted plan and goals) stays with the builder or specialist that owns the files. A plan or spec change, or any expansion, goes to the planner: the planner authors the revision, and no reviewer, Oracle, or builder does.
- **Order.** The planner authors the revision, then independent plan review (fit-review, Plan review), then the applicable existing confirmation (Factory's spec and plan gates, or none where the flow has no gate), then resume the affected work. A PASS on an earlier plan does not cover the revised one.
- **Handoff and resume.** Every handoff and resume carries the verbatim original request and explicit amendments as the goal authority, plus the overall summary and goals as context. The summary is not authority and never replaces them. No new record schema or structured-file field is added: use the existing progress record or the conversation.
- **Expansion.** Oracle may authorize a justified in-goal expansion only as fit-review's Expansion rule allows. The expansion then goes to the planner as a revision request.
- **Feature Builder.** A standalone Planner-to-Implementer handoff is a bypass: it must get the plan gate and classify each feedback item as a repair or a plan or spec change before implementation.
- **Reviewers.** A reviewer dispatched under a goal-fit or alignment contract follows that contract's reply format, not the generic review summary.

## Quality Gates

- Every implementation must pass **Reviewer** before proceeding
- Every plan must pass plan review (fit-review, Plan review) before implementation begins; the Reviewer gate applies to implementations
- Coordinators should not skip review even for "simple" changes
- If a reviewer requests changes, the original specialist fixes them and re-review occurs

## Model Capacity Fallback

When a subagent stops on a model capacity, quota, session limit, or reset-wait failure (most often Claude), switch its **model** and keep its **agent**. This is automatic for those failures; do not ask first.

- **Same agent, same role.** Re-dispatch the same agent with the same task, permissions, and context (and session, where the harness supports it). Do not substitute an equivalent agent.
- **Model order, one attempt each.** Try the next model in the configured fallback order for that agent. When the order is exhausted, try the harness's known available default, unless it was already tried. Then stop; do not cycle back.
- **Never** retry the same unavailable model, and never wait blindly for a quota reset.
- **Only supported switching.** Change the model through per-call selection the runtime supports, using only fallback models and defaults that are already configured or exposed. Do not invent model IDs, and do not edit persistent or global config, accounts, or billing.
- **Blocker when nothing is left.** If no configured fallback or default is available, or per-call selection is unsupported, the affected task is reported BLOCKED with the question of which model to use. Its dependents stop; independent authorized work continues (see Autonomous Execution and Blockers).
- **Inspect before resuming.** Check what the failed attempt left in the working tree, then resume from that partial work. Never run two writers on the same files at once.
- **Keep review independent.** The reviewer stays a separate agent from the builder, even when the builder moves to a fallback model.
- **Disclose.** The final report names the original model, each fallback attempted, and the model that finished the work.

## Skills Integration

These skills complement subagent workflows:

| Skill                            | When to Use                                      |
| -------------------------------- | ------------------------------------------------ |
| `writing-plans`                  | Creating implementation plans before execution   |
| `subagent-driven-development`    | Executing plans with fresh subagent per task     |
| `executing-plans`                | Following through on plans in a separate session |
| `dispatching-parallel-agents`    | Multiple independent problems to solve           |
| `requesting-code-review`         | Structured review between implementation stages  |
| `receiving-code-review`          | Responding constructively to review feedback     |
| `verification-before-completion` | Quality checks before claiming work done         |
| `finishing-a-development-branch` | Completing work after all tasks pass review      |
| `orient-to-recent-work`          | Build context from recent project activity       |
| `brainstorming`                  | Structured ideation when scope is fuzzy          |
| `systematic-debugging`           | Structured root cause investigation              |
| `using-superpowers`              | Leveraging the full skill system                 |
