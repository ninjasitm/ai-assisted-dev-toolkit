---
applyTo: "**/*"
description: "Testing strategy and conventions for the {{PROJECT_NAME}} monorepo."
---

# Testing Standards

## Commands

```bash
# All tests
{{PACKAGE_MANAGER}} test

# Specific app/package tests
{{PACKAGE_MANAGER}} test --filter={{APP_NAME_1}}

# Watch mode
{{PACKAGE_MANAGER}} test --filter={{APP_NAME_1}} -- --watch
```

## Test Locations

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

## Coverage Requirements

- Minimum coverage: {{COVERAGE_THRESHOLD}}
- Critical paths must have integration or E2E coverage
- New features require tests before merging

## Cross-Package Testing

- Shared packages should have standalone unit tests
- Apps should test integration with shared packages
- Changes to shared packages must pass all downstream app tests
