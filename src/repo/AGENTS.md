# AGENTS.md - {{PROJECT_NAME}}

**Language:** {{LANGUAGE}}
**Framework:** {{FRAMEWORK}}
**Package Manager:** {{PACKAGE_MANAGER}}
**Deploy:** {{DEPLOY_PLATFORM}} | **Dev:** localhost:{{DEV_PORT}}

## Overview

{{PROJECT_DESCRIPTION}}

## Structure

```
{{PROJECT_NAME}}/
{{PROJECT_STRUCTURE}}
```

## Tech Stack

**Core:** {{LANGUAGE}}, {{FRAMEWORK}}
**Database:** {{DATABASE}}
**Testing:** {{TEST_FRAMEWORK}}
**Build:** {{BUILD_TOOL}}

## Coding Standards

### {{PRIMARY_PATTERN_NAME}}

```{{FILE_EXTENSION}}
{{PRIMARY_PATTERN_EXAMPLE}}
```

**Rules:**

- {{CODING_RULE_1}}
- {{CODING_RULE_2}}
- {{CODING_RULE_3}}

## Patterns

### Data Access

```{{FILE_EXTENSION}}
{{DATA_ACCESS_PATTERN}}
```

### API/Routes

```{{FILE_EXTENSION}}
{{API_PATTERN}}
```

## Testing

```bash
# Run all tests
{{TEST_COMMAND}}

# Run tests with coverage
{{TEST_COVERAGE_COMMAND}}
```

### Test Structure

```{{FILE_EXTENSION}}
{{TEST_EXAMPLE}}
```

## Environment Variables

| Variable        | Description        | Required |
| --------------- | ------------------ | -------- |
| `{{ENV_VAR_1}}` | {{ENV_VAR_1_DESC}} | Yes      |
| `{{ENV_VAR_2}}` | {{ENV_VAR_2_DESC}} | No       |

## Commands

```bash
# Install dependencies
{{INSTALL_COMMAND}}

# Run development server
{{DEV_COMMAND}}

# Build for production
{{BUILD_COMMAND}}

# Run linting
{{LINT_COMMAND}}
```

## Deployment

```bash
# Deploy to {{DEPLOY_PLATFORM}}
{{DEPLOY_COMMAND}}
```

## Related Documentation

- [README.md](README.md) - Project overview
- [docs/](docs/) - Detailed documentation
- [.cursor/rules/](.cursor/rules/) - Cursor IDE rules

## Skills

For detailed standards on specific topics, refer to these skills in `.agents/skills/`:

| Skill               | File                                      | Purpose                                                 |
| ------------------- | ----------------------------------------- | ------------------------------------------------------- |
| **TDD**             | `test-driven-development/SKILL.md`        | Test-driven development with red-green-refactor         |
| **Debugging**       | `systematic-debugging/SKILL.md`           | Structured debugging methodology                        |
| **Verification**    | `verification-before-completion/SKILL.md` | Quality checks before claiming work done                |
| **Writing Plans**   | `writing-plans/SKILL.md`                  | Feature planning and specifications                     |
| **Executing Plans** | `executing-plans/SKILL.md`                | Following through on implementation plans               |
| **Code Review**     | `requesting-code-review/SKILL.md`         | Review process and checklists                           |
| **Review Feedback** | `receiving-code-review/SKILL.md`          | Responding constructively to review feedback            |
| **Brainstorming**   | `brainstorming/SKILL.md`                  | Structured ideation sessions                            |
| **Writing Skills**  | `writing-skills/SKILL.md`                 | Creating effective SKILL.md files                       |
| **Superpowers**     | `using-superpowers/SKILL.md`              | Leveraging the full skill system                        |
| **Git Worktrees**   | `using-git-worktrees/SKILL.md`            | Parallel development branches                           |
| **Parallel Agents** | `dispatching-parallel-agents/SKILL.md`    | Coordinating multiple AI agents                         |
| **Subagent Dev**    | `subagent-driven-development/SKILL.md`    | Breaking tasks into subagent chunks                     |
| **Branch Finish**   | `finishing-a-development-branch/SKILL.md` | Completing and merging branches                         |
| **Logging**         | `logging/SKILL.md`                        | Structured logging standards, log levels, observability |
| **Documentation**   | `project-documentation/SKILL.md`          | README, comments, ADRs, changelogs                      |

## Contributing

**Standards:** Follow {{FRAMEWORK}} and {{LANGUAGE}} best practices
**Process:** Feature branch → tests → lint → build → PR
