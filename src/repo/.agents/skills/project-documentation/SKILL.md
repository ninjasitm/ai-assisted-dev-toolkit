---
name: project-documentation
description: Standards for creating and maintaining project documentation including README files, inline comments, API documentation, and architectural decision records
version: 1.0.0
author: {{PROJECT_NAME}} Team
created: 2026-01-26
updated: 2026-01-26
tags:
  - documentation
  - readme
  - api-docs
  - adr
  - comments
applies_to:
  - "**/*.md"
  - "**/README*"
  - "**/CHANGELOG*"
  - "**/docs/**"
---

# Project Documentation Standards

Comprehensive guidelines for creating clear, consistent, and maintainable documentation across the project.

## Documentation Hierarchy

### Required Documentation

| File           | Location     | Purpose                              |
| -------------- | ------------ | ------------------------------------ |
| `README.md`    | Project root | Project overview, setup, quick start |
| `AGENTS.md`    | Project root | AI agent context and patterns        |
| `CHANGELOG.md` | Project root | Version history and changes          |
| `docs/`        | Project root | Detailed documentation               |

### Documentation Types

```
{{PROJECT_NAME}}/
├── README.md                    # Quick start, overview
├── AGENTS.md                    # AI context
├── CHANGELOG.md                 # Version history
├── CONTRIBUTING.md              # Contribution guidelines
└── docs/
    ├── architecture/            # System design
    │   ├── overview.md
    │   └── decisions/           # ADRs
    ├── api/                     # API documentation
    ├── guides/                  # How-to guides
    ├── specs/                   # Feature specifications
    └── fixes/                   # Bug fix documentation
```

## README.md Standards

### Required Sections

Every README.md should include:

```markdown
# Project Name

Brief description of what this project does.

## Quick Start

\`\`\`bash

# Installation

{{PACKAGE_MANAGER}} install

# Development

{{PACKAGE_MANAGER}} run dev

# Testing

{{PACKAGE_MANAGER}} run test
\`\`\`

## Features

- Feature 1: Description
- Feature 2: Description

## Documentation

- [Full Documentation](./docs/)
- [API Reference](./docs/api/)
- [Contributing](./CONTRIBUTING.md)

## License

{{LICENSE_TYPE}}
```

### README Best Practices

**✅ DO:**

- Start with a clear one-line description
- Include badges (build status, version, license)
- Provide copy-paste ready commands
- Link to detailed documentation
- Include screenshots/GIFs for UI projects
- Keep the quick start under 5 commands

**❌ DON'T:**

- Include implementation details
- Document every configuration option
- Repeat information from other docs
- Use jargon without explanation
- Assume prior knowledge of the stack

## Code Comments Standards

### When to Comment

**Comment WHY, not WHAT:**

```{{FILE_EXTENSION}}
// ❌ BAD - Describes what the code does (obvious from reading)
// Loop through users and check each one
for (const user of users) {
    if (user.isActive) { ... }
}

// ✅ GOOD - Explains why this approach was chosen
// Check active users first to fail fast on permission errors
// before expensive database operations
for (const user of users) {
    if (user.isActive) { ... }
}
```

### Comment Types

#### File Headers

```{{FILE_EXTENSION}}
/**
 * {{COMPONENT_NAME}}
 *
 * Purpose: Brief description of the file's responsibility
 *
 * Dependencies:
 * - ServiceA: For data fetching
 * - UtilityB: For formatting
 *
 * @see docs/architecture/components.md for design decisions
 */
```

#### Function Documentation

```{{FILE_EXTENSION}}
/**
 * Calculates the user's engagement score based on activity metrics.
 *
 * The algorithm weighs recent activity higher than historical data
 * to reflect current engagement levels accurately.
 *
 * @param userId - The unique identifier of the user
 * @param timeRange - Period to analyze (default: 30 days)
 * @returns Engagement score between 0-100, or null if insufficient data
 *
 * @example
 * const score = await calculateEngagementScore('user-123', { days: 7 });
 * if (score > 80) { // Highly engaged user }
 *
 * @throws {UserNotFoundError} When userId doesn't exist
 * @see docs/algorithms/engagement.md for scoring methodology
 */
```

#### Inline Comments

```{{FILE_EXTENSION}}
// IMPORTANT: This order matters - auth must happen before rate limiting
await authenticate(request);
await checkRateLimit(request);

// TODO(username): Refactor when API v2 is released - JIRA-123
const legacyAdapter = createAdapter();

// HACK: Workaround for browser bug in Safari 16.x
// Remove after Safari 17 reaches 90% adoption
if (isSafari16) { ... }

// NOTE: This seems slow but is optimized by the runtime
// See benchmarks: docs/performance/query-optimization.md
const result = data.filter(...).map(...).reduce(...);
```

### Comment Tags

| Tag          | Usage                   |
| ------------ | ----------------------- |
| `TODO`       | Planned improvements    |
| `FIXME`      | Known issues to address |
| `HACK`       | Temporary workarounds   |
| `NOTE`       | Important context       |
| `IMPORTANT`  | Critical information    |
| `DEPRECATED` | Code to be removed      |
| `SECURITY`   | Security-sensitive code |

## API Documentation

### Endpoint Documentation

```markdown
## POST /api/users

Create a new user account.

### Request

\`\`\`json
{
"email": "user@example.com",
"name": "John Doe",
"role": "member"
}
\`\`\`

### Response

**201 Created**
\`\`\`json
{
"id": "usr_123",
"email": "user@example.com",
"name": "John Doe",
"createdAt": "2026-01-26T10:00:00Z"
}
\`\`\`

**400 Bad Request**
\`\`\`json
{
"error": "VALIDATION_ERROR",
"message": "Email already exists"
}
\`\`\`

### Notes

- Requires authentication
- Rate limited: 10 requests/minute
```

## Architectural Decision Records (ADRs)

### ADR Template

```markdown
# ADR-001: {{DECISION_TITLE}}

## Status

Accepted | Proposed | Deprecated | Superseded by ADR-XXX

## Context

What is the issue that we're seeing that is motivating this decision?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive

- Benefit 1
- Benefit 2

### Negative

- Tradeoff 1
- Tradeoff 2

## References

- [Related document](link)
- [Prior discussion](link)
```

### When to Write ADRs

- Significant technology choices
- Architecture pattern decisions
- Breaking changes to APIs
- Security-related decisions
- Performance optimization approaches

## Changelog Standards

### Format (Keep a Changelog)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- New feature description

### Changed

- Modified behavior description

### Deprecated

- Soon-to-be removed features

### Removed

- Removed features

### Fixed

- Bug fix descriptions

### Security

- Security vulnerability fixes

## [1.0.0] - 2026-01-26

### Added

- Initial release
```

## Documentation Quality Checklist

### Before Committing

- [ ] README updated if behavior changed
- [ ] Public functions have JSDoc/docstrings
- [ ] Complex logic has explanatory comments
- [ ] Breaking changes documented in CHANGELOG
- [ ] New features have usage examples
- [ ] Error messages are documented

### Review Criteria

- [ ] Documentation matches implementation
- [ ] Examples are copy-paste ready
- [ ] Links are not broken
- [ ] Code samples are syntax-highlighted
- [ ] Screenshots are up-to-date

## Related Skills

- See `.agents/skills/writing-skills/` for prompt writing guidelines
- See `.agents/skills/writing-plans/` for feature planning documentation
