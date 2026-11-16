# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Task tool (superpowers:code-reviewer):
  Use template at requesting-code-review/code-reviewer.md. If the dispatch names a goal-fit or alignment contract, follow the reply format of any goal-fit or alignment contract instead of that template.

  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
  GOAL_CONTEXT: [overall goal summary of the whole work, as context only]
  ORIGINAL_REQUEST_AND_AMENDMENTS: [VERBATIM original request and every explicit amendment, pasted as text; the authority]
  CONSEQUENTIAL_FINDINGS: report separately and do not fix them. Scope, approach, requirement, or plan findings go to the coordinator for the planner (see subagent-workflow Plan and Spec Changes).
```

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
