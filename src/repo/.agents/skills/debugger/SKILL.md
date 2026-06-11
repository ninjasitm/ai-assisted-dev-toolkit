---
name: debugger
description: Use when dispatched to debug an issue — enforces systematic root cause investigation before any fix attempts. Complements the systematic-debugging skill with a structured dispatch template and reporting format.
---

# Debugger

Structured debugging dispatch template with mandatory root cause investigation.

**Core principle:** NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.

**When to use:**
- Dispatched by a coordinator to investigate a specific bug
- Test failures, production bugs, unexpected behavior
- Performance problems, build failures, integration issues

**Related skill:** `systematic-debugging` — contains the full methodology. This skill provides the dispatch template and report format.

## Dispatch Template

When dispatching a debugger subagent, use this prompt structure:

```
You are debugging an issue. Follow the systematic-debugging skill process.

## The Issue

[Describe the problem — error messages, unexpected behavior, symptoms]

## Reproduction Steps

[How to trigger the issue — commands, URLs, user actions]

## Environment

Project: [Project name and stack]

## MANDATORY: Use Systematic Debugging

You MUST follow the systematic-debugging skill process. This is non-negotiable.

**The Iron Law:** NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

## Phases

### Phase 1: Root Cause Investigation (REQUIRED BEFORE ANY FIX)

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - If not reproducible → gather more data, don't guess

3. **Check Recent Changes**
   - What changed that could cause this?
   - Git diff, recent commits
   - New dependencies, config changes

4. **Gather Evidence**
   - Add diagnostic logging at component boundaries
   - Log what data enters/exits each layer
   - Run once to gather evidence showing WHERE it breaks

5. **Trace Data Flow**
   - Where does bad value originate?
   - What called this with bad value?
   - Keep tracing up until you find the source

### Phase 2: Pattern Analysis

1. Find working examples in the codebase
2. Compare against references
3. Identify differences between working and broken
4. Understand dependencies

### Phase 3: Hypothesis and Testing

1. Form single hypothesis: "I think X is the root cause because Y"
2. Test minimally — SMALLEST possible change
3. Verify before continuing
4. If didn't work, form NEW hypothesis (don't stack fixes)

### Phase 4: Implementation

1. Create failing test case FIRST
2. Implement single fix addressing root cause
3. Verify fix — test passes, no regressions
4. If 3+ fixes failed: STOP and question the architecture

## Red Flags — STOP If You Think

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "I don't fully understand but this might work"
- "Let me add multiple changes and run tests"

**ALL of these mean: STOP. Return to Phase 1.**

## Report Format

When done, report:

1. **Root Cause:** What was actually causing the issue
2. **Evidence:** How you confirmed this was the root cause
3. **Fix Applied:** The specific change made
4. **Verification:** How you confirmed it's fixed
5. **Regression Test:** Test added to prevent recurrence
6. **Files Changed:** List of modified files

## When Stuck

If the debugger reports:

- "I've tried 3+ fixes without success"
- "Each fix reveals new problems"
- "This requires architectural changes"

**STOP** — This indicates an architectural problem, not a bug. Escalate before continuing.
