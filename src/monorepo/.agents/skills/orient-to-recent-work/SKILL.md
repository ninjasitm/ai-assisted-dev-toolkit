---
name: orient-to-recent-work
description: Build a compact mental model of recent project activity before any non-trivial task. Use proactively at the start of a session and before any investigation, planning, refactor, or multi-file change. Skip only for trivial fixes (typos, isolated docs, version bumps, mechanical refactors with a known target).
---

# Orient to recent work

Before starting a non-trivial task, build a compact mental model of what has happened recently in this repository. This prevents re-litigating settled decisions and surfaces context that may not be in code or docs.

## When to use

**Use proactively:**
- At the start of a session (before the first task)
- Before any investigation, planning, refactor, or multi-file change
- When picking up a thread after a break

**Skip for:**
- Single-line typo fixes
- Isolated documentation updates
- Dependency version bumps without logic changes
- Mechanical refactors with a known target

## Protocol (do once per session, hold the result)

1. **Read `CHANGELOG.md` [Unreleased]** — pending changes the team is preparing
2. **Read the most recent released section of `CHANGELOG.md`** — what just shipped
3. **Run `git log --oneline -20`** — recent commits at a glance
4. **For commits that touch files you'll modify, run `git show <hash> --stat`** — scope only, not the full diff
5. **Hold this mental model in working memory** for the session; re-run only if task scope changes dramatically

## Output format

A 3–5 line summary capturing:
- What's in flight (Unreleased highlights)
- What just shipped (last release)
- Any recent decisions affecting your task (naming, refactor, schema)
- If your task touches recently-modified files, append: `Recent touch on <files>: <commit summary>`

## Why

- Decisions have non-code context (commit messages, PR descriptions)
- Fresh sessions have no memory — this creates session-level orientation
- Prevents re-litigating recently-settled questions
