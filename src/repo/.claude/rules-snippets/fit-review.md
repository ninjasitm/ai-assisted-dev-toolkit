# Goal-Fit Review Brief

Read and follow this brief when a gate or command asks for a goal-fit review of a spec, a plan, or a build's scope. It adds to the reviewer rules of the calling flow.

## Reviewer

- Read-only. Do not edit files, stage, or commit. Do not write any file the caller did not ask for.
- Independent of the author. Use Oracle when it is available read-only; otherwise a separate reviewer in fresh context. The author's self-review, the author's summary, and a single session playing every role do not count.
- If no independent reviewer can run, the caller reports `BLOCKED`. Do not review in its place.
- Review the current artifacts from scratch on every run, including resumed runs. Do not rely on an earlier reply, an earlier summary, or the author's account of what changed.

## Goal sources

Use only these as goal authority:

1. The original user request, verbatim, and every explicit user amendment (intake answers, operator change requests, rework decisions). The caller passes them to you as text in the dispatch.
2. Accepted constraints from earlier artifacts, when the caller passes them: for a plan review, the accepted spec's requirements, acceptance criteria, and `[DECIDED]` items; for a build review, the accepted spec and plan. Trace against these. They are not goal authority on their own.

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
