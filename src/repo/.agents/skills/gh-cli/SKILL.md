---
name: gh-cli
description: Manage GitHub Issues from the command line using the gh CLI. Use when the user asks about GitHub issues, labels, milestones, or needs to manage project work items via the command line.
---

# GitHub Issues CLI

Interact with GitHub Issues from the command line using [gh](https://cli.github.com/).

## When to Use

- User asks to create, view, edit, or search GitHub Issues
- User needs to manage labels, milestones, or assignees
- User wants to close, reopen, or comment on issues
- MCP tools (`mcp_github_*`) are unavailable or failing
- User needs scripted/batch issue operations

## Prerequisites

1. Install gh CLI: `brew install gh` (macOS) or see [install instructions](https://github.com/cli/cli#installation)
2. Authenticate: `gh auth login`
3. Verify: `gh auth status`

## Issue Commands

### List Issues

```bash
# List open issues
gh issue list

# List issues with filters
gh issue list --state open --label "bug"
gh issue list --assignee @me
gh issue list --milestone "v1.0"

# List with search query
gh issue list --search "is:open label:epic sort:created-desc"

# Limit results
gh issue list --limit 20

# JSON output for scripting
gh issue list --json number,title,state,labels --limit 50
```

### Create Issues

```bash
# Interactive creation
gh issue create

# Create with all options
gh issue create --title "Bug: Login fails" --body "Description here" --label "bug" --assignee @me

# Create with milestone
gh issue create --title "Add feature" --body "Details" --label "enhancement" --milestone "v1.0"

# Create with body from file
gh issue create --title "Feature request" --body-file ./description.md

# Create and assign to multiple people
gh issue create --title "Review needed" --assignee user1,user2
```

### View Issues

```bash
# View issue details
gh issue view 123

# View in terminal (no browser)
gh issue view 123 --comments

# JSON output
gh issue view 123 --json title,body,state,labels,assignees,milestone

# Open in browser
gh issue view 123 --web
```

### Edit Issues

```bash
# Edit title
gh issue edit 123 --title "Updated title"

# Add labels
gh issue edit 123 --add-label "priority:high,needs-review"

# Remove labels
gh issue edit 123 --remove-label "needs-triage"

# Set milestone
gh issue edit 123 --milestone "v1.0"

# Add assignees
gh issue edit 123 --add-assignee @me,teammate

# Remove assignees
gh issue edit 123 --remove-assignee old-owner
```

### Close & Reopen Issues

```bash
# Close issue
gh issue close 123

# Close with comment
gh issue close 123 --comment "Fixed in PR #456"

# Close as not planned
gh issue close 123 --reason "not planned"

# Reopen issue
gh issue reopen 123

# Reopen with comment
gh issue reopen 123 --comment "Reopening — needs more work"
```

### Comments

```bash
# Add comment
gh issue comment 123 --body "Working on this"

# Add comment from file
gh issue comment 123 --body-file ./comment.md

# Edit last comment (interactive)
gh issue comment 123 --edit-last
```

### Pin & Lock Issues

```bash
# Pin issue
gh issue pin 123

# Unpin issue
gh issue unpin 123

# Lock issue
gh issue lock 123 --reason "resolved"

# Unlock issue
gh issue unlock 123
```

## Search

```bash
# Search issues across repo
gh search issues "authentication bug" --repo owner/repo

# Search with qualifiers
gh search issues "label:bug state:open" --repo owner/repo --limit 20

# Search issues assigned to me
gh issue list --search "assignee:@me is:open"
```

## Labels

```bash
# List labels
gh label list

# Create label
gh label create "priority:high" --color FF0000 --description "High priority"

# Edit label
gh label edit "priority:high" --new-name "priority:critical" --color CC0000

# Delete label
gh label delete "old-label" --yes
```

## Milestones

```bash
# List milestones
gh api repos/{owner}/{repo}/milestones --jq '.[].title'

# Create milestone
gh api repos/{owner}/{repo}/milestones -f title="v1.0" -f description="First release" -f due_on="2025-06-01T00:00:00Z"
```

## Common Workflows

### Triage New Issues

```bash
# List untriaged issues
gh issue list --search "is:open no:label no:assignee sort:created-asc"

# Assign and label
gh issue edit 123 --add-label "bug,priority:high" --add-assignee @me
```

### Epic Pattern (using labels)

```bash
# List epics
gh issue list --label "epic" --state open

# Create epic
gh issue create --title "Epic: User Authentication" --label "epic" --body "## Scope\n- Login\n- Registration\n- Password reset"

# Find stories for an epic (by reference in body)
gh issue list --search "is:open label:story \"Authentication\""
```

### Close with PR Reference

```bash
# Close and reference the fixing PR
gh issue close 123 --comment "Fixed in #456"
```

### Batch Operations

```bash
# Close multiple issues
for id in 10 11 12; do gh issue close "$id" --comment "Superseded by #20"; done

# Add label to multiple issues
for id in 10 11 12; do gh issue edit "$id" --add-label "backlog"; done
```

## Common Flags

| Flag          | Description                            |
| ------------- | -------------------------------------- |
| `--json`      | JSON output with field selection       |
| `--jq`        | Filter JSON output with jq expressions |
| `--web`       | Open in browser                        |
| `--limit`     | Max results to return                  |
| `--search`    | Search query with GitHub qualifiers    |
| `--state`     | Filter by state (open, closed, all)    |
| `--label`     | Filter by label                        |
| `--assignee`  | Filter by assignee                     |
| `--milestone` | Filter by milestone                    |

## Output Formatting

| Command                                              | Use Case                |
| ---------------------------------------------------- | ----------------------- |
| `gh issue list --json number,title`                  | JSON for scripting      |
| `gh issue list --json number,title --jq '.[].title'` | Extract specific fields |
| `gh issue view 123 --json body --jq '.body'`         | Get issue body only     |

## Limitations

- Requires `gh auth login` before first use
- GitHub Projects (v2) require separate `gh project` commands
- Rate limits: 5000 requests/hour for authenticated users
- Sub-issues require GitHub's sub-issues feature (beta)
- Epic patterns rely on label conventions, not native epics
