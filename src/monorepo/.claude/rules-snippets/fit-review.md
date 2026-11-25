# Goal-Fit Review Brief

Read and follow this brief when a gate or command asks for a goal-fit review of a spec, a plan, or a build's scope. It adds to the reviewer rules of the calling flow.

## Reviewer

- Read-only. Do not edit files, stage, or commit. Do not write any file the caller did not ask for.
- Independent of the author. Use Oracle when it is available read-only; otherwise a separate reviewer in fresh context. The author's self-review, the author's summary, and a single session playing every role do not count.
- If no independent reviewer can run, the caller reports `BLOCKED`. Do not review in its place.
- Review the current artifacts from scratch on every run, including resumed runs. Do not rely on an earlier reply, an earlier summary, or the author's account of what changed.
- Read-only guidance: the reviewer, Oracle included, never authors or edits a spec, plan, approach note, or code. A planner authors any revision. Reviewer feedback is guidance; the Expansion rule is the only path to added work, and no reviewer changes a goal.

## Goal sources

Use only these as goal authority:

1. The original user request, verbatim, and every explicit user amendment (intake answers, operator change requests, rework decisions). The caller passes them to you as text in the dispatch.
2. Accepted constraints from earlier artifacts, when the caller passes them: for a plan review, the accepted spec's requirements, acceptance criteria, and `[DECIDED]` items (or, on a factory plan-only route with no spec, the plan's Requirements Source and Acceptance Criteria); for a build review, the accepted spec and plan. Trace against these. They are not goal authority on their own.

Not goal sources: a slug, a ticket key, a ticket title, the existing spec alone, the planner's or author's summary, and any reviewer finding from an earlier round.

If the original request is not in the dispatch, do not infer goals from the spec or the plan. Reply `VERDICT: CHANGES` with a blocking finding: `Missing authoritative baseline: requires user decision; do not auto-repair.`

Quote the original request in your report. When a lower source (a spec, a plan, or a summary) conflicts with the original request, report the conflict with both quotes. Do not silently trust the lower source.

## Trace both ways

- **Forward:** every goal is covered by a requirement, acceptance criterion, or step. Name the section that covers it, or report the gap.
- **Backward:** every requirement, step, or file change traces to a goal. A change that no goal needs is scope drift.
- Implementation details that a goal needs are allowed without their own acceptance criterion (for example, a migration that a storage goal requires). Do not demand that every mundane detail be an acceptance criterion. Name the goal that justifies such a detail.

## Lenses (separate from correctness)

- **Ponytail:** is this the simplest work that meets the goals? Flag speculative abstraction, dead flexibility, reinvented standard-library behavior, and steps no goal asks for. Block only when the finding adds scope or complexity the goals do not justify; otherwise note it.
- **SOLID and SRP, proportional:** flag a responsibility split only when it harms a goal, for example one unit doing unrelated work the request keeps apart. Do not require abstractions or interfaces, and do not forbid a justified interface. Judge by the goals, not by the pattern.

## Decisions and repairs

- A change to a goal (dropping, narrowing, or adding one) is a user decision. So is any other question only the user can settle. A decision stays blocking until the user resolves it with an explicit amendment. Report it as a blocking finding under `VERDICT: CHANGES`, marked `requires user decision; do not auto-repair`, and also list it under **Decisions for the user**. Do not repair it, and do not assume an answer.
- Other blocking findings are scoped repairs: name the section and the specific change. The caller passes your findings to the author as dispatch context and reviews the changed artifacts again. You do not write repair notes or repair files.
- `VERDICT: PASS` means no blocking findings. Absence of blocking findings is not a pass. A finding that needs a user decision is blocking, so it is never a pass.

## Plan review

Applies when the artifact under goal-fit review is a written execution plan, or a plan that drives delegated or multi-task execution. This is a named plan review of that artifact. It is not a new checkpoint, and it does not change checkpoints A to D.

It excludes bookkeeping-only in-session todos, single-task approach notes already covered by checkpoint C, and trivial or focused single-file work with no consequential execution plan. Substance decides, not format: a consequential scope, approach, requirement, or acceptance change cannot escape review by being called a todo, note, or single-file edit.

Reply: the first line is `VERDICT: PASS` or `VERDICT: CHANGES`. The second line is `Review: plan review`. The third is `Reviewed inputs: <plan and authoritative sources>`. The sections of this brief follow as usual.

The expansion rule, planner authorship of revisions, independence, the baseline, and the human gates apply by reference. A revised plan is reviewed again before PASS. The coordinator owns freshness and reuse: it reuses an applicable PASS only as the Freshness rule allows, and a skill entry point alone never starts a second review.

Plan-specific adaptation. Where the Expansion rule or the Freshness rule names an alignment checkpoint or its file record, a plan review applies the same rule to the plan review itself. A plan's order is: planner revision, then an independent plan review PASS, then the applicable human confirmation for any accepted spec or plan, then execution. A justified expansion is never executed on a plan review PASS alone: the revised plan must PASS plan review and receive its applicable confirmation first. Repairs from a plan review go to the planner, not the builder. The record of a plan review PASS is the conversation or the existing progress record, noting the plan version reviewed; no new file or schema is required, and the by-file record in Freshness does not apply to plan reviews.

