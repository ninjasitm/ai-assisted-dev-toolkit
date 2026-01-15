---
description: Create an implementation plan from a feature specification or requirement
---

You are helping to create an implementation plan for a feature or requirement.

## Your Task

1. **Load context**:

   - Read `AGENTS.md` for project architecture and patterns
   - Review `docs/constitution.md` for project principles (if exists)
   - Check relevant existing code for patterns to follow

2. **Analyze the requirement**:

   - Identify functional requirements
   - Identify non-functional requirements (performance, security, etc.)
   - Note dependencies on existing code or external services
   - List acceptance criteria

3. **Create the implementation plan**:

   - **Technical approach**: How will this be implemented?
   - **File changes**: What files need to be created or modified?
   - **Data model changes**: Any database or schema changes?
   - **API changes**: Any endpoints to add or modify?
   - **Dependencies**: External packages or services needed?
   - **Testing strategy**: How will this be tested?

4. **Output the plan**:
   - Create `docs/plans/{{FEATURE_NAME}}.md` with the plan
   - Include estimated complexity and effort
   - List any open questions or decisions needed

## Plan Template

```markdown
# Implementation Plan: {{FEATURE_NAME}}

## Overview

[Brief description of the feature]

## Technical Approach

[How this will be implemented]

## File Changes

- [ ] `path/to/file.{{FILE_EXTENSION}}` - Description of changes

## Testing Strategy

- Unit tests for...
- Integration tests for...

## Open Questions

- [ ] Question 1
```
