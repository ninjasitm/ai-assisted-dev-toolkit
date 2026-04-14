---
name: acli
description: Interact with Jira from the command line using the official Atlassian CLI (acli) to create, search, view, edit, and transition work items, manage sprints and boards, and perform common Jira workflows. Use when the user asks about Jira tasks, tickets, issues, sprints, or needs to manage project work items.
---

# Atlassian CLI (ACLI)

Interact with Atlassian Jira from the command line using the official [Atlassian CLI](https://developer.atlassian.com/cloud/acli/reference/commands/).

## When to Use

- User asks to create, view, edit, or search Jira work items/tickets
- User needs to transition work items through workflow states (To Do → In Progress → Done)
- User wants to manage sprints or boards
- User needs to assign work items, add comments, or link issues
- User asks about their current tasks or sprint progress

## Prerequisites

1. Install acli: See [install guides](https://developer.atlassian.com/cloud/acli/guides/install-acli/) for macOS, Linux, or Windows
2. Authenticate via browser: `acli jira auth login --web`
3. Or authenticate with API token: `acli jira auth login --site "mysite.atlassian.net" --email "user@example.com" --token < token.txt`

## Authentication Commands

```bash
# Browser-based OAuth login
acli jira auth login --web

# API token login (pipe token via stdin)
echo "$JIRA_API_TOKEN" | acli jira auth login --site "mysite.atlassian.net" --email "user@example.com" --token

# Check auth status
acli jira auth status

# Switch between accounts
acli jira auth switch

# Logout
acli jira auth logout
```

## Switching Between Sites and Accounts

If acli is not currently using the site declared by the project or specified by the user, use the acli commands to switch sites:

```bash
# Interactive mode
acli jira auth switch

# Switch to a specific site
acli jira auth switch --site "mysite.atlassian.net"

# Switch to a specific email
acli jira auth switch --email "user@example.com"

# Switch to a specific site and email
acli jira auth switch --site "mysite.atlassian.net" --email "user@example.com"
```

## Work Item Commands

### Search Work Items

```bash
# Search with JQL query
acli jira workitem search --jql "project = PROJ"

# Search my assigned work items
acli jira workitem search --jql "project = PROJ AND assignee = currentUser()"

# Search by status
acli jira workitem search --jql "project = PROJ AND status = 'In Progress'"

# Search high priority items
acli jira workitem search --jql "project = PROJ AND priority = High"

# Search with multiple filters
acli jira workitem search --jql "project = PROJ AND assignee = currentUser() AND status = 'To Do' AND priority = High"

# Limit results and select fields
acli jira workitem search --jql "project = PROJ" --limit 50 --fields "key,summary,status,assignee"

# CSV output for scripting
acli jira workitem search --jql "project = PROJ" --csv

# JSON output for parsing
acli jira workitem search --jql "project = PROJ" --json

# Count matching work items
acli jira workitem search --jql "project = PROJ" --count

# Use a saved filter
acli jira workitem search --filter 10001

# Open search results in browser
acli jira workitem search --jql "project = PROJ" --web

# Paginate through all results
acli jira workitem search --jql "project = PROJ" --paginate
```

### Create Work Items

```bash
# Create with summary, project, and type
acli jira workitem create --summary "New Task" --project "PROJ" --type "Task"

# Create a bug with description and assignee
acli jira workitem create --summary "Login button not working" --project "PROJ" --type "Bug" --description "Steps to reproduce..." --assignee "user@example.com"

# Create a story
acli jira workitem create --summary "Add user authentication" --project "PROJ" --type "Story"

# Create with labels
acli jira workitem create --summary "Update dependencies" --project "PROJ" --type "Task" --label "maintenance,tech-debt"

# Create and assign to self
acli jira workitem create --summary "Fix crash on startup" --project "PROJ" --type "Bug" --assignee "@me"

# Create with parent (epic or subtask)
acli jira workitem create --summary "Implement login form" --project "PROJ" --type "Story" --parent "PROJ-100"

# Create from a text file (summary + description)
acli jira workitem create --from-file "workitem.txt" --project "PROJ" --type "Bug" --assignee "user@example.com"

# Create from a JSON file
acli jira workitem create --from-json "workitem.json"

# Generate a JSON template for creation
acli jira workitem create --generate-json

# Open editor for summary and description
acli jira workitem create --project "PROJ" --type "Task" --editor
```

### View Work Items

```bash
# View work item details
acli jira workitem view PROJ-123

# View in JSON format
acli jira workitem view PROJ-123 --json

# View specific fields
acli jira workitem view PROJ-123 --fields "summary,comment"

# View all fields
acli jira workitem view PROJ-123 --fields "*all"

# View navigable fields except comments
acli jira workitem view PROJ-123 --fields "*navigable,-comment"

# Open in browser
acli jira workitem view PROJ-123 --web
```

### Edit Work Items

```bash
# Edit summary
acli jira workitem edit --key "PROJ-123" --summary "Updated summary"

# Edit description
acli jira workitem edit --key "PROJ-123" --description "New description"

# Edit type
acli jira workitem edit --key "PROJ-123" --type "Bug"

# Edit labels
acli jira workitem edit --key "PROJ-123" --labels "new-label,other-label"

# Remove labels
acli jira workitem edit --key "PROJ-123" --remove-labels "old-label"

# Reassign
acli jira workitem edit --key "PROJ-123" --assignee "user@example.com"

# Edit multiple work items by key
acli jira workitem edit --key "PROJ-123,PROJ-456" --assignee "user@example.com" --yes

# Edit matching work items by JQL
acli jira workitem edit --jql "project = PROJ AND status = 'To Do'" --assignee "user@example.com" --yes

# Edit from JSON file
acli jira workitem edit --from-json "workitem.json"

# Skip confirmation prompt
acli jira workitem edit --key "PROJ-123" --summary "Updated" --yes
```

### Transition Work Items

```bash
# Move to a new status
acli jira workitem transition --key "PROJ-123" --status "In Progress"

# Move to Done
acli jira workitem transition --key "PROJ-123" --status "Done"

# Transition multiple work items
acli jira workitem transition --key "PROJ-123,PROJ-456" --status "In Progress" --yes

# Transition by JQL
acli jira workitem transition --jql "project = PROJ AND assignee = currentUser() AND status = 'To Do'" --status "In Progress" --yes

# Transition by saved filter
acli jira workitem transition --filter 10001 --status "Done" --yes
```

### Assign Work Items

```bash
# Assign to self
acli jira workitem assign --key "PROJ-123" --assignee "@me"

# Assign to specific user
acli jira workitem assign --key "PROJ-123" --assignee "user@example.com"

# Assign to project default assignee
acli jira workitem assign --key "PROJ-123" --assignee "default"

# Remove assignee
acli jira workitem assign --key "PROJ-123" --remove-assignee

# Assign by JQL
acli jira workitem assign --jql "project = PROJ AND status = 'To Do'" --assignee "user@example.com" --yes

# Assign multiple by key
acli jira workitem assign --key "PROJ-123,PROJ-456" --assignee "@me" --yes
```

### Comments

```bash
# Add a comment
acli jira workitem comment create --key "PROJ-123" --body "This is my comment"

# Add a comment from a file
acli jira workitem comment create --key "PROJ-123" --body-file "comment.txt"

# Open editor to write comment
acli jira workitem comment create --key "PROJ-123" --editor

# Edit the last comment by the same author
acli jira workitem comment create --key "PROJ-123" --body "Updated comment" --edit-last

# Comment on multiple work items by JQL
acli jira workitem comment create --jql "project = PROJ AND status = 'Done'" --body "Closing sprint"

# List comments for a work item
acli jira workitem comment list --key "PROJ-123"

# Delete a comment
acli jira workitem comment delete --key "PROJ-123" --comment-id "12345"
```

### Link & Clone Work Items

```bash
# Link two work items
acli jira workitem link create --out PROJ-123 --in PROJ-456 --type Blocks

# List links for a work item
acli jira workitem link list --key "PROJ-123"

# Get available link types
acli jira workitem link type

# Delete a link
acli jira workitem link delete --key "PROJ-123" --link-id "12345"

# Clone a work item
acli jira workitem clone --key "PROJ-123"

# Clone to a different project
acli jira workitem clone --key "PROJ-123" --to-project "TEAM"

# Clone multiple work items
acli jira workitem clone --key "PROJ-123,PROJ-456" --to-project "TEAM" --yes

# Delete a work item
acli jira workitem delete --key "PROJ-123"

# Archive a work item
acli jira workitem archive --key "PROJ-123"
```

## Sprint & Board Commands

```bash
# Search boards
acli jira board search

# Search boards by project
acli jira board search --project "PROJ"

# Search boards by type
acli jira board search --type scrum

# Search boards by name
acli jira board search --name "My Board"

# List sprints for a board
acli jira board list-sprints --id 123

# List active sprints only
acli jira board list-sprints --id 123 --state active

# List active and closed sprints
acli jira board list-sprints --id 123 --state active,closed

# List work items in a sprint
acli jira sprint list-workitems --sprint 1 --board 6

# Filter sprint items with JQL
acli jira sprint list-workitems --sprint 1 --board 6 --jql "assignee = currentUser()"

# Sprint items in custom fields
acli jira sprint list-workitems --sprint 1 --board 6 --fields "key,summary,status,assignee"
```

## Project Commands

```bash
# List projects
acli jira project list

# View project details
acli jira project view --key "PROJ"

# Create a project
acli jira project create --key "NEWPROJ" --name "New Project"

# Update a project
acli jira project update --key "PROJ" --name "Updated Name"
```

## Common Flags

These flags are reused across multiple commands:

| Flag              | Description                           |
| ----------------- | ------------------------------------- |
| `--json`          | JSON output                           |
| `--csv`           | CSV output                            |
| `--web` / `-w`    | Open in browser                       |
| `--yes` / `-y`    | Skip confirmation prompts             |
| `--ignore-errors` | Continue on errors for batch actions  |
| `-k, --key`       | Work item key(s) (comma-separated)    |
| `-j, --jql`       | JQL query                             |
| `-p, --project`   | Project key                           |
| `-a, --assignee`  | Assignee email, `@me`, or `default`   |
| `-s, --summary`   | Work item summary/title               |
| `-d, --description` | Work item description (plain text or ADF) |
| `-t, --type`      | Work item type (Bug, Story, Task, Epic) |

### Command-Specific Flags

Use the command docs above for the full option set. The most common command-specific flags are:

| Command | Flags |
| ------- | ----- |
| `workitem create` | `-l, --label`, `--parent`, `-e, --editor`, `--from-json`, `--generate-json` |
| `workitem edit` | `-l, --labels`, `--remove-labels`, `--from-json`, `--generate-json` |
| `workitem search` | `-f, --fields`, `-l, --limit`, `--paginate`, `--count` |

## Common Workflows

### Start Working on a Work Item

```bash
# Assign to self and move to In Progress
acli jira workitem assign --key "PROJ-123" --assignee "@me"
acli jira workitem transition --key "PROJ-123" --status "In Progress"
```

### Complete a Work Item

```bash
# Transition to Done
acli jira workitem transition --key "PROJ-123" --status "Done"
```

### Daily Standup Review

```bash
# View my in-progress items
acli jira workitem search --jql "assignee = currentUser() AND status = 'In Progress'" --fields "key,summary,status"
```

### Create and Track a Bug

```bash
# Create bug assigned to self
acli jira workitem create --summary "App crashes on login" --project "PROJ" --type "Bug" --assignee "@me"
# Then start working on it
acli jira workitem transition --key "PROJ-123" --status "In Progress"
```

### Bulk Update Work Items

```bash
# Reassign all items from one user matching a JQL query
acli jira workitem edit --jql "project = PROJ AND assignee = 'old@example.com'" --assignee "new@example.com" --yes
```

## Output Examples

| Command                                                          | Use Case               |
| ---------------------------------------------------------------- | ---------------------- |
| `acli jira workitem search --jql "project = PROJ"`               | Default table output   |
| `acli jira workitem search --jql "project = PROJ" --json`        | JSON for parsing       |
| `acli jira workitem search --jql "project = PROJ" --csv`         | Export to spreadsheet  |
| `acli jira workitem search --jql "project = PROJ" --fields "..."` | Custom field selection |

## Limitations

- Requires prior `acli jira auth login` configuration
- Designed for Jira Cloud; Server/Data Center support may vary
- Sprint and board commands require board IDs (use `acli jira board search` to find them)
- Rate limits apply based on Jira Cloud instance configuration
- Shell autocompletion available via `acli completion bash` (or zsh, fish, powershell)
