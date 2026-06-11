---
applyTo: "**/*"
description: "Database migration and schema management rules for the {{PROJECT_NAME}} monorepo."
---

# Database Migrations

Follow the rules defined in [.claude/rules-snippets/prisma-migrations.md](../../.claude/rules-snippets/prisma-migrations.md).

Key points:
- {{DATABASE_SYNC_RULE}} — create migrations with descriptive names and apply to development database before committing.
- Maintain corresponding model definitions for database entities and update affected services after schema changes.
- Run tests after schema modifications to catch regressions early.
- Coordinate schema changes across apps when using shared database packages.
