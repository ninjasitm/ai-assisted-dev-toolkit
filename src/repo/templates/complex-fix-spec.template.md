# Fix Specification: {{FIX_NAME}}

**Issue:** {{ISSUE_ID}}
**Author:** {{AUTHOR}}
**Created:** {{DATE}}
**Severity:** Critical | High | Medium | Low
**Status:** Investigating | Root Cause Found | Fix In Progress | Resolved

## Problem Summary

Brief one-paragraph description of the bug or issue.

## Symptoms

### Observed Behavior

What users or systems are experiencing:

- Symptom 1
- Symptom 2
- Symptom 3

### Expected Behavior

What should happen instead:

- Expected behavior 1
- Expected behavior 2

### Reproduction Steps

1. Step 1
2. Step 2
3. Step 3
4. Observe: [describe the bug]

### Environment

- **Environment:** Production / Staging / Development
- **Version:** {{VERSION}}
- **Browser/OS:** (if applicable)
- **User Impact:** X users affected

## Root Cause Analysis

### Investigation Timeline

| Time     | Action           | Finding                  |
| -------- | ---------------- | ------------------------ |
| {{TIME}} | Reviewed logs    | Found error pattern      |
| {{TIME}} | Checked database | Data inconsistency found |

### Root Cause

Detailed explanation of why the bug occurred:

```
[Code snippet or configuration showing the root cause]
```

**Why it happened:**

- Reason 1
- Reason 2

### Contributing Factors

- Factor 1 (e.g., missing validation)
- Factor 2 (e.g., race condition)
- Factor 3 (e.g., edge case not handled)

## Impact Assessment

### Affected Components

| Component       | Impact Level | Description       |
| --------------- | ------------ | ----------------- |
| {{component_1}} | High/Med/Low | How it's affected |
| {{component_2}} | High/Med/Low | How it's affected |

### Data Impact

- Was any data corrupted? Yes / No
- If yes, describe scope and recovery plan

### Business Impact

- Users affected: X
- Revenue impact: $X or N/A
- SLA breach: Yes / No

## Proposed Solution

### Approach

Describe the fix approach at a high level.

### Code Changes

**File:** `path/to/file.{{FILE_EXTENSION}}`

Before:

```{{FILE_EXTENSION}}
// Problematic code
```

After:

```{{FILE_EXTENSION}}
// Fixed code
```

### Additional Changes

- [ ] Database migration required
- [ ] Configuration change required
- [ ] Cache invalidation required

## Testing Requirements

### Regression Tests

- [ ] Test that the specific bug is fixed
- [ ] Test related functionality still works
- [ ] Test edge cases

### Test Cases

| Test Case             | Input | Expected Output    |
| --------------------- | ----- | ------------------ |
| Original bug scenario | X     | Y (fixed behavior) |
| Edge case 1           | A     | B                  |
| Edge case 2           | C     | D                  |

## Prevention

### How to Prevent Recurrence

- [ ] Add validation for X
- [ ] Improve error handling
- [ ] Add monitoring/alerting
- [ ] Update documentation

### Process Improvements

- Lesson learned 1
- Lesson learned 2

## References

- [Issue Tracker]({{ISSUE_TRACKER_URL}})
- [Related PR](link)
- [Error Logs](link)
- [Monitoring Dashboard](link)

---

## Changelog

| Date     | Author     | Change Description    |
| -------- | ---------- | --------------------- |
| {{DATE}} | {{AUTHOR}} | Initial investigation |
