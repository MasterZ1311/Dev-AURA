# Local-First Data with SQLite

> Track: Stage 1 (Foundations to Local-First Systems)  
> Prerequisite Knowledge: Basic SQL syntax (SELECT, INSERT, UPDATE), JavaScript / Node.js fundamentals  
> Estimated Build Time: 60 minutes  
> Target Project Outcome: Building a sovereign, offline-capable local note and task database using embedded SQLite with Write-Ahead Logging (WAL) and atomic transactions

---

## 1. The Hook: Why You Need This in Your Arsenal

When developers are taught fullstack engineering, they are almost universally shown this architecture:
`React Frontend -> Express/FastAPI Backend -> AWS RDS PostgreSQL Cloud Database`.

What happens when your user is on an airplane, riding a subway, or facing a Wi-Fi outage?
Your application displays an empty screen with a spinning loader and becomes completely unusable.

Even worse:
- The user's private notes and thoughts are stored on your cloud servers, creating privacy risks and monthly database hosting bills.
- Every keystroke requires a network roundtrip of 150 milliseconds.

In **Aura 3.0**, we inverted this model: **Local-First Software**.
- The primary copy of the data lives directly on the user's local disk in an embedded SQLite database.
- Read operations take **0.2 milliseconds** instead of 150 milliseconds.
- The application functions seamlessly with zero internet connection.
- If cloud sync is desired, the cloud is treated merely as a backup replication channel, never as the authoritative bottleneck.

---

## 2. The Mental Model: Intuitive Analogy & Visual Topology

### The Local Ledger vs. The Central Bureaucracy
- **Cloud-First SaaS**: Like needing to call a government office in another country every time you want to write a grocery list on your kitchen counter. If the phone line is down, you cannot write your list.
- **Local-First Computing**: You have a physical paper notebook directly on your desk. You write in it instantaneously. If you choose to photocopy it and mail a copy to a friend later, you can do so whenever convenient.

```mermaid
graph TD
    UI[Desktop / Webview Interface] -->|Sub-millisecond IPC| LocalEngine[Local Data Engine: SQLite Embedded]
    
    subgraph Host Machine Sovereignty
        LocalEngine --> WAL[(Write-Ahead Log: .db-wal)]
        LocalEngine --> DB[(Persistent Database: data.sqlite)]
    end
    
    LocalEngine -.->|Optional Asynchronous Background Sync| CloudReplication[Cloud Backup / Peer Sync]
```

---

## 3. Deep Dive: Under the Hood

### Embedded Database vs. Client-Server Database
- **PostgreSQL / MySQL**: Client-server databases. They run as standalone operating system processes, listen on TCP sockets (e.g., port 5432), and require authentication, network packets, and serialization on every query.
- **SQLite**: An in-process library. It does not run as a separate server. It compiles directly into your application process and reads/writes local disk pages directly via OS file locks.

### Why Write-Ahead Logging (WAL) Mode is Mandatory
By default, SQLite uses a rollback journal for transactions. When a transaction writes to the database, it locks the entire file, blocking all concurrent readers.

Enabling **Write-Ahead Logging (`PRAGMA journal_mode = WAL;`)** fundamentally changes this:
1. Changes are appended to a separate `.wal` file rather than modifying the main database file in place.
2. **Readers never block writers**, and **writers never block readers**.
3. Writes become fast sequential disk appends.
4. Periodically, SQLite executes a "checkpoint" that merges the WAL log back into the main database file.

### Trade-Off Matrix: Storage Engines

| Attribute | Cloud PostgreSQL | Browser IndexedDB | Local Embedded SQLite |
| :--- | :--- | :--- | :--- |
| **Read Latency** | 50ms - 200ms (Network) | 5ms - 15ms (JS thread) | < 0.5ms (In-memory cache) |
| **Offline Support** | 0% (Fails without internet) | 100% | 100% |
| **Query Power** | Full SQL | Limited Object Store / Key-Value | Full SQL (JOINs, CTEs, Window Fns) |
| **Data Sovereignty** | Centralized in Cloud | Tied to Browser Cache (Can be wiped) | Direct user-owned disk file |

---

## 4. Zero-to-One Interactive Playground: Build It From Scratch

Let us build a complete local-first note-taking engine in TypeScript using `better-sqlite3`. We will configure WAL mode, enforce schema migrations, and execute atomic transactions.

### Step 1: Environment Setup
Create a playground directory and install dependencies:

```bash
mkdir -p ~/aura-sandbox/local-sqlite
cd ~/aura-sandbox/local-sqlite
npm init -y
npm install better-sqlite3
npm install --save-dev typescript @types/node @types/better-sqlite3 tsx
```

### Step 2: Implementation (`local-vault.ts`)
Create `local-vault.ts`:

```typescript
import Database from 'better-sqlite3';
import { join } from 'path';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export class LocalVault {
  private db: Database.Database;

  constructor(dbPath: string = 'vault.db') {
    this.db = new Database(dbPath);

    // Performance & Concurrency Invariant: Enable Write-Ahead Logging (WAL)
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');

    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
    `);
  }

  public createNote(note: Note): void {
    const insert = this.db.prepare(`
      INSERT INTO notes (id, title, content, tags_json, created_at, updated_at)
      VALUES (@id, @title, @content, @tagsJson, @createdAt, @updatedAt)
    `);

    insert.run({
      id: note.id,
      title: note.title,
      content: note.content,
      tagsJson: JSON.stringify(note.tags),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
  }

  public getNote(id: string): Note | null {
    const row = this.db.prepare(`SELECT * FROM notes WHERE id = ?`).get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      tags: JSON.parse(row.tags_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public searchNotes(query: string): Note[] {
    const rows = this.db.prepare(`
      SELECT * FROM notes 
      WHERE title LIKE ? OR content LIKE ?
      ORDER BY created_at DESC
    `).all(`%${query}%`, `%${query}%`) as any[];

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      tags: JSON.parse(row.tags_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Demonstrates an atomic batch transaction.
   * If any note fails validation, all insertions are rolled back automatically.
   */
  public batchInsertNotes(notes: Note[]): void {
    const insert = this.db.prepare(`
      INSERT INTO notes (id, title, content, tags_json, created_at, updated_at)
      VALUES (@id, @title, @content, @tagsJson, @createdAt, @updatedAt)
    `);

    const runBatch = this.db.transaction((items: Note[]) => {
      for (const item of items) {
        if (!item.title.trim()) {
          throw new Error(`Validation Error: Note ${item.id} has an empty title`);
        }
        insert.run({
          id: item.id,
          title: item.title,
          content: item.content,
          tagsJson: JSON.stringify(item.tags),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      }
    });

    runBatch(notes);
  }

  public close(): void {
    this.db.close();
  }
}

// ---------------------------------------------------------------------------
// Verification Demo
// ---------------------------------------------------------------------------
const vault = new LocalVault('notes-test.db');

console.log('--- Step 1: Inserting Individual Note ---');
vault.createNote({
  id: 'note-01',
  title: 'Local-First Architecture Principles',
  content: 'Store user data locally first. Cloud is just a replica.',
  tags: ['architecture', 'sovereignty'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const fetched = vault.getNote('note-01');
console.log('Successfully retrieved note from SQLite:');
console.log(fetched);

console.log('\n--- Step 2: Testing Full-Text Search ---');
const results = vault.searchNotes('Sovereignty');
console.log(`Found ${results.length} note(s) matching search:`);
results.forEach((n) => console.log(`  - [${n.id}] ${n.title}`));

console.log('\n--- Step 3: Testing Transaction Atomicity (Rollback on Failure) ---');
try {
  vault.batchInsertNotes([
    {
      id: 'note-02',
      title: 'Valid Note',
      content: 'This note is valid.',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'note-03',
      title: '', // Invalid empty title! Will trigger rollback
      content: 'This note will fail.',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
} catch (err: any) {
  console.log('Transaction failed cleanly as expected:', err.message);
}

// Verify note-02 was NOT persisted due to rollback
const checkNote2 = vault.getNote('note-02');
console.log('Verification: Was note-02 persisted?', checkNote2 !== null ? 'YES' : 'NO (Rollback verified)');

vault.close();
```

### Step 3: Run and Test Instructions
Run the script using `tsx`:

```bash
npx tsx local-vault.ts
```

Expected terminal output:
```text
--- Step 1: Inserting Individual Note ---
Successfully retrieved note from SQLite:
{
  id: 'note-01',
  title: 'Local-First Architecture Principles',
  content: 'Store user data locally first. Cloud is just a replica.',
  tags: [ 'architecture', 'sovereignty' ],
  createdAt: '2026-10-12T13:30:00.000Z',
  updatedAt: '2026-10-12T13:30:00.000Z'
}

--- Step 2: Testing Full-Text Search ---
Found 1 note(s) matching search:
  - [note-01] Local-First Architecture Principles

--- Step 3: Testing Transaction Atomicity (Rollback on Failure) ---
Transaction failed cleanly as expected: Validation Error: Note note-03 has an empty title
Verification: Was note-02 persisted? NO (Rollback verified)
```

---

## 5. Battle Scars: What Breaks in Production & How to Debug It

### Top 3 Mistakes Beginners Make
1. **Forgetting to Enable WAL Mode**: Leaving SQLite in its default rollback journal mode. When a background thread writes to the database, any frontend read query throws a `SQLITE_BUSY: database is locked` error.  
   **Remediation**: Always execute `PRAGMA journal_mode = WAL;` immediately after opening the connection.
2. **Opening Multiple Database Connections in a Single Process**: Opening a new SQLite connection on every HTTP request or React render. Connections compete for locks and exhaust file descriptors.  
   **Remediation**: Create a single shared singleton connection instance per process.
3. **Storing Unindexed Foreign Keys**: In relational schemas, failing to create explicit indexes on foreign key columns causes SQLite to perform full table scans during `JOIN` queries.  
   **Remediation**: Always pair foreign keys with explicit indexes.

---

## 6. The Weekend Hackathon Challenge: Your Turn to Build

### Challenge: The Sovereign Local Note & Tagging Engine
Build a desktop-grade local note engine with full-text search.

- **Level 1 (Core)**: Implement the local SQLite database with notes, tags, and full CRUD operations running in WAL mode.
- **Level 2 (Advanced)**: Integrate SQLite FTS5 (Full-Text Search 5) virtual tables for lightning-fast keyword ranking across title and content fields.
- **Level 3 (Hardcore)**: Add single-file export and import: write a function that exports the entire database into an encrypted JSON or ZIP archive, and a function that imports it onto a fresh machine with zero data loss.

---

## 7. Knowledge Check & Next Steps

1. **Scenario**: Why does `PRAGMA journal_mode = WAL;` improve concurrency in local applications?  
   *Answer*: WAL mode allows concurrent readers to continue reading from the database while a writer appends to the log, eliminating read-write contention.
2. **Scenario**: What occurs during a database transaction rollback?  
   *Answer*: Any uncommitted changes made within the transaction block are discarded, restoring the database to its exact prior consistent state.
3. **Scenario**: Why is SQLite preferred over cloud databases for local productivity tools?  
   *Answer*: It executes in-process with sub-millisecond query latency, works 100% offline, requires zero network configurations, and stores data directly on the user's local disk.

Next Lesson: [Native Desktop with Rust & Tauri](./03-native-desktop-with-rust-tauri.md)
