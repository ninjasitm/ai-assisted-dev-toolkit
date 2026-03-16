---
applyTo: "**/*"
description: "Monorepo documentation standards for features and fixes"
---

# Monorepo Documentation Guidelines

## Overview

All project changes must be documented following these standards to maintain clear historical records and enable effective knowledge transfer.

## Documentation Location

All documentation lives in the `docs/` folder at the project root and in per-app `docs/` folders:

- **Features** → `docs/features/{{ISSUE_ID}}-FEATURE-NAME/`
- **Fixes** → `docs/fixes/` (tiered structure - see below)
- **Architecture** → `docs/architecture/` (ADRs, system design)
- **API** → `docs/api/` (API specifications)

## Documentation Location Rules

### CRITICAL: App-Specific vs Root Documentation

This monorepo uses a **distributed documentation strategy** where app-specific documentation lives with each app, and only monorepo-wide concerns are documented at the root level.

**App-specific documentation** must live in respective app folders:

- **{{APP_1}} Features** → `{{APP_DIR}}/{{APP_1}}/docs/features/{{ISSUE_ID}}-FEATURE-NAME/`
- **{{APP_2}} Features** → `{{APP_DIR}}/{{APP_2}}/docs/features/{{ISSUE_ID}}-FEATURE-NAME/`
- **{{APP_1}} Fixes** → `{{APP_DIR}}/{{APP_1}}/docs/fixes/`
- **{{APP_2}} Fixes** → `{{APP_DIR}}/{{APP_2}}/docs/fixes/`
- **Shared Package Features** → `{{PACKAGES_DIR}}/{{PACKAGE}}/docs/features/`
- **Shared Package Fixes** → `{{PACKAGES_DIR}}/{{PACKAGE}}/docs/fixes/`

**Root `docs/` folder** is ONLY for monorepo-wide documentation:

- Architecture decisions affecting multiple apps
- Deployment pipelines and infrastructure
- Cross-app integration patterns
- General project overview and getting started
- Monorepo-wide tooling and configuration

### Decision Tree: Where to Document?

```
Is this change specific to ONE app or package?
├── YES → Document in `{{APP_DIR}}/{app}/docs/` or `{{PACKAGES_DIR}}/{package}/docs/`
└── NO → Does it affect multiple apps or the monorepo structure?
    ├── YES → Document in root `docs/`
    └── NO → You might be documenting the wrong thing
```

### Examples

**✅ Correct Placement:**

- Frontend component refactor → `{{APP_DIR}}/{{APP_1}}/docs/features/{{ISSUE_PREFIX}}-123-COMPONENT-REFACTOR/`
- API endpoint changes → `{{APP_DIR}}/{{APP_2}}/docs/features/{{ISSUE_PREFIX}}-456-NEW-ENDPOINT/`
- Shared utility function → `{{PACKAGES_DIR}}/{{PACKAGE_1}}/docs/features/{{ISSUE_PREFIX}}-789-UTIL-FUNC/`
- CI/CD pipeline → `docs/infrastructure/github-actions.md`
- Deployment strategy → `docs/deployment/{{DEPLOY_PLATFORM}}.md`
- Monorepo migration → `docs/architecture/0001-monorepo-structure.md`

**❌ Incorrect Placement:**

- ❌ App component in root docs → Should be in `{{APP_DIR}}/{{APP_1}}/docs/`
- ❌ API route in root docs → Should be in `{{APP_DIR}}/{{APP_2}}/docs/`
- ❌ App-specific bug fix in root → Should be in `{{APP_DIR}}/{app}/docs/fixes/`
- ❌ CI/CD in app docs → Should be in root `docs/infrastructure/`

---

## Per-App Documentation Obligations

These rules apply to **every app** in `{{APP_DIR}}/`. The trigger for writing docs is a code change in that app, not just feature-level work.

