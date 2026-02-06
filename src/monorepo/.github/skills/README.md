# GitHub Copilot Skills

This folder is for skills installed via `npx -y skills add <owner/repo>` when using GitHub Copilot.

## About Skills

Skills are folders of instructions and resources that help AI agents perform specific tasks more accurately. They use the [Agent Skills](https://agentskills.io/) open format.

## Installing Skills

Install skills from [skills.sh](https://skills.sh/) using the `-a copilot` flag:

```bash
# For GitHub Copilot only
npx -y skills add -a copilot <owner/repo>

# For multiple agents (e.g., Copilot + Cursor)
npx -y skills add -a copilot -a cursor <owner/repo>
```

**Tip:** The skills CLI automatically detects installed agents. If you omit `-a copilot`, you'll be prompted to choose from detected agents.

**Important:** Always use `-a copilot` to install only for GitHub Copilot (or add multiple `-a` flags if you use multiple agents). This prevents creating unnecessary configuration files for other agents.

## Pre-installed Skills

Universal workflow skills are pre-installed in `.agents/skills/`. These include:

- test-driven-development
- systematic-debugging
- verification-before-completion
- writing-plans
- executing-plans
- And more...

See the main README.md for a full list of recommended skills.
