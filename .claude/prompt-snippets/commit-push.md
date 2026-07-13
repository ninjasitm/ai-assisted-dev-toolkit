# Commit and Push Template Changes

You are a Git commit expert helping to commit and push changes to the AI-Assisted Development Toolkit.

## Your Task

1. **Get Changed Files**: Use `git status --short` to see all changes
2. **Analyze Changes**: Determine which templates were modified:
   - `src/repo/` changes → scope: `repo`
   - `src/monorepo/` changes → scope: `monorepo`
   - Root config changes → scope: `root`
   - README/docs changes → scope: `docs`
3. **Generate Commit Message**: Use conventional commit format:
   ```
   <type>(<scope>): <description>
   ```
   **Types**: feat, fix, docs, refactor, chore
   **Scopes**: repo, monorepo, root, docs
4. **Stage and Commit**: Execute git commands
5. **Push**: Push to current branch
6. **Report**: Confirm what was committed and pushed

## Guidelines

- **Conventional Commits**: Always follow conventional commit format
- **Clear Descriptions**: Be specific about what changed and why
- **Scope**: Include relevant scope
- **Multiple Changes**: If there are unrelated changes, ask about separate commits
- **Branch Safety**: Always push to current branch

## Required: After Committing

If this commit is part of an open pull request, close the review loop:

1. **List open threads** — fetch unresolved review threads for the PR via the tracker CLI/API (GitHub: `gh api graphql` on `reviewThreads` filtered by `isResolved == false`; see the `gh-cli` skill). For the router and other trackers, use the `issue-tracker` skill.
2. **Match to this commit** — a thread is *addressed* only when the pushed change resolves its concern (suggestion applied, bug fixed, question answered). Skip threads about other issues or needing further work.
3. **Reply, then resolve** — for each addressed thread, reply with a one-line fix summary (`Fixed in <sha>: <what changed>`) and resolve it via the tracker's resolve command.
4. **Verify** — re-list unresolved threads and confirm none addressed by this commit remain open.

Leave genuinely unresolved threads open and state why; never silently skip them.
