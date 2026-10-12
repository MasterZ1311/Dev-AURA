# Native Desktop and Systems Architecture

> Low-latency desktop applications, native OS control centers, and memory-conscious workstation software.

---

## Systems in this Domain

- [**CodexOS**](./codexos-developer-os.md): A native developer control center built with Tauri 2.0 and Rust, featuring GPU terminal emulation and on-device AI root-cause diagnostics.
- [**Aura 3.0**](./aura-3-mindful-productivity.md): An offline, privacy-first desktop task manager engineered to combat cognitive fragmentation via Tone.js audio soundscapes.

---

## Technical Architecture: Native Desktop Systems Model

```mermaid
graph TD
    UserApp[Native Desktop Application] --> WindowManager[Native Window & Webview Host]
    
    subgraph Rust Native Engine (Tauri 2.0 FFI)
        WindowManager <-->|Asynchronous IPC Bridge: Zero Webview Block| RustCore[Rust Native Core Engine]
        RustCore --> PTYProcess[Spawn PTY Child Processes: bash / zsh / pwsh]
        RustCore --> SysMetrics[Hardware Telemetry: CPU / RAM / Disk IO via sysinfo]
        RustCore --> LocalVault[(Local SQLite Storage: Fast WAL Mode)]
    end
    
    PTYProcess <-->|PTY Streams| XTerm[xterm.js GPU-Accelerated Terminal Emulator]
    LocalVault <-->|Offline State| FrontendUI[Virtualized 60 FPS React 19 Frontend]
```

---

## Domain Engineering Highlights

1. **Tauri vs. Electron Runtime Tradeoffs**: Choosing lightweight system webviews paired with Rust FFI over multi-gigabyte Electron runtimes drops idle RAM usage by 90%.
2. **Terminal Emulation with xterm.js**: Integrating PTY process spawning over cross-platform native channels while keeping rendering at 60 FPS.
3. **Local-First State Persistence**: Zero cloud sync and zero background telemetry ensure total data privacy.
