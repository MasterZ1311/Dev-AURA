# Sovereign AI and Neural Speech Architecture

> On-device neural speech engines, zero-latency dictation, and open agent integration standards.

---

## Systems in this Domain

- [**Rheo / VoiceBox**](./rheo-neural-speech-engine.md): Local-first sovereign AI voice studio with zero-shot neural voice cloning and streaming synthesis.
- [**Skills Bot**](./skills-bot-agent-ecosystem.md): Standardized library of 1,900+ declarative agentic skills for autonomous workflows.

---

## Domain Engineering Highlights

1. **Host-Accelerated Neural Inference**: Dynamic detection and dispatching of inference jobs across Apple Silicon (Metal), NVIDIA (CUDA), and AMD (ROCm).
2. **Streaming Audio Buffer Pipelines**: Progressive PCM audio streaming to minimize time-to-first-byte (TTFB) during voice synthesis.
3. **Model Context Protocol (MCP)**: Providing open, standardized tool interfaces so autonomous agents can interact with local voice capabilities cleanly.
