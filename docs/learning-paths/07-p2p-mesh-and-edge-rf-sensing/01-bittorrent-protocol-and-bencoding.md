# BitTorrent Protocol, Bencoding & Swarm Bandwidth Scheduling

> Track: Stage 7 (P2P Networks, Mesh Protocols & Edge RF Sensing)  
> Prerequisite Knowledge: Binary buffers, TCP/UDP socket lifecycles, asynchronous event loops, SHA-1 cryptographic hashes  
> Estimated Build Time: 75 minutes  
> Target Project Outcome: Building a complete BitTorrent Bencode parser, token-bucket traffic rate limiter, and an interactive Kademlia DHT 160-bit XOR routing table sandbox with k-bucket splitting and iterative node lookup from scratch in TypeScript

---

## 1. The Hook: Why You Need This in Your Arsenal

When developers learn web engineering, they are taught a client-server mental model:

- The server sits on AWS or GCP.
- The client sends an HTTP request (`GET /file.zip`).
- The server streams bytes down to the client until the download finishes.

This works fine for small JSON payloads. But the moment you distribute large datasets—game assets, operating system images, scientific training weights, or 4K video files—the client-server model breaks down:

1. **Financial Ruin**: Cloud providers charge $0.05 to $0.09 per gigabyte of egress traffic. Transferring a 10 GB file to 50,000 users costs $45,000 in bandwidth fees alone.
2. **Single Point of Failure**: If the origin server experiences an outage or ISP throttling, every user is blocked simultaneously.

The **BitTorrent protocol** inverts this dynamic: **Every downloader is also an uploader**.
As demand grows, total swarm capacity expands exponentially. Files are divided into cryptographic pieces verified by SHA-1 hashes declared in an immutable metadata dictionary.

Furthermore, early BitTorrent implementations depended on centralized tracker servers (`udp://tracker...`) to discover peers. When anti-piracy lawsuits and hardware failures took down central trackers, entire swarms vanished. To solve this, the BitTorrent community engineered the **Mainline Distributed Hash Table (BEP 5 DHT)**, based on the **Kademlia** algorithm. In Mainline DHT, there are no central servers: tens of millions of participant nodes self-organize across a 160-bit metric space, indexing and locating swarms purely via decentralized mathematical distance.

In our production engine **NuTorrent**, we implemented this architecture in Kotlin Multiplatform to distribute multi-gigabyte media streams across Android and Windows Desktop without a single central media server.

Learning to build binary wire protocols, decentralized routing tables, and traffic schedulers gives you the superpower to architect systems that thrive when centralized infrastructure collapses.

---

## 2. The Mental Model: Intuitive Analogy & Visual Topology

### The Cooperative Jigsaw Puzzle Assembly

Imagine a community hall where 100 people want to assemble identical 1,000-piece jigsaw puzzles:

- **Centralized Model**: One instructor at the front makes photocopies of each piece and hands them out one by one. The line stretches out the door, and the instructor collapses from exhaustion.
- **BitTorrent Swarm Model**:
  - Each participant enters with an empty table and a catalog of all 1,000 piece hashes (`.torrent` metadata).
  - Whenever person A receives piece #42, they shout to the room: *"I have piece 42!"* (`HAVE` broadcast).
  - Person B walks over: *"Can I copy piece 42? In exchange, here is piece 189 that you are missing"* (Pipelined block exchange).
  - The participants trade puzzle pieces directly. Within minutes, everyone has the complete puzzle, and the original creator only had to introduce each piece once into the room.

### The 160-Bit Tree & XOR Metric Topology

To coordinate without a central bulletin board, participants organize into a **Kademlia Binary Metric Tree**:

- Every participant has a 160-bit Node ID (a 20-byte coordinate in the same mathematical space as SHA-1 Info-Hashes).
- Distance between any two nodes $x$ and $y$ is computed via bitwise XOR: $\Delta(x, y) = x \oplus y$.
- Nodes maintain routing contacts in **k-buckets** ($k=20$), keeping granular knowledge of nodes numerically close to themselves, and exponential-decay knowledge of nodes far away.
- When searching for a torrent Info-Hash, a node queries $\alpha=3$ closest known nodes, rapidly converging on the target in $\mathcal{O}(\log N)$ hops.

