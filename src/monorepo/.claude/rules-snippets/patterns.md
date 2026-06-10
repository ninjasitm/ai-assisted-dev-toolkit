## Workspace Conventions

### Package Naming

- Apps: Direct name (e.g., `web`, `api`, `docs`)
- Packages: Scoped (e.g., `@{{PROJECT_NAME}}/ui`, `@{{PROJECT_NAME}}/utils`)

### Import Paths

```typescript
// From shared packages
import { Button } from "@{{PROJECT_NAME}}/ui";

// Internal app imports
import { Component } from "@/components";
import { utils } from "~/utils";
```

## Turbo Tasks

### Task Dependencies

```json
{
	"tasks": {
		"build": {
			"dependsOn": ["^build"],
			"outputs": ["dist/**"]
		},
		"dev": {
			"cache": false,
			"persistent": true
		}
	}
}
```

### Running Tasks

```bash
# All workspaces
{{PACKAGE_MANAGER}} build

# Specific workspace
{{PACKAGE_MANAGER}} build --filter={{APP_NAME_1}}

# Workspace and dependencies
{{PACKAGE_MANAGER}} build --filter={{APP_NAME_1}}...
```

## SRP and reuse-first principle

- **Before implementing new functionality, review existing patterns** in shared packages (`{{UTILS_PATH}}`, `{{HELPERS_PATH}}`, `{{COMPOSABLES_PATH}}`) for capabilities that already solve the problem.
- **Prefer extending existing utilities** over creating new ones or duplicating logic inline — a new solution is only warranted when the existing one genuinely cannot accommodate the use case.
- **Never duplicate state or behavior** that an existing utility already manages (e.g., loading flags, error state, async wrappers). Inline duplication violates SRP and makes behavior inconsistent across the monorepo.
- When in doubt, extend the existing pattern and keep consumers (components, controllers, handlers) thin.
- Reusable logic belongs in a shared `packages/` module, not copied across apps.

## Shared Configuration

### ESLint

```javascript
// packages/config/eslint/base.js
module.exports = {
	extends: ["eslint:recommended"],
};

// apps/{{APP_NAME_1}}/eslint.config.js
import base from "@{{PROJECT_NAME}}/config/eslint";
export default [...base];
```

### TypeScript

```json
// packages/config/typescript/base.json
{
  "compilerOptions": {
    "strict": true
  }
}

// apps/{{APP_NAME_1}}/tsconfig.json
{
  "extends": "@{{PROJECT_NAME}}/config/typescript"
}
```

## Adding New Packages

1. Create directory in `packages/` or `apps/`
2. Add `package.json` with proper scope
3. Update monorepo config if needed
4. Add to consuming packages

## Adding Dependencies

```bash
# To specific app/package
{{PACKAGE_MANAGER}} add <package> --filter={{APP_NAME_1}}

# To root workspace
{{PACKAGE_MANAGER}} add -D <package> -w

# Internal package dependency
{{PACKAGE_MANAGER}} add @{{PROJECT_NAME}}/{{PACKAGE_NAME_1}} --filter={{APP_NAME_1}}
```

## Code Sharing Patterns

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
