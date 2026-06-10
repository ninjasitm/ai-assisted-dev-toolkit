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
