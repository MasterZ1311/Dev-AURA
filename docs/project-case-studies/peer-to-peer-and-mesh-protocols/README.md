# Peer-to-Peer and Mesh Protocols Architecture

> Decentralized wire protocols, BitTorrent engines, zero-infrastructure offline mesh networking, and delay-tolerant routing.

---

## Systems in this Domain

- [**NuTorrent**](./nutorrent-bittorrent-engine.md): Pure Kotlin Multiplatform BitTorrent client engine spanning Android and Windows Desktop, featuring Bencoding parsing, Kademlia DHT, BEP 6 Fast Extension, UPnP IGD port forwarding, and token-bucket bandwidth scheduling.
- [**NOVA**](./nova-offline-mesh-sharing.md): Zero-cloud, high-speed local Wi-Fi and hotspot file-sharing protocol featuring 1 MiB chunk streaming across Android SAF, ephemeral ECDH key exchange with Short Authentication String (SAS) verification, and delay-tolerant store-and-forward relaying.
- [**MeshLink**](./meshlink-epidemic-routing.md): Bounded epidemic store-and-forward mesh routing protocol over BLE and Wi-Fi Direct, featuring transport-agnostic routing abstractions, in-memory simulated testbeds, and a 5-stage synchronization handshake.

---

## Domain Engineering Highlights

1. **Wire Protocol Engineering**: Decoding binary payloads, state machines over raw TCP/UDP streams, and zero-allocation parsing.
2. **Decentralized Discovery**: Bootstrapping peer tables across local mDNS/NSD broadcasts, SSDP multicast for UPnP NAT traversal, and Kademlia XOR-distance DHT routing.
3. **End-to-End Ephemeral Cryptography**: Securing direct device-to-device radio links with Curve25519/ECDH, HKDF salt extraction, AES-256-GCM chunk AEAD, and visual human-verifiable SAS words.
4. **Delay-Tolerant Networking (DTN)**: Treating network partitioning as the normal operating state rather than an error, persisting payloads in local SQLite storage before attempting multi-hop epidemic dissemination.
