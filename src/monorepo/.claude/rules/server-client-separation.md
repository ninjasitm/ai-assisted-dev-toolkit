---
paths:
  - "src/**"
  - "apps/**"
  - "packages/**"
description: "Server and client code separation rules."
---

# Server-Client Separation

Follow the rules defined in [.claude/rules-snippets/server-client-separation.md](../rules-snippets/server-client-separation.md).

Key points:
- Never import server-only code in client components.
- Use API endpoints to expose server functionality to clients.
- Create shared types for cross-boundary use.
- Mark server-only modules clearly (e.g., `.server.{{LANGUAGE_EXTENSION}}`).
