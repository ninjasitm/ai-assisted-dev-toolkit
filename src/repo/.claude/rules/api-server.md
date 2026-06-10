---
applyTo:
  - "src/server/**"
  - "src/api/**"
  - "**/*.server.*"
description: "API and server-side development standards."
---

# API & Server

Follow the rules defined in [.claude/rules-snippets/api-server.md](../rules-snippets/api-server.md).

Key points:
- Follow {{API_ROUTE_PATTERN}} for API route conventions.
- Validate all input data before processing.
- Return consistent response formats with proper HTTP status codes.
