# API Documentation

This folder contains API specifications and documentation.

## Structure

```
api/
├── README.md           # This file
├── overview.md         # API overview and conventions
├── authentication.md   # Authentication details
└── endpoints/          # Individual endpoint documentation
    ├── users.md
    ├── posts.md
    └── ...
```

## Documentation Standards

### Endpoint Documentation

Each endpoint should document:

- **HTTP Method and Path**
- **Description**
- **Authentication requirements**
- **Request parameters** (path, query, body)
- **Response format**
- **Error responses**
- **Examples**

### Example Format

```markdown
## GET /api/{{RESOURCE}}/:id

Retrieve a single {{RESOURCE}} by ID.

### Authentication

Required: Bearer token

### Parameters

| Name | Type   | In   | Required | Description         |
| ---- | ------ | ---- | -------- | ------------------- |
| id   | string | path | Yes      | The {{RESOURCE}} ID |

### Response

**Success (200)**
\`\`\`json
{
"id": "123",
"name": "Example",
"createdAt": "2026-01-01T00:00:00Z"
}
\`\`\`

**Error (404)**
\`\`\`json
{
"error": "Not found",
"message": "{{RESOURCE}} with id '123' not found"
}
\`\`\`
```

## API Versioning

Document the API versioning strategy:

- URL versioning: `/api/v1/resource`
- Header versioning: `API-Version: 1`
- Query versioning: `/api/resource?version=1`

## OpenAPI/Swagger

If using OpenAPI, place the specification file here:

- `openapi.yaml` or `openapi.json`
- Link to interactive documentation (e.g., Swagger UI)
