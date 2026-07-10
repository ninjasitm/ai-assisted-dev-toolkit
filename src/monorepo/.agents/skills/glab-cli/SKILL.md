---
name: glab-cli
description: Manage GitLab merge requests, issues, and pipelines from the command line using the glab CLI. Use when the user asks about GitLab MRs, issues, pipelines, labels, milestones, or needs to manage project work items via the command line.
---

# GitLab CLI (glab)

Interact with GitLab from the command line using [glab](https://gitlab.com/gitlab-org/cli).

## When to Use

- User asks to create, view, edit, or search GitLab merge requests
- User needs to manage GitLab issues, labels, or milestones
- User wants to trigger, view, or retry CI/CD pipelines
- User needs to manage releases or changelogs
- User needs to resolve or reply to MR review comments/threads
- MCP tools (`mcp_gitlab_*`) are unavailable or failing
- User needs scripted/batch MR or issue operations

## Prerequisites

1. Install glab: `brew install glab` (macOS) or see [install instructions](https://gitlab.com/gitlab-org/cli/-/blob/main/README.md)
2. Authenticate: `glab auth login`
3. Verify: `glab auth status`

## Authentication

```bash
# Interactive login (opens browser)
glab auth login

# Authenticate against a self-hosted instance
glab auth login --hostname gitlab.company.com

# Non-interactive with a PAT
GITLAB_TOKEN=glpat-xxxx glab auth status

# Check current authentication
glab auth status

# Logout
glab auth logout
```

## Merge Request Commands

### List MRs

```bash
# List open MRs
glab mr list

# List MRs assigned to you
glab mr list --assignee @me

# List MRs with specific state
glab mr list --state opened
glab mr list --state merged
glab mr list --state closed

# List MRs with labels
glab mr list --label "bug,urgent"

# List MRs targeting a specific branch
glab mr list --target-branch main

# Limit results
glab mr list --limit 20

# JSON output for scripting
glab mr list --json number,title,state --limit 50
```

### Create MRs

```bash
# Create MR from current branch
glab mr create --title "feat: add pagination" --description "Closes #88"

# Create with all options
glab mr create \
  --title "feat: add pagination" \
  --description "Adds cursor-based pagination" \
  --assignee @me \
  --label "backend,enhancement" \
  --target-branch main

# Create and fill from commit messages
glab mr create --fill

# Create with reviewers
glab mr create --title "Fix auth" --reviewer user1,user2

# Create as draft/WIP
glab mr create --title "WIP: experimental feature" --draft

# Create with milestone
glab mr create --title "Release feature" --milestone "v1.0"
```

### View MRs

```bash
# View MR details
glab mr view 42

# View in terminal (no browser)
glab mr view 42 --comments

# JSON output
glab mr view 42 --json number,title,state,author,reviewers

# Open in browser
glab mr view 42 --web
```

### Edit MRs

```bash
# Edit title
glab mr update 42 --title "Updated title"

# Add labels
glab mr update 42 --label "priority:high"

# Remove labels
glab mr unlabel 42 "needs-review"

# Assign
glab mr update 42 --assignee @me

# Set milestone
glab mr update 42 --milestone "v1.0"

# Add reviewers
glab mr update 42 --reviewer user1,user2
```

### Merge & Close MRs

```bash
# Merge MR
glab mr merge 42

# Merge when pipeline succeeds
glab mr merge 42 --when-pipeline-succeeds --delete-source-branch

# Merge with squash
glab mr merge 42 --squash

# Close MR
glab mr close 42

# Close with comment
glab mr close 42 --comment "Superseded by !99"

# Reopen MR
glab mr reopen 42
```

### MR Approvals

```bash
# Approve MR
glab mr approve 42

# Unapprove MR
glab mr unapprove 42

# Check approval status
glab mr view 42 --json approvals
```

### MR Review Threads

```bash
# List discussion threads
glab mr discussion list 42

# Add a note/comment
glab mr note 42 --body "Looks good to me"

# Add note on specific line (requires diff refs)
glab mr note 42 --body "Nice catch" --commit abc123 --filename src/main.ts --line 42

# Resolve a discussion
glab mr discussion resolve 42 <discussion-id>

# Reply to a discussion
glab mr discussion reply 42 <discussion-id> --body "Fixed in commit def456"
```

## Issue Commands

### List Issues

```bash
# List open issues
glab issue list

# List issues with filters
glab issue list --state opened --label "bug"
glab issue list --assignee @me

# List with search query
glab issue list --search "authentication"

# Limit results
glab issue list --limit 20

# JSON output
glab issue list --json number,title,state --limit 50
```

### Create Issues

```bash
# Create issue
glab issue create --title "Bug: Login fails" --description "Steps to reproduce..."

# Create with labels and assignee
glab issue create \
  --title "Add feature" \
  --description "Details here" \
  --label "enhancement" \
  --assignee @me

# Create with milestone
glab issue create --title "Task" --description "Do this" --milestone "v1.0"

# Create with weight
glab issue create --title "Complex task" --description "Details" --weight 3
```

### View Issues

```bash
# View issue details
glab issue view 123

# View with comments
glab issue view 123 --comments

# JSON output
glab issue view 123 --json number,title,state,labels,assignees

# Open in browser
glab issue view 123 --web
```

### Edit Issues

```bash
# Edit title
glab issue update 123 --title "Updated title"

# Add labels
glab issue update 123 --add-label "priority:high"

# Remove labels
glab issue update 123 --remove-label "needs-triage"

# Set milestone
glab issue update 123 --milestone "v1.0"

# Reassign
glab issue update 123 --assignee @me

# Set weight
glab issue update 123 --weight 5
```

### Close & Reopen Issues

```bash
# Close issue
glab issue close 123

# Close with comment
glab issue close 123 --comment "Fixed in !456"

# Reopen issue
glab issue reopen 123
```

### Issue Comments

```bash
# Add comment
glab issue note 123 --body "Working on this"

# Add comment from file
glab issue note 123 --body-file ./comment.md
```

## Pipeline Commands

### View Pipelines

```bash
# List pipelines
glab pipeline list

# View latest pipeline for current branch
glab pipeline view

# View pipeline status
glab pipeline status

# View specific pipeline
glab pipeline view 123

# Wait for pipeline to complete
glab pipeline status --wait
```

### Trigger Pipelines

```bash
# Create pipeline for current branch
glab pipeline create

# Create pipeline with variables
glab pipeline create --variable ENV=staging --variable DEBUG=true

# Retry failed pipeline
glab pipeline retry 123

# Cancel running pipeline
glab pipeline cancel 123
```

### Pipeline Jobs

```bash
# List jobs in a pipeline
glab ci lint

# View job logs
glab ci view 123

# Retry a job
glab ci retry 123

# Download job artifacts
glab ci artifacts 123
```

## Release Commands

```bash
# List releases
glab release list

# Create release
glab release create v1.0.0 \
  --name "Version 1.0.0" \
  --description "Initial stable release"

# Create release with notes from file
glab release create v1.0.0 --notes-file CHANGELOG.md

# View release
glab release view v1.0.0

# Delete release
glab release delete v1.0.0
```

## Label Commands

```bash
# List labels
glab label list

# Create label
glab label create "priority:high" --color "#FF0000" --description "High priority"

# Edit label
glab label update "priority:high" --new-name "priority:critical" --color "#CC0000"

# Delete label
glab label delete "old-label"
```

## Common Workflows

### Triage New Issues

```bash
# List untriaged issues
glab issue list --search "is:open no:label no:assignee"

# Assign and label
glab issue update 123 --add-label "bug,priority:high" --assignee @me
```

### MR Review Workflow

```bash
# Check out MR locally
glab mr checkout 42

# Review changes
git log main..HEAD

# Approve when ready
glab mr approve 42
```

### Pipeline Debugging

```bash
# Check pipeline status
glab pipeline status

# View failed job logs
glab ci view <job-id>

# Retry failed job
glab ci retry <job-id>
```

### Batch Operations

```bash
# Close multiple issues
for id in 10 11 12; do glab issue close "$id" --comment "Superseded"; done

# Add label to multiple MRs
for mr in 10 11 12; do glab mr update "$mr" --add-label "backlog"; done
```

## Common Flags

| Flag          | Description                            |
| ------------- | -------------------------------------- |
| `--json`      | JSON output with field selection       |
| `--limit`     | Max results to return                  |
| `--search`    | Search query                           |
| `--state`     | Filter by state (opened, closed, merged) |
| `--label`     | Filter by label                        |
| `--assignee`  | Filter by assignee                     |
| `--milestone` | Filter by milestone                    |
| `-R, --repo`  | Override project (namespace/project)   |

## Output Formatting

| Command                                          | Use Case                |
| ------------------------------------------------ | ----------------------- |
| `glab mr list --json number,title`               | JSON for scripting      |
| `glab mr list --json number,title --limit 10`    | Limited JSON output     |
| `glab issue view 123 --json state`               | Get issue state only    |

## Limitations

- Requires `glab auth login` before first use
- Rate limits apply based on GitLab instance configuration
- Some commands require specific GitLab Premium/Ultimate features
- Pipeline commands may vary between GitLab.com and self-managed instances
- MR review threads use discussion API (not inline comments)
