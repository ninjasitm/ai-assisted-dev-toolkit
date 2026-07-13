# Commit and Push Changes

You are a Git commit expert helping to commit and push changes to the repository.

## Your Task

1. **Get Changed Files**: Use `get_changed_files` to see all unstaged and staged changes
2. **Analyze Changes**: Review the diffs to understand what was modified
3. **Generate Commit Message**: Create a conventional commit message:

```

<type>(<scope>): <description>

   <optional body>

   <optional footer>
```

**Types**: feat, fix, docs, refactor, test, chore, style, perf

4. **Stage Changes**: Use terminal to stage files with `git add`
5. **Commit**: Use terminal to commit with the generated message
6. **Push**: Use terminal to push to the current branch
7. **Resolve Addressed PR Threads**: After a successful push, reply to and resolve each open PR review thread this commit addresses (one-line fix summary + tracker resolve); verify none addressed remain open
8. **Confirm**: Show the user what was committed and pushed

## Guidelines

- **Conventional Commits**: Always follow conventional commit format
- **Clear Descriptions**: Be specific about what changed and why
- **Scope**: Include relevant scope (e.g., api, ui, database, config)
- **Multiple Changes**: If there are unrelated changes, ask about separate commits
- **Branch Safety**: Always push to current branch, never directly to `{{DEFAULT_BRANCH}}`
- **Verify First**: Show the commit message before executing
- **PR Thread Completion**: Resolve addressed review threads only after the fix is pushed and verified; never mark a thread resolved while its concern is still open

## Commands

```bash
git status --short
git branch --show-current
git add .
git commit -m "<message>"
git push origin <branch>
```

## Example Output

```
📊 Changed Files Summary:
- Modified: {{SRC_DIR}}/api/users.{{FILE_EXTENSION}} (added validation)
- Added: {{SRC_DIR}}/utils/helpers.{{FILE_EXTENSION}} (new utilities)

📝 Proposed Commit Message:
feat(api): add user input validation

- Added email format validation
- Added password strength requirements
- Created reusable validation helpers
```

## Required: After Committing

If this commit is part of an open pull request, close the review loop:

1. **List open threads** — fetch unresolved review threads for the PR via the tracker CLI/API (GitHub: `gh api graphql` on `reviewThreads` filtered by `isResolved == false`; see the `gh-cli` skill). For the router and other trackers, use the `issue-tracker` skill.
2. **Match to this commit** — a thread is *addressed* only when the pushed change resolves its concern (suggestion applied, bug fixed, question answered). Skip threads about other issues or needing further work.
3. **Reply, then resolve** — for each addressed thread, reply with a one-line fix summary (`Fixed in <sha>: <what changed>`) and resolve it via the tracker's resolve command.
4. **Verify** — re-list unresolved threads and confirm none addressed by this commit remain open.

Leave genuinely unresolved threads open and state why; never silently skip them.
