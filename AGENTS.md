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
│   │   │   ├── agents/ # Custom agent templates (subagents)
│   │   │   ├── rules/  # IDE behavior rules
│   │   │   └── commands/ # Custom commands
│   │   ├── .github/    # GitHub Copilot templates
│   │   │   ├── agents/ # Custom agent templates (subagents)
│   │   │   ├── instructions/ # Context instructions (source of truth)
│   │   │   └── prompts/ # Reusable prompts
│   │   ├── .claude/    # Claude Code config templates
│   │   │   ├── agents/ # Agent definitions (thin wrappers)
│   │   │   ├── agents-snippets/ # Agent definitions (source of truth)
│   │   │   ├── rules/  # Rules (thin wrappers)
│   │   │   ├── rules-snippets/ # Rules content (source of truth)
│   │   │   ├── prompt-snippets/ # Prompt content (source of truth)
│   │   │   ├── commands/ # Claude Code commands (thin wrappers)
│   │   │   └── skills/ # Skill definitions
│   │   ├── .agents/    # Pre-installed universal skills
│   │   │   └── skills/ # Bundled skills (TDD, debugging, etc.)
│   │   ├── docs/       # Documentation structure templates
│   │   ├── templates/  # Document templates
│   │   ├── CLAUDE.md   # Redirect → AGENTS.md
│   │   └── AGENTS.md   # Agent context (source of truth)
│   │
│   └── monorepo/       # Monorepo templates
│       ├── .cursor/    # Root Cursor config
│       ├── .github/    # Root GitHub config
│       ├── .claude/    # Root Claude Code config
│       ├── .agents/    # Pre-installed universal skills
│       ├── apps/       # App-specific templates
│       └── packages/   # Package templates
│
├── .cursor/            # This repo's Cursor config
├── .github/            # This repo's GitHub config
├── .claude/            # This repo's Claude Code config
│   ├── commands/       # Thin wrappers → prompt-snippets
│   ├── rules/          # Thin wrappers → rules-snippets
│   ├── rules-snippets/ # Rules-specific content fragments
│   └── prompt-snippets/ # Shared content fragments (source of truth)
├── .opencode/          # This repo's OpenCode config
│   ├── agents/         # Agent definitions
│   ├── command/        # Custom commands
│   └── opencode.json   # OpenCode configuration
├── .vscode/            # VS Code / GitHub Copilot config
│   └── mcp.json        # Copilot MCP config
├── CLAUDE.md           # Redirect → AGENTS.md
└── AGENTS.md           # This file (source of truth)
```

## Cross-Compatible Architecture

This toolkit uses a layered architecture for cross-tool compatibility (Claude Code + GitHub Copilot + Cursor):

### Shared layer (both Claude Code and Copilot read)

- **`AGENTS.md`** — Single main agent context file (industry standard)
- **`CLAUDE.md`** — Thin redirect to AGENTS.md with @import syntax for prompt snippets
- **`.claude/prompt-snippets/`** — Shared content fragments referenced by both tools

### Copilot source of truth

- **`.github/instructions/`** — Full detailed rules (also powers VS Code non-agent features)
- **`.github/prompts/`** — Reusable prompts

### Claude thin wrappers

- **`.claude/rules/`** — Thin wrappers pointing to `.claude/rules-snippets/`

### Tool-specific

- **`.cursor/`** — Cursor IDE (independent, .mdc format)
- **`.opencode/`** — OpenCode (agents, commands, opencode.json)
- **`.vscode/mcp.json`** — GitHub Copilot MCP config (`"servers"` key)

### Reference patterns

- **CLAUDE.md** uses `@AGENTS.md` import (for Claude Code) and markdown links in "Related Documentation" (for human readers)
- **`.github/copilot-instructions.md`** is the Copilot equivalent of CLAUDE.md
- **Thin wrappers** in `.claude/`, `.cursor/`, `.github/`, `.opencode/` use markdown links to reference snippet files

## Sub-Agent Patterns

Use the appropriate sub-agents when the task benefits from specialized expertise or parallel execution.

### When to use sub-agents

| Context                                  | Recommended Agent                                            | Why                                   |
| ---------------------------------------- | ------------------------------------------------------------ | ------------------------------------- |
| Orchestration and coordination           | `orchestrator` or `coordinator` or `delegator` or equivalent | Strategic planning and task breakdown |
| Code base exploration and analysis       | `explorer` or equivalent                                     | Focused on understanding codebases    |
| Codebase understanding and documentation | `documenter` or equivalent                                   | Focused on generating documentation   |
| Reviewing templates for quality          | `reviewer` or equivalent                                     | Read-only, focused on standards       |
| Implementing template changes            | `developer` or `fixer` or equivalent                         | Needs write access, follows workflows |
| Planning architecture decisions          | `planner` or `consul` or equivalent                          | Read-only, strategic thinking         |
| PR code review                           | `reviewer` or equivalent                                     | Structured review process             |
| Commit and push                          | `build` or `deployer` or equivalent                          | Execution-focused                     |
| UI design and prototyping                | `designer` or equivalent                                     | Visual and UX expertise               |

### Sub-agent invocation patterns

**Claude Code** (via `.claude/agents/` or plugins in target projects):

```
@reviewer Review the coding standards template
@developer Implement the new placeholder syntax
@planner Design the monorepo structure
```

**GitHub Copilot** (via `.github/agents/` or plugins in target projects):

```
@reviewer Review the coding standards template
@developer Implement the new placeholder syntax
```

**OpenCode** (via `.opencode/agents/` or plugins in target projects):

```
@reviewer Review the coding standards template
@developer Implement the new placeholder syntax
@planner Design the monorepo structure
```

### Sub-agent guidelines

1. **Choose the right agent** — Match the agent's role to the task
2. **Provide context** — Reference the relevant rules-snippets or prompt-snippets
3. **Set constraints** — Use tool restrictions for read-only agents (reviewer, planner)
4. **Chain when needed** — Planner → Developer → Reviewer for complex changes

## Clarification & Alignment Guidelines

### 1. Proactive Clarification

- **Identify Ambiguity**: Stop and ask if a task lacks clear acceptance criteria, inputs, or expected outputs.
- **Resolve Conflicts**: Flag conflicting instructions between the user prompt, existing code, and documentation before writing code.
- **Expose Assumptions**: State your assumptions clearly and ask for validation before proceeding with high-impact changes.

### 2. Technical Validation & Alternatives

- **Propose Better Paths**: Suggest a simpler, more performant, or more idiomatic alternative if you see a better way to solve the problem.
- **Flag Code Smells**: Alert the team if the requested changes introduce technical debt, anti-patterns, or break existing architectural rules.
- **Check Dependencies**: Ask for verification if a task requires adding new third-party libraries or upgrading existing versions.

### 3. Scope & Edge Case Management

- **Surface Edge Cases**: List potential failures, null states, or security risks you discover, and ask how to handle them.
- **Prevent Scope Creep**: Ask for permission before modifying files or logic outside the explicit scope of the assigned task.
- **Clarify Breakages**: Warn the user immediately if a requested change will intentionally break backward compatibility or existing APIs.

### 4. How to Ask Questions (Response Formatting)

When stopping to ask a question, do not just post an open-ended block of text. Format your query using one of these two structures:

- **Structured Multiple-Choice**: For architectural, design, or logic choices, provide a numbered list of distinct options. Include a brief pro/con or trade-off for each path so the user can quickly respond with just a number (e.g., "Go with Option 2").
- **Targeted Text Input**: For missing data, API endpoints, or environment variables, provide a clear, pre-formatted Markdown template or fill-in-the-blank block. The user should be able to copy, fill out, and return it with minimal friction.

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

The toolkit includes 16 pre-installed universal skills in `src/repo/.agents/skills/` and `src/monorepo/.agents/skills/`:

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

### Branch Workflow

**Always work from a feature branch — never commit directly to `main`.**

```bash
git checkout main
git pull origin main
git checkout -b feat/your-change-description
# ... make changes ...
git push -u origin feat/your-change-description
# Open a PR from the branch into main for review
```

- Branch naming: `feat/`, `fix/`, `docs/`, `chore/` prefixes
- All changes go through a PR review before merging to `main`
- Keep branches focused — one logical change per branch

### Template Editing Rules

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

## Documentation Updates

After completing any change to this repository, dispatch the **Documenter** subagent to update affected documentation.

> "Use the Documenter agent to update README.md, CHANGELOG.md, and any affected template READMEs based on the changes just made. Keep updates concise — add missing entries, correct outdated info, and update paths. Do not rewrite sections that are still accurate."

### What to Update

| Change Type | Files to Update |
| ----------- | --------------- |
| New template file | `README.md` — File Descriptions + Repository Structure |
| New placeholder | `README.md` — Placeholder Reference tables |
| New template folder | `README.md` — Repository Structure + File Descriptions |
| New/removed `.claude`, `.cursor`, or `.github` command | `README.md` — relevant `*.md` File Descriptions section |
| New bundled skill | `README.md` — Bundled Universal Skills table; `AGENTS.md` — Bundled Skills table |
| New supported ecosystem | `README.md` — Supported Ecosystems table |
| Any fix or improvement | `CHANGELOG.md` — follow [Keep a Changelog](https://keepachangelog.com/) format |

### Standards

- **Concise**: Add or correct entries; don't rewrite accurate sections.
- **Placeholder-safe**: Never substitute `{{PLACEHOLDER}}` values inside template files under `src/`.
- **Accurate paths**: Reference actual paths (`src/repo/` or `src/monorepo/`), not generic names.

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
