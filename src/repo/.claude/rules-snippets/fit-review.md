# Goal-Fit Brief

Read and follow this brief when a gate or command asks for a goal-fit check of a spec, a plan, or an approach, or for a review of a build. It adds to the reviewer rules of the calling flow.

## Two kinds of check

- **Goal-fit check** (letters A, B, C): "does this direction serve the stated goal?" Oracle runs it, read-only, and returns a direction verdict: `VERDICT: PASS` or `VERDICT: CHANGES`.
- **Review** (letter D, the post-build implementation check, and all code review): "is the work built correctly, and does it fit the goal?" A fresh independent reviewer runs it after the work is declared done. Oracle never runs a review.

Keep the words apart: call A to C goal-fit checks everywhere, and keep "review" for D and code review.

## Letters (one meaning each)

| Letter | Meaning | Run by |
| --- | --- | --- |
| **A** | Spec goal-fit check: the spec, before the spec gate, and any spec change | Oracle; fallback a fresh reviewer |
| **B** | Plan goal-fit check: a written execution plan, before the plan gate or execution, and any plan change | Oracle; fallback a fresh reviewer |
| **C** | Approach goal-fit check: the planner's approach note for a task, before its first build | Oracle; fallback a fresh reviewer |
| **D** | Implementation review: the work after it is declared done, before aggregate verification and review. In Factory this is the post-build implementation check | Fresh independent reviewer, never Oracle |
| **R** | User-directed rework classification: classifies a user's rework note as `repair`, `plan change`, or `spec change`, and does not repair it | Fresh independent reviewer, never Oracle |

In Factory, the post-build implementation check is checkpoint D, and its saved output is the post-build fit record, `round-<U>/post-build-fit-<j>.md`. A fresh independent reviewer, never Oracle, runs it after the build is declared done.

## Applicability

C and D apply only when there is an accepted spec or plan. Supplied-only tasks and fixes skip C and D; they need no approach note. Builder inputs carry the approach note only where C ran. Prompts refer to this section and do not restate it.

## Oracle and fallback

- Oracle steers: it runs only goal-fit checks A, B, and C, read-only. It never runs D, code review, or the post-build fit check, and it never approves a human gate, a scope expansion, a publication, or a merge.
- When Oracle is not available read-only, a fresh independent reviewer runs the goal-fit check. Block only when neither is available: report `BLOCKED: no independent reviewer` and stop the affected acceptance or progression. Unrelated authorized work continues.
- Human spec and plan confirmation stays separate and mandatory. No goal-fit check or review replaces it.

## Reviewer

- Read-only. Do not edit files, stage, or commit. Do not write any file the caller did not ask for.
- Independent of the author. The author's self-review, the author's summary, and a single session playing every role do not count.
- Review the current artifacts from scratch on every run, including resumed runs. Do not rely on an earlier reply, an earlier summary, or the author's account of what changed.
- Read-only guidance: the checker, Oracle included, never authors or edits a spec, plan, approach note, or code. A planner authors any revision. Checker feedback is guidance; the Expansion rule is the only path to added work, and no checker changes a goal.

## Goal sources

Use only these as goal authority:

1. The original user request, verbatim, and every explicit user amendment (intake answers, operator change requests, rework decisions). The caller passes them to you as text in the dispatch.
2. Accepted constraints from earlier artifacts, when the caller passes them: for plan goal-fit (B), the accepted spec's requirements, acceptance criteria, and `[DECIDED]` items (or, on a factory plan-only route with no spec, the plan's Requirements Source and Acceptance Criteria); for D, the accepted spec and plan. Trace against these. They are not goal authority on their own.

Not goal sources: a slug, a ticket key, a ticket title, the existing spec alone, the planner's or author's summary, and any reviewer finding from an earlier round.

If the original request is not in the dispatch, do not infer goals from the spec or the plan. The caller must supply the original request before dispatch. For R, if it is missing, do not dispatch or save a classification: report `BLOCKED: missing authoritative baseline`, obtain the request, and retry R. For A–D, a checker given no original request returns `VERDICT: CHANGES` with a blocking finding: `Missing authoritative baseline: requires user decision; do not auto-repair.`

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
- Other blocking findings are scoped repairs: name the section and the specific change. The caller passes your findings to the author as dispatch context and checks the changed artifacts again. You do not write repair notes or repair files.
- `VERDICT: PASS` means no blocking findings. Absence of blocking findings is not a pass. A finding that needs a user decision is blocking, so it is never a pass.

## Plan goal-fit check (B)

Applies when the artifact under goal-fit check is a written execution plan, or a plan that drives delegated or multi-task execution. It is letter B. It is not a separate checkpoint. Reply: the first line is `VERDICT: PASS` or `VERDICT: CHANGES`. The second line is `Checkpoint: B`. The third is `Reviewed inputs: <plan and authoritative sources>`.

It excludes bookkeeping-only in-session todos, single-task approach notes already covered by C, and trivial or focused single-file work with no consequential execution plan. Substance decides, not format: a consequential scope, approach, requirement, or acceptance change cannot escape the check by being called a todo, note, or single-file edit.

The expansion rule, planner authorship of revisions, independence, the baseline, and the human gates apply by reference. A revised plan is checked again before PASS. The coordinator owns freshness and reuse: it reuses an applicable PASS only as the Freshness rule allows, and a skill entry point alone never starts a second check.

A plan's order is: planner revision, then a B PASS, then the applicable human confirmation for any accepted spec or plan, then execution. A justified expansion is never executed on a B PASS alone: the revised plan must pass B and receive its applicable confirmation first. Repairs from B go to the planner, not the builder. The record of a B PASS is the conversation or the existing progress record, noting the plan version checked; no new file or schema is required, and the by-file record in Freshness does not apply to B.

