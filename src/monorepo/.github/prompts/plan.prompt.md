---
description: Create an implementation plan for a feature
---

# Plan Feature Implementation

Plan how to implement the specified feature. This is the second step in the development lifecycle.

## Usage

```
/plan {{ISSUE_KEY}}-123
/plan docs/specs/user-authentication.md
```

## Process

1. **Load Feature Context**:
   - Read specification from `docs/specs/{{FEATURE_NAME}}.md`
   - Review `AGENTS.md` for architecture patterns
   - Check `docs/constitution.md` for project principles

2. **Analyze Requirements**:
   - Functional requirements
   - Non-functional requirements
   - Dependencies on existing code
   - External service integrations

3. **Generate Implementation Plan**:

   Create `docs/plans/{{FEATURE_NAME}}.md` with:

   - **Architecture Overview**: Component structure, data flow
   - **Tech Stack**: Libraries and frameworks to use
   - **File Structure**: Exact paths following project conventions
   - **API Design**: Input/output schemas (if applicable)
   - **Database Changes**: Schema modifications (if needed)
   - **Security Considerations**: Auth, validation, data protection
   - **Testing Strategy**: Unit, integration, E2E approach
   - **Integration Points**: Dependencies on other features

4. **Generate Additional Artifacts** (if needed):
   - `docs/research/{{FEATURE_NAME}}.md` - Technical research
   - `docs/models/{{FEATURE_NAME}}.md` - Data model details
   - `docs/contracts/{{FEATURE_NAME}}/` - API specifications

5. **Report Completion**:
   - Plan file path
   - Additional artifacts created
   - Ready for `/tasks` command

## Plan Template

```markdown
# Implementation Plan: {{FEATURE_NAME}}

## Overview
[Feature description and goals]

## Architecture
[Component structure and relationships]

## Tech Stack
- {{FRAMEWORK}}: [usage]
- {{DATABASE}}: [usage]

## File Structure
- `{{SRC_DIR}}/{{FEATURE_NAME}}/`
  - `index.{{FILE_EXTENSION}}` - Entry point
  - `types.{{FILE_EXTENSION}}` - Type definitions

## API Design
[Endpoints, inputs, outputs]

## Database Changes
[Schema modifications]

## Testing Strategy
- Unit tests for [components]
- Integration tests for [flows]
- E2E tests for [scenarios]

## Security
[Authentication, authorization, validation]

## Open Questions
- [ ] Question 1
```
