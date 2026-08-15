# Track 04: Fullstack & API Engineering

> *"Designing responsive, resilient fullstack systems requires architectural discipline across the client, network, and storage tiers."*

This track explores high-performance frontend engineering, REST/RPC API design, database query optimization, and secure authentication architecture.

---

## Track Curriculum & Progress

| Module / Topic | File | Status | Difficulty |
| :--- | :--- | :---: | :---: |
| **Production API Design & Best Practices** | [`backend-and-api-design.md`](./backend-and-api-design.md) | Complete | Intermediate |
| **Frontend Performance & State Architecture** | [`frontend-performance-and-state.md`](./frontend-performance-and-state.md) | Complete | Intermediate |
| **Database Mastery, Indexing & EXPLAIN** | [`database-mastery-and-indexing.md`](./database-mastery-and-indexing.md) | Complete | Advanced |
| **Auth, OAuth2 & Session Architecture** | [`auth-and-session-management.md`](./auth-and-session-management.md) | Complete | Advanced |
| **Realtime Systems (WebSockets, SSE, WebRTC)** | `realtime-systems.md` | `[TODO: Open for Contribution]` | Advanced |
| **Message Queues & Background Workers** | `queues-and-background-jobs.md` | `[TODO: Open for Contribution]` | Advanced |

---

## Production Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client (Web/Mobile)
    participant CDN as Edge CDN / Cloudflare
    participant GW as API Gateway / Load Balancer
    participant API as Backend Service
    participant Cache as Redis Cache
    participant DB as PostgreSQL DB

    C->>CDN: GET /api/v1/feed
    CDN-->>C: Cache Hit (if edge cached)
    CDN->>GW: Cache Miss -> Gateway
    GW->>API: Route Request with Auth Token
    API->>Cache: Query Redis (Key: feed:user:123)
    alt Cache Hit
        Cache-->>API: Return Cached Feed
    else Cache Miss
        API->>DB: SQL Query with Index Scan
        DB-->>API: Result Rows
        API->>Cache: Set Key (TTL 300s)
    end
    API-->>GW: 200 OK + JSON Payload
    GW-->>C: Response Delivered (<50ms)
```

---

## Open Contribution Tasks

- [ ] Guide on Redis caching patterns (Cache-Aside, Write-Through, Stampede mitigation).
- [ ] Scaling WebSocket connections with Redis Pub/Sub backplane.
- [ ] Production background job orchestration using BullMQ / Celery.
