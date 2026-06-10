---
applyTo: "**/*"
description: "Database migration and schema management rules."
---

# Database Migrations

- {{DATABASE_SYNC_RULE}}
- Create migrations with descriptive names.
- Apply migrations to development database before committing.
- Maintain corresponding model definitions for database entities.
- Update affected services after schema changes.
- Run tests after schema modifications.
