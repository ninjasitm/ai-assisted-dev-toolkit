---
applyTo: "**/*"
description: "Monorepo documentation standards for features and fixes"
---

# Monorepo Documentation Guidelines

## Overview

This monorepo uses a **distributed documentation strategy** where app-specific documentation lives with each app, and only monorepo-wide concerns are documented at the root level.

## Documentation Location Rules

### CRITICAL: App-Specific vs Root Documentation

**App-specific documentation** must live in respective app folders:

- **{{APP_1}} Features** → `apps/{{APP_1}}/docs/features/{{ISSUE_ID}}-FEATURE-NAME/`
- **{{APP_2}} Features** → `apps/{{APP_2}}/docs/features/{{ISSUE_ID}}-FEATURE-NAME/`
- **{{APP_1}} Fixes** → `apps/{{APP_1}}/docs/fixes/`
- **{{APP_2}} Fixes** → `apps/{{APP_2}}/docs/fixes/`
- **Shared Package Features** → `packages/{{PACKAGE}}/docs/features/`
- **Shared Package Fixes** → `packages/{{PACKAGE}}/docs/fixes/`

**Root `docs/` folder** is ONLY for monorepo-wide documentation:

- Architecture decisions affecting multiple apps
- Deployment pipelines and infrastructure
- Cross-app integration patterns
- General project overview and getting started
- Monorepo-wide tooling and configuration

### Decision Tree: Where to Document?

```
Is this change specific to ONE app or package?
├── YES → Document in `apps/{app}/docs/` or `packages/{package}/docs/`
└── NO → Does it affect multiple apps or the monorepo structure?
    ├── YES → Document in root `docs/`
    └── NO → You might be documenting the wrong thing
```

### Examples

**✅ Correct Placement:**

- Frontend component refactor → `apps/{{APP_1}}/docs/features/LEB-123-COMPONENT-REFACTOR/`
- API endpoint changes → `apps/{{APP_2}}/docs/features/LEB-456-NEW-ENDPOINT/`
- Shared utility function → `packages/{{PACKAGE_1}}/docs/features/LEB-789-UTIL-FUNC/`
- CI/CD pipeline → `docs/infrastructure/github-actions.md`
- Deployment strategy → `docs/deployment/cloudflare-workers.md`
- Monorepo migration → `docs/architecture/0001-monorepo-structure.md`

**❌ Incorrect Placement:**

- ❌ Vue component in root docs → Should be in `apps/{{APP_1}}/docs/`
- ❌ API route in root docs → Should be in `apps/{{APP_2}}/docs/`
- ❌ App-specific bug fix in root → Should be in `apps/{app}/docs/fixes/`
- ❌ CI/CD in app docs → Should be in root `docs/infrastructure/`

## Per-App Documentation Obligations

These rules apply to **every app** in `apps/*` and **every package** in `packages/*`. The trigger for writing docs is a code change in that app or package, not just feature-level work.

| App / Package       | Change type                                                        | Required doc action                                                                                        |
| ------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `apps/{{APP_1}}`    | New or modified API route / controller                             | Update `docs/api/` endpoint spec **and** add/update the corresponding page in `apps/{{DOCS_APP}}/content/` |
| `apps/{{APP_1}}`    | New module / service                                               | Add to feature spec (`docs/features/`) and note architectural choices                                      |
| `apps/{{APP_1}}`    | Breaking change (renamed/removed endpoint, changed response shape) | Update `docs/api/`, `apps/{{DOCS_APP}}/content/`, **and** `CHANGELOG.md`                                   |
| `apps/{{APP_2}}`    | New page / UI feature                                              | Update feature spec (`docs/features/`) and add/update page in `apps/{{DOCS_APP}}/content/` if user-facing  |
| `apps/{{APP_2}}`    | New route handler or API route                                     | Update relevant feature spec                                                                               |
| `apps/{{DOCS_APP}}` | Content-only edits (MDX/MDC, navigation config)                    | No extra docs required — changes here **are** the documentation update                                     |
| `packages/*`        | New or changed public API                                          | Update `docs/api/` and add/update the relevant page in `apps/{{DOCS_APP}}/content/`                        |

> **Rule of thumb:** If you added or changed a controller, an API route handler, or any function that is callable from another app or external client, you must update both `docs/api/` **and** `apps/{{DOCS_APP}}/content/` before committing. The docs app is the **living, user-facing documentation** — keep it in sync with every shipped feature.

## Docs App (`apps/{{DOCS_APP}}`) Sync Requirements

