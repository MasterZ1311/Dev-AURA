# Project Case Studies & Architectural Blueprints

> Deep-dive technical analyses of production systems built across our engineering portfolio.

---

## Directory Overview

This directory documents the concrete architectures, trade-offs, components, and hard-won lessons across our production systems:

| Domain | Directory | Featured Systems |
| :--- | :--- | :--- |
| **Native Desktop & Systems** | [`native-desktop-and-systems/`](./native-desktop-and-systems/README.md) | CodexOS, Aura 3.0 |
| **Cryptography & Zero-Knowledge** | [`cryptography-and-zero-knowledge/`](./cryptography-and-zero-knowledge/README.md) | Kryptyx, Ghost Messenger (Calypso) |
| **Client-Side WASM Compute** | [`client-side-wasm-compute/`](./client-side-wasm-compute/README.md) | ErgonPDF |
| **Sovereign AI & Neural Speech** | [`sovereign-ai-and-neural-speech/`](./sovereign-ai-and-neural-speech/README.md) | Rheo, VoiceBox, Skills Bot, Frameworkless Local RAG |
| **Edge Sensing & Radio Physics** | [`edge-sensing-and-radio-physics/`](./edge-sensing-and-radio-physics/README.md) | RuView (WiFi DensePose) |
| **Peer-to-Peer & Mesh Protocols** | [`peer-to-peer-and-mesh-protocols/`](./peer-to-peer-and-mesh-protocols/README.md) | NuTorrent, NOVA, MeshLink |
| **Realtime Operations & Esports** | [`realtime-operations-and-esports/`](./realtime-operations-and-esports/README.md) | Valorant Tournament Ops, BGMI TCC |
| **Distributed Marketplaces** | [`distributed-commerce-and-marketplaces/`](./distributed-commerce-and-marketplaces/README.md) | Parkly, COUNT, Kamaal Shop |
| **Clinical Health & Verification** | [`clinical-health-and-verification/`](./clinical-health-and-verification/README.md) | PinkPulse, SDA Matrimony DigiLocker |
| **Creative Engineering & 3D Web** | [`creative-engineering-and-3d-web/`](./creative-engineering-and-3d-web/README.md) | ZEUS, Zeus New Web |

---

## Source Repository Attachment Index

When studying these architectures, inspect the actual production codebases linked below:

