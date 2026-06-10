---
applyTo: "src/**"
description: "Server and client code boundary enforcement."
---

# Server-Client Separation

Follow the rules defined in [.claude/rules-snippets/server-client-separation.md](../rules-snippets/server-client-separation.md).

Key points:
- Never import server-only code in client components.
- Use API endpoints to expose server functionality to clients.
- Mark server-only modules clearly (e.g., `.server.{{LANGUAGE_EXTENSION}}`).
