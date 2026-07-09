---
name: bkt-cli
description: Manage Bitbucket pull requests, issues, and repositories from the command line using the bkt CLI. Use when the user asks about Bitbucket PRs, issues, repos, pipelines, or needs to manage project work items via the command line.
---

# Bitbucket CLI (bkt)

Interact with Bitbucket Cloud & Data Center from the command line using [bkt](https://github.com/avivsinai/bitbucket-cli).

## When to Use

- User asks to create, view, edit, or search Bitbucket pull requests
- User needs to manage Bitbucket issues (Cloud only)
- User wants to manage repositories, branches, or permissions
- User needs to trigger or view pipelines
- User needs to manage webhooks or extensions
- MCP tools (`mcp_bitbucket_*`) are unavailable or failing
- User needs scripted/batch PR or issue operations

## Prerequisites

1. Install bkt: `brew install avivsinai/tap/bitbucket-cli` (macOS) or see [install instructions](https://github.com/avivsinai/bitbucket-cli#installation)
2. Authenticate: `bkt auth login`
3. Create and activate a context: `bkt context create`

## Authentication

### Bitbucket Data Center

```bash
# Interactive flow: opens browser to create a Personal Access Token
bkt auth login https://bitbucket.mycorp.example --web-token

# Or provide credentials directly
bkt auth login https://bitbucket.mycorp.example --username alice --token <PAT>
```

### Bitbucket Cloud

```bash
# Browser OAuth flow
bkt auth login https://bitbucket.org --kind cloud --web

# Or provide credentials directly
bkt auth login https://bitbucket.org --kind cloud --username <email> --token <api-token>
```

### Context Management

```bash
# Create context for Data Center
bkt context create dc-prod --host bitbucket.mycorp.example --project ABC --set-active

# Create context for Cloud
bkt context create cloud-prod --host api.bitbucket.org --workspace myteam --set-active

# List contexts
bkt context list

# Check auth status
bkt auth status
```

## Pull Request Commands

### List PRs

```bash
# List open PRs
bkt pr list --state OPEN

# List PRs with limit
bkt pr list --state OPEN --limit 10

# List merged PRs
bkt pr list --state MERGED

# List declined PRs
bkt pr list --state DECLINED

# JSON output for scripting
bkt pr list --json id,title,state --limit 20
```

### Create PRs

```bash
# Create PR
bkt pr create --title "feat: cache" --source feature/cache --target main

# Create with reviewer
bkt pr create --title "Fix auth" --source fix/auth --target main --reviewer alice

# Create with description
bkt pr create \
  --title "feat: add caching" \
  --source feature/cache \
  --target main \
  --description "Implements Redis caching for API responses"

# Create for specific project/repo
bkt pr create --project DATA --repo platform-api \
  --title "Fix bug" --source fix/bug --target main
```

### View PRs

```bash
# View PR details
bkt pr view 42

# View with comments
bkt pr comments 42 --details

# JSON output
bkt pr view 42 --json id,title,state,author
```

### Merge & Decline PRs

```bash
# Merge PR
bkt pr merge 42 --message "merge: feature/cache"

# Decline PR
bkt pr decline 42 --reason "Superseded by PR 99"
```

### PR Checks & CI Status

```bash
# Show build/CI status
bkt pr checks 42

# Wait for builds to complete
bkt pr checks 42 --wait

# Wait with timeout
bkt pr checks 42 --wait --timeout 5m
```

### PR Comments & Review Threads

```bash
# List PR comments
bkt pr comments 42 --details

# Resolve a comment thread
bkt pr comments resolve 42 <thread-id>

# Reopen a resolved thread
bkt pr comments reopen 42 <thread-id>

# Delete a comment
bkt pr comments delete 42 <thread-id>
```

## Issue Commands (Bitbucket Cloud Only)

### List Issues

```bash
# List open issues
bkt issue list --state open

# List by kind
bkt issue list --state open --kind bug

# List by priority
bkt issue list --state open --priority major
```

### Create Issues

```bash
# Create issue
bkt issue create -t "Login broken" -k bug -p major

# Create with description
bkt issue create \
  --title "API timeout" \
  --kind bug \
  --priority critical \
  --description "Endpoints timeout after 30s"
```

### View Issues

```bash
# View issue
bkt issue view 42

# View with comments
bkt issue view 42 --comments
```

### Edit Issues

```bash
# Edit assignee and priority
bkt issue edit 42 --assignee "{abc-123}" --priority critical

# Change kind
bkt issue edit 42 --kind improvement
```

### Close & Reopen Issues

```bash
# Close issue
bkt issue close 42

# Reopen issue
bkt issue reopen 42
```

### Issue Comments

```bash
# Add comment
bkt issue comment 42 -b "Fixed in v1.2.0"
```

### Issue Status

```bash
# Show your assigned/created issues
bkt issue status
```

### Attachments

```bash
# List attachments
bkt issue attachment list 42

# Upload file
bkt issue attachment upload 42 screenshot.png

# Download all attachments
bkt issue attachment download 42 --all

# Delete attachment
bkt issue attachment delete 42 old-file.txt
```

## Repository Commands

```bash
# List repos
bkt repo list --limit 20

# List repos in a workspace (Cloud)
bkt repo list --workspace myteam --limit 10

# View repo details
bkt repo view platform-api

# Create repo (Data Center)
bkt repo create data-pipeline --description "Data ingestion" --project DATA

# Create repo (Cloud)
bkt repo create frontend-app --workspace myteam --cloud-project WEB

# Clone repo
bkt repo clone platform-api --project DATA --ssh

# Browse repo in browser
bkt repo browse --project DATA --repo platform-api
```

## Branch Commands

```bash
# List branches (Cloud)
bkt branch list --workspace myteam

# Create branch
bkt branch create release/1.9 --from main
```

## Permission Commands

```bash
# List permissions
bkt perms repo list --project DATA --repo platform-api
```

## Webhook Commands

```bash
# Create webhook
bkt webhook create \
  --name "CI" \
  --url https://ci.example.com/hook \
  --event repo:refs_changed
```

## Pipeline Commands

```bash
# Trigger pipeline
bkt pipeline run --workspace myteam --repo api --ref main --var ENV=staging

# View pipeline status
bkt status pipeline {pipeline-uuid}

# Check rate limit
bkt status rate-limit
```

## Extension Commands

```bash
# Install extension
bkt extension install https://github.com/example/bkt-hello.git

# Run extension
bkt extension exec hello -- --flag=1
```

## Raw API Access

```bash
# Access any API endpoint directly
bkt api /rest/api/1.0/projects --param limit=100 --json
bkt api /repositories --param workspace=myteam --field pagelen=50
```

## Environment Variables

| Variable              | Description                                      |
| --------------------- | ------------------------------------------------ |
| `BKT_TOKEN`           | Authentication token (bypasses keyring)          |
| `BKT_HOST`            | Bitbucket server base URL                        |
| `BKT_USERNAME`        | Username for basic auth in headless mode         |
| `BKT_PROJECT`         | Default Data Center project key                  |
| `BKT_WORKSPACE`       | Default Bitbucket Cloud workspace                |
| `BKT_REPO`            | Default repository slug                          |
| `BKT_CONFIG_DIR`      | Override config file directory                   |
| `BKT_HTTP_DEBUG`      | Set to `1` to log HTTP request URLs and status   |

## Common Workflows

### PR Review Workflow

```bash
# List open PRs
bkt pr list --state OPEN --limit 10

# Check CI status
bkt pr checks 42

# View PR comments
bkt pr comments 42 --details
```

### Batch Operations

```bash
# Close multiple issues
for id in 10 11 12; do bkt issue close "$id"; done

# Check status of multiple PRs
for pr in 40 41 42; do bkt pr checks "$pr"; done
```

## Limitations

- Issue tracking is only available for Bitbucket Cloud (Data Center uses Jira)
- Requires `bkt auth login` and context creation before first use
- Rate limits apply based on Bitbucket instance configuration
- Some commands may differ between Cloud and Data Center
- PR comment thread operations use top-level comment IDs