## Checkpoints and dispatch

Only flows whose configured instructions include these checks call this brief at those points; they are not a universal requirement. When configured, name the letter in the dispatch and reply.

- **A, spec goal-fit check:** the spec, before the spec gate, and again after any spec change.
- **B, plan goal-fit check:** the written plan, before the plan gate or execution, and again after any plan change. See the section above.
- **C, approach goal-fit check:** the planner's read-only approach note against the supplied task, before the task's first build. Applicability above governs it.
- **D, implementation review:** runs immediately after the builder declares done (after reconciling multiple builders, if any), before verification and code review, and again after every repair. Applicability above governs it.
- **R, user-directed rework classification:** the user's rework note, before any build restarts. It classifies the note and does not repair it. Its reply begins `CLASSIFICATION: <repair|plan change|spec change>`, which replaces the `VERDICT:` first line for R only. The Factory file for R is `rework-classification-<b>.md`. A repair stays within the goals and accepted spec and plan. A plan change goes through B, and a spec change goes through A; each then needs its human confirmation before the rebuild.

The dispatch carries the goal sources above (the verbatim original request and every amendment), the accepted spec and plan when the flow has them, the letter, and the reviewed inputs: the paths, the commit, and the changed-file list, or the approach note for C. Check results may be passed as evidence. They are never goal authority. Every dispatch also carries the overall work's summary and goals as context: the whole feature or job, not only the current task or step. The verbatim original request and explicit amendments remain the authority, and the summary never replaces them.

## Rules

- **Reply.** For A–D, the first line is `VERDICT: PASS` or `VERDICT: CHANGES`, followed by `Checkpoint: <A|B|C|D>` and `Reviewed inputs: <paths, commit, changed files, plan and sources, or approach note>`. R starts with `CLASSIFICATION: <repair|plan change|spec change>` and does not use the A–D header.
- **Expansion.** A reviewer finding alone never authorizes new scope. Oracle advice may recommend considering an in-goal expansion when it states a basis, the addition traces to a quoted original goal or explicit amendment, and no goal changes; this advice is not permission to expand scope. Such a possibility is a planner revision request, not a direct edit: the planner revises the affected plan or approach note, an independent read-only check reviews the revision, and an accepted spec or plan still needs its existing human confirmation. A fallback reviewer (not Oracle) reports a possible expansion as a blocking finding marked `requires user decision; do not auto-repair`. A goal-changing, out-of-goal, or ambiguous expansion always requires a user decision. A repair stays inside the goals and accepted spec and plan. A proposed expansion is never a PASS: its verdict is `VERDICT: CHANGES` with a blocking finding marked `pending expansion; planner revision required`. Oracle's stated basis is not authority to implement an unrevised plan. The revised artifact must pass its applicable goal-fit check before it is offered for human confirmation. Neither the proposed expansion nor the checker's PASS authorizes implementation; wait for the required human confirmation.
- **Decision wins.** If any blocking finding requires a user decision, the whole verdict is a decision: stop and ask, and do not repair even the repairable findings. Repair only when every blocking finding is repairable.
- **Repairs.** When every blocking finding is repairable, the `CHANGES` goes back to the builder or planner as dispatch context. After any `CHANGES`, the check runs again on the changed inputs; reuse is never allowed after a `CHANGES`. Stop as `BLOCKED` under the same rules as the goal-fit loop: a repair that changes nothing, or the same finding returning unchanged.
- **Freshness.** A `PASS` covers the inputs named in its reply. Judge relevance by what the change does to the goals, not by filenames or path lists alone. Run the check again when the inputs change in a goal-relevant way: a goal source changes, the accepted spec or plan changes, the approach changes, an acceptance criterion or check changes, or a file change alters what the goals need. Every rework's R classification runs again on resume or rework; A or B runs again when R classifies the rework as a spec or plan change. Reuse is allowed only after an applicable `PASS`: a mechanical change (wording, formatting, a fix that keeps the reviewed goals, files, and approach) made after that PASS does not need a new check. The caller records the PASS it relies on, by file, and which case applied.
- **Decisions.** A `requires user decision` finding stops the affected work and its dependents, and the caller asks the user. A planner revision made in response to a finding goes back through an independent read-only check, and a goal, spec, or plan change still needs the user's confirmation through the existing gate. Unrelated authorized work continues.
- **Independence.** The rules above apply. With no independent checker or reviewer, the caller reports `BLOCKED: no independent reviewer`. The affected acceptance and progression stop; unrelated authorized work continues.

## Legacy names (installs before this rule)

Patch and upgrade older installs with these names. Keep existing files as they are; do not rewrite their contents.

- Old checkpoint A (after a build, before review, Factory): the **post-build fit check**. Read `round-<U>/alignment-A-<j>.md` as `round-<U>/post-build-fit-<j>.md`.
- Old checkpoint B (rework note, Factory): **R**. Read `alignment-B-<b>.md` as `rework-classification-<b>.md`. Its old `Classification:` line is the `CLASSIFICATION:` first line.
- Old "plan review" (`Review: plan review`): **B**. Its reply reads `Checkpoint: B`.
- Old checkpoints C and D keep their letters, and now apply only with an accepted spec or plan (see Applicability).
- Old letter meanings are retired. A file or reply that uses an old meaning for a letter is read through this list, not as a new meaning.

## Output

The first line is exactly `VERDICT: PASS` or `VERDICT: CHANGES`, except R, whose first line is `CLASSIFICATION:` (see above). `CHANGES` needs at least one blocking finding. Then use these sections:

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
