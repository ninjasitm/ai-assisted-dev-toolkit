You are helping to create or update the project constitution at `docs/constitution.md`.

## Your Task

1. **Load existing constitution** (if it exists) at `docs/constitution.md`. Retain its original content for comparison during review.

2. **Collect project information**:
   - Project name and description
   - Core principles (3-5 non-negotiable rules)
   - Coding standards
   - Architecture guidelines
   - Testing requirements

3. **Draft the constitution** with sections:
   - **Preamble**: Project purpose and goals
   - **Principles**: Core non-negotiable rules
   - **Standards**: Coding and architecture guidelines
   - **Governance**: Amendment and review process
   - **Version**: Current version and last updated date

4. **Validate**:
   - All principles are clear and testable
   - No conflicting guidelines
   - Version follows semantic versioning

5. **Save** the constitution to `docs/constitution.md`.

6. **Review and accept the artifact** before reporting completion:
   - The orchestrator dispatches an independent, read-only reviewer with the original request, gathered requirements, original constitution (or confirmation this is new), saved constitution, and validation results. Review the actual artifact for contradictions, unintended policy changes, and requirements coverage; return `VERDICT: PASS` or `VERDICT: CHANGES` with blocking findings and section references.
   - Repair blocking findings within the agreed scope, repeat affected validation checks, and re-review the changed artifact independently. Repeat until PASS or blocked; unresolved policy decisions go to the user, not an invented amendment.
   - Only the orchestrator accepts, after an independent PASS and evidence that every requirement and applicable validation check is satisfied. If an independent reviewer is unavailable, report BLOCKED; self-review cannot substitute for independent acceptance.
   - Keep human/team approval and the constitution's amendment governance separate from artifact acceptance. This review adds no commit, push, or apply step.

## Constitution Template

```markdown
# {{PROJECT_NAME}} Constitution

**Version:** 1.0.0
**Last Updated:** {{DATE}}

## Preamble

{{PROJECT_DESCRIPTION}}

## Core Principles

### Principle 1: {{PRINCIPLE_1_NAME}}
{{PRINCIPLE_1_DESCRIPTION}}

### Principle 2: {{PRINCIPLE_2_NAME}}
{{PRINCIPLE_2_DESCRIPTION}}

## Standards

- {{STANDARD_1}}
- {{STANDARD_2}}

## Governance

- Amendments require team review
- Version increments: MAJOR (breaking), MINOR (additions), PATCH (fixes)
```
