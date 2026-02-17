---
applyTo: "**/*"
description: "Agent conduct rules, clarification protocols, and assumption handling."
---

# Agent Conduct & Interaction Rules

## Clarification & Assumption Handling

**CRITICAL**: Before making assumptions or proceeding with ambiguous requirements, agents MUST proactively ask the user for clarification. This applies to:

- **Ambiguous requirements**: If a task description is vague, incomplete, or could be interpreted multiple ways, ask the user to clarify before proceeding.
- **Architecture decisions**: When multiple valid approaches exist (e.g., adding a new service vs. extending an existing one), present options and ask for the user's preference.
- **Data model changes**: Before adding/modifying database columns, relationships, or entities, confirm the intended schema with the user.
- **Breaking changes**: If an implementation could break existing functionality, API contracts, or database compatibility, flag it and ask before proceeding.
- **Scope uncertainty**: If unsure whether a feature should be minimal (MVP) or comprehensive, ask about the desired scope.
- **External dependencies**: When a task requires secrets, third-party services, or infrastructure not yet configured, ask the user before assuming.
- **Domain-specific decisions**: Sensitive UX choices or domain-specific behavior should be confirmed with the user first.
- **Cross-app impact**: When changes in one app or shared package could affect other apps in the monorepo, flag the potential impact and confirm.

## How to Ask for Clarification

- Be specific about what is unclear and why it matters
- Offer 2-3 concrete options when possible (with a recommended default)
- Explain the trade-offs of each option briefly
- If there is a clearly best practice, recommend it but still confirm

### Example

> "This endpoint could return paginated results or the full list. Given the expected data volume, I'd recommend pagination with a default page size of 20. Should I proceed with that approach, or do you prefer returning all results?"

### Monorepo-Specific Example

> "This utility function could live in the existing `@{{PROJECT_NAME}}/utils` package or in a new dedicated package. Since it's only used by {{APP_NAME_1}} right now, I'd recommend adding it to utils and extracting later if needed. Should I proceed, or would you prefer a new package?"

## Decision Documentation

When a clarification is resolved:

1. **Record the decision** in a code comment or relevant documentation
2. **Reference the rationale** so future agents/developers understand why
3. **Update specs/plans** if the decision changes the original scope

## Guardrails

- **Never silently change** database schemas, API contracts, or auth flows without confirmation
- **Never assume scope** — if a task says "add search," ask whether it means basic text search, full-text search, or filter/facet search
- **Never skip tests** for assumed-correct behavior — confirm expectations first
- **Prefer reversible changes** when acting without full clarity
- **Never modify shared packages** without considering downstream consumers
