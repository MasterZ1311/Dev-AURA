# Stage 2: Cryptographic Fortress & Zero-Trust Security

> Air-Gapped Architectures, Post-Quantum Readiness, and Sovereign Peer-to-Peer Zero-Metadata Communication.

---

## Overview

In the cloud era, security is often outsourced to third-party services: Auth0, AWS KMS, or proprietary OAuth providers. When those providers suffer breaches or downtime, user data is compromised.

Stage 2 teaches the principles of **Sovereign Applied Cryptography**:
1. How to derive mathematically fortified encryption keys from human passphrases using memory-hard Argon2id.
2. How to achieve absolute confidentiality with AES-256-GCM authenticated encryption and post-quantum lattice primitives.
3. Why eliminating network permissions at the operating system level (0 network permissions in Android manifests) creates mathematically verifiable air-gapped security (as built in *Kryptyx*).
4. How to engineer peer-to-peer ephemeral communication using WebRTC DataChannels and the Signal Protocol Double Ratchet, leaving zero metadata on signaling servers (as built in *Calypso*).

---

## Modules in This Stage

```text
02-cryptographic-fortress-and-zero-trust/
├── README.md                                         # Stage syllabus & roadmap
├── 01-symmetric-encryption-and-key-derivation.md     # Argon2id, AES-256-GCM, memory wiping
├── 02-air-gapped-mobile-security.md                 # 0-permission manifests & hardware Keystore
└── 03-p2p-webrtc-and-the-double-ratchet.md          # WebRTC channels, Signal ratchet & BIP-39
```

---

## Learning Objectives

- **Key Derivation Mastery**: Distinguish fast hashes (SHA-256) from memory-hard password derivation functions (Argon2id, PBKDF2).
- **Authenticated Encryption**: Implement AES-256-GCM with distinct Initialization Vectors (IV) to prevent replay and bit-flipping attacks.
- **Air-Gapped Systems**: Architect mobile and desktop vaults that physically cannot communicate with the internet.
- **Forward Secrecy**: Implement the Double Ratchet protocol to ensure that compromise of today's key cannot decrypt yesterday's or tomorrow's messages.
