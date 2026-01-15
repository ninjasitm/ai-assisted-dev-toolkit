# {{APP_NAME}}

{{APP_DESCRIPTION}}

## Getting Started

### Prerequisites

- Node.js {{NODE_VERSION}}
- {{PACKAGE_MANAGER}}

### Development

```bash
# From monorepo root
{{PACKAGE_MANAGER}} dev --filter={{APP_NAME}}

# Or from this directory
{{PACKAGE_MANAGER}} dev
```

Visit [http://localhost:{{APP_DEV_PORT}}](http://localhost:{{APP_DEV_PORT}})

### Building

```bash
{{PACKAGE_MANAGER}} build --filter={{APP_NAME}}
```

### Testing

```bash
# Unit tests
{{PACKAGE_MANAGER}} test --filter={{APP_NAME}}

# E2E tests
{{PACKAGE_MANAGER}} test:e2e --filter={{APP_NAME}}
```

## Structure

```
{{APP_NAME}}/
├── src/
│   ├── {{APP_SRC_STRUCTURE}}
├── tests/
├── public/
└── package.json
```

## Shared Packages

This app uses the following shared packages:

- `@{{PROJECT_NAME}}/{{PACKAGE_NAME_1}}` - {{PACKAGE_1_DESCRIPTION}}
- `@{{PROJECT_NAME}}/{{PACKAGE_NAME_2}}` - {{PACKAGE_2_DESCRIPTION}}

## Environment Variables

Create a `.env.local` file:

```bash
{{APP_ENV_EXAMPLE}}
```

## Deployment

Deployed to {{APP_DEPLOY_PLATFORM}}:

```bash
{{PACKAGE_MANAGER}} deploy:{{APP_NAME}}
```

## Related

- [Monorepo README](../../README.md)
- [AGENTS.md](AGENTS.md) - AI development context
