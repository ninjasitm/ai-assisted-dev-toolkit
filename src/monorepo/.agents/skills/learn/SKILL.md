---
name: learn
description: Opt-in, advisory learning step for a Factory job that has been verifiably merged. Runs only with durable merge evidence and a current APPROVE, reads the job's final decision and QA (and its retro, when it provably matches), and proposes at most one candidate: no change, one short project memory entry, or a small targeted diff to an existing doc or skill. Writes one redacted advisory learn.md in the job folder. Never edits project files, memory, AGENTS.md, skills, or job state, and never commits, pushes, or publishes. Human approval of an exact patch is a separate task.
---

# Learn

Learn looks back at one finished Factory job and asks whether something it showed is worth keeping for the next relevant job. Most jobs produce nothing worth keeping, and the default answer is no change.

Design inspiration, not copied text: the lee-to/ai-factory `skills/aif-evolve/SKILL.md` at commit `647f47cd0fe64b1968e335dda1ce7ca4a46fe379` (https://github.com/lee-to/ai-factory/blob/647f47cd0fe64b1968e335dda1ce7ca4a46fe379/skills/aif-evolve/SKILL.md), for the idea of turning verified evidence into targeted, reviewed guidance, and the pskoett/pskoett-ai-skills `skills/self-improvement/SKILL.md` at commit `878b0e48bca74849c6219815882e75e60cfa2b72` (https://github.com/pskoett/pskoett-ai-skills/blob/878b0e48bca74849c6219815882e75e60cfa2b72/skills/self-improvement/SKILL.md), for the idea of promoting recurring patterns only after they recur. Neither file is vendored, copied, or required at runtime, and this skill adds no upstream license dependency.

Learn is advice. It never changes a stage, verdict, approval, QA record, merged diff, worktree, or global config.

## When it runs

- **Factory only, opt-in.** Learn runs only for a job whose `job.json` has `"learn": true`. Absent or any other value is off.
- **Verified merge required.** The job's `merge` record must show a completed merge: either `mode: local` with `commit: <sha>`, the post-merge commit of the `--no-ff` merge, or `mode: push-mr` with `state: MERGED` and `merge.mr` exactly equal to the job's recorded `mr` URL. A Forge merge commit is optional and irrelevant there. The stage `merged` alone is never proof. A merge proves only that the merge happened. It is never the identity of the reviewed work.
- **Current approval.** The final `decision.md` must be `APPROVE`. Skip a job still awaiting approval or merge, an `abandoned` job, a job that needs a human, and a job whose current decision is `ESCALATE` or has been superseded. A job repaired after an escalation may learn from its later merge once that merge has a fresh verified `APPROVE`.
- **Missing report recovery.** An opted-in, merged job with a verified merge record and no `learn.md` may run Learn to write only that report. Recovery does not redo the merge, fetch, run tests, reset, or change the worktree. It follows the current `decision.md`, not an older one.
- **Manual use.** Naming a job is not proof. Manual use needs the same verified merge record and current `APPROVE`. Without them, skip. Do not invent commands, checkouts, or paths to look for them. The report goes to chat unless the operator asks for the file.

## Input (read only)

- `job.json`: the `merge` record and the `learn` key. `decision.md`: the current `APPROVE` and its round.
- `qa.md`, and the human's QA answer in `build.md` when present.
- Retro: `round-<R>/retro-<D>.md` is used only when it provably matches the current acceptance basis. Its first line names the decision type (`APPROVE` or `ESCALATE`) and round `R`, and its reviewed or tested input identity equals the identity the current `decision.md` records for that same round and decision type. Compare only those recorded identities. Never use `merge.commit`, or any merge commit, as retro identity. With no matching acceptance basis, omit retro, say so in the report, and keep the narrower evidence. The [retro skill](../retro/SKILL.md) writes that report. Learn never reruns retro, and a missing or stale retro is not a reason to skip.
- The accepted artifacts: `spec.md`, `plan.md`, and `tasks.md` when they exist, plus only the source paths relevant to a candidate, not the whole diff.
- Relevant project guidance: `AGENTS.md`, the project's docs, the Factory and other skills the job used, and approved project memory.

Never read raw transcripts, session logs, shell output, stdout, environment files, credentials, global configuration, another project's data, or the tracker. Make no network call. Run no test, lint, build, git, or tracker command. Do not publish.

If an input is missing or unreadable, name it in the report and continue with what remains. If no current `APPROVE` or no verified merge record can be confirmed, write nothing and say `Learn skipped: <reason>` in chat.

## Evidence rules

A candidate needs evidence the job itself verified: a passing review, a passing QA check, or a human answer recorded in `build.md`. Claims in the builder's prose alone are not evidence.

Recommend nothing when the evidence is:

- **One-off:** it happened once and has no reason to recur.
- **Duplicate:** existing guidance already says it, so cite that guidance instead of adding a copy.
- **Stale:** it describes code or docs that the merged change already replaced.

Candidates come from two kinds of evidence:

- A **recurring verified pattern**: the same friction or fix appears in two or more places in the job's artifacts, for example a repair that repeats across rounds or reviews.
- An **important verified durable convention**: a rule the project's current code or docs confirm and that is not written down yet.

Keep one candidate per run. Prefer none over a weak candidate.

## Outcomes

Each run has exactly one outcome and at most one candidate:

1. **`none`**: no change. Say which evidence was one-off, duplicate, or stale.
2. **`memory`**: one short project memory entry, in the Memory target format below.
3. **`diff`**: a small targeted diff to an existing canonical doc or skill, with the exact path and the lines it changes.

## Candidate shape

Each candidate states:

- **Evidence:** the artifact and its heading or line, redacted.
- **Target:** the exact path. Prefer the existing canonical guidance file (the one that already owns the topic). Use memory only when no canonical file fits.
- **Change:** the single memory entry, or the small diff.
- **Check:** how the next reader verifies the claim (a command, a file, or a test the repo already runs), and the expected result.
- **Counterexample:** one case where the change must not apply, when one exists.
- **Status:** `proposed`, awaiting exact approval.

## Redaction

Replace every secret, token, password, key, credential, connection string, personal email address or name, and internal host with `[redacted]`. Quote no more than the line that shows the problem. Never copy a value that looks like a secret, even if an artifact contains it.

## Memory target

Project memory is a short list of notes, not authority. It never overrides `AGENTS.md`, a skill, or a rule.

- **Existing memory first.** If the project already has a canonical memory file, propose the entry there.
- **Default file.** If no memory file exists, propose `docs/agent-memory.md`. It is created only after the operator approves the exact patch, and never scaffolded in advance. Learn itself never creates it.
- **Entry format.** One line per entry, with a source and a recheck cue:

  ```
  - <one fact or rule>. Source: <job id>/<artifact>. Recheck: <command or file that confirms it>. Added: <YYYY-MM-DD>.
  ```

- **Reading.** A later relevant job reads the approved canonical memory file, or `docs/agent-memory.md` only when that file exists and the job's feature is relevant to it. Factory wiring owns that read.

## Output

Learn writes one file, `factory/jobs/<id>/learn.md`, in the existing job folder, which is ignored by git. It is the only write, on the default path and in recovery. It is advisory and never read as a verdict.

```
# Learn: <job id>
Decision: APPROVE, round <R>
Merge: <local <merge.commit> | push-mr MERGED <merge.mr>>
Inputs: <each file read>
Missing inputs: <none, or the list>
Retro: used | omitted (<reason>)
Outcome: none | memory | diff

Candidate: [memory | diff] <one-line summary>. Evidence: <artifact:heading, redacted>. Target: <exact path>. Change: <entry or small diff>. Check: <how to verify> expected <result>. Counterexample: <case or none>. Status: proposed.
```

When the outcome is `none`, the file records the inputs, the retro status, and the reason, with no candidate line.

## Approval

Learn never applies its own proposal. The operator reviews the exact patch in a separate, later task. Approval covers only that exact text and target. Any change to the text needs a new approval. When approval is given, that task applies the patch and may create the memory file. Commit and push are separate decisions and are not part of Learn.

## Guardrails

- Write nothing except `learn.md` in the job folder, and never silently, even when the operator enabled Learn. Create no other files. Never edit `AGENTS.md`, skills, docs, memory, `job.json`, the merge, the merged diff, QA, decisions, approvals, worktrees, branches, or global or user config.
- Keep the advice short and specific: one target, one change, one check.
