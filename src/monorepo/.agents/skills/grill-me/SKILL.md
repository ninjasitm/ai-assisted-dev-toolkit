---
name: grill-me
description: Use to resolve blocking ambiguity in a request before a spec, plan, or build relies on it. Asks only the unresolved decisions that would change the outcome, in rounds with a recommended answer each, and stops once they are settled. Use when a request is genuinely ambiguous or the user asks to be grilled. Not a general stress-test of ideas.
---

# Grill Me

Interview the user until the decisions that change the outcome are settled. This skill only gathers answers. It changes nothing else.

_Attribution: the design-tree, frontier, and round format are adapted from mattpocock/skills (MIT), `skills/productivity/grilling/SKILL.md` at commit `d65391149dbb5fe76478e76fa8d5122b2aa5a70e`. This skill is self-contained: no text is copied and it needs no other skill._

## When to Use

- A caller (`/specify`, `/plan`, or the user) finds real ambiguity: scope, acceptance criteria, or a choice that changes what gets built.
- Not for clear requests. Do not interview for its own sake.

## Rules

- **Read-only.** No file, tracker, git, or other side-effecting writes. Reading the repo and running read-only lookups is allowed.
- **Facts are yours.** Before asking, check the request, the repo, and the docs. Anything that needs exploration goes to a read-only sub-agent or a direct read. Ask the user only for decisions.
- **Decisions are the user's.** Put each one to the user. Do not assume an answer.
- **Batch the frontier.** Ask every question whose prerequisites are already settled in one round. A question that depends on an unanswered one waits for a later round.
- **Recommend and trade off.** Give each question numbered options with a short pro/con, and one recommended option. Word the question so a "yes" accepts the recommendation.
- **Never auto-confirm.** Silence, a recommendation, or a partial answer is not acceptance. Record it as open.
- **Blocking only.** Ask only decisions that block the next step. Record a non-blocking preference as open; do not ask it.
- **Stop when enough.** Stop when the blocking decisions are settled, or the frontier is empty. A round cap set by the caller (for example, Factory) wins over the default. Without one, if more than three rounds seem necessary, say the request needs scoping and stop.
- **Existing approvals stand.** Never override or reopen an approval the caller or user already gave.
- **Not a gate.** This skill does not replace independent fit review, artifact acceptance, or human approval.

## Round Format

```
**Q1 — <title>**: <question, with numbered options and trade-offs>
Recommended: <option> — <one-line reason>
```

Separate questions with a blank line. Stop after the round and wait for answers.

## Done Report

Return to the caller:

- **Settled**: each decision and the user's answer, quoted.
- **Open**: unanswered decisions, each marked blocking or not.
- **Not accepted**: recommendations or assumptions the caller must not treat as given.
