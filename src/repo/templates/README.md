# Documentation Templates

This folder contains templates for project documentation. Copy these templates when creating new feature or fix documentation.

## Available Templates

- **monthly-fix-log.template.md** - Template for monthly fix logs (YYYY-MM.md format)
- **feature-spec.template.md** - Template for feature specifications
- **feature-plan.template.md** - Template for feature implementation plans
- **complex-fix-spec.template.md** - Template for complex fix specifications
- **complex-fix-plan.template.md** - Template for complex fix implementation plans
- **adr.template.md** - Template for Architecture Decision Records

## Usage

### Monthly Fix Logs

```bash
# Copy template to create new monthly log
cp templates/monthly-fix-log.template.md docs/fixes/2026-01.md

# Edit the file and replace placeholders:
# - {{MONTH_NAME}} → January
# - {{YEAR}} → 2026
# - {{YYYY-MM-DD}} → Actual dates
```

### Feature Documentation

```bash
# Create feature folder
mkdir -p docs/features/ISSUE-123-FEATURE-NAME

# Copy templates
cp templates/feature-spec.template.md docs/features/ISSUE-123-FEATURE-NAME/spec.md
cp templates/feature-plan.template.md docs/features/ISSUE-123-FEATURE-NAME/plan.md

# Edit files and replace placeholders
```

### Complex Fix Documentation

```bash
# Create fix folder
mkdir -p docs/fixes/ISSUE-456-COMPLEX-FIX

# Copy templates
cp templates/complex-fix-spec.template.md docs/fixes/ISSUE-456-COMPLEX-FIX/spec.md
cp templates/complex-fix-plan.template.md docs/fixes/ISSUE-456-COMPLEX-FIX/plan.md

# Edit files and replace placeholders
```

### Architecture Decision Records

```bash
# Copy ADR template
cp templates/adr.template.md docs/architecture/0001-decision-title.md

# Edit and replace placeholders
```

## Placeholder Reference

Common placeholders used in templates:

- `{{MONTH_NAME}}` - Full month name (e.g., January, February)
- `{{YEAR}}` - Four-digit year (e.g., 2026)
- `{{YYYY-MM-DD}}` - ISO date format (e.g., 2026-01-21)
- `{{YYYY-MM}}` - Year and month (e.g., 2026-01)
- `{{ISSUE_ID}}` - Issue tracker ID (e.g., ISSUE-123, JIRA-456)
- `{{FEATURE_NAME}}` - Feature name
- `{{FIX_NAME}}` - Fix name
- `{{DATE}}` - Current date or last update date
- `{{ISSUE_TRACKER}}` - Issue tracker name (e.g., Linear, Jira)
- `{{ISSUE_TRACKER_URL}}` - Full URL to issue tracker ticket

## Automated Creation

Use the `/spec` and `/plan` commands to automatically create documentation from these templates with placeholders filled in.
