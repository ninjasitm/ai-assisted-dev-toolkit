---
description: Create a feature specification from a description
---

# Create Feature Specification

Start a new feature by creating a specification. This is the first step in the development lifecycle.

## Usage

```
/specify Add user authentication with OAuth2 support
/specify Create a REST API for product catalog
```

## Process

1. **Parse Feature Description**:
   - Extract core functionality
   - Identify user stories
   - Note constraints and requirements

2. **Determine Context**:
   - Check `AGENTS.md` for project architecture
   - Review existing features in `docs/specs/`
   - Understand tech stack and patterns

3. **Create Feature Directory**:
   ```
   docs/features/{{FEATURE_NAME}}/
   ```

4. **Generate Specification**:

   Create `docs/specs/{{FEATURE_NAME}}.md` using template:

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
   - Scalability: [requirements]

   ## Acceptance Criteria
   - [ ] Criterion 1
   - [ ] Criterion 2

   ## Technical Constraints
   - [Framework/library requirements]
   - [Integration requirements]

   ## Out of Scope
   - [What this feature does NOT include]

   ## Open Questions
   - [ ] [Questions needing clarification]
   ```

5. **Create Git Branch** (optional):
   ```bash
   git checkout -b feature/{{FEATURE_NAME}}
   ```

6. **Report Completion**:
   - Feature directory path
   - Spec file path
   - Branch name (if created)
   - Ready for `/plan` command

## Guidelines

- Be specific and actionable
- Mark ambiguities with `[NEEDS CLARIFICATION: question]`
- Include acceptance criteria for testability
- Reference existing patterns from `AGENTS.md`