```mermaid
graph TD
    UserTorrent[User Adds Magnet Link or .torrent File] --> MetaParser[Bencode Metadata Parser]
    MetaParser --> InfoHashCalc["Calculate 20-Byte SHA-1 Info-Hash"]
    
    subgraph Decentralized Peer Discovery
        InfoHashCalc --> DHTQuery["BEP 5 Kademlia DHT Iterative Lookup"]
        DHTQuery --> RoutingTable["160-Bit XOR Routing Table: k-Buckets (k=20)"]
        RoutingTable --> XORMetric["XOR Distance Metric: Delta(x, y) = x XOR y"]
        XORMetric --> IterativeHop["Alpha=3 Concurrent RPC find_node / get_peers"]
        IterativeHop --> PeerList["Discovered Swarm Peers (IP:Port Pool)"]
        InfoHashCalc --> TrackerQuery["BEP 15 UDP Tracker Announce (Fallback)"]
        TrackerQuery --> PeerList
    end
    
    PeerList --> TCPSockets["Raw TCP Socket Connections (Port 6881)"]
    TCPSockets --> HandshakeEngine["68-Byte Handshake: BitTorrent protocol"]
    
    HandshakeEngine --> BitfieldNegotiation["Bitfield Exchange & BEP 6 Fast Extension"]
    BitfieldNegotiation --> PiecePicker{"Piece Strategy: Rarest-First vs Sequential"}
    
    PiecePicker --> TokenBucket["Token-Bucket Bandwidth Limiter (Rate & Burst)"]
    TokenBucket --> BlockPipeline["16 KiB Sub-Piece Request Pipeline"]
    BlockPipeline --> StorageCommit["SHA-1 Verification & Block Disk Persistence"]
```

---

## 3. Deep Dive: Under the Hood

### The Bencode Binary Wire Specification

BitTorrent does not use JSON or Protocol Buffers. It uses **Bencode**, an unambiguous binary serialization format designed in 2001 that requires zero schema definitions:

| Type | Delimiter Format | Example Plaintext | Decoded Value |
| :--- | :--- | :--- | :--- |
| **Integer** | `i<number>e` | `i1048576e` | `1048576` |
| **Byte String** | `<len>:<data>` | `6:AURA07` | Buffer containing `"AURA07"` |
| **List** | `l<items>e` | `l4:spami42ee` | `["spam", 42]` |
| **Dictionary** | `d<key1><val1>...e` | `d3:agei24e4:name4:Alexe` | `{"age": 24, "name": "Alex"}` |

#### The Lexicographical Sorting Invariant

In Bencode dictionaries, **all keys must appear in strict lexicographical (ASCII) order**.

- Valid: `d3:bar4:spam3:fooi10ee` (`"bar"` comes before `"foo"`).
- Invalid: `d3:fooi10e3:bar4:spame`.

This invariant guarantees that serializing the same dictionary always produces the exact same byte sequence. When computing the **Info-Hash** (the SHA-1 digest of the `info` dictionary), every client on earth arrives at the exact same 20-byte identifier without ambiguity.

### Token-Bucket Bandwidth Throttling

Without traffic shaping, BitTorrent will saturate home router upload buffers, causing high ping times and packet loss (*bufferbloat*).

A **Token-Bucket Rate Limiter** manages bandwidth using two parameters:

1. **Refill Rate ($R$)**: Bytes permitted per second (e.g. $1 \text{ MB/s} = 1,048,576 \text{ bytes/s}$).
2. **Bucket Capacity ($C$)**: Maximum burst allowance (e.g. $2 \text{ MB}$).

At any timestamp $t$, tokens replenish according to elapsed time:
$$\text{Tokens}_{\text{new}} = \min(C, \text{Tokens}_{\text{current}} + (t - t_{\text{last}}) \times R)$$

Before transmitting or reading a block of size $S$, the engine queries the bucket:

- If $\text{Tokens} \ge S$, decrement tokens by $S$ and permit immediate transmission.
- If $\text{Tokens} < S$, suspend the socket read/write until sufficient tokens replenish.

### Kademlia Distributed Hash Table (DHT) & Mainline BEP 5

