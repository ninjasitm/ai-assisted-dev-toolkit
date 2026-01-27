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

## Task Consolidation Rules (CRITICAL)

Before creating tickets, consolidate tasks to reduce noise and improve focus:

### Grouping Guidelines

- **Merge related work**: Combine tasks touching the same component or feature area
- **Bundle by deliverable**: Group by what gets shipped, not individual steps
- **Collapse small items**: Tasks < 2 story points should be subtasks or merged
- **Limit hierarchy depth**: Prefer Epic → Story → Task (avoid Subtasks when possible)

### Maximum Ticket Counts

| Feature Size        | Max Stories | Max Tasks/Story | Max Subtasks/Task |
| ------------------- | ----------- | --------------- | ----------------- |
| Small (< 8 SP)      | 1-2         | 2-3             | 0                 |
| Medium (8-21 SP)    | 2-4         | 3-4             | 2-4               |
| Large (21-55 SP)    | 4-8         | 4-6             | 4-8               |
| XL (55+ SP)         | 6-12        | 5-8             | 8-15              |

### Before Creating Tickets, Ask:

1. Can these 2+ tasks be combined into one?
2. Is this subtask really necessary, or is it just a step?
3. Would a developer naturally do these together anyway?
4. Does each ticket represent meaningful, demonstrable progress?

## Epic Discovery (Parent Task Assignment)

All stories and tasks MUST belong to an Epic. Before creating tickets:

### 1. Check for Explicit Parent

- If the requirement doc specifies an Epic, use it
- If linked from an existing Epic, use that Epic

### 2. Search for Matching Epic

If no parent is specified, use MCP/{{ISSUE_TRACKER}} tools to find a suitable Epic:

```
# Search for open Epics in the project
- List all Epics with status: Open, In Progress
- Filter by labels/components matching the feature domain
- Check Epic descriptions for related keywords
```

**Matching Criteria** (in priority order):

1. **Domain match**: Epic covers same feature area (e.g., "Authentication", "Payments")
2. **Component match**: Epic targets same system component
3. **Sprint/Release match**: Epic is in current or upcoming sprint
4. **Keyword match**: Epic title/description contains related terms

### 3. Fallback to Maintenance Epic

If no appropriate Epic exists:

- Search for existing "Maintenance" or "Tech Debt" Epic
- If none exists, create one:
  ```
  Epic: Maintenance & Improvements - {{QUARTER}}
  Description: Technical improvements, bug fixes, and maintenance work
  Labels: maintenance, tech-debt
  ```

### 4. Report Parent Assignment

In the ticket creation report, always include:

```
Parent Epic: [EPIC-123] Epic Title
Assignment Reason: Domain match (Authentication) | Maintenance fallback
```

## Process

1. **Parse Document**:

   - Load the specified document (.md, .txt, .json)
   - Detect document structure (headers, lists, task categories)
   - Extract task hierarchy: Epic → Story → Task → Subtask

2. **Consolidate & Classify** (do this BEFORE creating tickets):

   - **Group related items** by component, feature area, or deliverable
   - **Merge small tasks** (< 2 SP) into related larger tasks
   - **Eliminate redundant subtasks** that are obvious steps
   - **Validate counts** against maximum limits above

3. **Classify Consolidated Tasks**:

   - **Epic**: Large features, 13+ story points
   - **Story**: User-focused deliverable, 3-13 story points (prefer larger stories)
   - **Task**: Implementation work, 2-8 story points (avoid < 2 SP tasks)
   - **Subtask**: Only for complex tasks needing breakdown, 1-3 story points

4. **Estimate Effort**:

   - 0.5-1 hours → Merge with related task (too small alone)
   - 2-3 hours → 2 story points
   - 4-6 hours → 3-5 story points
   - 7-12 hours → 8 story points
   - 13+ hours → 13 story points (consider splitting into stories)

5. **Create Tickets**:

   - Create in proper hierarchy order (Epics first, then Stories, then Tasks)
   - Link child issues to parents
   - Set assignees, labels, and story points
   - Create dependency links where noted

6. **Generate Report**:
   - List all created tickets with IDs
   - Show hierarchy and relationships
   - Report total story points
   - **Show consolidation summary**: "Merged X items into Y tickets"

## Anti-Patterns to Avoid

❌ **Don't create separate tickets for**:

- "Create file X" and "Configure file X" (one ticket)
- "Write tests" and "Run tests" (one ticket)
- Each individual file change in a feature
- Steps that take < 1 hour

✅ **Do combine into single tickets**:

- All database work for an entity (model + migration + seeder)
- Related API endpoints (CRUD operations for one resource)
- All configuration and setup for a feature
- Testing for a component (unit + integration)

## Document Format Support

**Markdown Headers**:

```markdown
# Epic: Feature Name

## Story: User Story (combines related implementation)

### Task: Implementation Task (only if story needs breakdown)
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
