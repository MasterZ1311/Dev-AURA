# Database Mastery, Indexing & EXPLAIN ANALYZE

> **Difficulty**: Advanced  
> **Target Outcome**: Diagnose database bottlenecks, optimize B-Tree indexes, and execute safe zero-downtime migrations.

---

## Indexing Fundamentals (PostgreSQL)

When datasets exceed hundreds of thousands of rows, queries lacking targeted indexes trigger full table scans (**Sequential Scans**).

```sql
CREATE INDEX idx_orders_user_id_status ON orders (user_id, status);
```

### Query Execution Analysis:
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total_amount 
FROM orders 
WHERE user_id = 42 AND status = 'COMPLETED';
```

Key Metrics:
- Suboptimal: `Seq Scan on orders` (High I/O and execution latency)
- Optimal: `Index Scan using idx_orders_user_id_status` (Direct index lookup)

---

## Indexing Best Practices

1. **Index Foreign Keys**: Index `user_id`, `tenant_id`, and `order_id` columns.
2. **Composite Index Column Ordering**: Place high-cardinality equality filters first, range filters second.
3. **Partial Indexes**: Index subsets of rows to minimize memory and disk usage:
   ```sql
   CREATE INDEX idx_active_subscriptions ON subscriptions (user_id) 
   WHERE status = 'ACTIVE';
   ```

---

## Safe Production Schema Migrations

Avoid exclusive locks on active production tables. In PostgreSQL, always create indexes concurrently:
```sql
CREATE INDEX CONCURRENTLY idx_users_email_verified ON users (email) WHERE is_verified = true;
```

---

## Contributor Challenges
- [ ] Connection pooling optimization using PgBouncer.
- [ ] Identifying and resolving N+1 query patterns with ORMs (Prisma, Drizzle).