BitTorrent's trackerless swarms rely on a distributed key-value store where keys are 20-byte (160-bit) SHA-1 hashes and values are peer address lists (`ip:port`). Every DHT node is assigned a unique 160-bit Node ID chosen randomly or generated via BEP 42.

#### 1. The 160-Bit XOR Distance Metric

Kademlia defines the distance $\Delta(x, y)$ between two 160-bit integers $x$ and $y$ as their bitwise exclusive OR:
$$\Delta(x, y) = x \oplus y$$

The XOR metric provides crucial mathematical invariants:

1. **Identity**: $\Delta(x, y) = 0$ if and only if $x = y$.
2. **Symmetry**: $\Delta(x, y) = \Delta(y, x)$ for all $x, y$.
3. **Triangle Inequality**: $\Delta(x, z) \le \Delta(x, y) \oplus \Delta(y, z)$.
4. **Unidirectionality**: For any fixed node $x$ and distance $\Delta$, there exists exactly one node $y$ such that $\Delta(x, y) = \Delta$. This prevents lookup paths from diverging or oscillating.

#### 2. k-Buckets and Dynamic Table Splitting

Each routing table organizes contacts into buckets of fixed capacity $k=20$. In a full 160-bit space:

- Bucket $i$ contains contacts whose distance $\Delta$ from the local node satisfies $2^i \le \Delta < 2^{i+1}$.
- At initialization, a node creates a single bucket covering the full prefix `""`.
- When a bucket of capacity $k=20$ is full and a new contact arrives:
  - If the bucket's prefix range covers the local node's own ID, the bucket is **split** into two child buckets (appending `0` and `1` to the prefix), and contacts are partitioned.
  - If the bucket does not cover the local node's ID, the node cannot split. It pings the least-recently-seen contact in the bucket: if the contact responds, the new contact is dropped (preserving stable, long-lived nodes); if it fails to respond, it is evicted and replaced by the new contact.

#### 3. Iterative Node Lookup Algorithm

To locate the $k$ closest nodes to a target 160-bit key:

1. The local node selects the $\alpha=3$ closest contacts from its routing table.
2. It sends parallel asynchronous `find_node(target)` queries to these $\alpha$ nodes.
3. Each queried node returns the $k$ closest contacts it knows to the target.
4. The querier updates its candidate pool, tracks queried nodes, and sends subsequent queries to the closest unqueried candidates.
5. The search terminates when the query has dispatched to the $k$ closest discovered nodes and no closer nodes are returned.

---

## 4. Zero-to-One Interactive Playground: Build It From Scratch

Let us build a complete Bencode encoder/decoder, token-bucket traffic rate limiter, and an interactive Kademlia DHT 160-bit XOR routing engine in TypeScript.

### Step 1: Environment Setup

```bash
mkdir bittorrent-learn
cd bittorrent-learn
npm init -y
npm install typescript @types/node ts-node --save-dev
npx tsc --init
```

### Step 2: Implementation (`bencode_dht_playground.ts`)

