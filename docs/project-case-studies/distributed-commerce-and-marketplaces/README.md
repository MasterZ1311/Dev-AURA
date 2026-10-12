# Distributed Commerce and Marketplaces Architecture

> Two-sided marketplaces, autonomous multi-agent economic coordination, and transaction ledger accuracy.

---

## Systems in this Domain

- [**Parkly**](./parkly-smart-parking-marketplace.md): Autonomous multi-agent smart parking marketplace coordinating hosts, drivers, computer vision slot inspection, and dynamic demand pricing.
- [**COUNT & Kamaal Shop**](./count-and-transaction-ledgers.md): Financial accounting and transaction ledgers with property-based testing and ledger balance invariants.

---

## Technical Architecture: Distributed Marketplace & Ledger Topology

```mermaid
graph TD
    UserDriver[Driver: Mobile Booking Client] --> BookingService[Booking Orchestration Service]
    UserHost[Host: Parking Spot Owner] --> ListingService[Listing & Inspection Service]
    
    subgraph Multi-Agent Autonomous Coordination (Parkly)
        ListingService --> VisionAgent[Vision Agent: Driveway Suitability Verification]
        BookingService --> PricingAgent[Dynamic Yield Pricing Agent: Demand Heatmaps]
        BookingService --> DisputeAgent[Dispute Arbitration Agent]
    end
    
    subgraph Dual-Database Transactional Architecture
        BookingService --> OCCLock{Optimistic Concurrency: Version == V_expected?}
        OCCLock -->|Version Match| PostgresTx[(PostgreSQL: ACID Booking & Double-Entry Ledger)]
        OCCLock -->|Version Conflict| RetryHandler[Shed Transaction & Refresh UI State]
        
        SensorStream[IoT Ultrasonic Sensors] --> DynamoDB[(DynamoDB: High-Throughput Occupancy Telemetry)]
    end
```

---

## Domain Engineering Highlights

1. **Dual-Database Architecture**: PostgreSQL for ACID transactional bookings and ledgers, combined with DynamoDB for high-throughput IoT sensor occupancy streams.
2. **Autonomous Multi-Agent Topology**: Decoupled agents coordinating space verification, pricing, and dispute resolution.
3. **Optimistic Concurrency Control**: Preventing double-booking race conditions during reservation spikes.
