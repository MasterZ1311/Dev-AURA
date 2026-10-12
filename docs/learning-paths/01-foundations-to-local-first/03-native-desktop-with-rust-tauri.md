# Native Desktop with Rust & Tauri

> Track: Stage 1 (Foundations to Local-First Systems)  
> Prerequisite Knowledge: Basic Rust and TypeScript concepts, understanding of webviews and IPC  
> Estimated Build Time: 60 minutes  
> Target Project Outcome: Building a lightweight native desktop bridge connecting a TypeScript frontend to a privileged Rust backend via Tauri 2.0 IPC commands

---

## 1. The Hook: Why You Need This in Your Arsenal

For the past decade, building cross-platform desktop applications meant one thing: **Electron**.
Electron bundles an entire Chromium browser and an entire Node.js runtime into every single application.

The consequences are painful:
- An idle "Hello World" Electron app consumes **350MB to 600MB of RAM**.
- The binary installer exceeds **150MB**.
- If a developer has three Electron apps open (e.g., Slack, VS Code, Discord), 2GB to 4GB of RAM is devoured by duplicate Chromium instances before a single line of work is done.

When building **CodexOS** (our desktop developer workstation combining an editor, PTY terminal emulator, and hardware telemetry), Electron was unacceptable.

The modern alternative is **Tauri 2.0**:
- Instead of bundling Chromium, Tauri leverages the operating system's native Webview (WebKit on macOS, WebView2 on Windows, WebKitGTK on Linux).
- The backend is written in **Rust**, providing memory safety, zero-cost abstractions, and direct POSIX/Win32 systems access.
- An idle Tauri application consumes **under 45MB of RAM**, with binary sizes under **15MB**.

---

## 2. The Mental Model: Intuitive Analogy & Visual Topology

### The Private Jet vs. The Commercial Airline Seat
- **Electron**: Buying an entire commercial Boeing 777 (Chromium + Node.js) just to transport one passenger to another city. It is slow to start, burns gallons of fuel (RAM), and takes up massive runway space.
- **Tauri 2.0**: Taking a high-speed personal sports car (Rust) and using existing municipal roads (the OS native webview). It starts instantly, uses minimal fuel, and has full access to local roads.

```mermaid
graph TD
    subgraph Frontend Webview: Sandboxed UI
        React[React / TypeScript Interface] --> Invoke[tauri.invoke: Command Bridge]
    end
    
    Invoke -->|Asynchronous IPC JSON Message| FFI[Tauri Inter-Process Communication]
    
    subgraph Native Backend: Unsandboxed Rust
        FFI --> CommandHandler[Rust Command Router: #[tauri::command]]
        CommandHandler --> OSBridge[Native OS API / Sysinfo / PTY Spawner]
        OSBridge --> Hardware[(Host CPU / RAM / Disks / Terminal Processes)]
    end
```

The frontend runs in a sandboxed webview for UI rendering, while privileged system tasks (reading memory stats, spawning terminal PTYs, killing processes) are handled safely in Rust.

---

## 3. Deep Dive: Under the Hood

### The Tauri 2.0 IPC Protocol
How does a webview communicate with Rust?
1. In the frontend, `invoke('get_system_metrics', { refresh: true })` serializes JavaScript arguments into a JSON payload.
2. The webview's internal bridge passes the payload across the boundary via OS-level webview IPC:
   - On Windows: `window.chrome.webview.postMessage`
   - On macOS: `window.webkit.messageHandlers`
3. The Tauri runtime deserializes the JSON using Rust's `serde_json` and executes the corresponding `#[tauri::command]` function on a background thread pool.
4. The Rust function returns a result, which is serialized and resolved as a native JavaScript `Promise`.

### Trade-Off Matrix: Desktop Frameworks

| Metric | Electron | Tauri 2.0 | Flutter Desktop | Native (Swift / WinUI) |
| :--- | :--- | :--- | :--- | :--- |
| **Idle Memory Usage** | 350MB - 800MB | 30MB - 60MB | 80MB - 150MB | 15MB - 35MB |
| **Installer Size** | 80MB - 150MB | 8MB - 20MB | 30MB - 60MB | < 10MB |
| **Frontend Flexibility** | 100% (Standard Web) | 100% (Standard Web) | Custom Widget Canvas | Platform-specific UI |
| **Systems Language** | Node.js (C++ Addons) | Rust (Zero-cost FFI) | Dart | C++ / Swift / C# |

