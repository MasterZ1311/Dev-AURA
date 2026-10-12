# Creative Engineering and 3D Web Architecture

> Hardware-accelerated 3D graphics, real-time shader pipelines, and visceral web micro-interactions.

---

## Systems in this Domain

- [**ZEUS & Zeus New Web**](./zeus-interactive-3d-shaders.md): High-performance interactive 3D web experiences utilizing React Three Fiber, custom WebGL shaders, and GSAP micro-animations.

---

## Technical Architecture: 60 FPS WebGL GPU Pipeline

```mermaid
graph TD
    ClientDevice[Client Hardware: Desktop GPU / Mobile SoC] --> CanvasHost[HTML5 WebGL Canvas Context]
    
    subgraph Three.js Scene & Render Lifecycle
        CanvasHost --> SceneGraph[Scene Graph: Perspective Camera, Lights, Geometries]
        SceneGraph --> CustomShader[Custom GLSL Vertex & Fragment Shaders]
        CustomShader --> DPRClamp[Device Pixel Ratio Clamped to 2.0: Prevent Thermal Throttling]
        DPRClamp --> RenderLoop[requestAnimationFrame 16.6ms Tick Loop]
    end
    
    subgraph Resource Memory Management
        RenderLoop --> VisibilityDetector{Document VisibilityState == 'hidden'?}
        VisibilityDetector -->|Yes| HaltRAF[Pause Render Loop: Preserve Battery]
        VisibilityDetector -->|No| DrawCall[Execute Draw Call to GPU VRAM]
        DrawCall --> PageUnmount[Page Unmount: geometry.dispose, texture.dispose]
    end
```

---

## Domain Engineering Highlights

1. **60 FPS GPU Rendering**: Throttling animation loops when off-screen and optimizing geometry draw calls to maintain smooth framerates on mobile devices.
2. **Hardware & Web Integration**: Connecting web interfaces with hardware and IoT resources (`Zeus-IOT-Resources`) to bridge physical hardware with digital experiences.
3. **Shader Resource Management**: Proactive disposal of WebGL geometries, textures, and materials to avoid browser memory leaks.
