# Cursor Skills

This folder is for skills installed via `npx skills add <owner/repo>`.

## About Skills

Skills are folders of instructions and resources that help AI agents perform specific tasks more accurately. They use the [Agent Skills](https://agentskills.io/) open format.

## Installing Skills

Install skills from [skills.sh](https://skills.sh/):

```bash
npx skills add <owner/repo>
```

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
npx skills add onmax/nuxt-skills
npx skills add vercel-labs/agent-skills

# Security skills
npx skills add trailofbits/skills

# Framework-specific
npx skills add better-auth/skills
```

See the main README.md for a full list of recommended skills.
