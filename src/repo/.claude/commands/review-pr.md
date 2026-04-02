````mdc
---
description: Conduct comprehensive pull request code review
---

# Review Pull Request

Conduct comprehensive code review for pull requests with structured fix tracking.

## Usage

```bash
/review-pr 42
/review-pr https://github.com/{{REPO_OWNER}}/{{PROJECT_NAME}}/pull/42
````

## Process

1. **Load PR Context**:
   - Get PR details (title, description, changed files)
   - Extract issue reference if available
   - Get PR diff and file changes
   - **CRITICAL**: Use GitHub MCP tools to retrieve ALL unresolved/open comments from ALL reviewers

2. **Review PR Comments from ALL Reviewers**:
   - **CRITICAL**: Use `manage_todo_list` tool to create comprehensive todo list
   - Extract and categorize ALL unresolved/open PR comments by severity:
     - Critical (blocking issues)
     - High Priority (should be fixed before merge)
     - Medium Priority (important improvements)
   - For each comment:
     - Summarize the reviewer's feedback
     - Propose a resolution plan with 99.9% confidence level
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
   - **✅ Approve**: All criteria met, ready for merge
   - **❌ Request Changes**: Blocking issues found
   - **💬 Comment**: Non-blocking suggestions only

7. **Provide Actionable Improvements**:
   - For each suggestion:
     - Provide clear explanation of why improvement is needed
     - Include specific code examples or patterns
     - Reference best practices or conventions

8. **Output Format**:

   ```markdown
   ## Review Summary

   **Decision**: [✅ Approve | ❌ Request Changes | 💬 Comment]

   [Concise 2-3 sentence summary of review findings]

   ## PR Comments & Resolution Plan

   | Severity | Reviewer | Comment   | Resolution Plan | Confidence |
   | -------- | -------- | --------- | --------------- | ---------- |
   | Critical | @user    | [Summary] | [Plan]          | 99.9%      |
   | High     | @user    | [Summary] | [Plan]          | 99.9%      |
   | Medium   | @user    | [Summary] | [Plan]          | 99.9%      |

   ## Code Quality Findings

   ### Critical Issues

   - **[File:Line]**: [Issue description]
     - **Impact**: [Why this matters]
     - **Fix**: [Specific actionable suggestion]

   ### High Priority

   - **[File:Line]**: [Issue description]
     - **Impact**: [Why this matters]
     - **Fix**: [Specific actionable suggestion]

   ### Medium Priority (Suggestions)

   - **[File:Line]**: [Improvement suggestion]
     - **Rationale**: [Explanation]
     - **Example**: [Code snippet if applicable]

   ## Potential Issues

   ### Bugs & Edge Cases (If Applicable)

   - [Description of potential bug]
   - [Edge case not handled]

   ### Security Concerns (If Applicable)

   - [Security vulnerability or concern]

   ### Performance Bottlenecks (If Applicable)

   - [Performance issue identified]

   ## Testing Notes (If Applicable)

   - [Verification performed or needed]
   - [Test coverage assessment]

   ## Action Items Checklist

   - [ ] Fix: [Critical issue 1]
   - [ ] Fix: [Critical issue 2]
   - [ ] Address: [High priority comment]
   - [ ] Improve: [Medium priority suggestion]
   ```

```

9. **Report Review Status**:
   - Review decision with clear justification
   - Summary of key findings by severity
   - Inline comments for specific code locations
   - Todo list status showing progress
   - Next steps if changes requested

10. **Confirm Execution Plan**
    - If there are changes, ask the user to confirm the execution plan with a (Y/n)

11. **If the plan is confirmed, proceed with fix Tracking with Internal Todo List**:
    - **Before Starting Work**:
      - Use `manage_todo_list` to create comprehensive list of ALL fixes:
        - PR comments requiring fixes (by severity)
        - Code quality issues
        - Potential bugs or security concerns
        - Performance improvements
    - **During Implementation**:
      - Mark ONE todo as `in-progress` before starting
      - Complete the specific fix
      - Test the fix (if applicable)
      - Mark todo as `completed` IMMEDIATELY after finishing
      - Move to next todo and repeat
    - **Never batch completions** - mark each done immediately
```
