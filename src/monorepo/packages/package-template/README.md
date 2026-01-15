# @{{PROJECT_NAME}}/{{PACKAGE_NAME}}

{{PACKAGE_DESCRIPTION}}

## Installation

This package is internal to the monorepo. Add it to an app:

```bash
{{PACKAGE_MANAGER}} add @{{PROJECT_NAME}}/{{PACKAGE_NAME}} --filter={{APP_NAME}}
```

## Usage

```typescript
import { {{PACKAGE_EXPORT}} } from "@{{PROJECT_NAME}}/{{PACKAGE_NAME}}";

// Example usage
{{PACKAGE_USAGE_EXAMPLE}}
```

## Development

```bash
# Build
{{PACKAGE_MANAGER}} build --filter=@{{PROJECT_NAME}}/{{PACKAGE_NAME}}

# Test
{{PACKAGE_MANAGER}} test --filter=@{{PROJECT_NAME}}/{{PACKAGE_NAME}}

# Watch mode
{{PACKAGE_MANAGER}} dev --filter=@{{PROJECT_NAME}}/{{PACKAGE_NAME}}
```

## Structure

```
{{PACKAGE_NAME}}/
├── src/
│   ├── index.ts          # Package exports
│   └── {{PACKAGE_SRC_STRUCTURE}}
├── tests/
├── package.json
└── tsconfig.json
```

## Exports

```typescript
// Main exports
export { {{PACKAGE_EXPORTS}} } from "./{{PACKAGE_MAIN_FILE}}";
```

## Dependencies

This package has the following peer dependencies:

- {{PACKAGE_PEER_DEPS}}

## Related

- [Monorepo README](../../README.md)
- [Root AGENTS.md](../../AGENTS.md)
