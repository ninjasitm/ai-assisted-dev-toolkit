---
applyTo: "**/*"
description: "Database migration and schema management rules."
---

# Database Migrations

Follow the rules defined in [.claude/rules-snippets/database-migrations.md](../../.claude/rules-snippets/database-migrations.md).

Key points:
- {{DATABASE_SYNC_RULE}} — create migrations with descriptive names and apply to development database before committing.
- Maintain corresponding model definitions for database entities and update affected services after schema changes.
- Run tests after schema modifications to catch regressions early.
