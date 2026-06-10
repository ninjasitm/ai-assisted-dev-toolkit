---
paths:
  - "src/server/**"
  - "src/api/**"
  - "apps/**/server/**"
  - "apps/**/api/**"
  - "**/*.server.*"
description: "API server patterns and route conventions."
---

# API Server

Follow the rules defined in [.claude/rules-snippets/api-server.md](../rules-snippets/api-server.md).

Key points:
- Follow the API route pattern for all endpoints.
- Validate all input data before processing.
- Return consistent response formats with proper HTTP status codes.
- Document API endpoints in the designated location.
