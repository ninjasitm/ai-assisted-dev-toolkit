---
applyTo: "**/*"
description: "Monorepo architecture and project context."
---

# Project Architecture

This is a **monorepo** with shared packages.

## Structure

- `apps/` - Deployable applications
- `packages/` - Shared internal packages
- `{{MONOREPO_CONFIG}}` - Task configuration

## Apps

| App              | Framework           | Purpose               |
| ---------------- | ------------------- | --------------------- |
| `{{APP_NAME_1}}` | {{APP_1_FRAMEWORK}} | {{APP_1_DESCRIPTION}} |
| `{{APP_NAME_2}}` | {{APP_2_FRAMEWORK}} | {{APP_2_DESCRIPTION}} |

## Packages

| Package                                | Purpose                                 |
| -------------------------------------- | --------------------------------------- |
| `@{{PROJECT_NAME}}/{{PACKAGE_NAME_1}}` | {{PACKAGE_1_DESCRIPTION}}               |
| `@{{PROJECT_NAME}}/{{PACKAGE_NAME_2}}` | {{PACKAGE_2_DESCRIPTION}}               |
| `@{{PROJECT_NAME}}/config`             | Shared ESLint, TypeScript, build config |

## Cross-Package Imports

```typescript
import { Component } from "@{{PROJECT_NAME}}/ui";
import { formatDate } from "@{{PROJECT_NAME}}/utils";
```

## Context Files

- Root `AGENTS.md` - Monorepo-level context
- `apps/*/AGENTS.md` - App-specific patterns
- `packages/*/README.md` - Package documentation
