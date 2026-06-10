---
paths:
  - "prisma/**"
  - "**/migrations/**"
  - "**/*.prisma"
description: "Database migration and schema management rules."
---

# Prisma Migrations

Follow the rules defined in [.claude/rules-snippets/prisma-migrations.md](../rules-snippets/prisma-migrations.md).

Key points:
- Create migrations with descriptive names.
- Apply migrations to development database before committing.
- Update affected services and run tests after schema changes.