| App                        | Change type                                                           | Required doc action                                                                                                            |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `{{APP_DIR}}/{{APP_1}}`    | New or modified controller/route                                      | Update `docs/api/` endpoint spec **and** add/update the corresponding page in `{{APP_DIR}}/{{DOCS_APP}}/{{DOCS_CONTENT_DIR}}/` |
| `{{APP_DIR}}/{{APP_1}}`    | New module / service                                                  | Add to feature spec (`docs/features/`) and note architectural choices                                                          |
| `{{APP_DIR}}/{{APP_1}}`    | Breaking change (renamed or removed endpoint, changed response shape) | Update `docs/api/`, `{{APP_DIR}}/{{DOCS_APP}}/{{DOCS_CONTENT_DIR}}/`, **and** `CHANGELOG.md`                                   |
| `{{APP_DIR}}/{{APP_2}}`    | New route handler or API route                                        | Update relevant feature spec                                                                                                   |
| `{{APP_DIR}}/{{APP_2}}`    | New page / UI feature                                                 | Update feature spec (`docs/features/`) and add/update page in `{{APP_DIR}}/{{DOCS_APP}}/{{DOCS_CONTENT_DIR}}/` if user-facing  |
| `{{APP_DIR}}/{{APP_3}}`    | New page / UI feature                                                 | Update feature spec (`docs/features/`) and add/update page in `{{APP_DIR}}/{{DOCS_APP}}/{{DOCS_CONTENT_DIR}}/` if user-facing  |
| `{{APP_DIR}}/{{DOCS_APP}}` | Content-only edits (MDX, meta, config)                                | No extra docs required — changes here **are** the documentation update                                                         |
| `{{PACKAGES_DIR}}/*`       | New or changed public API                                             | Update `docs/api/` and add/update the relevant page in `{{APP_DIR}}/{{DOCS_APP}}/{{DOCS_CONTENT_DIR}}/`                        |

> **Rule of thumb:** If you added or changed a controller, an API route handler, or any function that is callable from another app or external client, you must update both `docs/api/` **and** `{{APP_DIR}}/{{DOCS_APP}}/{{DOCS_CONTENT_DIR}}/` before committing. The `{{APP_DIR}}/{{DOCS_APP}}` site is the living, user-facing documentation — keep it in sync with every shipped feature.

---

## Feature Documentation

### When to Document Features

Create feature documentation for:

- New user-facing features
- API endpoints or major backend services
- Component libraries or reusable modules
- Significant architectural changes
- Any work tracked by issue IDs ({{ISSUE_TRACKER}} tickets)

### Feature Documentation Structure

Each app maintains its own feature documentation:

**Location:** `{{APP_DIR}}/{app}/docs/features/{{ISSUE_ID}}-FEATURE-NAME/`

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

- `{{APP_DIR}}/{{APP_NAME}}/src/components/FeatureName.{{FILE_EXTENSION}}`
- `{{APP_DIR}}/{{APP_NAME}}/test/FeatureName.test.{{FILE_EXTENSION}}`

### Modified Files

- `{{APP_DIR}}/{{APP_NAME}}/src/routes/index.{{FILE_EXTENSION}}`
- `{{APP_DIR}}/{{APP_NAME}}/src/types/index.{{FILE_EXTENSION}}`

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

---

## Fix & Bug Documentation

### Decision Tree

**Before creating any fix documentation, ask:**

1. **Is this a complex fix?** (multi-file, architectural changes, affects multiple features)
   - ✅ YES → Create folder `{{APP_DIR}}/{app}/docs/fixes/{{ISSUE_ID}}-FIX-NAME/` with `spec.md` + `plan.md`
   - ❌ NO → Add entry to `{{APP_DIR}}/{app}/docs/fixes/{YYYY-MM}.md` (monthly log)

2. **Does the monthly log for this month exist?**
   - ❌ NO → Create it first using the template below
   - ✅ YES → Add your fix as a new section