If the monorepo includes a documentation app (e.g., Docus, Nuxt Content, Docusaurus, Nextra, Starlight), the site content **must be updated as part of every commit that changes user-facing behavior**.

### When to Update the Docs App

| Trigger                       | Action in `apps/{{DOCS_APP}}/content/`           |
| ----------------------------- | ------------------------------------------------ |
| New feature shipped           | Create or update the relevant documentation page |
| API endpoint added or changed | Update the API reference page                    |
| Breaking change               | Add migration guide or update affected pages     |
| Bug fix that changes behavior | Update any page that described the old behavior  |
| New shared package public API | Add or update the package reference page         |
| UI component added            | Add usage examples page if user-facing           |
| Configuration change          | Update setup / configuration pages               |

### What Does NOT Require a Docs App Update

- Internal refactors with no behavior change
- CI/CD pipeline changes (unless they affect developer setup)
- Test-only changes
- Dependency updates with no API changes
- Content edits within `apps/{{DOCS_APP}}` itself (these are the docs)

### Pre-Commit Checklist (Docs App)

Before committing code that changes any app or package:

- [ ] **Feature work**: Corresponding docs page created or updated in `apps/{{DOCS_APP}}/content/`
- [ ] **API changes**: API reference pages reflect the new endpoints, parameters, and response shapes
- [ ] **Breaking changes**: Migration guide added and affected pages updated
- [ ] **Bug fixes**: Any page describing the old behavior is corrected
- [ ] **Navigation**: `apps/{{DOCS_APP}}` navigation/sidebar config updated if new pages were added
- [ ] **Cross-references**: Links between docs pages and `docs/features/` specs are consistent

### Content Organization

Organize the docs app content to mirror the project structure:

```
apps/{{DOCS_APP}}/content/
├── getting-started/          # Onboarding and setup guides
├── guides/                   # How-to guides and tutorials
├── api/                      # API reference (mirrors docs/api/)
├── architecture/             # High-level architecture overview
├── packages/                 # Shared package documentation
│   ├── {{PACKAGE_1}}/
│   └── {{PACKAGE_2}}/
└── changelog/                # User-facing changelog (optional)
```

> **Keep `docs/` and `apps/{{DOCS_APP}}/content/` complementary, not duplicative.** Root `docs/` holds internal specs, plans, and ADRs. The docs app holds polished, user-facing content. When a feature spec in `docs/features/` is completed, distill the user-facing parts into a docs app page.

## App-Specific Documentation

### Feature Documentation Structure

Each app maintains its own feature documentation:

**Location:** `apps/{app}/docs/features/{{ISSUE_ID}}-FEATURE-NAME/`

**Required Files:**

```
apps/{{APP_1}}/docs/features/{{ISSUE_ID}}-FEATURE-NAME/
├── spec.md       # Functional specification
├── plan.md       # Implementation plan
└── [optional]    # Code examples, component diagrams
```

### Fix & Bug Documentation

**App-specific fixes follow a tiered structure:**

#### Decision Tree

**Before creating any fix documentation, ask:**

1. **Is this a complex fix?** (multi-file, architectural changes, affects multiple features)
   - ✅ YES → Create folder `apps/{app}/docs/fixes/{{ISSUE_ID}}-FIX-NAME/` with `spec.md` + `plan.md`
   - ❌ NO → Add entry to `apps/{app}/docs/fixes/{YYYY-MM}.md` (monthly log)

2. **Does the monthly log for this month exist?**
   - ❌ NO → Create it first using the template below
   - ✅ YES → Add your fix as a new section

**⚠️ CRITICAL: Do NOT create individual `.md` files for simple fixes!**

#### What NOT to Do

**DO NOT create individual fix files like:**

- ❌ `apps/{{APP_1}}/docs/fixes/2025-10-component-bug.md`
- ❌ `apps/{{APP_2}}/docs/fixes/api-error-handling.md`
- ❌ `packages/{{PACKAGE_1}}/docs/fixes/type-definition-fix.md`

**Instead, add them as sections in the monthly log:**

- ✅ `apps/{{APP_1}}/docs/fixes/2025-10.md` with a new section
- ✅ `apps/{{APP_2}}/docs/fixes/2025-10.md` with a new section

#### Complex Fix Structure

**Location:** `apps/{app}/docs/fixes/{{ISSUE_ID}}-FIX-NAME/`

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

#### Monthly Fix Logs

**Location:** `apps/{app}/docs/fixes/{YYYY-MM}.md`

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
    - `src/components/Component.vue`
    - `src/composables/use-feature.ts`
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

## Root-Level Documentation

### When to Use Root `docs/`

Create root-level documentation for:

