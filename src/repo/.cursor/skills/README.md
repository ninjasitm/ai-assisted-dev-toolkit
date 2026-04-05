# Cursor Skills

This folder is for skills installed via `npx -y skills add <owner/repo> --skill '*' --agent github-copilot cursor`.

## About Skills

Skills are folders of instructions and resources that help AI agents perform specific tasks more accurately. They use the [Agent Skills](https://agentskills.io/) open format.

## Installing Skills

Install skills from [skills.sh](https://skills.sh/) using the `-a cursor` flag:

```bash
# For Cursor only
npx -y skills add -a cursor <owner/repo> --skill '*' --agent github-copilot cursor

# For multiple agents (e.g., Cursor + GitHub Copilot)
npx -y skills add -a cursor -a github-copilot <owner/repo> --skill '*' --agent github-copilot cursor
```

**Tip:** The skills CLI automatically detects installed agents. If you omit `-a cursor`, you'll be prompted to choose from detected agents. Use `--skill '*' --agent github-copilot cursor` to avoid skill-selection prompts when installing from a repo.

**Important:** Always use `-a cursor` to install only for Cursor (or add multiple `-a` flags if you use multiple agents). This prevents creating unnecessary configuration files for other agents.

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
npx -y skills add -a cursor onmax/nuxt-skills --skill '*' --agent github-copilot cursor
npx -y skills add -a cursor vercel-labs/agent-skills --skill '*' --agent github-copilot cursor

# Security skills
npx -y skills add -a cursor trailofbits/skills --skill '*' --agent github-copilot cursor

# Framework-specific
npx -y skills add -a cursor better-auth/skills --skill '*' --agent github-copilot cursor
```

See the main README.md for a full list of recommended skills.
