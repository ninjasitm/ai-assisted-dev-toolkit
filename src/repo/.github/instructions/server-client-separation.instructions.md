---
applyTo: "**/*"
description: "Server/client boundary enforcement and data fetching patterns."
---

# Server-Client Separation

Follow the rules defined in [.claude/rules-snippets/server-client-separation.md](../../.claude/rules-snippets/server-client-separation.md).

Key points:
- Never import server-only code in client components; use API endpoints to expose server functionality to clients.
- Create shared types for cross-boundary use; use appropriate data fetching patterns for the framework.
- Mark server-only modules clearly (e.g., `.server.{{LANGUAGE_EXTENSION}}`).