## Alignment checkpoints (build flows)

Only build flows whose configured instructions include alignment checkpoints call this brief at those checkpoints; they are not a universal requirement. When configured, compare work with the goals before it goes on. Name the checkpoint in the dispatch and reply.

- **A, before review:** after a build round or a batch of repairs, before the review round starts. Factory uses it.
- **B, before user-directed rework:** the user's rework note, before any build restarts. It reviews the note and does not repair it.
- **C, before the first build of a task:** the planner's read-only approach note against the supplied task, before any edit. `/implement`, `/implement-feature`, and `/implement-fixes` use it.
- **D, after reconciliation:** the whole feature's changes against the full-feature text, before aggregate verification and review. `/implement-feature` uses it.

The dispatch carries the goal sources above (the verbatim original request and every amendment), the accepted spec and plan when the flow has them, the checkpoint name, and the reviewed inputs: the paths, the commit, and the changed-file list, or the approach note for C. Check results may be passed as evidence. They are never goal authority. Every alignment dispatch also carries the overall work's summary and goals as context: the whole feature or job, not only the current task or step. The verbatim original request and explicit amendments remain the authority, and the summary never replaces them.

Rules:

- **Reply.** After the first line, add `Checkpoint: <A|B|C|D>` and `Reviewed inputs: <paths, commit, changed files, or approach note>`. For B, also add `Classification: repair`, `Classification: plan change`, or `Classification: spec change`. A repair stays within the goals and the accepted spec and plan. A note or change that alters a goal, the accepted spec, or the accepted plan is a spec or plan change.
- **Expansion.** A reviewer finding alone never authorizes new scope. Oracle advice may recommend considering an in-goal expansion when it states a basis, the addition traces to a quoted original goal or explicit amendment, and no goal changes; this advice is not permission to expand scope. Such a possibility is a planner revision request, not a direct edit: the planner revises the affected plan or approach note, an independent read-only review checks the revision, and an accepted spec or plan still needs its existing human confirmation. A fallback reviewer (not Oracle) reports a possible expansion as a blocking finding marked `requires user decision; do not auto-repair`. A goal-changing, out-of-goal, or ambiguous expansion always requires a user decision. A repair stays inside the goals and accepted spec and plan. A proposed expansion is never a PASS: its verdict is `VERDICT: CHANGES` with a blocking finding marked `pending expansion; planner revision required`. Oracle's stated basis is not authority to implement an unrevised plan. PASS is possible only after the planner's revision is independently reviewed again, and any applicable human confirmation for an accepted spec or plan is complete.
- **Decision wins.** If any blocking finding requires a user decision, the whole verdict is a decision: stop and ask, and do not repair even the repairable findings. Repair only when every blocking finding is repairable.
- **Repairs.** When every blocking finding is repairable, the `CHANGES` goes back to the builder as dispatch context. After any `CHANGES`, the checkpoint runs again on the changed inputs; reuse is never allowed after a `CHANGES`. Stop as `BLOCKED` under the same rules as the goal-fit loop: a repair that changes nothing, or the same finding returning unchanged. For B there is nothing to repair: its findings are a classification or a decision.
- **Freshness.** A `PASS` covers the inputs named in its reply. Judge alignment relevance by what the change does to the goals, not by filenames or path lists alone. Run the checkpoint again when the inputs change in an alignment-relevant way: a goal source changes, the accepted spec or plan changes, the approach changes, an acceptance criterion or check changes, or a file change alters what the goals need. Also run it on resume or rework. B always runs for each rework request, including a resumed one. Reuse is allowed only after an applicable `PASS`: a mechanical change (wording, formatting, a fix that keeps the reviewed goals, files, and approach) made after that PASS does not need a new review. The caller records the PASS it relies on, by file, and which case applied.
- **Decisions.** A `requires user decision` finding stops the affected work and its dependents, and the caller asks the user. A planner revision made in response to a finding goes back through an independent read-only review, and a goal, spec, or plan change still needs the user's confirmation through the existing gate. A goal, accepted spec, or accepted plan change goes through the flow's existing reconfirm gate when it has one. Unrelated authorized work continues.
- **Independence.** The same rules as above apply. With no independent reviewer the caller reports `BLOCKED: no independent reviewer`. The affected acceptance and progression stop; unrelated authorized work continues.

## Output

The first line is exactly `VERDICT: PASS` or `VERDICT: CHANGES`. `CHANGES` needs at least one blocking finding. Then use these sections:

```markdown
## Goal sources
- Original request (quoted, short), amendments, accepted constraints. Conflicts: <quotes, or none>

## Trace
- Forward: <goal → covering section, or gap>
- Backward: <untraced item → scope drift, or none>

## Blocking findings
- [section] Problem. Repair: <specific change>

## Decisions for the user
- <goal change or open decision, or none>

## Notes (non-blocking)
- [section] Ponytail or SRP observation. Optional.
```