---

## 4. Zero-to-One Interactive Playground: Build It From Scratch

Let us write a simulation of a Tauri 2.0 IPC command dispatcher in TypeScript. This playground demonstrates how the frontend calls type-safe native commands, how the backend validates arguments, and how hardware telemetry is gathered.

### Step 1: Environment Setup
Create a playground directory:

```bash
mkdir -p ~/aura-sandbox/tauri-bridge
cd ~/aura-sandbox/tauri-bridge
npm init -y
npm install typescript @types/node tsx
```

### Step 2: Implementation (`tauri-ipc-simulator.ts`)
Create `tauri-ipc-simulator.ts`:

```typescript
import * as os from 'os';

// Type definitions matching Rust data structs
export interface SystemMetrics {
  hostname: string;
  platform: string;
  architecture: string;
  totalMemoryBytes: number;
  freeMemoryBytes: number;
  memoryUsagePercent: number;
  cpuCores: number;
  loadAverage: number[];
  uptimeSeconds: number;
}

export interface PtyProcessSpawnResult {
  pid: number;
  shell: string;
  status: 'SPAWNED' | 'FAILED';
}

/**
 * Simulates the Rust Tauri Backend Command Registry
 */
export class RustBackendSimulator {
  /**
   * Equivalent to:
   * #[tauri::command]
   * fn get_system_metrics() -> Result<SystemMetrics, String>
   */
  public static getSystemMetrics(): SystemMetrics {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usagePercent = Number((((totalMem - freeMem) / totalMem) * 100).toFixed(2));

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      totalMemoryBytes: totalMem,
      freeMemoryBytes: freeMem,
      memoryUsagePercent: usagePercent,
      cpuCores: os.cpus().length,
      loadAverage: os.loadavg(),
      uptimeSeconds: Math.floor(os.uptime()),
    };
  }

  /**
   * Equivalent to:
   * #[tauri::command]
   * fn spawn_terminal_pty(shell: String) -> Result<PtyProcessSpawnResult, String>
   */
  public static spawnTerminalPty(shellPath: string): PtyProcessSpawnResult {
    if (!shellPath || shellPath.includes('..')) {
      throw new Error('Security Error: Invalid or forbidden shell path');
    }

    // In actual Tauri / CodexOS, this invokes portable-pty or openpty in Rust
    const mockPid = Math.floor(1000 + Math.random() * 9000);
    return {
      pid: mockPid,
      shell: shellPath,
      status: 'SPAWNED',
    };
  }
}

/**
 * Simulates the Frontend Tauri IPC Bridge (@tauri-apps/api/core)
 */
export class TauriFrontendBridge {
  public static async invoke<T>(command: string, args: Record<string, any> = {}): Promise<T> {
    console.log(`[IPC Request] Invoking native Rust command: '${command}'`, args);

    // Simulate asynchronous IPC boundary hop
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (command === 'get_system_metrics') {
            resolve(RustBackendSimulator.getSystemMetrics() as unknown as T);
          } else if (command === 'spawn_terminal_pty') {
            resolve(RustBackendSimulator.spawnTerminalPty(args.shellPath) as unknown as T);
          } else {
            reject(new Error(`Tauri Command Not Found: ${command}`));
          }
        } catch (err: any) {
          reject(err);
        }
      }, 10);
    });
  }
}

// ---------------------------------------------------------------------------
// Verification Simulation: Frontend calling privileged native commands
// ---------------------------------------------------------------------------
async function runClientWorkflow() {
  console.log('--- Step 1: Frontend requesting host telemetry ---');
  const metrics = await TauriFrontendBridge.invoke<SystemMetrics>('get_system_metrics');
  
  console.log('\n[Frontend Received Telemetry]');
  console.log(`Host:        ${metrics.hostname} (${metrics.platform}/${metrics.architecture})`);
  console.log(`CPU Cores:   ${metrics.cpuCores}`);
  console.log(`Memory Used: ${metrics.memoryUsagePercent}% (${(metrics.freeMemoryBytes / 1024 / 1024 / 1024).toFixed(2)} GB free)`);
  console.log(`Uptime:      ${metrics.uptimeSeconds} seconds`);

  console.log('\n--- Step 2: Frontend requesting native PTY shell spawn ---');
  const pty = await TauriFrontendBridge.invoke<PtyProcessSpawnResult>('spawn_terminal_pty', {
    shellPath: '/bin/zsh',
  });
  console.log('\n[Frontend Received PTY Session]');
  console.log(`Spawned PID: ${pty.pid} using shell ${pty.shell} (Status: ${pty.status})`);
}

runClientWorkflow();
```

