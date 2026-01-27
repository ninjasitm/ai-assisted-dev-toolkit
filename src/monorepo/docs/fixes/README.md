# Fixes & Bug Documentation

This folder contains documentation for bug fixes and improvements.

## Structure

### Complex Fixes (Folders)

Complex fixes that require detailed documentation:

```
fixes/
├── {{ISSUE_ID}}-FIX-NAME/
│   ├── spec.md       # Root cause analysis
│   ├── plan.md       # Implementation plan
│   └── [optional]    # Test cases, examples
```

### Simple Fixes (Monthly Logs)

Simple fixes documented in monthly aggregated logs:

```
fixes/
├── 2026-01.md       # January 2026 fixes
├── 2026-02.md       # February 2026 fixes
└── 2026-03.md       # March 2026 fixes
```

## Decision Tree: How to Document Fixes

**Before documenting, ask:**

1. **Is this a complex fix?** (multi-file, architectural changes, affects multiple features)

   - ✅ YES → Create folder `{{ISSUE_ID}}-FIX-NAME/` with `spec.md` + `plan.md`
   - ❌ NO → Add entry to `{YYYY-MM}.md` (monthly log)

2. **Does the monthly log for this month exist?**
   - ❌ NO → Create it using the template
   - ✅ YES → Add your fix as a new section

## Creating Fix Documentation

### For Simple Fixes (Use Monthly Log)

```bash
# Check if current month's log exists
ls docs/fixes/$(date +%Y-%m).md

# If not, create from template
cp templates/monthly-fix-log.template.md docs/fixes/$(date +%Y-%m).md

# Edit and add your fix as a new section
```

### For Complex Fixes (Use Folder)

```bash
# Create fix folder
mkdir -p docs/fixes/{{ISSUE_ID}}-FIX-NAME

# Copy templates
cp templates/complex-fix-spec.template.md docs/fixes/{{ISSUE_ID}}-FIX-NAME/spec.md
cp templates/complex-fix-plan.template.md docs/fixes/{{ISSUE_ID}}-FIX-NAME/plan.md

# Edit files and document root cause, solution, testing
```

## What NOT to Do

**❌ DO NOT create individual `.md` files for simple fixes:**

- ❌ `2025-10-database-connection-fix.md`
- ❌ `2025-10-auth-token-refresh.md`
- ❌ `fix-session-timeout.md`

**✅ Instead, add them as sections in the monthly log:**

- ✅ `2025-10.md` with a new `## [2025-10-24] - Database Connection Fix` section

## Monthly Log Guidelines

### File Creation

- Create **NEW** file when calendar month changes
- Do NOT append to previous month's file
- Use YYYY-MM.md naming format (e.g., `2026-01.md`)

### Content

Each monthly log should contain:

- **Summary** - Overview of the month's focus
- **Fix entries** - Each with date, description, root cause, solution, impact
- **Patterns & Learnings** - Common issues and best practices discovered
- **Technical Debt** - Items to address in future

### Format

Follow [Keep a Changelog](https://keepachangelog.com/) format for consistency.

## Index of Fixes

### Monthly Logs

- [2026-01.md](2026-01.md) - January 2026 fixes
- [2025-12.md](2025-12.md) - December 2025 fixes
- [2025-11.md](2025-11.md) - November 2025 fixes

### Complex Fixes

- [{{ISSUE_ID}}-COMPLEX-FIX]({{ISSUE_ID}}-COMPLEX-FIX/) - Brief description

---

**Last Updated**: {{Date}}