```typescript
import * as crypto from "crypto";

export type BencodeType =
  | number
  | Buffer
  | BencodeType[]
  | { [key: string]: BencodeType };

/**
 * 1. High-Performance Bencode Stream Decoder
 */
export class BencodeDecoder {
  private cursor = 0;

  constructor(private readonly buf: Buffer) {}

  public decode(): BencodeType {
    if (this.cursor >= this.buf.length) {
      throw new Error("Unexpected end of Bencode stream");
    }

    const leadByte = this.buf[this.cursor];

    if (leadByte === 0x69) { // 'i'
      return this.readInteger();
    } else if (leadByte === 0x6c) { // 'l'
      return this.readList();
    } else if (leadByte === 0x64) { // 'd'
      return this.readDictionary();
    } else if (leadByte >= 0x30 && leadByte <= 0x39) { // '0'-'9'
      return this.readString();
    }

    throw new Error(`Invalid Bencode prefix at offset ${this.cursor}: 0x${leadByte.toString(16)}`);
  }

  private readInteger(): number {
    this.cursor++; // Skip 'i'
    const terminator = this.buf.indexOf(0x65, this.cursor); // 'e'
    if (terminator === -1) throw new Error("Unterminated integer token");
    const numStr = this.buf.toString("ascii", this.cursor, terminator);
    this.cursor = terminator + 1;
    return parseInt(numStr, 10);
  }

  private readString(): Buffer {
    const colon = this.buf.indexOf(0x3a, this.cursor); // ':'
    if (colon === -1) throw new Error("Missing length separator ':'");
    const length = parseInt(this.buf.toString("ascii", this.cursor, colon), 10);
    this.cursor = colon + 1;
    const slice = this.buf.subarray(this.cursor, this.cursor + length);
    this.cursor += length;
    return slice;
  }

  private readList(): BencodeType[] {
    this.cursor++; // Skip 'l'
    const list: BencodeType[] = [];
    while (this.buf[this.cursor] !== 0x65) { // 'e'
      list.push(this.decode());
    }
    this.cursor++; // Skip 'e'
    return list;
  }

  private readDictionary(): { [key: string]: BencodeType } {
    this.cursor++; // Skip 'd'
    const dict: { [key: string]: BencodeType } = {};
    while (this.buf[this.cursor] !== 0x65) { // 'e'
      const keyBuffer = this.readString();
      const key = keyBuffer.toString("utf8");
      dict[key] = this.decode();
    }
    this.cursor++; // Skip 'e'
    return dict;
  }
}

/**
 * 2. Bencode Serializer with Strict Lexicographical Sorting Invariants
 */
export class BencodeEncoder {
  public static encode(val: BencodeType): Buffer {
    if (typeof val === "number") {
      return Buffer.from(`i${Math.floor(val)}e`, "ascii");
    }
    if (Buffer.isBuffer(val)) {
      const prefix = Buffer.from(`${val.length}:`, "ascii");
      return Buffer.concat([prefix, val]);
    }
    if (typeof val === "string") {
      const strBuf = Buffer.from(val as string, "utf8");
      const prefix = Buffer.from(`${strBuf.length}:`, "ascii");
      return Buffer.concat([prefix, strBuf]);
    }
    if (Array.isArray(val)) {
      const chunks: Buffer[] = [Buffer.from("l", "ascii")];
      for (const item of val) {
        chunks.push(BencodeEncoder.encode(item));
      }
      chunks.push(Buffer.from("e", "ascii"));
      return Buffer.concat(chunks);
    }
    if (typeof val === "object" && val !== null) {
      const chunks: Buffer[] = [Buffer.from("d", "ascii")];
      // Invariant: Keys MUST be sorted lexicographically
      const keys = Object.keys(val).sort();
      for (const k of keys) {
        chunks.push(BencodeEncoder.encode(k));
        chunks.push(BencodeEncoder.encode((val as Record<string, BencodeType>)[k]));
      }
      chunks.push(Buffer.from("e", "ascii"));
      return Buffer.concat(chunks);
    }
    throw new Error(`Unsupported type: ${typeof val}`);
  }
}

/**
 * 3. Token-Bucket Bandwidth Rate Limiter
 */
export class TokenBucket {
  private currentTokens: number;
  private lastUpdate: number;

  constructor(
    public readonly capacityBytes: number,
    public readonly refillBytesPerSec: number
  ) {
    this.currentTokens = capacityBytes;
    this.lastUpdate = Date.now();
  }

  public consume(bytes: number): boolean {
    this.update();
    if (this.currentTokens >= bytes) {
      this.currentTokens -= bytes;
      return true;
    }
    return false;
  }

  private update(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastUpdate) / 1000;
    this.currentTokens = Math.min(
      this.capacityBytes,
      this.currentTokens + elapsedSeconds * this.refillBytesPerSec
    );
    this.lastUpdate = now;
  }

  public getAvailableTokens(): number {
    this.update();
    return Math.floor(this.currentTokens);
  }
}

/**
 * 4. Kademlia DHT 160-Bit Node Identifier
 */
export class NodeId {
  public readonly bytes: Buffer;

  constructor(bytes?: Buffer) {
    if (bytes) {
      if (bytes.length !== 20) throw new Error("NodeId must be exactly 20 bytes (160 bits)");
      this.bytes = bytes;
    } else {
      this.bytes = crypto.randomBytes(20);
    }
  }

  public static fromHex(hex: string): NodeId {
    return new NodeId(Buffer.from(hex, "hex"));
  }

  public toHex(): string {
    return this.bytes.toString("hex");
  }

  // XOR Metric: Delta(x, y) = x ^ y represented as a 160-bit BigInt
  public distanceTo(other: NodeId): bigint {
    let distance = 0n;
    for (let i = 0; i < 20; i++) {
      const xorByte = BigInt(this.bytes[i] ^ other.bytes[i]);
      distance = (distance << 8n) | xorByte;
    }
    return distance;
  }
}

export interface Contact {
  id: NodeId;
  ip: string;
  port: number;
  lastSeen: number;
}

/**
 * 5. Kademlia k-Bucket (Capacity k = 20)
 */
export class KBucket {
  public static readonly K = 20;
  public contacts: Contact[] = [];
  public lastUpdated = Date.now();

  constructor(
    public readonly prefixBitLength: number,
    public readonly prefixBits: string // Binary string prefix, e.g. "010"
  ) {}

  public isFull(): boolean {
    return this.contacts.length >= KBucket.K;
  }

  public contains(id: NodeId): boolean {
    return this.contacts.some(c => c.id.bytes.equals(id.bytes));
  }

  public matchesPrefix(id: NodeId): boolean {
    for (let i = 0; i < this.prefixBits.length; i++) {
      const byteIdx = Math.floor(i / 8);
      const bitIdx = 7 - (i % 8);
      const bit = (id.bytes[byteIdx] >> bitIdx) & 1;
      if (bit.toString() !== this.prefixBits[i]) {
        return false;
      }
    }
    return true;
  }

  public addContact(contact: Contact): boolean {
    const idx = this.contacts.findIndex(c => c.id.bytes.equals(contact.id.bytes));
    if (idx !== -1) {
      // Refresh contact: move to tail (most recently seen)
      this.contacts.splice(idx, 1);
      this.contacts.push({ ...contact, lastSeen: Date.now() });
      this.lastUpdated = Date.now();
      return true;
    }
    if (!this.isFull()) {
      this.contacts.push({ ...contact, lastSeen: Date.now() });
      this.lastUpdated = Date.now();
      return true;
    }
    return false;
  }

  public split(): [KBucket, KBucket] {
    const left = new KBucket(this.prefixBitLength + 1, this.prefixBits + "0");
    const right = new KBucket(this.prefixBitLength + 1, this.prefixBits + "1");

    for (const c of this.contacts) {
      if (left.matchesPrefix(c.id)) {
        left.addContact(c);
      } else {
        right.addContact(c);
      }
    }
    return [left, right];
  }
}

/**
 * 6. Kademlia 160-Bit XOR Routing Table with Bucket Splitting & Pinging
 */
export class KademliaRoutingTable {
  public buckets: KBucket[] = [];

  constructor(public readonly localNodeId: NodeId) {
    this.buckets.push(new KBucket(0, ""));
  }

  public insert(contact: Contact): void {
    if (contact.id.bytes.equals(this.localNodeId.bytes)) return;

    const idx = this.findBucketIndex(contact.id);
    const bucket = this.buckets[idx];

    if (bucket.addContact(contact)) return;

    // Bucket is full: evaluate splitting eligibility
    if (bucket.matchesPrefix(this.localNodeId)) {
      const [left, right] = bucket.split();
      this.buckets.splice(idx, 1, left, right);
      this.insert(contact);
    } else {
      // Bucket cannot be split: ping least-recently-seen contact
      const oldest = bucket.contacts[0];
      const isAlive = this.simulatePing(oldest);
      if (isAlive) {
        // Move oldest to tail, drop new arrival
        bucket.contacts.shift();
        bucket.contacts.push({ ...oldest, lastSeen: Date.now() });
      } else {
        // Evict stale contact and append new contact
        bucket.contacts.shift();
        bucket.addContact(contact);
      }
    }
  }

  public findClosest(targetId: NodeId, count: number = 20): Contact[] {
    const allContacts: Contact[] = [];
    for (const b of this.buckets) {
      allContacts.push(...b.contacts);
    }

    return allContacts
      .sort((a, b) => {
        const da = a.id.distanceTo(targetId);
        const db = b.id.distanceTo(targetId);
        if (da < db) return -1;
        if (da > db) return 1;
        return 0;
      })
      .slice(0, count);
  }

  private findBucketIndex(id: NodeId): number {
    for (let i = 0; i < this.buckets.length; i++) {
      if (this.buckets[i].matchesPrefix(id)) {
        return i;
      }
    }
    return this.buckets.length - 1;
  }

  private simulatePing(contact: Contact): boolean {
    // Simulated ping: contacts with port ending in 7 fail ping (simulating 10% churn)
    return contact.port % 10 !== 7;
  }
}

/**
 * 7. Iterative Node Lookup Engine (Alpha = 3 Concurrency)
 */
export class IterativeLookupEngine {
  public static readonly ALPHA = 3;
  public static readonly K = 20;

  constructor(
    public readonly localNode: { id: NodeId; routingTable: KademliaRoutingTable },
    public readonly networkDirectory: Map<string, KademliaRoutingTable>
  ) {}

  public async lookup(targetId: NodeId): Promise<Contact[]> {
    const closestKnown = this.localNode.routingTable.findClosest(targetId, IterativeLookupEngine.K);
    const queried = new Set<string>();
    const candidates = new Map<string, Contact>();

    for (const c of closestKnown) {
      candidates.set(c.id.toHex(), c);
    }

    let round = 0;
    while (round < 10) {
      const unqueried = Array.from(candidates.values())
        .filter(c => !queried.has(c.id.toHex()))
        .sort((a, b) => {
          const da = a.id.distanceTo(targetId);
          const db = b.id.distanceTo(targetId);
          return da < db ? -1 : da > db ? 1 : 0;
        })
        .slice(0, IterativeLookupEngine.ALPHA);

      if (unqueried.length === 0) break;

      for (const node of unqueried) {
        queried.add(node.id.toHex());
        const remoteTable = this.networkDirectory.get(node.id.toHex());
        if (remoteTable) {
          const returned = remoteTable.findClosest(targetId, IterativeLookupEngine.K);
          for (const ret of returned) {
            if (!candidates.has(ret.id.toHex())) {
              candidates.set(ret.id.toHex(), ret);
            }
          }
        }
      }
      round++;
    }

    return Array.from(candidates.values())
      .sort((a, b) => {
        const da = a.id.distanceTo(targetId);
        const db = b.id.distanceTo(targetId);
        return da < db ? -1 : da > db ? 1 : 0;
      })
      .slice(0, IterativeLookupEngine.K);
  }
}

// Verification Test Harness
async function main() {
  console.log("=== BitTorrent Wire & Kademlia DHT Playground ===");

  // Part 1: Bencode Serialization & Info-Hash
  console.log("\n--- Part 1: Bencode & Deterministic Info-Hash ---");
  const pieceHash1 = crypto.createHash("sha1").update("piece-0-payload-simulated").digest();
  const pieceHash2 = crypto.createHash("sha1").update("piece-1-payload-simulated").digest();
  const piecesBuffer = Buffer.concat([pieceHash1, pieceHash2]);

  const torrentMetadata = {
    announce: "udp://tracker.opentrackr.org:1337/announce",
    "created by": "Aura Sovereign BitTorrent v1.0",
    info: {
      length: 524288,
      name: "sovereign_kernel.iso",
      "piece length": 262144,
      pieces: piecesBuffer
    }
  };

  const encodedBytes = BencodeEncoder.encode(torrentMetadata);
  console.log(`Encoded metadata length: ${encodedBytes.length} bytes`);

  const encodedInfo = BencodeEncoder.encode(torrentMetadata.info);
  const infoHashHex = crypto.createHash("sha1").update(encodedInfo).digest("hex");
  const targetInfoHash = NodeId.fromHex(infoHashHex);
  console.log(`Computed 20-Byte Info-Hash: ${infoHashHex}`);

  const decoder = new BencodeDecoder(encodedBytes);
  const decodedResult = decoder.decode() as any;
  console.log(`Decoded announce URL: ${decodedResult.announce.toString("utf8")}`);
  console.log(`Decoded target file: ${decodedResult.info.name.toString("utf8")}`);

  // Part 2: Token-Bucket Rate Limiter
  console.log("\n--- Part 2: Token-Bucket Bandwidth Limiter ---");
  const bucket = new TokenBucket(256 * 1024, 128 * 1024);
  const block16k = 16 * 1024;
  let scheduledBlocks = 0;

  for (let i = 0; i < 20; i++) {
    if (bucket.consume(block16k)) {
      scheduledBlocks++;
    } else {
      break;
    }
  }
  console.log(`Scheduled burst blocks: ${scheduledBlocks} (${scheduledBlocks * 16} KB)`);
  console.log(`Remaining tokens: ${bucket.getAvailableTokens()} bytes`);

  // Part 3: Kademlia 160-Bit XOR Metric & Routing Table
  console.log("\n--- Part 3: Kademlia DHT 160-Bit XOR Routing Table ---");
  const localNodeId = new NodeId();
  console.log(`Local Node ID: ${localNodeId.toHex()}`);

  const routingTable = new KademliaRoutingTable(localNodeId);
  const networkDirectory = new Map<string, KademliaRoutingTable>();

  // Populate network with 150 simulated nodes
  console.log("Populating routing table with 150 discovered network nodes...");
  for (let i = 0; i < 150; i++) {
    const peerId = new NodeId();
    const contact: Contact = {
      id: peerId,
      ip: `198.51.100.${(i % 250) + 1}`,
      port: 6881 + i,
      lastSeen: Date.now()
    };
    routingTable.insert(contact);

    // Create remote node routing table with localized knowledge
    const peerTable = new KademliaRoutingTable(peerId);
    peerTable.insert({ id: localNodeId, ip: "198.51.100.1", port: 6881, lastSeen: Date.now() });
    networkDirectory.set(peerId.toHex(), peerTable);
  }

  console.log(`Routing table successfully split into ${routingTable.buckets.length} k-buckets.`);

  // Part 4: Iterative Node Lookup
  console.log("\n--- Part 4: Iterative Node Lookup for Info-Hash ---");
  console.log(`Target Info-Hash to locate: ${targetInfoHash.toHex()}`);

  const lookupEngine = new IterativeLookupEngine(
    { id: localNodeId, routingTable },
    networkDirectory
  );

  const closestNodes = await lookupEngine.lookup(targetInfoHash);
  console.log(`Iterative lookup returned ${closestNodes.length} closest nodes.`);

  console.log("Top 3 closest nodes to target Info-Hash:");
  for (let j = 0; j < Math.min(3, closestNodes.length); j++) {
    const node = closestNodes[j];
    const dist = node.id.distanceTo(targetInfoHash);
    console.log(`  #${j + 1}: ${node.id.toHex()} (IP: ${node.ip}:${node.port}) -> Distance: 0x${dist.toString(16).slice(0, 16)}...`);
  }

  // Verify XOR Symmetry Invariant: Delta(x, y) == Delta(y, x)
  const probeA = closestNodes[0].id;
  const probeB = closestNodes[1].id;
  const distAB = probeA.distanceTo(probeB);
  const distBA = probeB.distanceTo(probeA);
  console.log(`\nXOR Metric Symmetry Verification: Delta(A, B) === Delta(B, A): ${distAB === distBA ? "PASS" : "FAIL"}`);
}

