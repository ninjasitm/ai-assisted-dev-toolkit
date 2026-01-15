---
description: Review template files for quality, consistency, and proper placeholder usage
---

You are reviewing template files in the AI-Assisted Development Toolkit.

Follow this review process:

1. **Identify Scope**: Determine what is being reviewed:

   - Single file or directory
   - `src/repo/` templates
   - `src/monorepo/` templates
   - Root configuration

2. **Check Placeholder Consistency**:

   - All project-specific values use `{{PLACEHOLDER}}` syntax
   - Placeholder names are SCREAMING_SNAKE_CASE
   - All placeholders are documented in README.md

3. **Review Template Quality**:

   - [ ] Templates are generic and framework-agnostic
   - [ ] Instructions are clear and actionable
   - [ ] Examples are easy to customize
   - [ ] File structure matches documented layout

4. **Check for Issues**:

   - [ ] No hardcoded project-specific values
   - [ ] No broken placeholder syntax
   - [ ] No undocumented placeholders
   - [ ] Consistent formatting across files

5. **Report Findings**:
   - List any issues found
   - Suggest improvements
   - Confirm templates are ready for use