1. **Architecture Decisions** affecting multiple apps
2. **Deployment & Infrastructure** (CI/CD, hosting, environments)
3. **Cross-App Integration** patterns and contracts
4. **Monorepo Tooling** (Turborepo, workspace management)
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
├── deployment/            # Infrastructure and deployment
│   ├── cloudflare-workers.md
│   ├── github-actions.md
│   └── environments.md
│
├── integration/           # Cross-app patterns
│   ├── api-contracts.md
│   ├── shared-types.md
│   └── event-bus.md
│
├── infrastructure/        # Monorepo tooling
│   ├── turborepo.md
│   ├── package-management.md
│   └── workspace-scripts.md
│
└── getting-started.md     # New developer onboarding
```

### Architecture Decision Records (ADRs)

**Location:** `docs/architecture/{{NNNN}}-{{decision-title}}.md`

**When to Create Root ADRs:**

- Choosing monorepo structure
- Selecting build system (Turborepo, Nx, etc.)
- API gateway vs direct app communication
- Shared package strategy
- Cross-app authentication approach
- Deployment platform decisions

**Template:**

```markdown
# ADR {{NNNN}}: {{Decision Title}}

**Status**: Proposed | Accepted | Deprecated | Superseded
**Date**: {{YYYY-MM-DD}}
**Scope**: Monorepo-wide
**Affected Apps**: {{APP_1}}, {{APP_2}}, [or "All"]

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

---

**Last Updated**: {{Date}}
```

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

## Shared Package Documentation

### Package-Level Documentation

Each shared package maintains its own docs:

**Location:** `packages/{{PACKAGE}}/docs/`

```
packages/{{PACKAGE}}/
├── docs/
│   ├── features/          # New package features
│   ├── fixes/             # Monthly fix logs
│   ├── api.md             # Package API reference
│   └── migration-guide.md # Breaking changes
├── src/
└── package.json
```

### Package Feature Documentation

**Location:** `packages/{{PACKAGE}}/docs/features/{{ISSUE_ID}}-FEATURE-NAME/`

Similar structure to app features, but focus on:

- Public API additions
- Breaking changes for consumers
- Migration guides for existing usage

### Package Fix Documentation

**Location:** `packages/{{PACKAGE}}/docs/fixes/{YYYY-MM}.md`

Same monthly log structure, but track:

- Bug fixes in package
- API improvements
- Breaking changes and deprecations
- Apps affected by changes

## Changelog Management

### App-Specific Changelogs

Each app maintains its own `CHANGELOG.md`:

**Location:** `apps/{app}/CHANGELOG.md`

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

- Updated Turborepo to v{{VERSION}}
- Added GitHub Actions caching

### {{APP_1}}

- See [app changelog](apps/{{APP_1}}/CHANGELOG.md)

### {{APP_2}}

- See [app changelog](apps/{{APP_2}}/CHANGELOG.md)

### Shared Packages

- **{{PACKAGE_1}} v{{VERSION}}**: New utility functions
- **{{PACKAGE_2}} v{{VERSION}}**: TypeScript types update

## [{{VERSION}}] - {{YYYY-MM-DD}}

[Previous releases...]
```

## Pre-Commit Documentation Gate

**⚠️ MANDATORY: Documentation MUST be written or updated BEFORE committing code. This is a hard requirement — no commit should land without the corresponding docs entry.**

### Pre-Commit Checklist

Before running `git commit`, verify ALL items that apply to your change:

**All changes:**

- [ ] **Features**: `docs/features/{{ISSUE_ID}}-FEATURE-NAME/spec.md` exists and reflects the current implementation
- [ ] **Features**: `docs/features/{{ISSUE_ID}}-FEATURE-NAME/plan.md` is updated if scope changed
- [ ] **Fixes**: Entry added to `apps/{app}/docs/fixes/{{YYYY-MM}}.md` (or complex fix folder created)
- [ ] **Breaking changes**: `CHANGELOG.md` updated
- [ ] **Architectural decisions**: ADR created in `docs/architecture/` if a significant choice was made

**App changes (API routes, controllers, services):**

- [ ] New or modified endpoints documented in `docs/api/` (HTTP method, path, auth requirements, request/response shape, error codes)
- [ ] Corresponding `apps/{{DOCS_APP}}/content/` page created or updated
- [ ] Removed or renamed endpoints noted as breaking changes in `docs/api/`, `apps/{{DOCS_APP}}/content/`, and `CHANGELOG.md`
- [ ] New modules/services referenced in the relevant feature spec

**Frontend app changes (pages, UI features):**

