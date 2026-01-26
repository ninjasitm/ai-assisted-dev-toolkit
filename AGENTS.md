# AGENTS.md - AI-Assisted Development Toolkit

**Type:** Template Repository
**Purpose:** Provide AI instruction templates for single repos and monorepos
**Audience:** Developers setting up AI-assisted development workflows

## Overview

This is a **meta-repository** containing templates for AI development instructions. The templates in `src/` are meant to be copied to target projects and customized.

## Structure

```
/
├── src/
│   ├── repo/           # Single repository templates
│   │   ├── .cursor/    # Cursor IDE config templates
│   │   ├── .github/    # GitHub Copilot templates
│   │   ├── .agents/    # Pre-installed universal skills
│   │   │   └── skills/ # Bundled skills (TDD, debugging, etc.)
│   │   ├── docs/       # Documentation structure templates
│   │   ├── templates/  # Document templates
│   │   └── AGENTS.md   # Agent context template
│   │
│   └── monorepo/       # Monorepo templates
│       ├── .cursor/    # Root Cursor config
│       ├── .github/    # Root GitHub config
│       ├── .agents/    # Pre-installed universal skills
│       │   └── skills/ # Bundled skills (TDD, debugging, etc.)
│       ├── apps/       # App-specific templates
│       ├── packages/   # Package templates
│       ├── docs/       # Documentation structure templates
│       ├── templates/  # Document templates
│       └── AGENTS.md   # Monorepo agent context template
│
├── .cursor/            # This repo's Cursor config
├── .github/            # This repo's GitHub config
└── AGENTS.md           # This file
```

## Template Conventions

### Placeholder Syntax

All templates use `{{PLACEHOLDER}}` syntax for customizable values:

- `{{PROJECT_NAME}}` - Project name
- `{{FRAMEWORK}}` - Primary framework (Next.js, Nuxt, Laravel, Django, etc.)
- `{{LANGUAGE}}` - Programming language (TypeScript, PHP, Python, C#, etc.)
- `{{PACKAGE_MANAGER}}` - Package manager (npm, pnpm, composer, pip, etc.)
- `{{DEV_PORT}}` - Development server port
- `{{DEPLOY_PLATFORM}}` - Deployment target

### File Types

| Extension          | Purpose              | Used By        |
| ------------------ | -------------------- | -------------- |
| `.mdc`             | Cursor rules         | Cursor IDE     |
| `.md`              | Commands/prompts     | Cursor/Copilot |
| `.prompt.md`       | Reusable prompts     | GitHub Copilot |
| `.instructions.md` | Context instructions | GitHub Copilot |

## Bundled Skills

The toolkit includes 16 pre-installed universal skills in `.agents/skills/`:

| Skill                            | Purpose                                  |
| -------------------------------- | ---------------------------------------- |
| `test-driven-development`        | TDD with red-green-refactor workflow     |
| `systematic-debugging`           | Structured debugging methodology         |
| `verification-before-completion` | Quality checks before claiming work done |
| `writing-plans`                  | Creating implementation plans            |
| `executing-plans`                | Following through on plans               |
| `requesting-code-review`         | Best practices for requesting reviews    |
| `receiving-code-review`          | Responding to review feedback            |
| `brainstorming`                  | Structured ideation sessions             |
| `writing-skills`                 | Creating effective SKILL.md files        |
| `using-superpowers`              | Leveraging the full skill system         |
| `using-git-worktrees`            | Git worktree workflows                   |
| `dispatching-parallel-agents`    | Coordinating multiple AI agents          |
| `subagent-driven-development`    | Breaking tasks into subagent chunks      |
| `finishing-a-development-branch` | Completing and merging branches          |
| `logging`                        | Structured logging standards             |
| `project-documentation`          | README, comments, ADRs, changelogs       |

## Working on This Repository

When modifying templates:

1. **Preserve placeholders** - Keep `{{VAR}}` syntax intact
2. **Stay generic** - Avoid project-specific references
3. **Document placeholders** - List required variables in README
4. **Test templates** - Verify syntax is valid after placeholder replacement

## Template Categories

### Single Repo (`src/repo/`)

For standard repositories with a single project:

- Web applications
- API servers
- CLI tools
- Libraries

### Monorepo (`src/monorepo/`)

For monorepos with:

- Multiple apps (`apps/`)
- Shared packages (`packages/`)
- Workspace-level configuration

## Contributing

When modifying templates:

1. **Preserve placeholders** - Keep `{{VAR}}` syntax intact
2. **Stay generic** - Avoid project-specific references
3. **Test changes** - Verify templates work after placeholder replacement
4. **Update documentation** - Keep README.md in sync with changes

## Related Documentation

- [README.md](README.md) - Usage guide and placeholder reference
- [src/repo/](src/repo/) - Single repository templates
- [src/monorepo/](src/monorepo/) - Monorepo templates
