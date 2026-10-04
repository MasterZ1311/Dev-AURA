# Distributed Commerce and Marketplaces Architecture

> Two-sided marketplaces, autonomous multi-agent economic coordination, and transaction ledger accuracy.

---

## Systems in this Domain

- [**Parkly**](./parkly-smart-parking-marketplace.md): Autonomous multi-agent smart parking marketplace coordinating hosts, drivers, computer vision slot inspection, and dynamic demand pricing.
- [**COUNT & Kamaal Shop**](./count-and-transaction-ledgers.md): Financial accounting and transaction ledgers with property-based testing and ledger balance invariants.

---

## Domain Engineering Highlights

1. **Dual-Database Architecture**: PostgreSQL for ACID transactional bookings and ledgers, combined with DynamoDB for high-throughput IoT sensor occupancy streams.
2. **Autonomous Multi-Agent Topology**: Decoupled agents coordinating space verification, pricing, and dispute resolution.
3. **Optimistic Concurrency Control**: Preventing double-booking race conditions during reservation spikes.
