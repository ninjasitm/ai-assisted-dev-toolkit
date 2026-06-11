---
name: gh-cli
description: Manage GitHub Issues and Pull Request review threads from the command line using the gh CLI. Use when the user asks about GitHub issues, labels, milestones, PR review comments, resolving review threads, or needs to manage project work items via the command line.
---

# GitHub Issues & PR Review CLI

Interact with GitHub Issues from the command line using [gh](https://cli.github.com/).

## When to Use

- User asks to create, view, edit, or search GitHub Issues
- User needs to manage labels, milestones, or assignees
- User wants to close, reopen, or comment on issues
- User needs to resolve or reply to PR review comments/threads
- User needs to submit a PR review (approve, request changes, comment)
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
gh api repos/{{REPO_OWNER}}/{{PROJECT_NAME}}/milestones --jq '.[].title'

# Create milestone
gh api repos/{{REPO_OWNER}}/{{PROJECT_NAME}}/milestones -f title="v1.0" -f description="First release" -f due_on="2025-06-01T00:00:00Z"
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
cat > /tmp/epic-body.md <<'EOF'
## Scope
- Login
- Registration
- Password reset
EOF
gh issue create --title "Epic: User Authentication" --label "epic" --body-file /tmp/epic-body.md

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

## Pull Request Review Threads

Manage PR review comments and resolve threads.

### List Review Threads

```bash
# List unresolved review threads via GraphQL
gh api graphql -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: 123) {
      reviewThreads(first: 50) {
        nodes {
          id
          isResolved
          comments(first: 1) {
            nodes {
              id
              body
              path
              line
            }
          }
        }
      }
    }
  }
}'

# Filter to unresolved only with jq
gh api graphql -f query='...' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | {id, file: .comments.nodes[0].path, body: .comments.nodes[0].body}'
```

### Reply to a Review Comment

```bash
# Reply to a specific comment thread (REST API — requires PR number)
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments/COMMENT_ID/replies -X POST -f body="Fixed in commit abc123."
```

### Resolve a Review Thread

Threads are resolved via the GraphQL API. You need the thread node ID (starts with `PRRT_`).

```bash
# Resolve a single thread
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {threadId: "PRRT_kwDOQlyQTc6IWPxG"}) {
    thread { id isResolved }
  }
}'

# Resolve multiple threads
for thread_id in PRRT_xxx PRRT_yyy PRRT_zzz; do
  gh api graphql -f query="mutation { resolveReviewThread(input: {threadId: \"$thread_id\"}) { thread { id isResolved } } }"
done
```

### Unresolve a Review Thread

```bash
gh api graphql -f query='
mutation {
  unresolveReviewThread(input: {threadId: "PRRT_kwDOQlyQTc6IWPxG"}) {
    thread { id isResolved }
  }
}'
```

### Submit a PR Review

```bash
# Comment review (no approval/request changes)
gh api repos/OWNER/REPO/pulls/123/reviews -X POST \
  -f body="All comments addressed in commit abc123." \
  -f event="COMMENT"

# Approve
gh api repos/OWNER/REPO/pulls/123/reviews -X POST \
  -f body="LGTM" \
  -f event="APPROVE"

# Request changes
gh api repos/OWNER/REPO/pulls/123/reviews -X POST \
  -f body="Needs fixes" \
  -f event="REQUEST_CHANGES"
```

### Full Workflow: Fix Comments and Resolve Threads

```bash
# 1. List unresolved threads
gh api graphql -f query='{
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: 123) {
      reviewThreads(first: 50) {
        nodes { id isResolved comments(first: 1) { nodes { body path } } }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | {thread_id: .id, file: .comments.nodes[0].path}'

# 2. Make fixes, commit, push
git add -A && git commit -m "fix: address review comments" && git push

# 3. Reply to each comment
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments/COMMENT_ID/replies -X POST -f body="Fixed in commit abc123."

# 4. Resolve each thread
gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "THREAD_ID"}) { thread { id isResolved } } }'

# 5. Post review confirming all addressed
gh api repos/OWNER/REPO/pulls/123/reviews -X POST \
  -f body="All review comments addressed." \
  -f event="COMMENT"
```

## Troubleshooting

### Permission Errors (FORBIDDEN)

**Symptom:** `malcolm-napx does not have the correct permissions to execute ResolveReviewThread`

**Cause:** Multiple GitHub accounts configured; the active account lacks write access.

**Diagnosis:**
```bash
# Check which accounts are configured
gh auth status

# Check which account is active (Active account: true)
gh auth status 2>&1 | grep -A2 "Active account: true"
```

**Fix — switch to the correct account:**
```bash
# Switch active account
gh auth switch

# Or set the active account explicitly
gh auth switch -u ninjasitm

# Verify the switch
gh auth status
```

**Fix — if the active account genuinely lacks permissions:**
```bash
# Check repo access
gh api repos/OWNER/REPO --jq '.permissions'

# Required scopes for thread resolution: repo, read:org
gh auth refresh -s repo,read:org
```

**Prevention:** Always verify `gh auth status` shows the correct active account before batch operations. The `resolveReviewThread` GraphQL mutation requires write access to the repository.

### Thread Resolution Fails Silently

**Symptom:** `resolveReviewThread` returns `{"data":{"resolveReviewThread":null}}` with no error.

**Cause:** Thread ID is invalid or already resolved.

**Fix:**
```bash
# Re-list threads to confirm IDs
gh api graphql -f query='...' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | {id, isResolved}'

# Thread IDs start with PRRT_ — verify format
echo "$THREAD_ID" | grep -q "^PRRT_" || echo "Invalid thread ID format"
```

### Rate Limiting on Batch Operations

**Symptom:** `403 rate limit exceeded` or `429` errors during bulk thread resolution.

**Fix:**
```bash
# Check remaining rate limit
gh api rate_limit --jq '.rate.remaining'

# Add delays between batch operations
for thread_id in $(thread_ids); do
  gh api graphql -f query="mutation { resolveReviewThread(input: {threadId: \"$thread_id\"}) { thread { id isResolved } } }"
  sleep 0.5  # 500ms between calls
done
```

## Limitations

- Requires `gh auth login` before first use
- GitHub Projects (v2) require separate `gh project` commands
- Rate limits: 5000 requests/hour for authenticated users
- Sub-issues require GitHub's sub-issues feature (beta)
- Epic patterns rely on label conventions, not native epics
- PR thread resolution requires the GraphQL API (REST does not support it)
- Thread node IDs start with `PRRT_`, comment IDs start with `PRRC_`
