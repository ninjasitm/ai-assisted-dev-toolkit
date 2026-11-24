---
name: code-review
description: Use for read-only review of one defined change set (staged, unstaged or new local files, a branch range, or a PR diff) against project standards and against the requirements it must meet. Use when running /review or /review-pr, or when a reviewer needs scope and requirements rules.
---

# Code Review

Read-only review of one named scope, judged on two lenses. It reports findings. It does not edit, stage, commit, push, reply to threads, or approve.

_Attribution: the two-lens split (project standards, requirements fit) is adapted from mattpocock/skills (MIT), `skills/engineering/code-review/SKILL.md` at commit `d65391149dbb5fe76478e76fa8d5122b2aa5a70e`. No text is copied._

## 1. Resolve scope first

Review exactly one scope and name it in the report. Never default to the whole working tree.

| Invocation                              | Scope                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| Explicit paths, feature, or file list   | Only those files, with the diff for those files                                          |
| `/review` with no argument              | Relevant local changes (below)                                                           |
| `/review-pr <number or URL>`            | The PR's own diff, base to head, as the PR host reports it (below)                       |

**Local changes.** Collect three states and keep them separate:

- Staged: `git diff --cached` (and `--stat`).
- Unstaged: `git diff`.
- New: `git ls-files --others --exclude-standard`, read directly.

A file can be staged and then edited again. `git diff` then shows only the later edit and hides the staged change. So always read `git diff --cached` for staged files, and label each finding `staged` or `unstaged`.

**Relevance.** Include a dirty file only if it is in the explicit scope or was produced by this session's work. List unrelated dirty files as skipped with the reason. If the relevant set is unclear, list the candidates and ask the user which to include before reviewing.

**Committed range.** When the user names a base or asks for a branch review, use `git diff <base>...HEAD`. Reuse the base and head SHA rule in `review.md` (Load Context). Do not add a second diff method.

**PR diff.** Take the diff from the PR host for the PR's base and head. Do not use the local working tree or local branch. If the diff cannot be fetched, stop and report that. Do not substitute a local diff. Comment retrieval and thread handling stay in `review-pr.md`.

## 2. Establish the requirements source

Use the first that applies:

1. Requirements supplied in the request: quoted or linked acceptance criteria, or an explicit goal statement.
2. Fallback only: a recognized, project-linked approved artifact (a spec or plan that the request, PR description, or linked issue points to and the project marks as approved). Do not guess artifact paths.

A bare command argument (`/review this`), a generic title (`fix stuff`, `WIP`), or a branch name is not a requirement. A draft is not a source. If neither applies, the requirements lens is **not assessed**. Say so. Never write "pass" for an unassessed lens.

## 3. Review through two lenses

**Project standards.** Check against `AGENTS.md`, the rules snippets, the categories in `review.md`, and nearby code. Judge by the project's existing patterns, not personal taste.

**Requirements fit** (only when a source was established):

- **Missed:** a stated requirement with no implementation or test.
- **Misimplemented:** the change contradicts the source.
- **Scope creep:** a change that no requirement traces to. Report it for the user to decide. It is not an automatic failure.

Use the severities from `review.md` (Critical, Important, Minor). A requirements gap is a finding at one of those severities. It is not a veto, a new approval step, or an extra review round.

## 4. Report

Use the report format in `review.md`. Its Lenses block is the single canonical format: fill its fields (scope, skipped, project standards, requirements fit, requirements source). Do not add a second Lenses block here.

## Rules

- Read-only. No edits, staging, commits, pushes, or thread replies from this skill.
- Dispatch separate read-only reviewers only where the calling workflow already does (the orchestrator checkpoint in `review.md`). Do not add reviewers.
- Keep the calling workflow's verdict and handoffs unchanged.
- No tracker, auth, or bootstrap is needed for local review. For PR review, use the calling workflow's existing fallbacks.
