# Architecture Decision Records

This folder contains Architecture Decision Records (ADRs) documenting significant technical decisions made in this project.

## What is an ADR?

An ADR is a short document describing a significant software design choice along with its context and consequences.

## Structure

```
architecture/
├── 0001-initial-architecture.md
├── 0002-database-choice.md
├── 0003-api-design.md
└── README.md
```

## Creating an ADR

1. Copy the template:

   ```bash
   cp templates/adr.template.md docs/architecture/{{ADR_NUMBER}}-{{DECISION_TITLE}}.md
   ```

2. Fill in the template with:
   - Context and problem statement
   - Considered options
   - Decision outcome and rationale
   - Consequences

## Naming Convention

ADRs are numbered sequentially: `NNNN-short-title.md`

- `0001-initial-project-structure.md`
- `0002-authentication-strategy.md`
- `0003-database-migration-approach.md`

## Status

ADRs can have the following statuses:

- **Proposed** - Under discussion
- **Accepted** - Decision made and being implemented
- **Deprecated** - No longer relevant
- **Superseded** - Replaced by another ADR

## Index

<!-- Add your ADRs here as you create them -->

| ADR  | Title                                          | Status   | Date     |
| ---- | ---------------------------------------------- | -------- | -------- |
| 0001 | [Example Decision](./0001-example-decision.md) | Accepted | {{DATE}} |
