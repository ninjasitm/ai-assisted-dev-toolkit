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
{
	{
		APP_STATE_PATTERN;
	}
}
```

## API Integration

```typescript
{
	{
		APP_API_PATTERN;
	}
}
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
{
	{
		APP_UNIT_TEST_EXAMPLE;
	}
}
```

### E2E Tests

```typescript
{
	{
		APP_E2E_TEST_EXAMPLE;
	}
}
```

## Deployment

- **Platform:** {{APP_DEPLOY_PLATFORM}}
- **Command:** `{{PACKAGE_MANAGER}} deploy:{{APP_NAME}}`

## Clarification & Alignment Guidelines

### 1. Proactive Clarification

- **Identify Ambiguity**: Stop and ask if a task lacks clear acceptance criteria, inputs, or expected outputs.
- **Resolve Conflicts**: Flag conflicting instructions between the user prompt, existing code, and documentation before writing code.
- **Expose Assumptions**: State your assumptions clearly and ask for validation before proceeding with high-impact changes.

### 2. Technical Validation & Alternatives

- **Propose Better Paths**: Suggest a simpler, more performant, or more idiomatic alternative if you see a better way to solve the problem.
- **Flag Code Smells**: Alert the team if the requested changes introduce technical debt, anti-patterns, or break existing architectural rules.
- **Check Dependencies**: Ask for verification if a task requires adding new third-party libraries or upgrading existing versions.

### 3. Scope & Edge Case Management

- **Surface Edge Cases**: List potential failures, null states, or security risks you discover, and ask how to handle them.
- **Prevent Scope Creep**: Ask for permission before modifying files or logic outside the explicit scope of the assigned task.
- **Clarify Breakages**: Warn the user immediately if a requested change will intentionally break backward compatibility or existing APIs.

### 4. How to Ask Questions (Response Formatting)

When stopping to ask a question, do not just post an open-ended block of text. Format your query using one of these two structures:

- **Structured Multiple-Choice**: For architectural, design, or logic choices, provide a numbered list of distinct options. Include a brief pro/con or trade-off for each path so the user can quickly respond with just a number (e.g., "Go with Option 2").
- **Targeted Text Input**: For missing data, API endpoints, or environment variables, provide a clear, pre-formatted Markdown template or fill-in-the-blank block. The user should be able to copy, fill out, and return it with minimal friction.

## Documentation Requirements

Documentation updates are **mandatory before committing**. See the root [`.github/instructions/documentation.instructions.md`](../../.github/instructions/documentation.instructions.md) for the full pre-commit checklist and AI agent directives.

**Quick summary:**

- Ensure feature spec/plan exists and is current in `docs/features/`
- Update `docs/api/` for any API surface changes
- Update `README.md` for setup, command, or env var changes
- If a `docs` app exists in the monorepo, update its content pages and navigation

### If This App IS the Docs App

If `{{APP_NAME}}` is the dedicated documentation site for this monorepo:

- Every new or changed feature in **any** app or package requires a corresponding page update here
- Register new pages in the sidebar/navigation config
- Preview locally before committing: `{{PACKAGE_MANAGER}} dev --filter={{APP_NAME}}`
- Include docs-app changes in the same commit/PR as the code they document

## Related

- [Root AGENTS.md](../../AGENTS.md) - Monorepo context
- [README.md](README.md) - App documentation
