# Zero-Downtime Deployment Strategies

> **Difficulty**: Advanced  
> **Target Outcome**: Deploy production updates continuously with zero dropped requests and automated rollback mechanisms.

---

## Deployment Strategies

### 1. Rolling Deployments
Progressively replaces instances in a service pool behind a reverse proxy or load balancer.
- Resource footprint: Low.
- Considerations: Coexistence of heterogeneous software versions during rollout window.

### 2. Blue-Green Deployments
Provisions a parallel environment (Green) alongside current production (Blue). Upon health validation, traffic is switched at the routing tier.
- Resource footprint: High during rollout.
- Advantage: Instant rollback via router switch.

### 3. Canary Deployments
Routes a fractional subset of traffic (e.g. 5%) to the new release while monitoring error rates and P99 latencies before full rollout.

```mermaid
graph LR
    User[Incoming Traffic] --> LB[Load Balancer]
    LB -->|95% Traffic| Old[Stable v1.4.0 (Blue)]
    LB -->|5% Canary| New[New Release v1.5.0 (Green)]
```

---

## Health Check Endpoint Standards

Health checks must distinguish process survival from request serving capability:

- **Liveness (`/livez`)**: Assesses process health. If failing, container runtime triggers restart.
- **Readiness (`/readyz`)**: Assesses dependency connectivity (database pools, cache nodes). If failing, router removes instance from traffic distribution.

---

## Contributor Challenges
- [ ] ArgoCD / Flux GitOps continuous deployment guide.
- [ ] NGINX / Envoy zero-downtime configuration reload patterns.
