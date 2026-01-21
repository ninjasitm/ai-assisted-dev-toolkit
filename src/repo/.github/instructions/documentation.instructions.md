---
applyTo: "**/*"
description: "Documentation standards for features and fixes"
---

# Documentation Guidelines

## Overview

All project changes must be documented following these standards to maintain clear historical records and enable effective knowledge transfer.

## Documentation Location

All documentation lives in the `docs/` folder at the project root:

- **Features** → `docs/features/{{ISSUE_ID}}-FEATURE-NAME/`
- **Fixes** → `docs/fixes/` (tiered structure - see below)
- **Architecture** → `docs/architecture/` (ADRs, system design)
- **API** → `docs/api/` (API specifications)

## Feature Documentation

### When to Document Features

Create feature documentation for:

- New user-facing features
- API endpoints or major backend services
- Component libraries or reusable modules
- Significant architectural changes
- Any work tracked by issue IDs ({{ISSUE_TRACKER}} tickets)

### Feature Documentation Structure

**Location:** `docs/features/{{ISSUE_ID}}-FEATURE-NAME/`

**Required Files:**

```
{{ISSUE_ID}}-FEATURE-NAME/
├── spec.md       # Functional specification
├── plan.md       # Implementation plan
└── [optional]    # Code examples, diagrams, etc.
```

### Creating Feature Documentation

1. **Use the spec workflow**: Run `/spec` command to generate `spec.md`
2. **Create implementation plan**: Run `/plan` command to generate `plan.md`
3. **Keep it updated**: Update during implementation if scope changes
4. **Link from commits**: Reference folder in commit messages

### Feature Spec Template (spec.md)

```markdown
# {{ISSUE_ID}}: {{Feature Name}}

**Status**: Draft | In Progress | Completed
**Created**: {{Date}}
**Issue**: [{{ISSUE_ID}}]({{ISSUE_TRACKER_URL}})

## Overview

Brief description of the feature and its purpose.

## User Stories

- As a [user type], I want [goal] so that [benefit]
- As a [user type], I want [goal] so that [benefit]

## Requirements

### Functional Requirements

1. Must support [capability]
2. Should handle [scenario]
3. Must validate [constraint]

### Non-Functional Requirements

- Performance: [metric]
- Security: [requirement]
- Accessibility: [standard]

## Technical Approach

### Architecture

- Component structure
- Data flow
- Integration points

### API Changes

- New endpoints
- Modified responses
- Breaking changes

### Database Changes

- New tables/collections
- Schema modifications
- Migration strategy

## Acceptance Criteria

- [ ] Feature works as specified
- [ ] Tests pass (unit, integration, E2E)
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] Deployed to staging

## Out of Scope

- Features explicitly not included
- Future enhancements to consider separately

## Open Questions

- [ ] Question 1?
- [ ] Question 2?

---

**Last Updated**: {{Date}}
```

### Feature Plan Template (plan.md)

```markdown
# Implementation Plan: {{ISSUE_ID}}

**Feature**: {{Feature Name}}
**Estimated Effort**: {{Hours/Days}}
**Dependencies**: {{List dependencies}}

## Implementation Strategy

### Phase 1: Foundation

- [ ] Task 1: Setup infrastructure
- [ ] Task 2: Create base components
- [ ] Task 3: Add configuration

### Phase 2: Core Implementation

- [ ] Task 4: Implement main logic
- [ ] Task 5: Add error handling
- [ ] Task 6: Write unit tests

### Phase 3: Integration

- [ ] Task 7: Connect to API
- [ ] Task 8: Add E2E tests
- [ ] Task 9: Update documentation

### Phase 4: Polish

- [ ] Task 10: Performance optimization
- [ ] Task 11: Accessibility review
- [ ] Task 12: Code review fixes

## File Changes

### New Files

- `{{SRC_DIR}}/components/FeatureName.{{FILE_EXTENSION}}`
- `{{TEST_DIR}}/FeatureName.test.{{FILE_EXTENSION}}`

### Modified Files

- `{{SRC_DIR}}/routes/index.{{FILE_EXTENSION}}`
- `{{SRC_DIR}}/types/index.{{FILE_EXTENSION}}`

## Testing Strategy

- **Unit Tests**: Component logic, utility functions
- **Integration Tests**: API interactions, data flow
- **E2E Tests**: User workflows, critical paths

## Rollout Plan

1. Deploy to development environment
2. Internal testing and feedback
3. Deploy to staging
4. User acceptance testing
5. Production deployment

## Rollback Plan

- Revert commits: [list SHAs]
- Database rollback: [migration down command]
- Feature flag: [toggle off if applicable]

---

**Last Updated**: {{Date}}
```

