---
name: improve-codebase-architecture
description: Opt-in, report-only architecture review. Use only when the user explicitly asks to review a named scope or find shallow modules and poor seams. Reads the named scope, or a few recent hotspots when none is named, checks local guidance and ADRs against real callers and tests, and reports at most three ranked candidates, or none. Never edits files or writes to git or a tracker. For over-engineering-only requests, use ponytail-audit instead.
---

# Improve Codebase Architecture

Report where a module boundary might be simpler, with evidence. The output is one short report in chat. Nothing else changes.

_Attribution: the candidate-seam approach, deletion test, and depth-versus-shallowness framing are adapted from mattpocock/skills (MIT), `skills/engineering/improve-codebase-architecture/SKILL.md` and `skills/engineering/codebase-design/SKILL.md` at commit `d65391149dbb5fe76478e76fa8d5122b2aa5a70e`. The license is at https://github.com/mattpocock/skills/blob/d65391149dbb5fe76478e76fa8d5122b2aa5a70e/LICENSE. This file is a new adaptation for this toolkit. It does not copy the source text and needs no other skill._

## When to Use

Only on an explicit request, such as "improve the architecture of `src/billing`" or "find shallow modules in the recent changes." Not on your own initiative, as a side effect of another task, or as a Factory gate or hold.

Use another skill instead when:
- The question is correctness or standards for a diff: `code-review`.
- The request is over-engineering only, with no seam question: `ponytail-audit`.
- The change is tests or behavior: `test-driven-development`, after a decision.
- There is no scope and no hotspot signal: ask for the scope in one line.

## Boundaries

- Read files and local history only. Do not run writing git commands (`commit`, `stash`, `checkout`, `reset`, `fetch`, `pull`, `push`, `add`), and do not edit code, docs, or config.
- Do not create files, HTML, temporary output, or branches, and do not write to a tracker, PR, or ADR.
- Do not interview the user. Put missing decisions in the report as assumptions and open questions.
- No subagent is required. If the calling flow delegates, a read-only exploration subagent may gather evidence. It must not write, and the report goes back to the caller.
- Follow-on planning happens only when the user directs it, using the existing `writing-plans` skill.

## Process

1. **Scope.** Use the named scope. If none is named, take at most 10 recently changed source files from `git log --since="30 days ago" --name-only --pretty=format:`, excluding lockfiles, generated files, and docs. State the rule you used.
2. **Guidance.** Read `AGENTS.md` or `CLAUDE.md` where present, and ADRs under `docs/architecture/` or `docs/adr/`. A recorded decision outranks a fresh opinion. If a candidate reverses one, flag it as a decision to revisit, and only when the friction is real.
3. **Evidence.** For each module in scope, read its real call sites and the tests that exercise it through its public interface. Cite `path:line`. Record the friction you actually observe: a reader bouncing between modules to understand one behavior, an interface nearly as complex as its implementation, a seam that leaks, a change that had to touch several places. Caller count and recent churn are clues to investigate, not conclusions. One caller can be the right seam, and a busy module can be well shaped. Neither number alone qualifies or disqualifies a candidate. Do not invent callers, tests, or history. If a check cannot run, say so.
4. **Deletion test.** For each suspect module, imagine deleting it and read the result:
   - Complexity vanishes: it was a pass-through. Verify that its behavior is really trivial, checking callers and side effects, before calling it a consolidation candidate.
   - Complexity reappears across several callers: it earns its keep. Do not recommend deleting it.
   - Complexity collects into one better owner elsewhere: consolidation may be worth it, with evidence that the owner exists and fits.
5. **Candidates.** Keep at most 3, ranked. A candidate needs observed friction, a plausible simpler seam described in one or two sentences, evidence from callers or tests, and no unflagged conflict with a recorded decision. Zero is valid.

## Output

Use one shape. Write nothing else.

```markdown
## Architecture review: <scope>

**Scope rule:** <named | recent hotspots: rule used>
**Guidance read:** <files and ADRs, or "none found">

### Candidates
1. **<name>**: <one-line summary>
   - Friction seen: <observations, with path:line>
   - Current vs proposed seam: <plain language>
   - Deletion test: <vanishes | reappears in <callers> | collects in <owner>>
   - Callers and tests: <path:line list>
   - Maintainability and testability: <what a maintainer touches now vs after, without invented counts; whether the seam is testable through its public interface>
   - Risk and missing evidence: <what could break, and what is unverified>

### Recommendation
<no change recommended | consider candidate N>, in two sentences. Open questions go here as a list; they are not asked interactively.
```

If no candidate meets the bar, the Candidates section reads "None met the bar" with one line per module checked.
