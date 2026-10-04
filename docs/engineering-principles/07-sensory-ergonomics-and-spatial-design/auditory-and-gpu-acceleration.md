# Auditory Feedback & GPU-Accelerated Web Engineering

---

## 1. Web Audio Integration with Tone.js

Synthesizing tones directly on the client provides zero-latency audio cues without loading bulky audio files.

```typescript
import * as Tone from 'tone';

let synth: Tone.Synth | null = null;

export async function playFocusTransitionCue() {
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }
  
  if (!synth) {
    synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 },
    }).toDestination();
  }

  // Play a gentle chord transition (e.g. C4 to G4)
  synth.triggerAttackRelease('C4', '8n');
}
```

---

## 2. 60 FPS Three.js Performance Rules

1. **Pause Animation Loops Off-Screen**: Use `IntersectionObserver` to halt WebGL render loops when the canvas is scrolled out of view.
2. **Dispose of Meshes and Geometries**: Explicitly call `.dispose()` on geometries, materials, and textures when unmounting scenes to avoid GPU memory leaks.
3. **Minimize Draw Calls**: Group static geometries into single merged meshes to reduce CPU-to-GPU overhead.
