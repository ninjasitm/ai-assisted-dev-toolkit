# Review Staged Files

Review the current staged files before committing.

> **📋 Builds on [review.md](review.md)** — Uses the same review categories and report format. This prompt adds staged-files-specific context loading and a pre-commit focus.

## Usage

```
/review-staged
```

## Process

1. **Load Staged Context**:
   - Run `git diff --cached` to get all staged changes
   - Run `git diff --cached --stat` for a summary of affected files
   - Load `AGENTS.md` for project patterns
   - Identify the scope of changes (feature, fix, refactor, etc.)

2. **Apply Review Checklist**:
   - Apply all review categories from [review.md](review.md) (Architecture & Patterns, Functionality, Code Quality, Error Handling, Security, Performance, Testing, Documentation)
   - Focus on issues that should block this specific commit

3. **Pre-Commit Checks**:
   - [ ] Documentation updated (see `.claude/rules-snippets/documentation.md`)
   - [ ] No debug code, console logs, or TODO comments left in
   - [ ] No secrets, credentials, or sensitive data
   - [ ] Changes match the commit message scope

4. **Output Format**:

   Use the standard report format from [review.md](review.md).

   If issues are found, recommend either fixing before commit or creating a follow-up task.
