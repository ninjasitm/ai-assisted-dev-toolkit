# Fix Implementation Plan: {{FIX_NAME}}

**Issue:** {{ISSUE_ID}}
**Spec:** [spec.md](spec.md)
**Author:** {{AUTHOR}}
**Created:** {{DATE}}
**Priority:** P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)
**Status:** Planning | In Progress | In Review | Deployed

## Overview

Brief summary of the fix and implementation approach.

## Prerequisites

- [ ] Root cause confirmed in spec
- [ ] Impact assessment complete
- [ ] Stakeholders notified
- [ ] Rollback plan ready

## Implementation Steps

### Step 1: Immediate Mitigation (if needed)

**Timeline:** ASAP

**Tasks:**
- [ ] Apply temporary workaround
- [ ] Notify affected users
- [ ] Enable monitoring

### Step 2: Prepare Fix

**Timeline:** X hours

**Files to modify:**
- `path/to/file1.{{FILE_EXTENSION}}`
- `path/to/file2.{{FILE_EXTENSION}}`

**Tasks:**
- [ ] Create feature branch from {{DEFAULT_BRANCH}}
- [ ] Implement code changes
- [ ] Add/update tests
- [ ] Update documentation

**Code Changes:**

```{{FILE_EXTENSION}}
// Describe the key changes
```

### Step 3: Testing

**Timeline:** X hours

**Tasks:**
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Manual verification of fix
- [ ] Verify no regression

**Test Commands:**
```bash
{{TEST_COMMAND}}
```

### Step 4: Code Review

**Timeline:** X hours

**Tasks:**
- [ ] Create pull request
- [ ] Address review comments
- [ ] Get approval from {{REVIEWER}}

### Step 5: Deployment

**Timeline:** X hours

**Tasks:**
- [ ] Deploy to staging
- [ ] Verify fix in staging
- [ ] Deploy to production
- [ ] Monitor for 24 hours

## Rollback Plan

If the fix causes issues:

1. **Immediate:** Revert commit `{{COMMIT_HASH}}`
2. **Database:** Run rollback migration (if applicable)
3. **Cache:** Clear cache keys: `{{CACHE_KEYS}}`
4. **Notify:** Alert team via {{NOTIFICATION_CHANNEL}}

**Rollback command:**
```bash
git revert {{COMMIT_HASH}}
{{DEPLOY_COMMAND}}
```

## Verification

### Success Criteria

- [ ] Original bug no longer reproducible
- [ ] No new errors in logs
- [ ] Performance metrics stable
- [ ] User reports resolved

### Monitoring

| Metric              | Expected Value | Alert Threshold |
| ------------------- | -------------- | --------------- |
| Error rate          | < 0.1%         | > 1%            |
| Response time       | < 200ms        | > 500ms         |

## Communication

### Stakeholder Updates

| Stakeholder      | Update Method | When             |
| ---------------- | ------------- | ---------------- |
| Engineering      | Slack         | On fix complete  |
| Product          | Email         | On deployment    |
| Customers        | Status page   | If applicable    |

### Post-Mortem

- [ ] Schedule post-mortem meeting
- [ ] Document lessons learned
- [ ] Create follow-up tickets for improvements

## Timeline

| Phase                | Target Time    | Actual Time | Status      |
| -------------------- | -------------- | ----------- | ----------- |
| Mitigation           | +1 hour        |             | Not Started |
| Fix Development      | +4 hours       |             | Not Started |
| Testing              | +2 hours       |             | Not Started |
| Code Review          | +2 hours       |             | Not Started |
| Deployment           | +1 hour        |             | Not Started |
| Monitoring           | +24 hours      |             | Not Started |

## Notes

Additional notes, edge cases discovered, or decisions made during implementation.

---

## Progress Log

| Time       | Update                              |
| ---------- | ----------------------------------- |
| {{TIME}}   | Plan created                        |
