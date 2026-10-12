# Peer-to-Peer and Mesh Protocols Architecture

> Decentralized wire protocols, BitTorrent engines, zero-infrastructure offline mesh networking, and delay-tolerant routing.

---

## Systems in this Domain

- [**NuTorrent**](./nutorrent-bittorrent-engine.md): Pure Kotlin Multiplatform BitTorrent client engine spanning Android and Windows Desktop, featuring Bencoding parsing, Kademlia DHT, BEP 6 Fast Extension, UPnP IGD port forwarding, and token-bucket bandwidth scheduling.
- [**NOVA**](./nova-offline-mesh-sharing.md): Zero-cloud, high-speed local Wi-Fi and hotspot file-sharing protocol featuring 1 MiB chunk streaming across Android SAF, ephemeral ECDH key exchange with Short Authentication String (SAS) verification, and delay-tolerant store-and-forward relaying.
- [**MeshLink**](./meshlink-epidemic-routing.md): Bounded epidemic store-and-forward mesh routing protocol over BLE and Wi-Fi Direct, featuring transport-agnostic routing abstractions, in-memory simulated testbeds, and a 5-stage synchronization handshake.

---

## Technical Architecture: Decentralized Wire & Mesh Topology

```mermaid
graph TD
    NodeA[Local Sovereign Node A] --> DiscoveryMesh{Discovery & Transport Subsystems}
    
    subgraph Discovery & NAT Traversal
        DiscoveryMesh --> mDNSBroadcaster[Local mDNS / NSD Service Broadcast: _mesh._tcp]
        DiscoveryMesh --> UPnPClient[SSDP UPnP IGD Multicast: Punch Router WAN Ports]
        DiscoveryMesh --> DHTTable[Kademlia 160-Bit XOR Distance Routing Table]
    end
    
    subgraph Direct Radio & Wire Protocols
        mDNSBroadcaster --> DirectWiFi[Local Wi-Fi / Hotspot TCP Stream: 1 MiB Chunk Pipeline]
        DHTTable --> BitTorrentWire[BitTorrent TCP Peer Wire: Bencode, Bitfield, AllowedFast]
        DiscoveryMesh --> BLERadio[Bluetooth Low Energy GATT Transport]
    end
    
    subgraph Delay-Tolerant Store-and-Forward (DTN)
        BLERadio --> SyncHandshake[5-Stage Sync Handshake: HELLO -> SUMMARY -> REQUEST -> TRANSFER -> RELAY_ACK]
        SyncHandshake --> SQLiteVault[(Pre-Transmission SQLite Durable Storage)]
    end
```

---

## Domain Engineering Highlights

1. **Wire Protocol Engineering**: Decoding binary payloads, state machines over raw TCP/UDP streams, and zero-allocation parsing.
2. **Decentralized Discovery**: Bootstrapping peer tables across local mDNS/NSD broadcasts, SSDP multicast for UPnP NAT traversal, and Kademlia XOR-distance DHT routing.
3. **End-to-End Ephemeral Cryptography**: Securing direct device-to-device radio links with Curve25519/ECDH, HKDF salt extraction, AES-256-GCM chunk AEAD, and visual human-verifiable SAS words.
4. **Delay-Tolerant Networking (DTN)**: Treating network partitioning as the normal operating state rather than an error, persisting payloads in local SQLite storage before attempting multi-hop epidemic dissemination.
