# Documentation Templates

This folder contains templates for monorepo documentation. Copy these templates when creating new feature or fix documentation.

## Available Templates

- **monthly-fix-log.template.md** - Template for monthly fix logs (YYYY-MM.md format)
- **feature-spec.template.md** - Template for feature specifications
- **feature-plan.template.md** - Template for feature implementation plans
- **complex-fix-spec.template.md** - Template for complex fix specifications
- **complex-fix-plan.template.md** - Template for complex fix implementation plans
- **adr.template.md** - Template for Architecture Decision Records (root docs only)

## Usage

### For App-Specific Documentation

**Monthly Fix Logs:**

```bash
# Copy template to create new monthly log for web app
cp templates/monthly-fix-log.template.md apps/web/docs/fixes/2026-01.md

# Edit and replace {{APP_NAME}}, {{FRAMEWORK}}, dates, etc.
```

**Feature Documentation:**

```bash
# Create feature folder in web app
mkdir -p apps/web/docs/features/LEB-123-FEATURE-NAME

# Copy templates
cp templates/feature-spec.template.md apps/web/docs/features/LEB-123-FEATURE-NAME/spec.md
cp templates/feature-plan.template.md apps/web/docs/features/LEB-123-FEATURE-NAME/plan.md
```

**Complex Fix Documentation:**

```bash
# Create fix folder in server app
mkdir -p apps/server/docs/fixes/LEB-456-COMPLEX-FIX

# Copy templates
cp templates/complex-fix-spec.template.md apps/server/docs/fixes/LEB-456-COMPLEX-FIX/spec.md
cp templates/complex-fix-plan.template.md apps/server/docs/fixes/LEB-456-COMPLEX-FIX/plan.md
```

### For Root Documentation

**Architecture Decision Records:**

```bash
# Copy ADR template to root docs
cp templates/adr.template.md docs/architecture/0001-decision-title.md

# Edit and replace placeholders
```

## Critical Guidelines

### App-Specific vs Root Documentation

**✅ Document in apps/packages:**

- App-specific features
- App-specific bug fixes
- Component implementations
- API endpoint changes

**✅ Document in root docs/:**

- Architecture decisions affecting multiple apps
- Deployment pipelines
- Cross-app integration patterns
- Monorepo tooling configuration

**❌ Never put app-specific docs in root docs/**

See [documentation.instructions.md](../.github/instructions/documentation.instructions.md) for full guidelines.

## Placeholder Reference

### Common Placeholders

- `{{APP_NAME}}` - App name (e.g., web, server)
- `{{FRAMEWORK}}` - Framework (e.g., Nuxt, Hono)
- `{{Month}}` - Full month name (e.g., January)
- `{{Year}}` - Four-digit year (e.g., 2026)
- `{{YYYY-MM-DD}}` - ISO date format
- `{{ISSUE_ID}}` - Issue tracker ID
- `{{FEATURE-NAME}}` - Kebab-case feature name
- `{{FIX-NAME}}` - Kebab-case fix name

### Monorepo-Specific

- `{{APP_1}}` - First app name from workspace
- `{{APP_2}}` - Second app name from workspace
- `{{PACKAGE_1}}` - First package name
- `{{PACKAGE_2}}` - Second package name
- `{{BUILD_SYSTEM}}` - Build system (e.g., Turborepo)

## Automated Creation

Use the `/spec` and `/plan` commands to automatically create documentation from these templates with placeholders filled in based on your monorepo structure.