| System Name | Case Study Guide | Source Repository Link | Key Source Files to Inspect |
| :--- | :--- | :--- | :--- |
| **CodexOS** | [`codexos-developer-os.md`](./native-desktop-and-systems/codexos-developer-os.md) | [CodeSorcerer-007/CodexOS](https://github.com/CodeSorcerer-007/CodexOS) | `src-tauri/src/main.rs`, `src/components/Terminal.tsx` |
| **Aura 3.0** | [`aura-3-mindful-productivity.md`](./native-desktop-and-systems/aura-3-mindful-productivity.md) | [CodeSorcerer-007/Aura](https://github.com/CodeSorcerer-007/Aura) | `src/store/useTaskStore.ts`, `src/services/soundscape.ts` |
| **Kryptyx** | [`kryptyx-password-fortress.md`](./cryptography-and-zero-knowledge/kryptyx-password-fortress.md) | [CodeSorcerer-007/Kryptx](https://github.com/CodeSorcerer-007/Kryptx) | `app/src/main/AndroidManifest.xml`, `crypto/Argon2Helper.kt` |
| **Ghost Messenger** | [`calypso-ghost-messenger.md`](./cryptography-and-zero-knowledge/calypso-ghost-messenger.md) | [MasterZ1311/Ghost-Messenger](https://github.com/MasterZ1311/Ghost-Messenger) | `webrtc/SignalingClient.kt`, `crypto/DoubleRatchet.kt` |
| **ErgonPDF** | [`ergonpdf-in-browser-pdf-suite.md`](./client-side-wasm-compute/ergonpdf-in-browser-pdf-suite.md) | [CodeSorcerer-007/ErgonPDF](https://github.com/CodeSorcerer-007/ErgonPDF) | `src/workers/pdfWorker.ts`, `src/utils/pdfOperations.ts` |
| **Rheo / VoiceBox** | [`rheo-neural-speech-engine.md`](./sovereign-ai-and-neural-speech/rheo-neural-speech-engine.md) | [MasterZ1311/Rheo](https://github.com/MasterZ1311/Rheo) | `engine/device_resolver.py`, `api/streaming_audio.py` |
| **Skills Bot** | [`skills-bot-agent-ecosystem.md`](./sovereign-ai-and-neural-speech/skills-bot-agent-ecosystem.md) | [MasterZ1311/Skills-Bot-V.-MZ.0-](https://github.com/MasterZ1311/Skills-Bot-V.-MZ.0-) | `registry/mcp_manifest.json`, `orchestrator/runner.ts` |
| **Frameworkless Local RAG** | [`frameworkless-local-rag.md`](./sovereign-ai-and-neural-speech/frameworkless-local-rag.md) | [iamvishaal491/college_recom_colvex](https://github.com/iamvishaal491/college_recom_colvex) | `model_inference.py`, `vector_search.py` |
| **RuView (WiFi DensePose)** | [`ruview-wifi-densepose.md`](./edge-sensing-and-radio-physics/ruview-wifi-densepose.md) | [MasterZ1311/RuView](https://github.com/MasterZ1311/RuView) | `firmware/esp32_csi.c`, `dsp/phase_unwrapper.ts` |
| **NuTorrent** | [`nutorrent-bittorrent-engine.md`](./peer-to-peer-and-mesh-protocols/nutorrent-bittorrent-engine.md) | [MasterZ1311/NuTorrent](https://github.com/MasterZ1311/NuTorrent) | `core/src/commonMain/bencode/`, `core/network/UPnP.kt` |
| **NOVA** | [`nova-offline-mesh-sharing.md`](./peer-to-peer-and-mesh-protocols/nova-offline-mesh-sharing.md) | [MasterZ1311/Aura (Reference)](https://github.com/MasterZ1311/Dev-AURA) | `transfer/ChunkPipeline.kt`, `crypto/SasVerify.kt` |
| **MeshLink** | [`meshlink-epidemic-routing.md`](./peer-to-peer-and-mesh-protocols/meshlink-epidemic-routing.md) | [MasterZ1311/Aura (Reference)](https://github.com/MasterZ1311/Dev-AURA) | `routing/SyncHandshake.kt`, `transport/PeerTransport.kt` |
| **Valorant Tourney Ops** | [`vto-valorant-tournament-ops.md`](./realtime-operations-and-esports/vto-valorant-tournament-ops.md) | [MasterZ1311/Valorant-Tourney-Ops](https://github.com/MasterZ1311/Valorant-Tourney-Ops) | `src/algorithms/bergerRoundRobin.ts`, `src/types/fsm.ts` |
| **BGMI TCC** | [`bgmi-tcc-esports-control.md`](./realtime-operations-and-esports/bgmi-tcc-esports-control.md) | [MasterZ1311/BGMI-Tourney-Ops](https://github.com/MasterZ1311/BGMI-Tourney-Ops) | `src/engine/scoringMatrix.ts`, `src/parsers/csvStream.ts` |
| **Parkly** | [`parkly-smart-parking-marketplace.md`](./distributed-commerce-and-marketplaces/parkly-smart-parking-marketplace.md) | [MasterZ1311/Parkly](https://github.com/MasterZ1311/Parkly) | `server/services/bookingService.ts`, `prisma/schema.prisma` |
| **COUNT / FinTrack** | [`count-event-ledger-accounting.md`](./distributed-commerce-and-marketplaces/count-event-ledger-accounting.md) | [MasterZ1311/FinTrack-Pro](https://github.com/MasterZ1311/FinTrack-Pro) | `src/ledger/doubleEntry.ts`, `tests/invariants.spec.ts` |
| **PinkPulse** | [`pinkpulse-ethical-oncology-risk.md`](./clinical-health-and-verification/pinkpulse-ethical-oncology-risk.md) | [MasterZ1311/Pink-Pulse](https://github.com/MasterZ1311/Pink-Pulse) | `src/algorithms/gailModel.ts`, `src/crypto/scrubber.ts` |
| **SDA Matrimony Site** | [`sda-matrimony-digilocker-consent.md`](./clinical-health-and-verification/sda-matrimony-digilocker-consent.md) | [MasterZ1311/SDA-Matrimony-Site](https://github.com/MasterZ1311/SDA-Matrimony-Site) | `server/auth/digilockerOAuth.ts`, `server/models/User.ts` |
| **ZEUS / Zeus Web** | [`zeus-3d-web-creative-engineering.md`](./creative-engineering-and-3d-web/zeus-3d-web-creative-engineering.md) | [CodeSorcerer-007/Zeus](https://github.com/CodeSorcerer-007/Zeus) | `src/shaders/waveShader.glsl`, `src/canvas/SceneManager.ts` |

---

## Analysis Framework

Each case study breaks down:
1. **Executive Overview**: What problem the system solves and its operating model.
2. **Architecture & Tech Stack**: Languages, frameworks, and component boundaries.
3. **Core Invariants & State Models**: Mathematical or business constraints enforced in code.
4. **Hard-Won Engineering Lessons**: Difficult bugs, performance bottlenecks, and architectural pivots encountered during development.
5. **Open Challenges & Future Work**: Extension areas for open collaboration.
