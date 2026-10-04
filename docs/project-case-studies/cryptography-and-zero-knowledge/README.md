# Cryptography and Zero-Knowledge Architecture

> Mathematical security guarantees, post-quantum defenses, and zero-metadata communication.

---

## Systems in this Domain

- [**Kryptyx**](./kryptyx-password-fortress.md): 100% offline, post-quantum fortified Android password fortress with 0 network permissions.
- [**Ghost Messenger (Calypso)**](./calypso-ghost-messenger.md): Zero-metadata, peer-to-peer messaging over WebRTC DataChannels using the Signal Protocol (Double Ratchet).

---

## Domain Engineering Highlights

1. **Air-Gap Verification via OS Permissions**: Eliminating internet permissions at the OS manifest level delivers verifiable isolation against network attacks.
2. **Post-Quantum Cryptography (ML-KEM-768)**: Layering lattice-based key encapsulation with AES-256-GCM and Argon2id key derivation ensures security against quantum threats.
3. **Peer-to-Peer Zero-Metadata Communication**: WebRTC DataChannels ensure the signaling server never observes message volume, timing, or content.
