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

## Package Exports

Every shared package must have a clean public API:

```{{FILE_EXTENSION}}
// packages/{{PACKAGE_NAME}}/src/index.ts
export { Component } from "./Component";
export type { ComponentProps } from "./types";
```
