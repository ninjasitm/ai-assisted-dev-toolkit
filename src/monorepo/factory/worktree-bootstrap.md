# Worktree bootstrap (factory)

The factory runs the steps below in each new job worktree, in order, before the builder starts. Edit this file for your project; it is yours after install and `upgrade` never overwrites it without `--force`.

Rules:

- One shell command per line. Lines starting with `#` are notes. Blank lines are skipped.
- Each command runs from the worktree root with `sh -c`. It stops the build at the first failure.
- Each command gets these variables:
  - `FACTORY_JOB_ID`: the job id, such as `001-onboarding-bootstrap`. Use it to name per-job resources, such as a database.
  - `FACTORY_PORT_BUILDER`: the builder's dev-server port. Pass it with the flag or env var that `AGENTS.md` documents.
  - `FACTORY_WORKTREE`: the worktree path (also the current directory).
  - `FACTORY_MAIN_CHECKOUT`: the main checkout, where ignored local files such as `.env` live.
- Steps must be safe to run again. Rework reruns the whole list.
- Keep secrets out of this file. Copy them from `FACTORY_MAIN_CHECKOUT` instead.

The list ships with no active steps. Uncomment the ones your project needs, or replace them. Examples:

```sh
# Dependencies: pick the one AGENTS.md documents.
# npm ci
# pnpm install --frozen-lockfile
# composer install --no-interaction
# bundle install --path vendor/bundle
# go mod vendor

# Local env file, copied only when the main checkout has one and this worktree does not.
# [ -f "$FACTORY_MAIN_CHECKOUT/.env" ] && [ ! -f .env ] && cp "$FACTORY_MAIN_CHECKOUT/.env" .env

# Database for this job only. Replace with your own create and migrate commands.
# createdb "app_${FACTORY_JOB_ID}" && DATABASE_URL="postgres:///app_${FACTORY_JOB_ID}" npm run db:migrate
```
