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
   - **CRITICAL — Comment Retrieval Strategy** (use this exact order):
     1. **Use GitHub MCP tools** (preferred) to retrieve ALL comments:
        - `mcp_github_github_pull_request_read` — get PR details and review comments
        - `github-pull-request_activePullRequest` — get the active PR context
        - Fetch **top-level PR comments** (issue-level comments on the PR conversation)
        - Fetch **inline review comments** (comments on specific lines of code)
        - Fetch **pending review comments** (from in-progress reviews)
     2. **If MCP tools fail or return no comments**, fall back to `gh` CLI:
        ```bash
        # Top-level conversation comments (often missed!)
        gh api repos/{owner}/{repo}/issues/{pr_number}/comments
        # Review comments (inline on code)
        gh api repos/{owner}/{repo}/pulls/{pr_number}/comments
        # Reviews themselves (contain top-level review bodies)
        gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews
        ```
     3. **Always check BOTH** top-level issue comments AND inline review comments — agents commonly miss top-level comments by only checking review comments
   - Identify which comments are **unresolved/open** vs already resolved

2. **Review PR Comments from ALL Reviewers**:
   - **CRITICAL**: Use `manage_todo_list` tool to create comprehensive todo list
   - Extract and categorize ALL **unresolved/open** PR comments by severity:
     - Critical (blocking issues)
     - High Priority (should be fixed before merge)
     - Medium Priority (important improvements)
   - For each comment:
     - Summarize the reviewer's feedback
     - Assess confidence in the resolution — can you fix this with high confidence?
     - **If the comment is unclear, ambiguous, or you cannot determine the right fix**:
       - **STOP and ask the user for clarification** before proceeding
       - Present 2-3 recommended solutions with trade-offs for each
       - Explain what you understand and what is unclear
       - Do NOT guess at a fix when the intent is ambiguous
     - If confident, propose a resolution plan with 99.9% confidence level
     - Add to todo list with appropriate status

3. **Verify Requirements**:
   - Read specification if linked
   - Check task completion against acceptance criteria
   - Verify all requirements met

4. **Code Quality & Best Practices**:

   ### Architecture & Patterns
   - [ ] Follows project architecture from `AGENTS.md`
   - [ ] Uses established patterns
   - [ ] Proper separation of concerns
   - [ ] Modularity and clear component boundaries
   - [ ] No code duplication
   - [ ] DRY (Don't Repeat Yourself) principles:
     - [ ] Logic is not duplicated across multiple locations
     - [ ] Shared functionality is extracted to reusable functions/modules
     - [ ] Constants and configuration are centralized
     - [ ] Similar patterns are abstracted appropriately
   - [ ] SOLID principles adherence:
     - [ ] Single Responsibility: Each class/module has one reason to change
     - [ ] Open/Closed: Open for extension, closed for modification
     - [ ] Liskov Substitution: Subtypes can replace base types without breaking
     - [ ] Interface Segregation: No client depends on unused methods
     - [ ] Dependency Inversion: Depend on abstractions, not concretions

   ### Code Quality
   - [ ] Adherence to {{LANGUAGE}}/{{FRAMEWORK}} coding conventions
   - [ ] Clear and descriptive variable/function names
   - [ ] Properly typed (no `any` in TypeScript)
   - [ ] Consistent naming conventions
   - [ ] Appropriate error handling
   - [ ] No debug code or code smells (e.g., duplicate code, long methods)
   - [ ] Comments for complex logic

   ### Testing & Quality
   - [ ] Unit tests for new functionality
   - [ ] Integration tests updated
   - [ ] E2E tests for user-facing features
   - [ ] All tests passing
   - [ ] Edge cases covered

   ### Security & Performance
   - [ ] Input validation implemented
   - [ ] No security vulnerabilities identified
   - [ ] Performance impact assessed
   - [ ] Database queries optimized
   - [ ] Performance bottlenecks addressed

   ### Documentation
   - [ ] Code documentation present
   - [ ] README updated if needed
   - [ ] API documentation current

5. **Potential Issues Identification**:
   - [ ] Potential bugs or edge cases identified
   - [ ] Security vulnerabilities noted
   - [ ] Performance bottlenecks flagged
   - Add all identified issues to todo list

6. **Review Decision**:
   - **Approve**: All criteria met, ready for merge
   - **Request Changes**: Blocking issues found
   - **Comment**: Non-blocking suggestions only

7. **Provide Actionable Improvements**:
   - For each suggestion:
     - Provide clear explanation of why improvement is needed
     - Include specific code examples or patterns
     - Reference best practices or conventions

8. **Fix Tracking**:
   - Create todo list of ALL fixes
   - Mark ONE todo as in-progress before starting
   - Complete the specific fix
   - Mark todo as completed immediately after finishing
   - Never batch completions

9. **Resolve PR Comment Threads**:
   - After each fix is pushed, resolve the comment thread
   - If a comment could NOT be addressed, explain why
   - Verify resolution after pushing
