# Checklist: [Process or System Name]

> **Scope**: Pre-deployment / Code Review / System Design / Incident Readiness  
> **Target Audience**: Software Engineers, Tech Leads, Site Reliability Engineers

---

## Purpose
A production-tested checklist designed for execution prior to releasing or finalizing [Topic].

---

## The Execution Matrix

### 1. Foundation & Hygiene
- [ ] **Item 1**: Verify all environment variables and secrets are injected via secure vaults.
- [ ] **Item 2**: Ensure linters, formatters, and type-checks pass with zero warnings.
- [ ] **Item 3**: Verify test suite coverage meets target threshold (>80%).

### 2. Performance & Scaling
- [ ] **Item 4**: Database query execution plans inspected (`EXPLAIN ANALYZE`).
- [ ] **Item 5**: Rate limiters and timeouts configured on external dependencies.
- [ ] **Item 6**: Caching policies configured with sensible TTLs and eviction strategies.

### 3. Security & Resilience
- [ ] **Item 7**: Input validation and sanitization on all untrusted user boundaries.
- [ ] **Item 8**: Structured JSON logging without sensitive PII leakage.
- [ ] **Item 9**: Health check endpoint `/healthz` reflects downstream connectivity.

### 4. Rollback & Disaster Recovery
- [ ] **Item 10**: Automated database migration rollback script verified in staging.
- [ ] **Item 11**: Feature flags created to instantly kill the feature if errors spike.

---

## Team Integration
Include this checklist within pull request templates or deployment pipelines to ensure team-wide compliance.
