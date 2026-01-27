# Implementation Plan: {{FEATURE_NAME}}

**Issue:** {{ISSUE_ID}}
**Spec:** [spec.md](spec.md)
**Author:** {{AUTHOR}}
**Created:** {{DATE}}
**Status:** Draft | In Progress | Completed

## Overview

Brief summary of the implementation approach.

## Prerequisites

Before starting implementation:

- [ ] Feature spec approved
- [ ] Design reviewed
- [ ] Dependencies available
- [ ] Test environment ready

## Architecture

### High-Level Design

```
[Component diagram or flow chart]
```

### Component Changes

| Component        | Change Type      | Description           |
| ---------------- | ---------------- | --------------------- |
| {{component_1}}  | New/Modified     | Brief description     |
| {{component_2}}  | New/Modified     | Brief description     |

## Implementation Steps

### Phase 1: Foundation

**Estimated Time:** X hours/days

#### Step 1.1: {{Step Title}}

**Files:**
- `path/to/file1.{{FILE_EXTENSION}}`
- `path/to/file2.{{FILE_EXTENSION}}`

**Tasks:**
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Notes:**
Implementation details or considerations.

#### Step 1.2: {{Step Title}}

**Files:**
- `path/to/file.{{FILE_EXTENSION}}`

**Tasks:**
- [ ] Task 1
- [ ] Task 2

### Phase 2: Core Implementation

**Estimated Time:** X hours/days

#### Step 2.1: {{Step Title}}

**Files:**
- `path/to/file.{{FILE_EXTENSION}}`

**Tasks:**
- [ ] Task 1
- [ ] Task 2

### Phase 3: Integration & Testing

**Estimated Time:** X hours/days

#### Step 3.1: Write Tests

**Files:**
- `{{TEST_DIR}}/feature.test.{{FILE_EXTENSION}}`

**Tasks:**
- [ ] Unit tests for component A
- [ ] Unit tests for component B
- [ ] Integration tests

#### Step 3.2: Integration

**Tasks:**
- [ ] Connect components
- [ ] End-to-end validation
- [ ] Performance testing

## Testing Strategy

### Unit Tests

| Test Case               | Component    | Expected Outcome      |
| ----------------------- | ------------ | --------------------- |
| Test case description   | Component    | Expected result       |

### Integration Tests

| Test Scenario           | Components   | Expected Outcome      |
| ----------------------- | ------------ | --------------------- |
| Scenario description    | A, B, C      | Expected result       |

### Manual Testing

- [ ] Test case 1: Description
- [ ] Test case 2: Description

## Migration/Deployment

### Database Migrations

```bash
# Migration commands
{{MIGRATION_COMMAND}}
```

### Feature Flags

If using feature flags:
- Flag name: `feature_{{FEATURE_NAME}}`
- Default: disabled
- Enable for: specific users/environments

### Rollback Plan

Steps to rollback if issues are discovered:

1. Step 1
2. Step 2
3. Step 3

## Dependencies

### External Dependencies

| Dependency      | Version  | Purpose              |
| --------------- | -------- | -------------------- |
| package-name    | ^1.0.0   | Why it's needed      |

### Internal Dependencies

- Component/service this depends on

## Risks & Mitigations

| Risk                    | Mitigation Strategy       |
| ----------------------- | ------------------------- |
| Risk description        | How to address            |

## Definition of Done

- [ ] All implementation steps completed
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Feature flag configured (if applicable)
- [ ] Deployed to staging
- [ ] QA sign-off
- [ ] Ready for production

## Timeline

| Phase                | Start Date | End Date   | Status      |
| -------------------- | ---------- | ---------- | ----------- |
| Phase 1: Foundation  | {{DATE}}   | {{DATE}}   | Not Started |
| Phase 2: Core        | {{DATE}}   | {{DATE}}   | Not Started |
| Phase 3: Testing     | {{DATE}}   | {{DATE}}   | Not Started |
| Deployment           | {{DATE}}   | {{DATE}}   | Not Started |

## Notes

Additional implementation notes, decisions made during development, or lessons learned.

---

## Progress Log

| Date       | Update                              |
| ---------- | ----------------------------------- |
| {{DATE}}   | Plan created                        |
