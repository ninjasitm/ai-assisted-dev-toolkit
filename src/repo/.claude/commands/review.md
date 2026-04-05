```mdc
---
description: Conduct code review for files or features
---

# Code Review

Comprehensive code review checklist for quality, security, and maintainability.

## Usage

```

/review {{SRC_DIR}}/feature/component.{{FILE_EXTENSION}}
/review feature-name
/review

````

## Process

1. **Determine Context**:
   - If file path provided, review that file
   - If feature name provided, review related files
   - If no argument, use chat history for context

2. **Load Context**:
   - Retrieve file contents and changes
   - Load `AGENTS.md` for project patterns
   - Check linked issues if available

3. **Conduct Review**:
   Apply review checklist and report findings

## Review Categories

### Functionality
- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No obvious bugs or logic errors

### Code Quality
- [ ] Code is readable and well-structured
- [ ] Functions are small and focused
- [ ] Variable names are descriptive
- [ ] No code duplication
- [ ] Follows project conventions from `AGENTS.md`

### Security
- [ ] No security vulnerabilities
- [ ] Input validation is present
- [ ] Sensitive data handled properly
- [ ] No hardcoded secrets or credentials

### Performance
- [ ] No obvious performance issues
- [ ] Database queries optimized
- [ ] No unnecessary loops or operations

### Testing
- [ ] Unit tests exist for new code
- [ ] Tests cover edge cases
- [ ] Tests are maintainable

### Documentation
- [ ] Complex logic is commented
- [ ] Public APIs are documented
- [ ] README updated if needed

## Report Format

```markdown
## Code Review: [file/feature]

### Summary
[Overall assessment]

### Findings

#### Critical 🔴
- [Must fix before merge]

#### Warnings 🟡
- [Should address]

#### Suggestions 🟢
- [Optional improvements]

### Recommendation
[Approve / Request Changes / Needs Discussion]
````

```

```
