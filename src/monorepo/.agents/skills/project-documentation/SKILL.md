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

Comprehensive guidelines for creating clear, consistent, and maintainable documentation across the monorepo.

## Documentation Hierarchy

### Monorepo Documentation Structure

```
{{PROJECT_NAME}}/
├── README.md                    # Monorepo overview, quick start
├── AGENTS.md                    # AI context for entire workspace
├── CHANGELOG.md                 # Version history
├── CONTRIBUTING.md              # Contribution guidelines
├── apps/
│   ├── {{APP_NAME_1}}/
│   │   ├── README.md            # App-specific setup
│   │   └── AGENTS.md            # App-specific AI context
│   └── {{APP_NAME_2}}/
│       ├── README.md
│       └── AGENTS.md
├── packages/
│   └── {{PACKAGE_NAME}}/
│       └── README.md            # Package documentation
└── docs/
    ├── architecture/            # System design
    │   ├── overview.md
    │   └── decisions/           # ADRs
    ├── api/                     # API documentation
    ├── guides/                  # How-to guides
    └── specs/                   # Feature specifications
```

### Documentation Ownership

| Document          | Owner              | Update Frequency   |
| ----------------- | ------------------ | ------------------ |
| Root README.md    | Platform team      | Major releases     |
| App README.md     | App team           | Per feature        |
| Package README.md | Package maintainer | Per change         |
| AGENTS.md         | AI/Dev tooling     | As patterns evolve |
| ADRs              | Relevant team      | Per decision       |

## Root README.md Standards

### Required Sections

```markdown
# {{PROJECT_NAME}}

Brief description of what this monorepo contains and its purpose.

## Quick Start

\`\`\`bash

# Clone and install

git clone {{REPO_URL}}
cd {{PROJECT_NAME}}
{{PACKAGE_MANAGER}} install

# Run all apps in development

{{PACKAGE_MANAGER}} dev

# Run specific app

{{PACKAGE_MANAGER}} dev --filter={{APP_NAME_1}}
\`\`\`

## Workspace Structure

| Directory                     | Purpose                   |
| ----------------------------- | ------------------------- |
| `apps/{{APP_NAME_1}}`         | {{APP_1_DESCRIPTION}}     |
| `apps/{{APP_NAME_2}}`         | {{APP_2_DESCRIPTION}}     |
| `packages/{{PACKAGE_NAME_1}}` | {{PACKAGE_1_DESCRIPTION}} |

## Documentation

- [Architecture Overview](./docs/architecture/overview.md)
- [API Documentation](./docs/api/)
- [Contributing Guide](./CONTRIBUTING.md)

## Development

See individual app READMEs for specific setup:

- [{{APP_NAME_1}} README](./apps/{{APP_NAME_1}}/README.md)
- [{{APP_NAME_2}} README](./apps/{{APP_NAME_2}}/README.md)
```

## App/Package README Standards

### App README Template

```markdown
# {{APP_NAME}}

{{APP_DESCRIPTION}}

## Prerequisites

- Node.js {{NODE_VERSION}}
- {{OTHER_DEPENDENCY}}

## Setup

\`\`\`bash

# From monorepo root

{{PACKAGE_MANAGER}} install

# Setup environment

cp apps/{{APP_NAME}}/.env.example apps/{{APP_NAME}}/.env.local

# Edit .env.local with your values

\`\`\`

## Development

\`\`\`bash

# Start development server

{{PACKAGE_MANAGER}} dev --filter={{APP_NAME}}

# Run tests

{{PACKAGE_MANAGER}} test --filter={{APP_NAME}}
\`\`\`

## Architecture

Brief overview of app architecture and key patterns.
See [AGENTS.md](./AGENTS.md) for detailed context.

## Environment Variables

| Variable       | Description                | Required |
| -------------- | -------------------------- | -------- |
| `DATABASE_URL` | Database connection string | Yes      |
| `API_KEY`      | External API key           | No       |
```

### Package README Template

