---
description: Create {{ISSUE_TRACKER}} tickets from requirements or task files
---

# Create Tickets from Requirements

Parse requirement documents or task breakdown files and create structured tickets in {{ISSUE_TRACKER}}.

## Usage

```
/assign-tasks docs/features/requirements.md
/assign-tasks docs/tasks/feature-breakdown.md
```

## Process

1. **Parse Document**:

   - Load the specified document (.md, .txt, .json)
   - Detect document structure (headers, lists, task categories)
   - Extract task hierarchy: Epic → Story → Task → Subtask

2. **Classify Tasks**:

   - **Epic**: Large features, 13+ story points
   - **Story**: User-focused, 3-8 story points
   - **Task**: Implementation work, 1-5 story points
   - **Subtask**: Granular work, <2 story points

3. **Estimate Effort**:

   - 0.5 hours → 1 story point
   - 1-2 hours → 2 story points
   - 3-4 hours → 3 story points
   - 5-6 hours → 5 story points
   - 7-8 hours → 8 story points
   - 9+ hours → 13 story points

4. **Create Tickets**:

   - Create in proper hierarchy order (Epics first, then Stories, then Tasks)
   - Link child issues to parents
   - Set assignees, labels, and story points
   - Create dependency links where noted

5. **Generate Report**:
   - List all created tickets with IDs
   - Show hierarchy and relationships
   - Report total story points
   - Identify any warnings or unresolved dependencies

## Document Format Support

**Markdown Headers**:

```markdown
# Epic: Feature Name

## Story: User Story

### Task: Implementation Task
```

**Dependency Keywords**:

- "depends on"
- "after"
- "requires"
- "blocks"

## Configuration

- **Project Key**: `{{PROJECT_KEY}}`
- **Default Assignee**: `{{DEFAULT_ASSIGNEE}}`
- **Labels**: Based on content categories

```markdown
# Epic: User Authentication System

## Story: User Registration

### Task: Create User Model

#### Subtask: Add validation attributes
```

**Tagged Format**:

```markdown
### [CORE] Create User Model (3 hours)

**Dependencies**: None
**Files**: app/Models/User.php, database/migrations/\*\_create_users_table.php
**Acceptance Criteria**:

- [ ] User model with proper $fillable and $casts
- [ ] Migration with proper constraints and indexes
- [ ] Model factory for testing
```

**JSON Format**:

```json
{
  "epic": {
    "title": "User Management System",
    "storyPoints": 21,
    "stories": [
      {
        "title": "User Registration",
        "storyPoints": 8,
        "tasks": [...]
      }
    ]
  }
}
```

The system intelligently parses any supported format and creates properly linked Jira tickets following CHIP project conventions and story point guidelines.
