---
description: Generate release notes from git commits (web, git tag, or documentation)
---

# Generate Release Notes

Generate professional release notes from git commits. Supports three output formats: **web** (customer-facing), **git tag** (concise), and **documentation** (detailed technical).

## Usage

```
/release-notes web
/release-notes tag
/release-notes docs
```

## Process

1. **Determine Output Format**:

   Ask the user which format they need:

   | Format            | Purpose                                             | Audience                            | Length         |
   | ----------------- | --------------------------------------------------- | ----------------------------------- | -------------- |
   | **Web**           | Website changelog, blog post, customer announcement | End users, customers                | 200-500 words  |
   | **Git Tag**       | Git tag annotation, GitHub/GitLab release           | Developers, external consumers      | 100-300 words  |
   | **Documentation** | RELEASE_NOTES.md, comprehensive changelog           | Internal developers, technical team | 500-2000 words |

2. **Gather Commit Data**:

   Run these commands to collect release information:

   ```bash
   # Get commits in range
   git log --oneline --since="[START_DATE]" --until="[END_DATE]"

   # Get detailed commit info
   git log --since="[START_DATE]" --format="%h|%s|%b|%an|%ad" --date=short

   # Get changed files
   git diff --stat [START_REF]..[END_REF]

   # Get commits by conventional type
   git log --oneline --grep="^feat" --since="[START_DATE]"
   git log --oneline --grep="^fix" --since="[START_DATE]"
   git log --oneline --grep="^perf" --since="[START_DATE]"
   ```

3. **Analyze Commits**:

   - Extract conventional commit type (feat, fix, perf, refactor, etc.)
   - Identify scope (auth, frontend, admin, etc.)
   - Group related commits together
   - Determine user/developer impact

4. **Generate Release Notes** using the appropriate template below.

---

## Templates

### Web Format (Customer-Facing)

For website changelogs, blog posts, and customer-facing announcements.

```markdown
# What's New in {{PROJECT_NAME}} [Version]

**Released [Date]**

[1-2 sentence overview written for end users, focusing on value delivered]

## Highlights

### [Feature/Improvement Title]

[2-3 sentences explaining the change in plain language. Focus on what users can now do, not how it was implemented.]

### [Feature/Improvement Title]

[2-3 sentences explaining the change in plain language.]

## Improvements

- [User-visible improvement in plain language]
- [User-visible improvement in plain language]

## Bug Fixes

- Fixed an issue where [user-visible problem description]
- Resolved [user-visible problem description]

---

_For detailed technical notes, see [RELEASE_NOTES.md](RELEASE_NOTES.md)._
```

**Web format guidelines:**

- Write for non-technical users where possible
- Focus on benefits and outcomes, not implementation details
- No commit hashes, file paths, or code references
- Use plain language — avoid jargon
- Include screenshots or links to demos when applicable
- Keep each item to 1-3 sentences

### Git Tag Format (Concise)

For git tag annotations, GitHub/GitLab releases, and quick announcements.

```markdown
## [Version Number] - [Date]

### Summary

[1-2 sentence overview]

### Key Changes

- 🚀 [Major improvement 1]
- ✨ [New feature]
- 🐛 [Important fix]
- 🔧 [Notable maintenance item]

### Upgrade Notes

[Only if breaking changes or required actions exist]
```

**Git tag format guidelines:**

- Maximum 5 bullet points
- Focus on user-facing changes only
- No technical file details or commit hashes
- Emoji categories for quick scanning
- Include upgrade/migration notes only for breaking changes

### Documentation Format (Detailed)

For RELEASE_NOTES.md, comprehensive changelogs, and internal documentation.

```markdown
# Release Notes - [Month Year]

## Version: [Version Number] ([Date])

### Summary

[2-3 sentence overview of the release focus and key improvements]

---

## [Category with Emoji] ([Date])

### [Feature/Fix Title]

**Commit**: `[hash]` - `[commit message]`

**Impact**: [Business/technical impact statement]

#### Changes

- [Specific change with file reference]
- [Specific change with file reference]

#### Benefits

- ✅ [User/developer benefit]
- ✅ [User/developer benefit]
```

**Documentation format guidelines:**

- Use emoji category headers:
  - 🚀 Performance & Optimization
  - 🎨 Frontend & UI
  - 🔒 Security & Authentication
  - 🐛 Bug Fixes
  - ✨ New Features
  - 🔧 Configuration & Deployment
  - 📚 Documentation
- Include commit hash and message for each change
- List modified files with context
- Explain technical changes clearly
- Highlight benefits with ✅ checkmarks

---

## General Guidelines

1. **Categories**: Use conventional commit types to categorize changes
2. **Tone**: Professional, clear, and appropriate for the target audience
3. **Format**: Use proper markdown with headers, bullets, code blocks
4. **Grouping**: Combine commits that address the same feature/fix
5. **Context**: Reference {{ISSUE_TRACKER}} tickets when applicable
6. **Monorepo Scope**: When generating notes for a specific app or package, filter commits to only those affecting that workspace

## Quality Checklist

Before finalizing release notes:

- [ ] Correct format selected for the audience
- [ ] All significant commits categorized appropriately
- [ ] Impact statements are clear and concise
- [ ] No sensitive information included (credentials, internal URLs)
- [ ] Version number and date are accurate
- [ ] Markdown formatting renders correctly
- [ ] Grammar and spelling checked
- [ ] Breaking changes clearly called out (if any)
- [ ] Scope correctly limited to relevant app/package (monorepo)