```markdown
# @{{PROJECT_NAME}}/{{PACKAGE_NAME}}

{{PACKAGE_DESCRIPTION}}

## Installation

\`\`\`bash

# Add to your app

{{PACKAGE_MANAGER}} add @{{PROJECT_NAME}}/{{PACKAGE_NAME}} --filter={{YOUR_APP}}
\`\`\`

## Usage

\`\`\`typescript
import { Component } from '@{{PROJECT_NAME}}/{{PACKAGE_NAME}}';

// Basic usage
<Component prop="value" />
\`\`\`

## API Reference

### Component

| Prop    | Type      | Default | Description |
| ------- | --------- | ------- | ----------- |
| `prop1` | `string`  | -       | Description |
| `prop2` | `boolean` | `false` | Description |

## Development

\`\`\`bash

# Build the package

{{PACKAGE_MANAGER}} build --filter={{PACKAGE_NAME}}

# Run tests

{{PACKAGE_MANAGER}} test --filter={{PACKAGE_NAME}}
\`\`\`
```

## Code Comments Standards

### When to Comment

**Comment WHY, not WHAT:**

```{{FILE_EXTENSION}}
// ❌ BAD - Describes what (obvious from code)
// Loop through users and check each one
for (const user of users) { ... }

// ✅ GOOD - Explains why
// Process users in batches to avoid memory issues with large datasets
for (const batch of chunk(users, 100)) { ... }
```

### File Headers

```{{FILE_EXTENSION}}
/**
 * {{COMPONENT_NAME}}
 *
 * Purpose: Brief description of the file's responsibility
 *
 * Dependencies:
 * - @{{PROJECT_NAME}}/ui: For base components
 * - @{{PROJECT_NAME}}/api: For data fetching
 *
 * @see docs/architecture/components.md
 */
```

### Function Documentation

```typescript
/**
 * Calculates engagement score based on user activity.
 *
 * Uses a weighted algorithm favoring recent activity.
 *
 * @param userId - User identifier
 * @param options - Calculation options
 * @returns Score 0-100, null if insufficient data
 *
 * @example
 * const score = await calculateScore('user-123', { days: 7 });
 *
 * @throws {UserNotFoundError} When user doesn't exist
 */
async function calculateEngagementScore(
	userId: string,
	options?: ScoreOptions,
): Promise<number | null>;
```

### Comment Tags

| Tag              | Usage                           |
| ---------------- | ------------------------------- |
| `TODO(username)` | Planned improvements with owner |
| `FIXME`          | Known issues to address         |
| `HACK`           | Temporary workarounds           |
| `NOTE`           | Important context               |
| `SECURITY`       | Security-sensitive code         |
| `DEPRECATED`     | Code to be removed              |

## Architectural Decision Records

### ADR Template

Location: `docs/architecture/decisions/ADR-NNN-title.md`

```markdown
# ADR-001: {{DECISION_TITLE}}

## Status

Accepted | Proposed | Deprecated | Superseded by ADR-XXX

## Context

What problem are we solving? What constraints exist?

## Decision

What did we decide? Be specific about the approach.

## Consequences

### Positive

- Benefit 1
- Benefit 2

### Negative

- Tradeoff 1
- Tradeoff 2

### Neutral

- Related change

## References

- [Related ADR](./ADR-000-related.md)
- [External resource](https://example.com)
```

### When to Write ADRs

- Choosing between technologies
- Establishing architecture patterns
- Making breaking changes
- Security-related decisions
- Significant dependency changes

## Changelog Standards

### Format (Keep a Changelog)

```markdown
# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- New feature description (#PR)

### Changed

- Modified behavior (#PR)

### Fixed

- Bug fix description (#PR)

## [1.2.0] - 2026-01-26

### Added

- Feature description
```

### Commit Messages

```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Cross-Package Documentation

### Linking Between Docs

```markdown
<!-- From app README to package -->

See [@{{PROJECT_NAME}}/ui](../../packages/ui/README.md) for component docs.

<!-- From package to architecture -->

See [Component Architecture](../../docs/architecture/components.md).
```

### API Documentation

For shared packages, maintain:

```
packages/{{PACKAGE_NAME}}/
├── README.md              # Usage guide
├── docs/
│   ├── api.md             # Full API reference
│   └── examples/          # Code examples
└── CHANGELOG.md           # Package changelog
```

## Documentation Quality Checklist

### Before Merging

- [ ] README updated if behavior changed
- [ ] Public APIs have JSDoc/docstrings
- [ ] Complex logic has explanatory comments
- [ ] Breaking changes documented in CHANGELOG
- [ ] New features have usage examples
- [ ] Links are not broken

### Review Criteria

- [ ] Documentation matches implementation
- [ ] Examples are copy-paste ready
- [ ] Consistent terminology used
- [ ] Screenshots current (if applicable)

## Related Skills

- See `.agents/skills/writing-skills/` for prompt writing
- See `.agents/skills/writing-plans/` for feature planning