## Fix & Bug Documentation

### Decision Tree

**Before creating any fix documentation, ask:**

1. **Is this a complex fix?** (multi-file, architectural changes, affects multiple features)

   - ✅ YES → Create folder `docs/fixes/{{ISSUE_ID}}-FIX-NAME/` with `spec.md` + `plan.md`
   - ❌ NO → Add entry to `docs/fixes/{YYYY-MM}.md` (monthly log)

2. **Does the monthly log for this month exist?**
   - ❌ NO → Create it first using the template below
   - ✅ YES → Add your fix as a new section

**⚠️ CRITICAL: Do NOT create individual `.md` files for simple fixes!**

### What NOT to Do

**DO NOT create individual fix files like:**

- ❌ `2025-10-database-connection-fix.md`
- ❌ `2025-10-auth-token-refresh.md`
- ❌ `fix-session-timeout.md`

**Instead, add them as sections in the monthly log:**

- ✅ `2025-10.md` with a new `## [2025-10-24] - Database Connection Fix` section

### Complex Fix Structure

**Location:** `docs/fixes/{{ISSUE_ID}}-FIX-NAME/`

**Structure:**

```
{{ISSUE_ID}}-FIX-NAME/
├── spec.md       # Root cause analysis
├── plan.md       # Fix implementation plan
└── [optional]    # Test cases, reproduction steps
```

**Use when:**

- Fix requires architectural changes
- Affects multiple components or services
- Needs detailed root cause analysis
- Requires migration or data transformation
- Has significant testing requirements

### Monthly Fix Logs

**Location:** `docs/fixes/{YYYY-MM}.md`

**File Creation Rules:**