- [ ] New route handlers documented in the relevant feature spec under `docs/features/`
- [ ] Any public-facing features have a corresponding `apps/{{DOCS_APP}}/content/` page created or updated

**`packages/*` changes:**

- [ ] New or changed public exports documented in `docs/api/` or the relevant feature spec
- [ ] `apps/{{DOCS_APP}}/content/` updated if the change is developer-facing

**`apps/{{DOCS_APP}}` changes:**

- [ ] No extra docs required — the content edit itself is the documentation update

If any applicable item is missing, **write the documentation first, then commit**.

## Documentation Workflows

### Creating a New Feature

1. **Identify scope**: Single app or cross-app?
2. **Create documentation**:
   - App-specific: `apps/{app}/docs/features/{{ISSUE_ID}}-NAME/`
   - Cross-app: Root ADR + app-specific implementation docs
3. **Use spec workflow**: Run `/spec` in context of the app
4. **Create plan**: Run `/plan` in app context
5. **Update docs app**: Create or update the corresponding page in `apps/{{DOCS_APP}}/content/`
6. **Link from commits**: Reference documentation path

### Fixing a Bug

1. **Determine complexity**: Simple or complex?
2. **Check monthly log**: Does current month's log exist?
3. **Document appropriately**:
   - Simple: Add section to `apps/{app}/docs/fixes/{YYYY-MM}.md`
   - Complex: Create `apps/{app}/docs/fixes/{{ISSUE_ID}}-FIX/`
4. **Update app changelog**: Reference in `apps/{app}/CHANGELOG.md`
5. **Update docs app**: If the fix changes user-facing behavior, update the relevant page in `apps/{{DOCS_APP}}/content/`

### Cross-App Changes

1. **Create root ADR**: Document decision at `docs/architecture/`
2. **Create app-specific docs**: Implementation details in each app
3. **Update integration docs**: If APIs change, update `docs/integration/`
4. **Update docs app**: Reflect cross-app changes in `apps/{{DOCS_APP}}/content/`
5. **Update root changelog**: Reference in root `CHANGELOG.md`

## Best Practices

### Do

- ✅ Keep app-specific docs with app code
- ✅ Use root docs only for cross-cutting concerns
- ✅ Link between related docs across apps
- ✅ Maintain separate changelogs per app
- ✅ Document API contracts explicitly
- ✅ Update all affected app docs for shared changes
- ✅ Update `apps/{{DOCS_APP}}/content/` with every user-facing change
- ✅ Keep docs app navigation in sync when adding new pages

### Don't

- ❌ Put app-specific features in root docs
- ❌ Duplicate documentation across apps
- ❌ Create individual fix files for simple bugs
- ❌ Forget to update API contract docs
- ❌ Mix app-specific and monorepo concerns
- ❌ Let cross-app integration docs become stale
- ❌ Commit feature code without updating the docs app
- ❌ Duplicate internal specs into the docs app verbatim — distill user-facing content instead

## Quick Reference

| Documentation Type       | Location                                      | Example                         |
| ------------------------ | --------------------------------------------- | ------------------------------- |
| {{APP_1}} Feature        | `apps/{{APP_1}}/docs/features/`               | Vue component implementation    |
| {{APP_2}} Feature        | `apps/{{APP_2}}/docs/features/`               | API endpoint addition           |
| {{APP_1}} Fix (simple)   | `apps/{{APP_1}}/docs/fixes/{YYYY-MM}.md`      | CSS styling bug                 |
| {{APP_2}} Fix (complex)  | `apps/{{APP_2}}/docs/fixes/{{ISSUE_ID}}-*/`   | Database migration              |
| Shared Package Feature   | `packages/{pkg}/docs/features/`               | Utility function addition       |
| Cross-App Architecture   | `docs/architecture/`                          | ADR for authentication approach |
| Deployment               | `docs/deployment/`                            | CI/CD pipeline documentation    |
| Integration              | `docs/integration/`                           | API contracts between apps      |
| Monorepo Tooling         | `docs/infrastructure/`                        | Turborepo configuration guide   |
| App Changelog            | `apps/{app}/CHANGELOG.md`                     | App-specific version history    |
| Root Changelog           | `CHANGELOG.md`                                | Monorepo-wide changes           |
| App Getting Started      | `apps/{app}/README.md`                        | App-specific setup instructions |
| Docs App Content         | `apps/{{DOCS_APP}}/content/`                  | User-facing documentation site  |
| Monorepo Getting Started | `docs/getting-started.md` or root `README.md` | New developer onboarding        |

---

**Last Updated**: {{Date}}
**Template Version**: 1.0.0
