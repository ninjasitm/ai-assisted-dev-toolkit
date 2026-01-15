---
model: gpt-4o
---

# Review Template Files

Review template files in the AI-Assisted Development Toolkit for quality and consistency.

## Usage

```
/review [file-path]
/review [template-folder]    # src/repo or src/monorepo
```

## Review Checklist

### Placeholder Syntax

- [ ] All project-specific values use `{{PLACEHOLDER}}` syntax
- [ ] Placeholder names are SCREAMING_SNAKE_CASE
- [ ] All placeholders are documented in README.md

### Template Quality

- [ ] Templates are generic and framework-agnostic
- [ ] Instructions are clear and actionable
- [ ] Examples are easy to customize
- [ ] File structure matches documented layout

### Consistency

- [ ] Formatting is consistent across files
- [ ] Similar sections use similar structure
- [ ] No duplicate placeholder definitions

### Documentation

- [ ] Purpose of each file is clear
- [ ] Usage instructions are complete
- [ ] Examples demonstrate proper customization
