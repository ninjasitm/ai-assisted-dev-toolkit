```mdc
---
description: Commit and push changes with conventional commit messages
---

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
7. **Confirm**: Show the user what was committed and pushed

## Guidelines

- **Conventional Commits**: Always follow conventional commit format
- **Clear Descriptions**: Be specific about what changed and why
- **Scope**: Include relevant scope (e.g., api, ui, database, config)
- **Multiple Changes**: If there are unrelated changes, ask about separate commits
- **Branch Safety**: Always push to current branch, never directly to `{{DEFAULT_BRANCH}}`
- **Verify First**: Show the commit message before executing

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

```

```
