# Production API Design Standards & Best Practices

> **Difficulty**: Intermediate  
> **Target Outcome**: Design consistent, predictable, and maintainable RESTful and RPC APIs.

---

## Core Rules of API Design

### 1. Resource-Oriented URI Structure
- Suboptimal: `POST /getUserDetails`, `POST /deleteOrder`
- Standard: `GET /api/v1/users/:id`, `DELETE /api/v1/orders/:id`

### 2. HTTP Status Code Conventions
- `200 OK`: Request succeeded.
- `201 Created`: Resource created successfully.
- `204 No Content`: Action succeeded with no body returned.
- `400 Bad Request`: Schema validation or syntax error.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Authenticated identity lacks permission for resource.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Unique constraint violation (e.g. email duplicate).
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unhandled server exception.

### 3. Structured Error Envelope
Return a standardized JSON structure on errors:
```json
{
  "error": {
    "code": "RESOURCE_ALREADY_EXISTS",
    "message": "User with email dev@example.com already exists.",
    "details": [
      { "field": "email", "issue": "duplicate" }
    ],
    "traceId": "req_8492048f0a"
  }
}
```

### 4. Cursor-Based Pagination
Avoid `OFFSET / LIMIT` on large datasets due to $O(N)$ sequential scan degradation. Use cursor-based pagination:
```text
GET /api/v1/posts?limit=20&after_cursor=eyJpZCI6MTA0fQ==
```

### 5. Idempotency Keys
For financial transactions or critical state mutations, support the `Idempotency-Key` header to prevent duplicate execution during network retries.

---

## Contributor Challenges
- [ ] Automated OpenAPI / Swagger documentation workflow.
- [ ] Architectural trade-off analysis: REST versus GraphQL versus gRPC.
