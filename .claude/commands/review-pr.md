---
description: Conduct comprehensive pull request code review
---

# Review Pull Request

Conduct comprehensive code review for pull requests with structured fix tracking.

## Usage

```bash
/review-pr 42
/review-pr https://github.com/{{REPO_OWNER}}/{{PROJECT_NAME}}/pull/42
```

## Process

1. **Load PR Context**:
   - Get PR details (title, description, changed files)
   - Extract issue reference if available
   - Get PR diff and file changes
   - Identify unresolved/open vs resolved comments

2. **Review PR Comments**:
   - Extract and categorize ALL unresolved PR comments by severity:
     - Critical (blocking issues)
     - High Priority (should be fixed before merge)
     - Medium Priority (important improvements)
   - For each comment:
     - Summarize the reviewer's feedback
     - Assess confidence in resolution
     - If unclear, STOP and ask for clarification
     - If confident, propose a resolution plan

3. **Verify Requirements**:
   - Read specification if linked
   - Check task completion against acceptance criteria

4. **Code Quality & Best Practices**:
   - Architecture & Patterns
   - Code Quality
   - Testing & Quality
   - Security & Performance
   - Documentation

5. **Review Decision**:
   - **Approve**: All criteria met, ready for merge
   - **Request Changes**: Blocking issues found
   - **Comment**: Non-blocking suggestions only

6. **Provide Actionable Improvements**:
   - Clear explanation of why improvement is needed
   - Specific code examples or patterns
   - Reference best practices or conventions

7. **Fix Tracking**:
   - Create todo list of ALL fixes
   - Mark ONE todo as in-progress before starting
   - Complete the specific fix
   - Mark todo as completed immediately after finishing
   - Never batch completions

8. **Resolve PR Comment Threads**:
   - After each fix is pushed, resolve the comment thread
   - If a comment could NOT be addressed, explain why
   - Verify resolution after pushing
