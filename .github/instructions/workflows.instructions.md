---
applyTo: "**/*"
description: "Template development workflows for the AI-Assisted Development Toolkit."
---

# Workflows

## Editing templates

1. Navigate to `src/repo/` or `src/monorepo/`.
2. Edit template files while preserving `{{PLACEHOLDER}}` syntax.
3. Test by copying to a real project and replacing placeholders.

## Adding new templates

1. Create the file in the appropriate `src/` subdirectory.
2. Use `{{PLACEHOLDER}}` for all project-specific values.
3. Document new placeholders in the root README.md.

## Testing templates

1. Copy template files to a test project.
2. Use find-and-replace to substitute placeholders.
3. Verify the resulting configuration works correctly.

## Placeholder conventions

- `{{PROJECT_NAME}}` - Project name (kebab-case).
- `{{FRAMEWORK}}` - Primary framework.
- `{{PACKAGE_MANAGER}}` - npm, pnpm, yarn, or bun.
- `{{DEV_PORT}}` - Development server port.
