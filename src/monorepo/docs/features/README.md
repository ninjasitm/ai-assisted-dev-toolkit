# Features Documentation

This folder contains documentation for all features implemented in this project.

## Structure

Each feature gets its own folder named after the issue ID and feature name:

```
features/
├── {{ISSUE_ID}}-FEATURE-NAME/
│   ├── spec.md       # Functional specification
│   ├── plan.md       # Implementation plan
│   └── [optional]    # Additional files (diagrams, examples)
└── README.md         # This file
```

## Creating Feature Documentation

### 1. Create Feature Folder

```bash
mkdir -p docs/features/{{ISSUE_ID}}-FEATURE-NAME
```

### 2. Generate Specification

Use the `/spec` command or copy the template:

```bash
cp templates/feature-spec.template.md docs/features/{{ISSUE_ID}}-FEATURE-NAME/spec.md
```

### 3. Generate Implementation Plan

Use the `/plan` command or copy the template:

```bash
cp templates/feature-plan.template.md docs/features/{{ISSUE_ID}}-FEATURE-NAME/plan.md
```

### 4. Update During Implementation

Keep documentation updated as:

- Requirements change
- Implementation details emerge
- New decisions are made

## Naming Conventions

**Folder names** should follow this pattern:

- `{{ISSUE_ID}}-FEATURE-NAME`
- Issue ID from your issue tracker (e.g., `LEB-123`, `JIRA-456`)
- Feature name in kebab-case (e.g., `user-authentication`, `data-export`)

**Examples:**

- `LEB-123-user-authentication/`
- `JIRA-456-data-export-api/`
- `GH-789-dark-mode-support/`

## Index of Features

<!-- Auto-generated or manually maintained list of features -->

### Active Features

- [{{ISSUE_ID}}-FEATURE-NAME]({{ISSUE_ID}}-FEATURE-NAME/) - Brief description

### Completed Features

- [{{ISSUE_ID}}-COMPLETED-FEATURE]({{ISSUE_ID}}-COMPLETED-FEATURE/) - Brief description

### Deprecated Features

- [{{ISSUE_ID}}-DEPRECATED-FEATURE]({{ISSUE_ID}}-DEPRECATED-FEATURE/) - Deprecated on {{Date}}

---

**Last Updated**: {{Date}}
