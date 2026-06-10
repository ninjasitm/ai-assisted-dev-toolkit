# Coding Standards

## Primary Pattern: {{PRIMARY_PATTERN_NAME}}

```{{FILE_EXTENSION}}
{{PRIMARY_PATTERN_EXAMPLE}}
```

**Rules:**

- {{CODING_RULE_1}}
- {{CODING_RULE_2}}
- {{CODING_RULE_3}}

## Data Access Pattern

```{{FILE_EXTENSION}}
{{DATA_ACCESS_PATTERN}}
```

## API / Route Pattern

```{{FILE_EXTENSION}}
{{API_PATTERN}}
```

## Naming Conventions

- Files: {{FILE_NAMING_CONVENTION}}
- Components: {{COMPONENT_NAMING_CONVENTION}}
- Functions: {{FUNCTION_NAMING_CONVENTION}}
- Variables: {{VARIABLE_NAMING_CONVENTION}}

## Code Quality

- Follow {{FRAMEWORK}} and {{LANGUAGE}} best practices
- Run linting before committing: `{{LINT_COMMAND}}`
- Format code consistently: `{{FORMAT_COMMAND}}`

## SRP and reuse-first principle

- **Before implementing new functionality, review existing patterns** in `{{COMPOSABLES_PATH}}`, `{{UTILS_PATH}}`, and `{{HELPERS_PATH}}` for capabilities that already solve the problem.
- **Prefer extending existing utilities** over creating new ones or duplicating logic inline — a new solution is only warranted when the existing one genuinely cannot accommodate the use case.
- **Never duplicate state or behavior** that an existing utility already manages (e.g., loading flags, error state, async wrappers). Inline duplication violates SRP and makes behavior inconsistent across the codebase.
- When in doubt, extend the existing pattern and keep consumers (components, controllers, handlers) thin.
