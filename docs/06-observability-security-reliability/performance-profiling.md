# Performance Profiling & Memory Leak Diagnostics

> **Difficulty**: Advanced  
> **Target Outcome**: Diagnose event-loop latency, CPU hot-paths, and memory leaks using flamegraphs and heap snapshots.

---

## Node.js Event Loop Profiling

When CPU saturation occurs, investigate synchronous bottlenecks (heavy serialization, unoptimized regular expressions, or cryptographic hashing on the main thread).

```bash
# Profile CPU usage natively in Node.js
node --prof app.js

# Process isolate log output
node --prof-process isolate-0xnnnnnnnn-v8.log > processed-profile.txt
```

---

## Interpreting Flamegraphs

In a standard flamegraph visualization:
- **X-Axis**: Execution frequency (wider blocks represent larger proportions of CPU time consumed).
- **Y-Axis**: Call stack depth (from parent callers to nested functions).
- **Optimization Target**: Wide plateaus at top stack levels indicate direct execution bottlenecks.

```mermaid
graph TD
    A[main()] --> B[handleRequest()]
    B --> C[parsePayload() - 10% CPU]
    B --> D[regexValidation() - 85% CPU Bottleneck]
```

---

## Memory Leak Root Causes

1. **Retained Event Listeners**: Missing `.off()` cleanup on long-lived event emitters.
2. **Unbounded Caches**: Storing items in memory without eviction limits (use LRU cache structures).
3. **Closure Reference Retention**: Timers or closures holding unintended references to large structures.

---

## Contributor Challenges
- [ ] Go `pprof` CPU and heap profiling reference guide.
- [ ] Clinic.js (`clinic flame`, `clinic doctor`) deep-dive.
