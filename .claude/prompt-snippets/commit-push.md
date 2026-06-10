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

## After Committing

If the fixset was part of an active pull request

- Identify any resolved comments that can be marked as resolved
- Use `resolve_pr_comments` or the `gh` cli, referencing gh skills in the project, tool to mark those comments as resolved and post a short description of the fix that addresses the comment
- If there are still unaddressed comments
- Identify why they weren't resolved (e.g., they were about a different issue, or they require further changes)
- OR fix them if they are legitimate issues that were missed in the commit
