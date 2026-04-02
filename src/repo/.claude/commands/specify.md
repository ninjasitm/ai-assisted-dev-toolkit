---
description: Create a feature specification from a natural language description
---

You are helping to create a feature specification based on the user's description.

## Your Task

1. **Parse the feature description**:

   - Extract the core functionality being requested
   - Identify user stories or use cases
   - Note any constraints or requirements mentioned

2. **Load context**:

   - Read `AGENTS.md` for project architecture
   - Review existing features in `docs/specs/` for format consistency
   - Check related code for context

3. **Create the specification**:

   - Create `docs/specs/{{FEATURE_NAME}}.md`
   - Use the template structure below
   - Be specific and actionable

4. **Output**:
   - Confirm specification created
   - Summarize key requirements
   - Suggest next step: `/plan` to create implementation plan

## Specification Template

```markdown
# Feature: {{FEATURE_NAME}}

## Overview

[What this feature does and why it's needed]

## User Stories

- As a [user type], I want [goal] so that [benefit]

## Functional Requirements

1. [Requirement 1]
2. [Requirement 2]

## Non-Functional Requirements

- Performance: [expectations]
- Security: [considerations]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Out of Scope

- [What this feature does NOT include]
```
