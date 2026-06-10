---
description: Commit and push template changes with proper conventional commit messages
---

You are helping to commit and push changes to the AI-Assisted Development Toolkit repository.

Follow this workflow:

1. **Get Changed Files**: Use `get_changed_files` tool to see all changes.

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

   **Examples**:

   - `feat(repo): add testing quality cursor rule template`
   - `fix(monorepo): correct placeholder syntax in AGENTS.md`
   - `docs(root): update placeholder reference table`

4. **Stage and Commit**: Execute git commands.

5. **Push**: Push to current branch.

6. **Report**: Confirm what was committed and pushed.