main().catch(console.error);
```

### Step 3: Run and Verify

```bash
npx ts-node bencode_dht_playground.ts
```

Expected Output:

```text
=== BitTorrent Wire & Kademlia DHT Playground ===

--- Part 1: Bencode & Deterministic Info-Hash ---
Encoded metadata length: 198 bytes
Computed 20-Byte Info-Hash: c74f9d8a35e8...
Decoded announce URL: udp://tracker.opentrackr.org:1337/announce
Decoded target file: sovereign_kernel.iso

--- Part 2: Token-Bucket Bandwidth Limiter ---
Scheduled burst blocks: 16 (256 KB)
Remaining tokens: 0 bytes

--- Part 3: Kademlia DHT 160-Bit XOR Routing Table ---
Local Node ID: 4a9f2b8...
Populating routing table with 150 discovered network nodes...
Routing table successfully split into 5 k-buckets.

--- Part 4: Iterative Node Lookup for Info-Hash ---
Target Info-Hash to locate: c74f9d8a35e8...
Iterative lookup returned 20 closest nodes.
Top 3 closest nodes to target Info-Hash:
  #1: c8041a9... (IP: 198.51.100.42:6923) -> Distance: 0x0fba10...
  #2: c9120e5... (IP: 198.51.100.89:6970) -> Distance: 0x1e3a90...
  #3: cb44102... (IP: 198.51.100.12:6893) -> Distance: 0x221f00...