- Create NEW file when calendar month changes (e.g., Feb 1 → create `2026-02.md`)
- Do NOT append to previous month's file
- Use [Keep a Changelog](https://keepachangelog.com/) format

**Purpose:**

- Monthly summary of all fixes and improvements
- Links to complex fix folders
- Quick reference for all changes in that period
- Pattern discovery and learning documentation
- Breaking changes summary

### Monthly Log Template

```markdown
# {{Month}} {{Year}} - Fixes & Improvements

**Format**: [Keep a Changelog](https://keepachangelog.com/)
**Period**: {{Month}} 1-{{Last Day}}, {{Year}}

## Summary

Brief overview of the month's focus areas and key achievements.

### Key Themes

- Theme 1: [e.g., Performance improvements]
- Theme 2: [e.g., Security patches]
- Theme 3: [e.g., TypeScript migration]

### Statistics

- Total fixes: X
- Complex fixes: Y
- Breaking changes: Z

---

## [{{YYYY-MM-DD}}] - {{Fix Title}}

### Fixed/Changed/Added

- **Issue**: Brief description of the problem
  - **Root cause**: Why it happened
  - **Solution**: How it was fixed
  - **Files modified**: `path/to/file1.{{FILE_EXTENSION}}`, `path/to/file2.{{FILE_EXTENSION}}`
  - **Status**: ✅ Fixed | ⏳ In Progress | 🔄 Under Review

### Impact

- 🔧 **Technical**: Performance improved by X%, reduced bundle size, etc.
- 🎯 **User Experience**: Faster load times, better error messages, etc.
- 🚨 **Breaking Changes**: [if any]

### Related

- Issue: [{{ISSUE_TRACKER}} link]
- PR: [Pull request link]
- Complex fix docs: [Link if applicable]

---

## [{{YYYY-MM-DD}}] - {{Another Fix Title}}

[Repeat structure for each fix]

---

## Patterns & Learnings

### Common Issues Discovered

- Pattern 1: [Description and prevention strategy]
- Pattern 2: [Description and prevention strategy]

### Best Practices Established

- Practice 1: [Description]
- Practice 2: [Description]

### Technical Debt

- [ ] Item 1: [Description and priority]
- [ ] Item 2: [Description and priority]

---

**Last Updated**: {{Date}}
**Next Review**: {{Next Month End}}
```

## Changelog Management

### Changelog Updates

Update `CHANGELOG.md` for:

- Version releases
- Breaking changes
- New features (link to feature docs)
- Critical bug fixes (link to fix docs)

### Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [{{VERSION}}] - {{YYYY-MM-DD}}

### Added

- New feature X ([{{ISSUE_ID}}](docs/features/{{ISSUE_ID}}-FEATURE-NAME/))
- New API endpoint Y

### Changed

- Updated component behavior ([{{ISSUE_ID}}](docs/fixes/{{ISSUE_ID}}-FIX-NAME/))
- Improved performance of Z

### Deprecated

- Old API endpoint (will be removed in v{{NEXT_VERSION}})

### Removed

- Deprecated feature from v{{PREV_VERSION}}

### Fixed

- Bug causing issue A ([#123]({{ISSUE_TRACKER_URL}}))
- Memory leak in component B

### Security

- Patched vulnerability CVE-{{ID}}
```

## Architecture Decision Records (ADRs)

### When to Create ADRs

Document significant architectural decisions:

- Technology choices (frameworks, libraries, databases)
- Design patterns and approaches
- Infrastructure decisions
- Security or performance trade-offs

### ADR Structure

**Location:** `docs/architecture/{{NNNN}}-{{decision-title}}.md`

**Template:**

```markdown
# ADR {{NNNN}}: {{Decision Title}}

**Status**: Proposed | Accepted | Deprecated | Superseded
**Date**: {{YYYY-MM-DD}}
**Deciders**: [List key decision makers]

## Context

What is the issue we're facing that motivates this decision?

## Decision

What is the change we're proposing and/or doing?

## Consequences

### Positive

- Benefit 1
- Benefit 2

### Negative

- Trade-off 1
- Trade-off 2

### Neutral

- Change 1 (neither positive nor negative)

## Alternatives Considered

### Alternative 1: {{Name}}

- Pros: [list]
- Cons: [list]
- Why rejected: [reason]

### Alternative 2: {{Name}}

- Pros: [list]
- Cons: [list]
- Why rejected: [reason]

## Implementation Notes

- Migration path: [if applicable]
- Rollout strategy: [if applicable]
- Monitoring: [metrics to track]

## References

- [Link to research]
- [Link to documentation]
- [Related ADRs]

---

**Last Updated**: {{Date}}
```

## Documentation Maintenance

### Regular Reviews

- **Monthly**: Review and close completed fix logs
- **Quarterly**: Audit feature documentation for accuracy
- **Release**: Update changelog and version documentation

### Deprecation Process

1. Mark feature/API as deprecated in code
2. Add deprecation notice to documentation
3. Create ADR explaining deprecation
4. Plan removal timeline
5. Update changelog

### Documentation Quality Checklist

- [ ] Clear and concise language
- [ ] Code examples are tested and working
- [ ] Links are valid and not broken
- [ ] Follows project conventions
- [ ] Includes diagrams where helpful
- [ ] Has proper metadata (dates, status, links)
- [ ] Reviewed by at least one other person

## Integration with Workflows

### During Development

1. **Starting work**: Create or reference feature spec
2. **Making changes**: Update relevant documentation
3. **Bug fixes**: Add to monthly log or create complex fix folder
4. **Code review**: Verify documentation is updated
5. **Merging**: Ensure changelog is updated if needed

### Commit Messages

Reference documentation in commits:

```
feat({{FEATURE}}): implement new feature X

See docs/features/{{ISSUE_ID}}-FEATURE-NAME/ for details

Closes {{ISSUE_ID}}
```

```
fix({{COMPONENT}}): resolve memory leak

Added to docs/fixes/{{YYYY-MM}}.md

Fixes #{{ISSUE_NUMBER}}
```

### Pull Requests

PR descriptions should:

- Link to feature documentation
- Reference fix documentation (monthly log or folder)
- Note any breaking changes
- List updated documentation files

## Best Practices

### Do

- ✅ Document as you develop, not after
- ✅ Use templates for consistency
- ✅ Link between related documentation
- ✅ Include practical code examples
- ✅ Keep documentation close to code (in repo)
- ✅ Use diagrams for complex flows
- ✅ Update documentation when code changes

### Don't

- ❌ Create duplicate documentation
- ❌ Let documentation become stale
- ❌ Skip documentation for "small" changes
- ❌ Use vague or unclear language
- ❌ Forget to link from code comments
- ❌ Create individual files for simple fixes
- ❌ Mix different documentation types in same folder

## Tools and Automation

### Recommended Tools

- **Markdown**: All documentation in Markdown format
- **Diagrams**: Use Mermaid, draw.io, or similar
- **API Docs**: Generate from code (JSDoc, TypeDoc, etc.)
- **Linting**: markdownlint for consistency

### Automation Opportunities

- Auto-generate API documentation from code
- Validate documentation links in CI
- Generate changelog from commit messages
- Create documentation stubs from issue templates

---

**Last Updated**: {{Date}}
**Template Version**: 1.0.0
