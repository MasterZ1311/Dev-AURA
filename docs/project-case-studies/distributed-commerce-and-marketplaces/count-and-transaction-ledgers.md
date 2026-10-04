# Case Study: COUNT & Transaction Ledgers

> **Platform**: Web SaaS / E-Commerce  
> **Tech Stack**: Next.js, Auth.js / NextAuth, Prisma ORM, Radix UI, Jest, Fast-Check

---

## 1. System Overview

COUNT and the Kamaal Commerce Engine are financial and transactional systems engineered to maintain strict ledger accounting invariants, currency calculation accuracy, and role-based access control.

---

## 2. Key Architectural Decisions

- **Property-Based Testing with `fast-check`**: Generates thousands of synthetic transactions, currency exchange combinations, and cart scenarios to catch rounding errors and edge cases automatically.
- **Double-Entry Ledger Invariants**: Debits and credits are recorded in balanced pairs; transactions that break ledger balance are rejected at the database constraint level.
- **Accessible UI Primitives with Radix UI**: Financial dashboards are constructed on unstyled, accessible primitives to ensure standard keyboard navigation and screen reader support.

---

## 3. What Was Learned

- **Floating Point Currency Bugs**: Never store financial amounts as floating-point numbers (`0.1 + 0.2 !== 0.3`). Always store currency as integer cents/fractions or use arbitrary-precision decimal types.
- **Property-Based Testing Catches Subtle Bugs**: Traditional unit tests test expected happy paths; property tests reveal calculation errors in edge cases human developers rarely think to test.
