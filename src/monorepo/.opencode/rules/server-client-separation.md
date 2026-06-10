# Server-Client Separation

Server and client code boundary enforcement.

@.claude/rules-snippets/server-client-separation.md

## Key points

- Never import server-only code in client components.
- Use API endpoints to expose server functionality to clients.
- Mark server-only modules clearly (e.g., `.server.{{LANGUAGE_EXTENSION}}`).
