---
applyTo: "**/*"
description: "Development workflows for monorepo."
---

# Workflows

## Development

```bash
# Start all apps
{{PACKAGE_MANAGER}} dev

# Start specific app
{{PACKAGE_MANAGER}} dev --filter={{APP_NAME_1}}

# Start app and its dependencies
{{PACKAGE_MANAGER}} dev --filter={{APP_NAME_1}}...
```

## Building

```bash
# Build all packages
{{PACKAGE_MANAGER}} build

# Build specific package
{{PACKAGE_MANAGER}} build --filter={{APP_NAME_1}}

# Build only changed packages
{{PACKAGE_MANAGER}} build --filter=[origin/main]
```

## Testing

```bash
# All tests
{{PACKAGE_MANAGER}} test

# Specific app/package tests
{{PACKAGE_MANAGER}} test --filter={{APP_NAME_1}}

# Watch mode
{{PACKAGE_MANAGER}} test --filter={{APP_NAME_1}} -- --watch
```

## Adding Features

1. Determine which app/package the feature belongs to
2. Check app-specific `AGENTS.md` for patterns
3. Implement following local conventions
4. Run `{{PACKAGE_MANAGER}} lint` and `{{PACKAGE_MANAGER}} test`
5. Create PR with conventional commits

## Adding Shared Code

1. Identify if code should be in existing or new package
2. Add to `packages/{{PACKAGE_NAME}}/src/`
3. Export from package index
4. Add dependency to consuming apps
5. Import using package scope

## CI/CD Integration

```yaml
steps:
  - name: Install
    run: {{PACKAGE_MANAGER}} install

  - name: Build
    run: {{PACKAGE_MANAGER}} build

  - name: Test
    run: {{PACKAGE_MANAGER}} test

  - name: Lint
    run: {{PACKAGE_MANAGER}} lint
```

## Remote Caching

```bash
# Login to Vercel (for remote cache)
turbo login

# Link to remote cache
turbo link
```
