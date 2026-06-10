---
applyTo:
  - "prisma/**"
  - "**/migrations/**"
  - "**/*.prisma"
description: "Database migration and schema management."
---

# Prisma Migrations

Follow the rules defined in [.claude/rules-snippets/database-migrations.md](../rules-snippets/database-migrations.md).

Key points:
- Follow {{DATABASE_SYNC_RULE}} for database synchronization.
- Create migrations with descriptive names; apply to dev database before committing.
- Run tests after schema modifications.
