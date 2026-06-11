# Review Pull Request

Conduct comprehensive code review for pull requests with structured fix tracking.

> **📋 Builds on [review.md](review.md)** — Uses the same review categories and report format. This prompt adds PR-specific workflows: comment retrieval, fix tracking, and thread resolution.

## Usage

```bash
/review-pr 42
/review-pr <PR-or-MR-url>
```

## Orchestrator Checkpoint

> **🛑 For large PRs** (10+ files or 3+ domains): Dispatch specialist reviewers in parallel:
>
> - **Backend Architect** → architecture, API design, database
> - **Frontend Developer** → UI, components, accessibility
> - **Reviewer** → code quality, SOLID, DRY
> - **Documenter** → documentation completeness
>   Each reviewer returns findings independently; the orchestrator merges results.
>   See `.claude/rules-snippets/subagent-workflow.md` for patterns.

## Process

1. **Load PR Context**:
   - Get PR details (title, description, changed files)
   - Extract issue reference if available
   - Get PR diff and file changes
   - **CRITICAL — Comment Retrieval Strategy**:
     1. **Use issue tracker MCP tools** (preferred) to retrieve ALL comments:
        - Get PR/MR details and review comments
        - Get the active PR/MR context
        - Fetch **top-level conversation comments** (often missed!)
        - Fetch **inline review comments** (comments on specific lines of code)
        - Fetch **pending review comments** (from in-progress reviews)
     2. **If MCP tools fail or unavailable**, fall back to the CLI — see the `issue-tracker` skill (`.agents/skills/issue-tracker/SKILL.md`) for your tracker's API commands.
     3. **Always check BOTH** top-level conversation comments AND inline review comments — agents commonly miss top-level comments by only checking inline review comments
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

4. **Apply Review Checklist**:
   - Apply all review categories from [review.md](review.md) (Architecture & Patterns, Functionality, Code Quality, Error Handling, Security, Performance, Testing, Documentation)
   - Add all identified issues to todo list

5. **Review Decision**:
   - **✅ Approve**: All criteria met, ready for merge
   - **❌ Request Changes**: Blocking issues found
   - **💬 Comment**: Non-blocking suggestions only

6. **Provide Actionable Improvements**:
   - For each suggestion:
     - Provide clear explanation of why improvement is needed
     - Include specific code examples or patterns
     - Reference best practices or conventions

7. **Output Format**:

   Use the standard report format from [review.md](review.md), with these PR-specific additions:

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

   [Use the standard categories from review.md: Architecture & Patterns, Functionality, Code Quality, Error Handling, Security, Performance, Testing, Documentation]

   ## Action Items Checklist

   - [ ] Fix: [Critical issue 1]
   - [ ] Fix: [Critical issue 2]
   - [ ] Address: [High priority comment]
   - [ ] Improve: [Medium priority suggestion]

   ## Fixes Applied

   _After fixes are implemented, populate this table with every change made:_

   | File              | Issue                           | Fix                              |
   | ----------------- | ------------------------------- | -------------------------------- |
   | `ExampleFile.php` | Missing import → fatal error    | Added `use Namespace\ClassName;` |
   | `ExampleFile.php` | Unreachable code after `return` | Removed dead `break` statements  |
   | `AnotherFile.php` | Field missing from `$casts`     | Added `'field' => 'datetime'`    |

   Every fix must appear in this table — one row per file+issue pair.
   ```

8. **Report Review Status**:
   - Review decision with clear justification
   - Summary of key findings by severity
   - Inline comments for specific code locations
   - Todo list status showing progress
   - Next steps if changes requested

9. **Confirm Execution Plan**
   - If there are changes, ask the user to confirm the execution plan with a (Y/n)

10. **If the plan is confirmed, proceed with fix Tracking with Internal Todo List**:
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

11. **Resolve PR Comment Threads After Fixing**:
    - **CRITICAL**: After each comment is addressed and the fix is pushed:
      1. **Resolve the comment thread** via your issue tracker's tools:
         - Use the issue tracker MCP tools to submit a review resolving threads
         - Or reply to each resolved thread with a brief summary of what was fixed
         - Or use the CLI — see the `issue-tracker` skill for your tracker's API commands
      2. **If a comment could NOT be addressed**:
         - Reply to the thread explaining why (e.g., out of scope, needs more context, trade-off decision)
         - Ask the user whether to leave it open or resolve with an explanation
      3. **Verify resolution** — after pushing, confirm the comment threads show as resolved in the PR
