---
name: issue-tracker
description: Strategy and tool resolution for interacting with issue trackers (Jira, GitHub Issues, Linear). Defines the MCP-first, CLI-fallback approach and provides the MCP tools reference. For CLI-specific commands, see the dedicated tracker skill (jira-cli, gh-cli, or linear-cli).
---

# Issue Tracker Integration

This skill defines the strategy for interacting with your project's issue tracker. It applies regardless of which tracker you use.

## Tool Resolution Order

Always try tools in this order:

1. **MCP Tools** (preferred) — Zero-setup, rich structured responses
2. **CLI Fallback** — When MCP tools are unavailable or fail

## MCP Tools Reference

| Tracker           | MCP Tool Prefix       | Key Operations                                                                                           |
| ----------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| **Jira**          | `mcp_atlassian_atl_*` | `searchJiraIssuesUsingJql`, `createJiraIssue`, `getJiraIssue`, `editJiraIssue`, `getVisibleJiraProjects` |
| **GitHub Issues** | `mcp_github_*`        | `list_issues`, `search_issues`, `issue_read`, `issue_write`                                              |
| **Linear**        | `mcp_linear_*`        | `searchIssues`, `createIssue`, `listTeams`, `listProjects`                                               |

### MCP Usage Examples

**Search for epics (Jira):**

```
mcp_atlassian_atl_searchJiraIssuesUsingJql({
  jql: "project = {{PROJECT_KEY}} AND issuetype = Epic AND status in ('Open', 'In Progress')",
  limit: 20
})
```

**List open epics (GitHub Issues):**

```
mcp_github_list_issues({ labels: ["epic"], state: "open" })
```

**Search issues (Linear):**

```
mcp_linear_searchIssues({
  teamKey: "{{PROJECT_KEY}}",
  filter: { type: "Epic", state: ["started", "unstarted"] }
})
```

## CLI Fallback Skills

When MCP tools are unavailable, use the CLI skill matching your tracker:

| Tracker           | CLI Skill    | CLI Tool                                           |
| ----------------- | ------------ | -------------------------------------------------- |
| **Jira**          | `jira-cli`   | [`jira`](https://github.com/ankitpokhrel/jira-cli) |
| **GitHub Issues** | `gh-cli`     | [`gh`](https://cli.github.com/)                    |
| **Linear**        | `linear-cli` | [`linear`](https://github.com/schpet/linear-cli)   |

> See `.agents/skills/{jira-cli,gh-cli,linear-cli}/SKILL.md` for detailed CLI commands and workflows.

## Tracker Configuration

These values come from `AGENTS.md`:

| Variable            | Purpose          | Example                           |
| ------------------- | ---------------- | --------------------------------- |
| `{{ISSUE_TRACKER}}` | Tracker name     | `Jira`, `GitHub Issues`, `Linear` |
| `{{PM_URL}}`        | Tracker base URL | `https://yourorg.atlassian.net`   |
| `{{PROJECT_KEY}}`   | Project/team key | `PROJ`, `ENG`                     |
| `{{PM_ISSUE_KEY}}`  | Issue key format | `PROJ-###`, `#42`, `ENG-###`      |

## CLI Initial Setup

- **Jira**: `jira init --server {{PM_URL}} --project {{PROJECT_KEY}}`
- **GitHub**: `gh auth login` (auto-detects repo)
- **Linear**: `linear auth` or set `LINEAR_API_KEY` environment variable

## Epic Discovery

All stories and tasks MUST belong to an Epic. Before creating tickets:

### 1. Check for Explicit Parent

- If the requirement doc specifies an Epic, use it
- If linked from an existing Epic, use that Epic

### 2. Search for Matching Epic

If no parent is specified, search for a suitable Epic. Use MCP first (see examples above), then fall back to CLI (see your tracker's CLI skill).

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
  Epic: Maintenance & Improvements - <current quarter>
  Description: Technical improvements, bug fixes, and maintenance work
  Labels: maintenance, tech-debt
  ```

### 4. Report Parent Assignment

In the ticket creation report, always include:

```
Parent Epic: [EPIC-123] Epic Title
Assignment Reason: Domain match (Authentication) | Maintenance fallback
```
