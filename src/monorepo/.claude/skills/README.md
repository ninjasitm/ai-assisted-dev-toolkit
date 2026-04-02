# Claude Code Skills

This folder is for skills installed via `npx -y skills add -a claude-code <owner/repo> --skill '*'`.

## About Skills

Skills are folders of instructions and resources that help AI agents perform specific tasks more accurately. They use the [Agent Skills](https://agentskills.io/) open format.

## Installing Skills

Install skills from [skills.sh](https://skills.sh/) using the `-a claude-code` flag:

```bash
# For Claude Code only
npx -y skills add -a claude-code <owner/repo> --skill '*'

# For multiple agents (e.g., Claude Code + GitHub Copilot)
npx -y skills add -a claude-code -a github-copilot <owner/repo> --skill '*'
```

**Tip:** The skills CLI automatically detects installed agents. If you omit `-a claude-code`, you'll be prompted to choose from detected agents.

**Important:** Always use `-a claude-code` to install only for Claude Code (or add multiple `-a` flags if you use multiple agents). This prevents creating unnecessary configuration files for other agents.

## Pre-installed Skills

Universal workflow skills are pre-installed in `.agents/skills/`. These include:

- test-driven-development
- systematic-debugging
- verification-before-completion
- writing-plans
- executing-plans
- And more...

## Examples

```bash
# Frontend skills
npx -y skills add -a claude-code onmax/nuxt-skills --skill '*'
npx -y skills add -a claude-code vercel-labs/agent-skills --skill '*'

# Security skills
npx -y skills add -a claude-code trailofbits/skills --skill '*'

# Framework-specific
npx -y skills add -a claude-code better-auth/skills --skill '*'
```

See the main README.md for a full list of recommended skills.
