# Client-Side WebAssembly Compute Architecture

> In-browser heavy compute pipelines, client-side document processing, and zero-server infrastructure.

---

## Systems in this Domain

- [**ErgonPDF**](./ergonpdf-document-workspace.md): Complete client-side document workspace offering 20+ PDF utilities running entirely inside the browser using WebAssembly and Web Workers.

---

## Technical Architecture: In-Browser Heavy Compute Pipeline

```mermaid
graph TD
    ClientBrowser[Client Web Browser: Chrome / Firefox / Safari] --> MainUIThread[Main UI Thread: React Interface & Virtual Canvas]
    
    MainUIThread -->|Zero-Copy postMessage: Transferable ArrayBuffer| WorkerPool[Dedicated Web Worker Thread Pool]
    
    subgraph Client-Side WebAssembly Sandbox
        WorkerPool --> WASMLoader[pdf-lib / C++ WASM Binary Engine]
        WASMLoader --> InMemBuffer[In-Memory TypedArray Manipulation: Linear RAM]
        InMemBuffer --> Operations[Merge, Split, OCR, Compress, Watermark, Encrypt]
        Operations --> OutputBinary[Generate Target Document Binary Stream]
    end
    
    OutputBinary -->|Return Transferred ArrayBuffer| MainUIThread
    MainUIThread --> BlobManager[Blob URL Creation & Download Stream]
    BlobManager --> URLRevoke[Explicit URL.revokeObjectURL: Garbage Collect V8 Heap]
```

---

## Domain Engineering Highlights

1. **Client-Side Heavy Compute**: Moving binary processing directly into the browser runtime eliminates cloud server operating costs.
2. **Main Thread Isolation**: Web Workers handle document compression, merging, and page extraction while keeping the UI responsive.
3. **Memory Safety & Blob Disposal**: Proactive deallocation of binary buffers and revocation of object URLs prevents browser heap exhaustion.
