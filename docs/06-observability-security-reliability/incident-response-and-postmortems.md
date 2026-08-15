# Incident Response & Blameless Postmortems

> **Difficulty**: Intermediate  
> **Target Outcome**: Establish structured incident triage procedures and conduct blameless root-cause investigations.

---

## Incident Severity Framework

| Severity Level | Definition | Target Resolution | Example |
| :--- | :--- | :---: | :--- |
| **SEV-1 (Critical)** | Core service unavailable to majority of users | < 30 minutes | Primary database partition, checkout failure |
| **SEV-2 (Major)** | Major functionality impaired; workaround exists | < 2 hours | Search indexing degraded, report export failure |
| **SEV-3 (Minor)** | Non-critical bug with minimal customer impact | < 24 hours | UI styling bug on secondary admin page |

---

## Standard Postmortem Template

```markdown
# Incident Postmortem: [Incident Identifier] (SEV-1)

- **Date**: 2026-08-15
- **Incident Commander**: @engineer-name
- **Duration**: 42 minutes (14:10 UTC - 14:52 UTC)
- **Impact**: 14,200 users received 502 Bad Gateway responses during checkout.

## 1. Executive Summary
A database migration added an unindexed foreign key column without CONCURRENTLY, causing an exclusive table lock that exhausted the connection pool.

## 2. Incident Timeline (UTC)
- 14:10: Deployment v2.4.1 executed.
- 14:13: Alert triggered: P99 Latency exceeded threshold.
- 14:18: Incident Commander initiated response channel.
- 14:25: Table lock identified on orders relation.
- 14:31: Rollback executed and locking statement terminated.
- 14:52: System latency normalized; incident closed.

## 3. Root Cause Analysis (5 Whys)
1. Why did requests fail? Connection pool exhausted.
2. Why was pool exhausted? Queries blocked waiting on lock on orders table.
3. Why was table locked? Migration executed CREATE INDEX without CONCURRENTLY.
4. Why was CONCURRENTLY omitted? Migration linter was not configured for raw SQL files.
5. Why was it not caught in CI? Staging database dataset size was insufficient to reproduce locking.

## 4. Preventative Action Items
- [ ] Add migration linter in CI to mandate CONCURRENT index creation (Owner: @engineer, Priority: P0).
- [ ] Increase synthetic staging dataset to 500,000 records (Owner: @engineer, Priority: P1).
```

---

## Contributor Challenges
- [ ] On-Call runbook and escalation flowchart.
- [ ] Alert fatigue reduction strategies and SLO definition guide.