**⚠️ CRITICAL: Do NOT create individual `.md` files for simple fixes!**

### What NOT to Do

**DO NOT create individual fix files like:**

- ❌ `{{APP_DIR}}/{{APP_1}}/docs/fixes/2025-10-component-bug.md`
- ❌ `{{APP_DIR}}/{{APP_2}}/docs/fixes/api-error-handling.md`
- ❌ `{{PACKAGES_DIR}}/{{PACKAGE_1}}/docs/fixes/type-definition-fix.md`

**Instead, add them as sections in the monthly log:**

- ✅ `{{APP_DIR}}/{{APP_1}}/docs/fixes/2025-10.md` with a new section
- ✅ `{{APP_DIR}}/{{APP_2}}/docs/fixes/2025-10.md` with a new section

### Complex Fix Structure

**Location:** `{{APP_DIR}}/{app}/docs/fixes/{{ISSUE_ID}}-FIX-NAME/`

**Structure:**

```
{{ISSUE_ID}}-FIX-NAME/
├── spec.md       # Root cause analysis
├── plan.md       # Fix implementation plan
└── [optional]    # Test cases, reproduction steps
```

**Use when:**

- Fix requires architectural changes
- Affects multiple components within the app
- Needs detailed root cause analysis
- Requires migration or data transformation
- Has significant testing requirements

### Monthly Fix Logs

**Location:** `{{APP_DIR}}/{app}/docs/fixes/{YYYY-MM}.md`

**File Creation Rules:**

