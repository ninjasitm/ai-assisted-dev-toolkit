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

Before creating tickets, consolidate tasks to reduce noise and improve focus.

### Maximum Ticket Counts

| Feature Size     | Max Stories | Max Tasks/Story | Max Subtasks/Task |
| ---------------- | ----------- | --------------- | ----------------- |
| Small (< 8 SP)   | 1-2         | 2-3             | 0                 |
| Medium (8-21 SP) | 2-4         | 3-4             | 2-4               |
| Large (21-55 SP) | 4-8         | 4-6             | 4-8               |
| XL (55+ SP)      | 6-12        | 5-8             | 8-15              |

### Consolidation Checklist

Before creating each ticket, ask:

1. **Can these 2+ items be combined?** Group related work together
2. **Is this subtask necessary?** Or is it just an obvious step?
3. **Would a developer do these together?** If yes, combine them
4. **Does this represent meaningful progress?** If not, merge it

### Grouping Guidelines

- **Merge related work**: Same component or feature area = 1 ticket
- **Bundle by deliverable**: Group by what ships together
- **Collapse small items**: < 2 SP should be subtasks or merged
- **Limit hierarchy**: Prefer Epic → Story → Task (minimize Subtasks)

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

2. **Consolidate First** (BEFORE creating tickets):
   - **Group related items** by component, feature area, or deliverable
   - **Merge small tasks** (< 2 SP) into related larger tasks
   - **Eliminate redundant subtasks** that are obvious steps
   - **Validate counts** against maximum limits above

3. **Classify Consolidated Tasks**:
   - **Epic**: Large features, 13+ story points
   - **Story**: User-focused deliverable, 3-13 story points (prefer larger)
   - **Task**: Implementation work, 2-8 story points (avoid < 2 SP)
   - **Subtask**: Only for complex tasks, 1-3 story points (use sparingly)

4. **Estimate Effort**:
   - 0.5-1 hours → **Merge with related task** (too small alone)
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
   - **Consolidation summary**: "Merged X raw items into Y tickets"

## API Rate Limiting & Throttling

**CRITICAL**: {{ISSUE_TRACKER}} APIs have rate limits. When creating multiple tickets:

### Batch Strategy

- **Small batches** (< 5 tickets): Create all tickets immediately
- **Medium batches** (5-15 tickets): Create in groups of 5 with 2-second delays
- **Large batches** (15+ tickets): Create in groups of 5 with 3-5 second delays

### Implementation Pattern

```
1. Create Epic(s) first → Wait 2 seconds
2. Create Stories (batch of 5) → Wait 2 seconds
3. Create next Stories (batch of 5) → Wait 2 seconds
4. Create Tasks (batch of 5) → Wait 3 seconds
5. Continue batching with delays
```

### Error Handling

- **429 (Rate Limit)**: Wait 10 seconds, then retry
- **503 (Service Unavailable)**: Wait 5 seconds, then retry
- **Max retries**: 3 attempts per ticket
- **Failed tickets**: Report at end with error details

### Progress Reporting

```
Creating tickets...
✓ Epic created: PROJ-123
  [Waiting 2s to avoid rate limiting...]
✓ Stories created: PROJ-124, PROJ-125, PROJ-126 (batch 1/3)
  [Waiting 2s...]
✓ Stories created: PROJ-127, PROJ-128, PROJ-129 (batch 2/3)
```

### Best Practices

- ⚠️ **Never create more than 5 tickets without a delay**
- ⚠️ **Always wait at least 2 seconds between batches**
- ⚠️ **Increase delays if rate limit errors occur**
- ✓ **Show progress updates between batches**
- ✓ **Report any failed tickets with retry instructions**

## Anti-Patterns to Avoid

❌ **Don't create separate tickets for**:

- "Create file X" and "Configure file X" (combine them)
- "Write tests" and "Run tests" (one ticket)
- Each individual file change
- Steps that take < 1 hour
- Each CRUD operation separately

✅ **Do combine into single tickets**:

- All database work for an entity (model + migration + seeder)
- Related API endpoints (CRUD for one resource)
- All configuration and setup for a feature
- Testing for a component (unit + integration)
- Documentation updates across files

## Document Format Support

**Markdown Headers**:

```markdown
# Epic: Feature Name

## Story: User Story (combines related implementation)

### Task: Implementation Task (only if story needs breakdown)
```

**Dependency Keywords**:

- "depends on", "after", "requires", "blocks"

## Configuration

- **Project Key**: `{{PROJECT_KEY}}`
- **Default Assignee**: `{{DEFAULT_ASSIGNEE}}`
- **Labels**: Based on content categories
