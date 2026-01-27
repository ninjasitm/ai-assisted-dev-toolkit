# Copilot Instructions — {{PROJECT_NAME}} Monorepo

## Project Overview

- **Type:** Monorepo
- **Package Manager:** {{PACKAGE_MANAGER}}
- **Apps:** `apps/{{APP_NAME_1}}/`, `apps/{{APP_NAME_2}}/`
- **Packages:** `packages/{{PACKAGE_NAME_1}}/`, `packages/{{PACKAGE_NAME_2}}/`, `packages/config/`

## Architecture

### Workspace Structure

```
{{PROJECT_NAME}}/
├── apps/                    # Deployable applications
│   ├── {{APP_NAME_1}}/      # {{APP_1_DESCRIPTION}}
│   └── {{APP_NAME_2}}/      # {{APP_2_DESCRIPTION}}
├── packages/                # Shared packages
│   ├── {{PACKAGE_NAME_1}}/ # {{PACKAGE_1_DESCRIPTION}}
│   ├── {{PACKAGE_NAME_2}}/ # {{PACKAGE_2_DESCRIPTION}}
│   └── config/             # Shared configuration
└── {{MONOREPO_CONFIG}}     # Monorepo config
```

### Import Conventions

```typescript
// Cross-package imports
import { Component } from "@{{PROJECT_NAME}}/ui";
import { utils } from "@{{PROJECT_NAME}}/utils";

// Internal app imports
import { Component } from "@/components";
import { utils } from "~/utils";
```

## Development Workflow

### Commands

```bash
# Development
{{PACKAGE_MANAGER}} dev                    # All apps
{{PACKAGE_MANAGER}} dev --filter={{APP_NAME_1}}  # Specific app

# Building
{{PACKAGE_MANAGER}} build                  # All packages
{{PACKAGE_MANAGER}} build --filter=<name>  # Specific package

# Testing
{{PACKAGE_MANAGER}} test                   # All tests
{{PACKAGE_MANAGER}} test --filter=<name>   # Specific tests

# Linting
{{PACKAGE_MANAGER}} lint
{{PACKAGE_MANAGER}} check-types
```

### Adding Dependencies

```bash
# To specific app/package
{{PACKAGE_MANAGER}} add <package> --filter={{APP_NAME_1}}

# To root workspace
{{PACKAGE_MANAGER}} add -D <package> -w

# Internal package dependency
{{PACKAGE_MANAGER}} add @{{PROJECT_NAME}}/{{PACKAGE_NAME_1}} --filter={{APP_NAME_1}}
```

## Key Patterns

### Shared Package Usage

```typescript
// packages/{{PACKAGE_NAME_1}}/src/index.ts
export { Component } from "./Component";
export type { ComponentProps } from "./types";

// apps/{{APP_NAME_1}}/src/pages/index.tsx
import { Component } from "@{{PROJECT_NAME}}/{{PACKAGE_NAME_1}}";
```

### Configuration Sharing

```typescript
// packages/config/eslint/base.js
module.exports = {
	/* shared rules */
};

// apps/{{APP_NAME_1}}/eslint.config.js
import base from "@{{PROJECT_NAME}}/config/eslint";
export default [...base];
```

## Context Sources

- [AGENTS.md](AGENTS.md) - Monorepo architecture
- [apps/{{APP_NAME_1}}/AGENTS.md](apps/{{APP_NAME_1}}/AGENTS.md) - App-specific patterns
- [apps/{{APP_NAME_2}}/AGENTS.md](apps/{{APP_NAME_2}}/AGENTS.md) - App-specific patterns

## Skills References

For detailed standards on specific topics, refer to these skills:

| Topic             | Skill Location                                   | Description                                                  |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| **Logging**       | `.agents/skills/logging/SKILL.md`                | Structured logging standards, log levels, message formatting |
| **Documentation** | `.agents/skills/project-documentation/SKILL.md`  | README standards, code comments, ADRs, changelogs            |
| **Writing Plans** | `.agents/skills/writing-plans/SKILL.md`          | Feature planning and specification                           |
| **Code Review**   | `.agents/skills/requesting-code-review/SKILL.md` | Code review process and checklists                           |
| **Debugging**     | `.agents/skills/systematic-debugging/SKILL.md`   | Systematic debugging workflows                               |

## Guidelines

- Follow monorepo conventions for task dependencies
- Use internal packages for shared code
- Run commands from monorepo root
- Reference app-specific AGENTS.md for detailed patterns
