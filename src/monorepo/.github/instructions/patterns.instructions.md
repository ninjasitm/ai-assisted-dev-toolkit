---
applyTo: "**/*"
description: "Monorepo patterns and conventions."
---

# Monorepo Patterns

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