### Step 3: Run and Test Instructions
Execute the script using `tsx`:

```bash
npx tsx tauri-ipc-simulator.ts
```

Expected terminal output:
```text
--- Step 1: Frontend requesting host telemetry ---
[IPC Request] Invoking native Rust command: 'get_system_metrics' {}

[Frontend Received Telemetry]
Host:        developer-workstation (linux/x64)
CPU Cores:   16
Memory Used: 43.12% (18.25 GB free)
Uptime:      184200 seconds

--- Step 2: Frontend requesting native PTY shell spawn ---
[IPC Request] Invoking native Rust command: 'spawn_terminal_pty' { shellPath: '/bin/zsh' }

[Frontend Received PTY Session]
Spawned PID: 4821 using shell /bin/zsh (Status: SPAWNED)
```

---

## 5. Battle Scars: What Breaks in Production & How to Debug It

### Top 3 Mistakes Beginners Make
1. **Blocking the Tauri Main Thread in Rust**: Executing a long-running computation or file hash inside a `#[tauri::command]` without `async` or thread spawning. This blocks the main window event loop and freezes the entire desktop GUI.  
   **Remediation**: Use `async fn` or `tokio::spawn` in Rust commands to keep the UI responsive.
2. **Transferring Giant Payloads over IPC as JSON**: Passing a 200MB file from Rust to the frontend as a serialized JSON array of numbers. JSON serialization adds massive CPU overhead.  
   **Remediation**: Use binary channels (`tauri::ipc::Response`) or byte buffers instead of JSON for media and large datasets.
3. **Missing CSP (Content Security Policy) Headers**: Disabling CSP in `tauri.conf.json` during development and forgetting to re-enable it. If the frontend renders unescaped user HTML, attackers can achieve remote code execution on the user's host machine.  
   **Remediation**: Enforce strict CSP rules disallowing external script tags.

---

## 6. The Weekend Hackathon Challenge: Your Turn to Build

### Challenge: The Native System Monitor
Build a personal desktop system monitor using Tauri 2.0.

- **Level 1 (Core)**: Create a Tauri app with a React or Svelte frontend that displays live CPU and RAM usage refreshed every second from a Rust command.
- **Level 2 (Advanced)**: Add a Process List view that lists top running processes sorted by RAM consumption with a "Kill Process" button connected to `std::process::Command` in Rust.
- **Level 3 (Hardcore)**: Integrate an embedded terminal using `xterm.js` in the frontend and `portable-pty` in Rust, allowing full interactive terminal sessions inside your desktop app.

---

## 7. Knowledge Check & Next Steps

1. **Scenario**: Why does Tauri consume 90% less memory than Electron?  
   *Answer*: Tauri uses the operating system's pre-installed native webview rather than bundling a dedicated Chromium engine, and uses Rust rather than Node.js for backend logic.
2. **Scenario**: What happens if a Rust Tauri command executes a synchronous infinite loop?  
   *Answer*: It blocks the thread handling the command; if executed on the main UI thread, the entire desktop application freezes and stops responding to window events.
3. **Scenario**: Why is IPC serialization overhead an important architectural consideration?  
   *Answer*: Large binary data converted to JSON strings incurs CPU and memory penalties. High-throughput desktop apps must use binary IPC channels for heavy payloads.

Next Lesson: [Virtualized UI Rendering at 60 FPS](./04-virtualized-ui-rendering.md)
