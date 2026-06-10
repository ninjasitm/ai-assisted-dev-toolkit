You are helping to generate professional release notes from git commits.

## Your Task

1. **Ask the user** which format they need:

   - **Web** — Customer-facing changelog for a website, blog post, or announcement
   - **Git Tag** — Concise summary for a git tag annotation or GitHub release
   - **Documentation** — Detailed technical notes for RELEASE_NOTES.md or internal changelog

2. **Ask for the scope** — entire monorepo, specific app, or specific package

3. **Ask for the commit range** (date range, tag range, or number of commits)

4. **Gather commit data** using terminal commands:

   ```bash
   # All commits in range
   git log --oneline --since="[START_DATE]" --until="[END_DATE]"

   # Scoped to a specific app/package
   git log --oneline --since="[START_DATE]" -- apps/[APP_NAME]/
   git log --oneline --since="[START_DATE]" -- packages/[PACKAGE_NAME]/

   # Detailed info
   git log --since="[START_DATE]" --format="%h|%s|%b|%an|%ad" --date=short
   git diff --stat [START_REF]..[END_REF]
   ```

5. **Analyze commits**:

   - Extract conventional commit types (feat, fix, perf, refactor, etc.)
   - Identify scopes
   - Group related commits together
   - Determine user/developer impact
   - Note which apps/packages are affected

6. **Generate release notes** in the selected format:

### Web Format

```markdown
# What's New in {{PROJECT_NAME}} [Version]

**Released [Date]**

[1-2 sentence overview for end users]

## Highlights

### [Feature Title]

[2-3 sentences in plain language]

## Improvements

- [User-visible improvement]

## Bug Fixes

- Fixed an issue where [problem description]
```

- Write for non-technical users
- No commit hashes, file paths, or code references
- Focus on benefits and outcomes

### Git Tag Format

```markdown
## [Version] - [Date]

### Summary

[1-2 sentence overview]

### Key Changes

- 🚀 [Major improvement]
- ✨ [New feature]
- 🐛 [Important fix]

### Upgrade Notes

[Only for breaking changes]
```

- Maximum 5 bullet points
- No file details or commit hashes
- Include upgrade notes only for breaking changes

### Documentation Format

```markdown
# Release Notes - [Month Year]

## Version: [Version] ([Date])

### Summary

[2-3 sentence overview]

---

## [Category with Emoji] ([Date])

### [Feature/Fix Title]

**Commit**: `[hash]` - `[message]`
**Impact**: [Impact statement]

#### Changes

- [Change with file reference]

#### Benefits

- ✅ [Benefit]
```

- Include commit hashes and file paths
- Use emoji category headers (🚀 🎨 🔒 🐛 ✨ 🔧 📚)
- Full technical detail

7. **Present the release notes** and ask if adjustments are needed

## Guidelines

- Use conventional commit types to categorize changes
- Group related commits that address the same feature/fix
- Reference {{ISSUE_TRACKER}} tickets when applicable
- Never include sensitive information (credentials, internal URLs)
- Verify version number and date accuracy
- For scoped releases, filter commits to only those affecting the target app/package
