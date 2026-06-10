---
applyTo: "**/*"
description: "Coding standards and conventions for the {{PROJECT_NAME}} monorepo."
---

# Coding Standards

## General Rules

- {{CODING_RULE_1}}
- {{CODING_RULE_2}}
- {{CODING_RULE_3}}

## Code Quality

- Follow {{LANGUAGE}} best practices across all apps and packages
- Run linting before committing: `{{LINT_COMMAND}}`
- Type check across workspace: `{{CHECK_TYPES_COMMAND}}`

## Shared Types / Models

```{{FILE_EXTENSION}}
{{SHARED_TYPES_EXAMPLE}}
```

## Shared Components / Modules

```{{FILE_EXTENSION}}
{{SHARED_COMPONENTS_EXAMPLE}}
```

## Shared Utilities

```{{FILE_EXTENSION}}
{{SHARED_UTILITIES_EXAMPLE}}
```

## SRP and reuse-first principle

- **Before implementing new functionality, review existing patterns** in shared packages (`{{UTILS_PATH}}`, `{{HELPERS_PATH}}`, `{{COMPOSABLES_PATH}}`) for capabilities that already solve the problem.
- **Prefer extending existing utilities** over creating new ones or duplicating logic inline — a new solution is only warranted when the existing one genuinely cannot accommodate the use case.
- **Never duplicate state or behavior** that an existing utility already manages (e.g., loading flags, error state, async wrappers). Inline duplication violates SRP and makes behavior inconsistent across the monorepo.
- When in doubt, extend the existing pattern and keep consumers (components, controllers, handlers) thin.
- Reusable logic belongs in a shared `packages/` module, not copied across apps.

## Package Exports

Every shared package must have a clean public API:

```{{FILE_EXTENSION}}
// packages/{{PACKAGE_NAME}}/src/index.ts
export { Component } from "./Component";
export type { ComponentProps } from "./types";
```
