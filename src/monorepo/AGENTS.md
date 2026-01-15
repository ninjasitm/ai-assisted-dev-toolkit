# AGENTS.md - {{PROJECT_NAME}} Monorepo

**Type:** Monorepo
**Language:** {{LANGUAGE}}
**Build System:** {{BUILD_SYSTEM}}
**Package Manager:** {{PACKAGE_MANAGER}}

## Overview

{{PROJECT_DESCRIPTION}}

## Structure

```
{{PROJECT_STRUCTURE}}
```

## Tech Stack

### Shared

- **Build System:** {{BUILD_SYSTEM}}
- **Package Manager:** {{PACKAGE_MANAGER}}
- **Language:** {{LANGUAGE}}
- **Linting:** {{LINTER}}
- **Testing:** {{TEST_FRAMEWORK}}

### Apps

| App              | Framework           | Purpose               |
| ---------------- | ------------------- | --------------------- |
| `{{APP_NAME_1}}` | {{APP_1_FRAMEWORK}} | {{APP_1_DESCRIPTION}} |
| `{{APP_NAME_2}}` | {{APP_2_FRAMEWORK}} | {{APP_2_DESCRIPTION}} |

### Packages/Libraries

| Package                                | Purpose                   |
| -------------------------------------- | ------------------------- |
| `{{PACKAGE_SCOPE}}/{{PACKAGE_NAME_1}}` | {{PACKAGE_1_DESCRIPTION}} |
| `{{PACKAGE_SCOPE}}/{{PACKAGE_NAME_2}}` | {{PACKAGE_2_DESCRIPTION}} |
| `{{PACKAGE_SCOPE}}/config`             | Shared configuration      |

## Development Workflow

### Commands

```bash
# Install dependencies
{{INSTALL_COMMAND}}

# Development (all apps)
{{DEV_COMMAND}}

# Development (specific app)
{{DEV_FILTER_COMMAND}}

# Build all
{{BUILD_COMMAND}}

# Test all
{{TEST_COMMAND}}

# Lint all
{{LINT_COMMAND}}

# Type check all
{{CHECK_TYPES_COMMAND}}
```

### Adding Dependencies

```bash
{{ADD_DEPENDENCY_EXAMPLE}}
```

### Creating New Packages/Modules

{{CREATE_PACKAGE_INSTRUCTIONS}}

## Workspace Conventions

### Package/Module Naming

- Apps: `{{APP_NAME_1}}`, `{{APP_NAME_2}}`
- Packages: `{{PACKAGE_SCOPE}}/package-name`

### Import/Reference Patterns

```{{FILE_EXTENSION}}
{{IMPORT_PATTERN_EXAMPLE}}
```

### Shared Configuration

```{{FILE_EXTENSION}}
{{SHARED_CONFIG_EXAMPLE}}
```

## Task Configuration

{{BUILD_SYSTEM_CONFIG_EXAMPLE}}

## App-Specific Context

Each app has its own `AGENTS.md` with detailed patterns:

- `{{APP_DIR}}/{{APP_NAME_1}}/AGENTS.md` - {{APP_1_DESCRIPTION}} patterns
- `{{APP_DIR}}/{{APP_NAME_2}}/AGENTS.md` - {{APP_2_DESCRIPTION}} patterns

## Environment Variables

### Root Level

```bash
# .env (shared)
{{ENVIRONMENT}}={{ENVIRONMENT_VALUE}}
```

### Per-App

```bash
# {{APP_DIR}}/{{APP_NAME_1}}/.env.local
{{APP_1_ENV_EXAMPLE}}

# {{APP_DIR}}/{{APP_NAME_2}}/.env.local
{{APP_2_ENV_EXAMPLE}}
```

## Code Sharing Patterns

### Shared Types/Models

```{{FILE_EXTENSION}}
{{SHARED_TYPES_EXAMPLE}}
```

### Shared Components/Modules

```{{FILE_EXTENSION}}
{{SHARED_COMPONENTS_EXAMPLE}}
```

### Shared Utilities

```{{FILE_EXTENSION}}
{{SHARED_UTILITIES_EXAMPLE}}
```

## Testing Strategy

### Unit Tests

- Located in each package: `{{PACKAGES_DIR}}/**/{{TEST_FILE_PATTERN}}`
- Located in each app: `{{APP_DIR}}/**/{{TEST_FILE_PATTERN}}`
- Run with: `{{TEST_COMMAND}}`

### Integration Tests

- Located in: `{{APP_DIR}}/*/{{INTEGRATION_TEST_DIR}}/`
- Run with: `{{INTEGRATION_TEST_COMMAND}}`

### E2E Tests

- Located in: `{{APP_DIR}}/*/{{E2E_TEST_DIR}}/`
- Run with: `{{E2E_TEST_COMMAND}}`

## Deployment

### Apps

| App              | Platform                  | Command                    |
| ---------------- | ------------------------- | -------------------------- |
| `{{APP_NAME_1}}` | {{APP_1_DEPLOY_PLATFORM}} | `{{APP_1_DEPLOY_COMMAND}}` |
| `{{APP_NAME_2}}` | {{APP_2_DEPLOY_PLATFORM}} | `{{APP_2_DEPLOY_COMMAND}}` |

### CI/CD

```yaml
# .github/workflows/ci.yml (or equivalent)
{ { CI_WORKFLOW_EXAMPLE } }
```

## Related Documentation

- [README.md](README.md) - Project overview
- [{{APP_DIR}}/{{APP_NAME_1}}/AGENTS.md]({{APP_DIR}}/{{APP_NAME_1}}/AGENTS.md) - App context
- [{{PACKAGES_DIR}}/{{PACKAGE_NAME_1}}/README.md]({{PACKAGES_DIR}}/{{PACKAGE_NAME_1}}/README.md) - Package docs