- Create NEW file when calendar month changes (e.g., Feb 1 → create `2026-02.md`)
- Do NOT append to previous month's file
- Each app maintains its own monthly logs
- Use [Keep a Changelog](https://keepachangelog.com/) format

### Monthly Log Template for Apps

```markdown
# {{Month}} {{Year}} - {{App Name}} App Fixes & Improvements

**App**: {{APP_NAME}} ({{FRAMEWORK}})
**Format**: [Keep a Changelog](https://keepachangelog.com/)
**Period**: {{Month}} 1-{{Last Day}}, {{Year}}

## Summary

Brief overview of the month's focus areas for this app.

### Key Themes

- Theme 1: [e.g., Component refactoring]
- Theme 2: [e.g., Performance optimization]
- Theme 3: [e.g., TypeScript strict mode compliance]

### Statistics

- Total fixes: X
- Complex fixes: Y (with dedicated folders)
- Breaking changes: Z

---

## [{{YYYY-MM-DD}}] - {{Fix Title}}

### Fixed/Changed/Added

- **Issue**: Brief description of the problem
  - **Root cause**: Why it happened
  - **Solution**: How it was fixed
  - **Files modified**:
    - `src/components/Component.{{FILE_EXTENSION}}`
    - `src/composables/use-feature.{{FILE_EXTENSION}}`
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

### {{APP_NAME}}-Specific Patterns

- Pattern 1: [Description and prevention strategy]
- Pattern 2: [Description and prevention strategy]

### Best Practices for {{FRAMEWORK}}

- Practice 1: [Description]
- Practice 2: [Description]

### Technical Debt

- [ ] Item 1: [Description and priority]
- [ ] Item 2: [Description and priority]

---

**Last Updated**: {{Date}}
**Next Review**: {{Next Month End}}
```

---

## Root-Level Documentation

### When to Use Root `docs/`

Create root-level documentation for:

1. **Architecture Decisions** affecting multiple apps
2. **Deployment & Infrastructure** (CI/CD, hosting, environments)
3. **Cross-App Integration** patterns and contracts
4. **Monorepo Tooling** ({{BUILD_SYSTEM}}, workspace management)
5. **Getting Started** guides for new developers
6. **Project Overview** and high-level architecture

### Root Documentation Structure

```
docs/
├── architecture/          # ADRs and system design
│   ├── 0001-monorepo-choice.md
│   ├── 0002-api-gateway-pattern.md
│   └── decisions.md       # Index of all ADRs
│
├── api/                   # API specifications
│   └── ...
│
├── deployment/            # Infrastructure and deployment
│   ├── {{DEPLOY_PLATFORM}}.md
│   ├── github-actions.md
│   └── environments.md
│
├── integration/           # Cross-app patterns
│   ├── api-contracts.md
│   ├── shared-types.md
│   └── event-bus.md
│
├── infrastructure/        # Monorepo tooling
│   ├── {{BUILD_SYSTEM}}.md
│   ├── package-management.md
│   └── workspace-scripts.md
│
└── getting-started.md     # New developer onboarding
```

---

## Architecture Decision Records (ADRs)

### When to Create ADRs

Document significant architectural decisions:

- Technology choices (frameworks, libraries, databases)
- Design patterns and approaches
- Infrastructure decisions
- Security or performance trade-offs
- Choosing monorepo structure
- Selecting build system ({{BUILD_SYSTEM}}, etc.)
- API gateway vs direct app communication
- Shared package strategy
- Cross-app authentication approach
- Deployment platform decisions

### ADR Structure

**Location:** `docs/architecture/{{NNNN}}-{{decision-title}}.md`

**Template:**

```markdown
# ADR {{NNNN}}: {{Decision Title}}

**Status**: Proposed | Accepted | Deprecated | Superseded
**Date**: {{YYYY-MM-DD}}
**Scope**: Monorepo-wide
**Affected Apps**: {{APP_1}}, {{APP_2}}, [or "All"]
**Deciders**: [List key decision makers]

## Context

What is the issue we're facing that affects multiple apps or the monorepo structure?

## Decision

What is the change we're proposing for the monorepo?

## Impact on Apps

### {{APP_1}}

- Changes required: [list]
- Migration effort: [estimate]

### {{APP_2}}

- Changes required: [list]
- Migration effort: [estimate]

### Shared Packages

- Changes required: [list]

## Consequences

### Positive

- Benefit 1 for monorepo
- Benefit 2 for development workflow

### Negative

- Trade-off 1
- Trade-off 2

## Alternatives Considered

### Alternative 1: {{Name}}

- Pros: [list]
- Cons: [list]
- Why rejected: [reason]

## Implementation

### Phase 1: Shared Packages

- [ ] Task 1
- [ ] Task 2

### Phase 2: App Migrations

- [ ] Migrate {{APP_1}}
- [ ] Migrate {{APP_2}}

### Phase 3: Documentation

- [ ] Update app-specific docs
- [ ] Update root getting-started

## Rollout Strategy

1. Implement in shared packages first
2. Migrate {{APP_1}} (less critical)
3. Monitor and adjust
4. Migrate {{APP_2}} (production app)

## References

- [Link to research]
- [Link to documentation]
- [Related ADRs]

---

**Last Updated**: {{Date}}
```

---

## Cross-App Documentation

### API Contracts

**Location:** `docs/integration/api-contracts.md`

Document contracts between apps:

```markdown
# API Contracts

## {{APP_2}} → {{APP_1}} Communication

### Endpoint: POST /api/data

**Provider**: {{APP_2}} ({{FRAMEWORK}})
**Consumer**: {{APP_1}} ({{FRAMEWORK}})

**Request:**

\`\`\`typescript
interface DataRequest {
userId: string;
payload: Record<string, unknown>;
}
\`\`\`

**Response:**

\`\`\`typescript
interface DataResponse {
id: string;
status: 'success' | 'error';
data: unknown;
}
\`\`\`

**Error Codes:**

- 400: Invalid request format
- 404: User not found
- 500: Internal server error

**Changelog:**

- 2025-01-15: Added `payload` field
- 2024-12-01: Initial version
```

---

## Shared Package Documentation

### Package-Level Documentation

Each shared package maintains its own docs:

**Location:** `{{PACKAGES_DIR}}/{{PACKAGE}}/docs/`

```
{{PACKAGES_DIR}}/{{PACKAGE}}/
├── docs/
│   ├── features/          # New package features
│   ├── fixes/             # Monthly fix logs
│   ├── api.md             # Package API reference
│   └── migration-guide.md # Breaking changes
├── src/
└── package.json
```

### Package Feature Documentation

**Location:** `{{PACKAGES_DIR}}/{{PACKAGE}}/docs/features/{{ISSUE_ID}}-FEATURE-NAME/`

Similar structure to app features, but focus on:

- Public API additions
- Breaking changes for consumers
- Migration guides for existing usage

### Package Fix Documentation

**Location:** `{{PACKAGES_DIR}}/{{PACKAGE}}/docs/fixes/{YYYY-MM}.md`

Same monthly log structure, but track:

- Bug fixes in package
- API improvements
- Breaking changes and deprecations
- Apps affected by changes

---

## Changelog Management

### App-Specific Changelogs

Each app maintains its own `CHANGELOG.md`:

**Location:** `{{APP_DIR}}/{app}/CHANGELOG.md`

```markdown
# {{App Name}} Changelog

All notable changes to {{APP_NAME}} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Feature X ([{{ISSUE_ID}}](docs/features/{{ISSUE_ID}}-FEATURE-NAME/))

### Changed

- Component Y behavior ([docs/fixes/2025-01.md](docs/fixes/2025-01.md))

### Fixed

- Bug Z (see [monthly log](docs/fixes/2025-01.md#2025-01-15))

## [{{VERSION}}] - {{YYYY-MM-DD}}

[Previous releases...]
```

### Root Changelog

**Location:** `CHANGELOG.md` (root)

Tracks monorepo-wide changes:

```markdown
# Monorepo Changelog

## [Unreleased]

### Infrastructure

- Updated {{BUILD_SYSTEM}} to v{{VERSION}}
- Added GitHub Actions caching

### {{APP_1}}

- See [app changelog]({{APP_DIR}}/{{APP_1}}/CHANGELOG.md)

### {{APP_2}}

- See [app changelog]({{APP_DIR}}/{{APP_2}}/CHANGELOG.md)

### Shared Packages

- **{{PACKAGE_1}} v{{VERSION}}**: New utility functions
- **{{PACKAGE_2}} v{{VERSION}}**: TypeScript types update

## [{{VERSION}}] - {{YYYY-MM-DD}}

[Previous releases...]
```

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

---

## Pre-Commit Documentation Gate

**⚠️ MANDATORY: Documentation MUST be written or updated BEFORE committing code. This is a hard requirement — no commit should land without the corresponding docs entry.**

### Pre-Commit Checklist

Before running `git commit`, verify ALL items that apply to your change:

**All changes:**

- [ ] **Features**: Feature spec exists in `docs/features/{{ISSUE_ID}}-FEATURE-NAME/spec.md` and reflects the current implementation
- [ ] **Features**: `plan.md` is updated if scope changed
- [ ] **Fixes**: Entry added to `docs/fixes/{{YYYY-MM}}.md` (or complex fix folder created)
- [ ] **Breaking changes**: `CHANGELOG.md` updated
- [ ] **Architectural decisions**: ADR created in `docs/architecture/` if a significant choice was made
- [ ] **README is accurate** — If setup steps, commands, or env vars changed, the relevant `README.md` is updated

**`{{APP_DIR}}/{{APP_1}}` changes ({{APP_1_FRAMEWORK}}):**

- [ ] New or modified controller endpoints documented in `docs/api/` (HTTP method, path, auth requirements, request/response shape, error codes)
- [ ] Corresponding `{{APP_DIR}}/{{DOCS_APP}}/{{DOCS_CONTENT_DIR}}/` page created or updated
- [ ] Removed or renamed endpoints noted as breaking changes in `docs/api/`, `{{APP_DIR}}/{{DOCS_APP}}/{{DOCS_CONTENT_DIR}}/`, and `CHANGELOG.md`
- [ ] New modules/services referenced in the relevant feature spec

**`{{APP_DIR}}/{{APP_2}}` or `{{APP_DIR}}/{{APP_3}}` changes ({{APP_2_FRAMEWORK}}):**

- [ ] New route handlers documented in the relevant feature spec under `docs/features/`
- [ ] Any public-facing or cross-app API routes documented in `docs/api/`
- [ ] User-facing features have a corresponding `{{APP_DIR}}/{{DOCS_APP}}/{{DOCS_CONTENT_DIR}}/` page created or updated

**`{{PACKAGES_DIR}}/*` changes:**

- [ ] New or changed public exports documented in `docs/api/` or the relevant feature spec
- [ ] `{{APP_DIR}}/{{DOCS_APP}}/{{DOCS_CONTENT_DIR}}/` updated if the change is developer-facing

**`{{APP_DIR}}/{{DOCS_APP}}` changes:**

- [ ] No extra docs required — the content edit itself is the documentation update

If any applicable item is missing, **write the documentation first, then commit**.

### Updating the Docs App

If this monorepo has a dedicated documentation app (`{{APP_DIR}}/{{DOCS_APP}}`), treat it as a first-class deliverable alongside code changes.

**When to update the docs app:**

- A new user-facing feature is shipped
- An existing feature's behavior or UI changes
- A public API or shared package interface is added or modified
- A breaking change is introduced anywhere

**How to update the docs app:**

1. **Feature guides** — Add or update a page under the relevant section explaining the feature.
2. **API reference** — Update any auto-generated or hand-written API docs pages.
3. **Changelog / release notes** — Add an entry if the docs app surfaces a changelog.
4. **Navigation / sidebar** — Register new pages in the sidebar or nav config if required by the docs framework.
5. **Preview locally** — Run the docs app to verify content renders correctly before committing:
   ```bash
   {{PACKAGE_MANAGER}} dev --filter={{DOCS_APP}}
   ```

### AI Agent Instructions

When implementing a feature or fix, AI agents **must**:

1. **Check for existing docs first** — Read the appropriate `docs/features/` folder for an existing spec before writing any code. If no spec exists, create one from `templates/feature-spec.template.md` and confirm scope before proceeding.
2. **Respect the placement decision tree** — Use app-level `docs/` for app-specific changes and root `docs/` only for cross-cutting concerns.
3. **Check the per-app obligations table** — Identify which apps are affected and follow the required doc actions for each.
4. **Create docs early** — Spec and plan should be written or updated _before_ implementation begins, not after.
5. **Keep docs in sync** — Update `spec.md` and `plan.md` as implementation decisions are made. Do not wait until the end.
6. **Update the docs app** — If `{{APP_DIR}}/{{DOCS_APP}}` is present, update the relevant content pages and sidebar navigation.
7. **Verify before completing** — After implementation, review all doc files and docs-app pages to ensure they reflect the final state of the code.
8. **Commit together** — Include all documentation and docs-app changes in the same commit (or PR) as the code changes.
9. **Never skip for "small" changes** — All fixes go in the monthly log at minimum. All features get a spec folder.

---

## Documentation Workflows

### Creating a New Feature

1. **Identify scope**: Single app or cross-app?
2. **Create documentation**:
   - App-specific: `{{APP_DIR}}/{app}/docs/features/{{ISSUE_ID}}-NAME/`
   - Cross-app: Root ADR + app-specific implementation docs
3. **Use spec workflow**: Run `/spec` in context of the app
4. **Create plan**: Run `/plan` in app context
5. **Link from commits**: Reference documentation path

### Fixing a Bug

1. **Determine complexity**: Simple or complex?
2. **Check monthly log**: Does current month's log exist?
3. **Document appropriately**:
   - Simple: Add section to `{{APP_DIR}}/{app}/docs/fixes/{YYYY-MM}.md`
   - Complex: Create `{{APP_DIR}}/{app}/docs/fixes/{{ISSUE_ID}}-FIX/`
4. **Update app changelog**: Reference in `{{APP_DIR}}/{app}/CHANGELOG.md`

### Cross-App Changes

1. **Create root ADR**: Document decision at `docs/architecture/`
2. **Create app-specific docs**: Implementation details in each app
3. **Update integration docs**: If APIs change, update `docs/integration/`
4. **Update root changelog**: Reference in root `CHANGELOG.md`

---

## Integration with Workflows

### During Development

1. **Starting work**: Create or reference feature spec (`docs/features/` or `docs/fixes/`)
2. **While implementing**: Keep `spec.md` and `plan.md` updated as scope evolves
3. **Before every commit**: Run through the Pre-Commit Documentation Gate checklist above
4. **Bug fixes**: Add to monthly log or create complex fix folder **before committing the fix**
5. **Code review**: Reviewer verifies documentation is present and accurate
6. **Merging**: Confirm changelog is updated if the change is user-facing or breaking

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

---

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

---

## Best Practices

### Do

- ✅ Document as you develop, not after
- ✅ Keep app-specific docs with app code
- ✅ Use root docs only for cross-cutting concerns
- ✅ Use templates for consistency
- ✅ Link between related docs across apps
- ✅ Include practical code examples
- ✅ Maintain separate changelogs per app
- ✅ Document API contracts explicitly
- ✅ Update all affected app docs for shared changes
- ✅ Use diagrams for complex flows

### Don't

- ❌ Put app-specific features in root docs
- ❌ Duplicate documentation across apps
- ❌ Create individual fix files for simple bugs
- ❌ Forget to update API contract docs
- ❌ Mix app-specific and monorepo concerns
- ❌ Let cross-app integration docs become stale
- ❌ Skip documentation for "small" changes
- ❌ Use vague or unclear language
- ❌ Mix different documentation types in same folder

---

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

## Quick Reference

| Documentation Type       | Location                                           | Example                       |
| ------------------------ | -------------------------------------------------- | ----------------------------- |
| {{APP_1}} Feature        | `{{APP_DIR}}/{{APP_1}}/docs/features/`             | Component implementation      |
| {{APP_2}} Feature        | `{{APP_DIR}}/{{APP_2}}/docs/features/`             | API endpoint addition         |
| {{APP_1}} Fix (simple)   | `{{APP_DIR}}/{{APP_1}}/docs/fixes/{YYYY-MM}.md`    | CSS styling bug               |
| {{APP_2}} Fix (complex)  | `{{APP_DIR}}/{{APP_2}}/docs/fixes/{{ISSUE_ID}}-*/` | Database migration            |
| Shared Package Feature   | `{{PACKAGES_DIR}}/{pkg}/docs/features/`            | Utility function addition     |
| Cross-App Architecture   | `docs/architecture/`                               | ADR for authentication        |
| Deployment               | `docs/deployment/`                                 | CI/CD pipeline documentation  |
| Integration              | `docs/integration/`                                | API contracts between apps    |
| Monorepo Tooling         | `docs/infrastructure/`                             | {{BUILD_SYSTEM}} config guide |
| App Changelog            | `{{APP_DIR}}/{app}/CHANGELOG.md`                   | App-specific version history  |
| Root Changelog           | `CHANGELOG.md`                                     | Monorepo-wide changes         |
| App Getting Started      | `{{APP_DIR}}/{app}/README.md`                      | App-specific setup            |
| Docs App Content         | `{{APP_DIR}}/{{DOCS_APP}}/{{DOCS_CONTENT_DIR}}/`   | User-facing documentation     |
| Monorepo Getting Started | `docs/getting-started.md` or root `README.md`      | New developer onboarding      |

---

**Last Updated**: {{Date}}
**Template Version**: 2.0.0
