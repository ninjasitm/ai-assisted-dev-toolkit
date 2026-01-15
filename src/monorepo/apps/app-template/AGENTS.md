# AGENTS.md - {{APP_NAME}} App

**Type:** {{APP_TYPE}}
**Framework:** {{APP_FRAMEWORK}}
**Port:** {{APP_DEV_PORT}}

## Overview

{{APP_DESCRIPTION}}

## Structure

```
apps/{{APP_NAME}}/
├── src/
│   ├── {{APP_SRC_STRUCTURE}}
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── package.json
└── AGENTS.md
```

## Tech Stack

- **Framework:** {{APP_FRAMEWORK}}
- **Language:** TypeScript
- **Styling:** {{APP_STYLING}}
- **State:** {{APP_STATE_MANAGEMENT}}
- **Testing:** {{TEST_FRAMEWORK}}

## Commands

```bash
# Development
{{PACKAGE_MANAGER}} dev --filter={{APP_NAME}}

# Build
{{PACKAGE_MANAGER}} build --filter={{APP_NAME}}

# Test
{{PACKAGE_MANAGER}} test --filter={{APP_NAME}}

# Lint
{{PACKAGE_MANAGER}} lint --filter={{APP_NAME}}
```

## Component Patterns

```{{APP_COMPONENT_EXTENSION}}
{{APP_COMPONENT_TEMPLATE}}
```

## State Management

```typescript
{{APP_STATE_PATTERN}}
```

## API Integration

```typescript
{{APP_API_PATTERN}}
```

## Shared Package Usage

```typescript
// Import from shared packages
import { Component } from "@{{PROJECT_NAME}}/ui";
import { formatDate } from "@{{PROJECT_NAME}}/utils";
import type { User } from "@{{PROJECT_NAME}}/types";
```

## Environment Variables

```bash
# .env.local
{{APP_ENV_EXAMPLE}}
```

## Testing

### Unit Tests
```typescript
{{APP_UNIT_TEST_EXAMPLE}}
```

### E2E Tests
```typescript
{{APP_E2E_TEST_EXAMPLE}}
```

## Deployment

- **Platform:** {{APP_DEPLOY_PLATFORM}}
- **Command:** `{{PACKAGE_MANAGER}} deploy:{{APP_NAME}}`

## Related

- [Root AGENTS.md](../../AGENTS.md) - Monorepo context
- [README.md](README.md) - App documentation