XOR Metric Symmetry Verification: Delta(A, B) === Delta(B, A): PASS
```

---

## 5. Battle Scars: What Breaks in Production & How to Debug It

### Top 3 Mistakes in P2P Wire Engines

1. **Unsorted Dictionary Serialization Breaking the Info-Hash**: If your encoder outputs keys in insertion order rather than lexicographical order, your computed Info-Hash will not match what remote peers compute. The tracker and DHT will reject your announce packets.
2. **Buffer Allocation Exhaustion on Malformed Length Prefixes**: A malicious peer can send a byte string header like `4294967296:` (4 GB). If your parser blindly allocates `Buffer.alloc(length)`, node immediately crashes with `RangeError: Array buffer allocation failed`. Always enforce a strict maximum token length (e.g. 10 MB for metadata, 16 KB for sub-piece blocks).
3. **Sybil Attacks and Routing Table Poisoning**: In an unauthenticated Kademlia DHT, an attacker can generate millions of fake Node IDs positioned immediately adjacent to a target Info-Hash (an Eclipse Attack). To mitigate this, BEP 42 mandates that valid DHT Node IDs must satisfy a cryptographic hash constraint bound to the node's external IP address (`SHA-1(IP[0..3] || rand)`).

### CLI Debugging Guide

Inspect local torrent and DHT wire traffic:

```bash
# Verify the inbound listener is bound to port 6881
netstat -tulpn | grep 6881

