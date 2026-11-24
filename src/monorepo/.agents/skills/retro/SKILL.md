---
name: retro
description: "Advisory retrospective on one acceptance decision or pre-merge check. Finds where the work needed a stop, a repair, or a manual step, and suggests the cheapest guardrail for each: a deterministic check when the rule is mechanical, or a judgment rule when it is not. Read-only and advisory. Factory runs it inline at each acceptance decision of a job that opted in (retro true). It can also be run by hand on a Factory job or a feature folder."
---

# Retro

Adapted from `mattpocock/skills`, `skills/engineering/retro/SKILL.md` at commit `d65391149dbb5fe76478e76fa8d5122b2aa5a70e` (https://github.com/mattpocock/skills/blob/d65391149dbb5fe76478e76fa8d5122b2aa5a70e/skills/engineering/retro/SKILL.md). That source is MIT licensed: Copyright (c) 2026 Matt Pocock. The license is at https://github.com/mattpocock/skills/blob/d65391149dbb5fe76478e76fa8d5122b2aa5a70e/LICENSE. This file is a new adaptation for Factory's acceptance evidence. It does not copy the source text.

The retro looks back at one acceptance decision and names the environment changes that would have made the next run need fewer stops. It is advice. It never changes a verdict, stage, gate, approval, or merge.

## Input

One acceptance decision of one Factory job. Read only the current job artifacts:

- `decision.md` (the approver's or the escalation's decision, with its header lines `Round: N` and `Tested commit: <sha|none>`)
- `build.md` and `qa.md` (in the build location)
- `round-<R>/review-*.md` and `round-<R>/alignment-*.md` for the round the decision names
- `intake.md`, `plan.md`, `tasks.md`, and `spec.md` when it exists (a plan-only job has no `spec.md`, and that is expected)

Manual use: the operator names a job id, or a feature folder that resolves to a job. With no job, name the artifacts to read. Do not read session logs, shell output, tracker data, or the network.

## Steps

1. Read the input above. Name any file that is missing, and continue.
2. List friction: each point where the work needed a stop, a repair, a rework, a redo, or a manual step. Give each its evidence: the artifact and its line or heading. Redact as described below.
3. Sort each finding into one category:
   - **Navigation:** the agent had to hunt for a file or a fact. A navigation pointer would fix it.
   - **Guardrails:** an automated check would have caught the error, or a check exists but is unwired or broken. Read the repo's own check commands in `AGENTS.md` first, and report an unwired check as the finding, not a new one.
   - **Standards:** a reviewer or a rule missed something, or a rule is unclear.
   - **Steering:** an instruction in `AGENTS.md` or a skill is too long, unused, or contradicted.
   - **Tool economy:** an expensive tool call could have been avoided.
   - **Information access:** a fact the agent needed was not available to it.
4. Classify each guardrail recommendation:
   - **Deterministic:** the rule is mechanical (a fixed pattern, a banned API, an import shape, a file location). Recommend a check the repo already runs, or the cheapest one it can add: a lint rule, a type check, a test, a pre-commit hook, or a CI job. Prefer a check over a written rule.
   - **Judgment:** the rule needs a human eye (cross-file consistency, "matches the surrounding style"). Recommend a line in the project's coding-standards document, read by the reviewer. Never use judgment for a rule a check could enforce.
5. Rank findings most severe first:
   - **Blocker:** the decision was an `ESCALATE`, a `needs-human` stop, or a failed check.
   - **Repair:** a `CHANGES` verdict was repaired.
   - **Friction:** the work slowed down, with no stop.
   Keep the list short. Ten findings at most.

## Redaction

Replace every secret, token, password, key, credential, connection string, personal email address or name, and internal host with `[redacted]`. Quote no more than the line that shows the problem. Never copy a value that looks like a secret into the report, even if the artifact contains it.

## Report

Use this shape:

```
Decision: <APPROVE|ESCALATE>, round <R>
Tested commit: <sha|none>

# Retro: <job id or feature>
Inputs: <each file read>
Missing inputs: <none, or the list>

1. [Blocker | Repair | Friction] <category>: <one-line finding>. Evidence: <artifact:line, redacted>. Guardrail: <deterministic: the check> | <judgment: the rule and where it goes>. Advice: <one specific change>.
```

## Where the report goes

Under Factory, the orchestrator saves the report once per acceptance decision, as `round-<R>/retro-<D>.md` in the job folder. The first two lines are the basis header copied from the current `decision.md`: `Decision` and `Tested commit`. Before saving, build those two lines from `decision.md`. If the file exists and its first two lines match, skip: it was saved for this decision and tested commit. If it exists and they differ, do not overwrite it. The rules are in `.agents/skills/factory/SKILL.md`, section Retro. A manual run on a job saves the same file only when the operator asks. A manual run with no job prints the report in chat and writes nothing.

## Guardrails for this skill

- The report is advice. Do not present it as a verdict, and do not change any stage, gate, approval, or merge.
- Run no tests, lint, build, git, or tracker command.
- Edit no code, no standards file, and no job state other than the report file.
- Keep the advice specific: name the check or the rule, and the file it goes in.
