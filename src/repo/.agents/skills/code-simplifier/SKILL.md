---
name: code-simplifier
description: Use after coding sessions or before commits to analyze recently modified code for simplification opportunities. Two-phase process: generate suggestions, then spawn a Staff Engineer reviewer to validate before presenting recommendations. Do not make code changes — analyze and report only.
---

# Code Simplifier

Analyzes recently modified code for simplification opportunities with mandatory peer review of suggestions.

**Purpose:** Reduce unnecessary complexity without changing behavior.

**When to use:**
- At the end of coding sessions
- Before creating commits
- Before code review
- When code has become overly complex

**DO NOT make any code changes.** Only analyze and report.

## Process

### Phase 1: Generate Suggestions

1. **Identify recently modified files:**
   ```bash
   git status --short
   git diff --name-only HEAD~3
   ```

2. **Analyze each file** for:
   - Unnecessary complexity and nesting
   - Redundant code
   - Poor variable/function names
   - Dead code
   - Language-specific anti-patterns

3. **Document suggestions:**
   ```markdown
   ### [filename]

   **Issues found:** [count]

   1. [Line X]: [Description of issue]
      - Current: `[code snippet]`
      - Suggested: `[improved code]`
   ```

### Phase 2: Peer Review (MANDATORY)

After generating suggestions, spawn a reviewer subagent to validate each one. Not all "simplifications" are improvements.

**Reviewer instructions:**

For EACH suggestion:
1. **Verify the claim** — Read the actual code. Is the issue real?
2. **Evaluate the fix** — Does it introduce new problems?
3. **Assign a verdict** — APPROVE, REJECT, or MODIFY

**Rejection heuristics:**

REJECT if:
- Only 2 occurrences of "duplication" (rule of three — wait for 3+)
- Abstraction would require complex parameters
- Context is intentionally different across "duplicates"
- The "fix" trades one complexity for another
- Current code is idiomatic for the framework
- Nested ternary is actually readable in context

APPROVE if:
- Confirmed dead code (unreachable branches)
- Genuine unused functions/variables
- 3+ identical patterns that could share a helper
- Clear bug or logic error

MODIFY if:
- Valid issue but wrong solution proposed

### Phase 3: Present Final Report

```markdown
## Code Simplification Report

### Suggestions

[Phase 1 analysis]

### Review Verdicts

| # | Suggestion | Verdict | Action |
|---|------------|---------|--------|
| 1 | ... | APPROVE | ... |
| 2 | ... | REJECT | Keep as-is |

### Final Recommendations

Only APPROVED and MODIFIED items are actionable.
```

## Integration with Pre-Commit Workflow

```
1. RUN TESTS
2. RUN TYPECHECK
3. CODE SIMPLIFIER     ← This skill (analyze + review)
4. IMPLEMENT approved changes only
5. CODE REVIEW
6. RE-RUN TESTS
7. COMMIT
```