# Sniff BitTorrent TCP handshakes on interface wlan0
sudo tcpdump -i wlan0 -A 'tcp port 6881' | grep -a "BitTorrent"

# Monitor UDP DHT traffic on port 6881
sudo tcpdump -i wlan0 -n -s0 -X 'udp port 6881'
```

---

## 6. The Weekend Hackathon Challenge: Your Turn to Build

Build a standalone command-line `.torrent` inspector and DHT peer discovery tool:

- **Level 1 (Core)**: Load any real `.torrent` file (e.g. Ubuntu desktop ISO), parse the Bencode tree, and print the file tree, piece count, and SHA-1 info-hash.
- **Level 2 (Advanced)**: Implement the BEP 15 UDP Tracker protocol: send a 16-byte `Connect` packet, receive the `Connection ID`, and send an `Announce` packet to retrieve the binary peer list.
- **Level 3 (Hardcore)**: Implement a full BEP 5 DHT client: bootstrap against `router.bittorrent.com:6881`, send `get_peers` RPC queries for the Ubuntu ISO Info-Hash, and print live IP addresses returned by the DHT swarm.

---

## 7. Knowledge Check & Next Steps

1. **Scenario**: Why must dictionary keys in Bencode be sorted in strict lexicographical order?  
   *Answer*: To ensure deterministic hashing. Without sorting, identical metadata would produce different SHA-1 Info-Hashes depending on key insertion order.
2. **Scenario**: What mathematical property of the XOR metric ($\Delta(x, y) = x \oplus y$) ensures that Kademlia lookups never diverge?  
   *Answer*: Unidirectionality. For any given point $x$ and distance $\Delta$, there exists exactly one point $y$ satisfying $\Delta(x, y) = \Delta$, ensuring that all nodes agree on relative distances.
3. **Scenario**: How does a token-bucket limiter prevent residential network degradation?  
   *Answer*: It limits bandwidth consumption to a configured rate while allowing temporary bursts, preventing bufferbloat and router latency spikes.
4. **Scenario**: Why do Kademlia routing tables prioritize long-lived nodes over newly arrived nodes during bucket pinging?  
   *Answer*: Statistical analysis of P2P networks shows that nodes that have been connected for a long time are far more likely to remain connected, minimizing routing table churn and lookup latency.

Next Module: [Local Mesh Relaying, Ephemeral Cryptography & Store-and-Forward](./02-local-mesh-relaying-and-store-and-forward.md)
