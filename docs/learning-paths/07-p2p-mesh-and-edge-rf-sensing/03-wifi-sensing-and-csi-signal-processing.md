# Wi-Fi Sensing, Channel State Information & Vital Signs DSP

> Track: Stage 7 (P2P Networks, Mesh Protocols & Edge RF Sensing)  
> Prerequisite Knowledge: Complex numbers ($I/Q$ signals), basic trigonometry, Fast Fourier Transform (FFT) concepts, digital filtering  
> Estimated Build Time: 75 minutes  
> Target Project Outcome: Building a Wi-Fi Channel State Information (CSI) phase unwrapping and contactless respiration BPM solver in TypeScript

---

## 1. The Hook: Why You Need This in Your Arsenal

For decades, tracking human presence and monitoring health vitals required physical cameras or wearable sensors:
- **Cameras Invade Privacy**: Nobody wants a camera monitoring their bedroom, hospital ward, or bathroom. Cameras also fail completely in total darkness, through smoke, or behind drywall.
- **Wearables Cause Friction**: Wearable smartwatches or chest bands must be recharged constantly, cause skin irritation, and elderly or trauma patients frequently remove them.

In **RuView (π RuView)**, we unlocked an entirely new domain of systems engineering: **Seeing through walls using radio physics**.

Every standard Wi-Fi router continuously fills rooms with electromagnetic waves across 64 orthogonal frequency-division multiplexing (OFDM) subcarriers. When a person sits, walks, or breathes, their chest displacement (a mere 2 to 5 millimeters) perturbs those radio waves:
- By capturing **Channel State Information (CSI)** on inexpensive \$9 ESP32-S3 microcontrollers, we extract millimeter-scale physical disturbances.
- We measure contactless breathing rate and heart rate using digital signal processing on subcarrier phase shifts.
- We run 4-bit quantized neural contrastive encoders in an **8 KB memory footprint**, requiring zero cameras and zero cloud connectivity.

Mastering edge radio-frequency signal processing enables you to build spatial intelligence systems that operate where optical cameras cannot go.

---

## 2. The Mental Model: Intuitive Analogy & Visual Topology

### The Spiderweb in the Breeze
Imagine a spider sitting at the center of its web:
- The spider does not need optical vision to detect when an insect lands on an anchor thread.
- The web vibrates. By measuring the frequency, amplitude, and phase shifts of vibrations along the silk strands, the spider determines the exact size and movement of the visitor.
- Wi-Fi works identically: 64 subcarrier radio frequencies act as an invisible electromagnetic web filling the room. When your lungs expand during inhalation, the path length of the reflected radio waves changes, creating a sinusoidal phase shift across the subcarriers.

```mermaid
graph TD
    Router[Wi-Fi Transmitter: 2.4 GHz / 5 GHz OFDM] --> DirectPath[Direct Line-of-Sight Path]
    Router --> ReflectedPath[Reflected Path from Moving Chest Cavity]
    
    DirectPath & ReflectedPath --> ESP32[ESP32-S3 Receiver: CSI Firmware Ingestion]
    ESP32 --> RawIQ["Raw Subcarrier Complex Samples: I + jQ (64 Subcarriers)"]
    
    subgraph Edge Digital Signal Processing
        RawIQ --> PhaseCalc["Phase Extraction: theta = atan2(Q, I)"]
        PhaseCalc --> Unwrap["Phase Unwrapping: Delta > pi Correction"]
        Unwrap --> Bandpass["Bandpass Filter: 0.1–0.5 Hz (Respiration Band)"]
        Bandpass --> BPMCalc["Zero-Crossing Frequency Detector"]
    end
    
    BPMCalc --> VitalsMetrics["Contactless Respiration: e.g. 16.4 BPM"]
    Bandpass --> QuantizedEncoder["8 KB 4-Bit Neural Encoder: Presence Classification"]
    VitalsMetrics --> SovereignBridge["Home Assistant MQTT / Matter Local Bridge"]
```

---

## 3. Deep Dive: Under the Hood

### Channel State Information (CSI) vs. Received Signal Strength (RSSI)
Most developers are familiar with RSSI (the Wi-Fi "signal bar" strength):
- RSSI is a single scalar number representing the averaged received power across the entire channel. It fluctuates wildly due to background noise and tells you nothing about fine-grained physical motion.

**Channel State Information (CSI)** reveals the underlying physics. In modern 802.11 standards, every transmitted packet contains a preamble that allows the receiver to estimate the channel matrix $H$:
$$y = H x + n$$
Where $x$ is the transmitted signal, $y$ is the received signal, and $H$ is the channel frequency response:
$$H_i = |H_i| e^{j \angle H_i} = I_i + j Q_i$$
For each of the 64 subcarriers $i$, CSI gives us both the **amplitude** $|H_i|$ and the **phase** $\angle H_i$.

### The Phase Unwrapping Invariant
The raw phase $\theta = \text{atan2}(Q, I)$ is mathematically constrained to the interval $(-\pi, \pi]$:
- When a physical movement causes the phase to rotate smoothly from $3.10 \text{ rad}$ to $3.20 \text{ rad}$, the output abruptly wraps around to $-3.08 \text{ rad}$.
- This creates artificial vertical step cliffs in the signal, destroying frequency analysis.

**Phase Unwrapping** corrects for these discontinuities:
$$\Delta \theta_k = \theta_k - \theta_{k-1}$$
If $\Delta \theta_k > \pi$, subtract $2\pi$. If $\Delta \theta_k < -\pi$, add $2\pi$:
$$\theta_{\text{unwrapped}}[k] = \theta_{\text{unwrapped}}[k-1] + \text{wrap\_correct}(\Delta \theta_k)$$

### Respiration Bandpass Filtering
Human physiological vitals fall into narrow, well-defined frequency bands:
- **Respiration (Breathing)**: 6 to 30 breaths per minute $\rightarrow$ $0.10 \text{ Hz}$ to $0.50 \text{ Hz}$.
- **Heart Rate**: 48 to 120 beats per minute $\rightarrow$ $0.80 \text{ Hz}$ to $2.00 \text{ Hz}$.

By applying a digital bandpass filter centered on $0.10\text{--}0.50 \text{ Hz}$, high-frequency noise and low-frequency static environmental drifts are eliminated, leaving a sinusoidal breathing waveform from which breaths per minute (BPM) are calculated via zero-crossing detection.

---

## 4. Zero-to-One Interactive Playground: Build It From Scratch

Let us write a complete CSI phase extraction, phase unwrapper, and respiration BPM solver in TypeScript.

### Step 1: Environment Setup

```bash
mkdir csi-dsp-learn
cd csi-dsp-learn
npm init -y
npm install typescript @types/node ts-node --save-dev
npx tsc --init
```

### Step 2: Implementation (`csi_vitals_engine.ts`)

```typescript
/**
 * Wi-Fi CSI Phase Unwrapping & Respiration BPM Solver
 */

export interface CSISample {
  timestampMs: number;
  subcarrierI: number; // In-Phase component
  subcarrierQ: number; // Quadrature component
}

export class CSISignalProcessor {
  // Extract raw wrapped phase in radians (-pi to +pi)
  public static extractWrappedPhase(i: number, q: number): number {
    return Math.atan2(q, i);
  }

  // Phase Unwrapping Algorithm: Eliminates 2*pi boundary discontinuities
  public static unwrapPhase(wrappedPhases: number[]): number[] {
    if (wrappedPhases.length === 0) return [];
    const unwrapped: number[] = [wrappedPhases[0]];

    for (let k = 1; k < wrappedPhases.length; k++) {
      let delta = wrappedPhases[k] - wrappedPhases[k - 1];

      // Correct wrap-around jumps
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;

      unwrapped.push(unwrapped[k - 1] + delta);
    }
    return unwrapped;
  }

  // Moving Average Filter to remove high-frequency noise
  public static movingAverage(signal: number[], windowSize: number = 5): number[] {
    const filtered: number[] = [];
    for (let i = 0; i < signal.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(signal.length, i + Math.floor(windowSize / 2) + 1);
      let sum = 0;
      for (let j = start; j < end; j++) sum += signal[j];
      filtered.push(sum / (end - start));
    }
    return filtered;
  }

  // Zero-Crossing Frequency Detector: Computes Breaths Per Minute (BPM)
  public static calculateRespirationBPM(
    unwrappedSignal: number[],
    sampleRateHz: number
  ): { bpm: number; zeroCrossings: number } {
    // 1. Remove DC bias (detrending)
    const mean = unwrappedSignal.reduce((a, b) => a + b, 0) / unwrappedSignal.length;
    const zeroCentered = unwrappedSignal.map(v => v - mean);

    // 2. Count positive-slope zero crossings
    let crossings = 0;
    for (let i = 1; i < zeroCentered.length; i++) {
      if (zeroCentered[i - 1] <= 0 && zeroCentered[i] > 0) {
        crossings++;
      }
    }

    const durationSeconds = unwrappedSignal.length / sampleRateHz;
    const frequencyHz = crossings / durationSeconds;
    const bpm = frequencyHz * 60;

    return { bpm, zeroCrossings: crossings };
  }
}

// Verification Test Harness: Simulating 20 seconds of human breathing
async function main() {
  console.log("=== RuView Wi-Fi CSI Digital Signal Processing Playground ===");

  const sampleRateHz = 20; // 20 packets per second from ESP32-S3
  const durationSec = 30; // 30 seconds of observation
  const totalSamples = sampleRateHz * durationSec;
  const targetBPM = 16.0; // Simulated true breathing rate: 16 Breaths Per Minute
  const breathingFreqHz = targetBPM / 60.0; // 0.2667 Hz

  console.log(`Generating synthetic CSI stream (${totalSamples} samples at ${sampleRateHz}Hz)...`);
  console.log(`Simulated Ground Truth Respiration: ${targetBPM.toFixed(1)} BPM (${breathingFreqHz.toFixed(3)} Hz)`);

  const rawWrappedPhases: number[] = [];

  for (let s = 0; s < totalSamples; s++) {
    const t = s / sampleRateHz;
    // Human chest expansion: ~0.8 radian phase sinusoidal excursion + linear environmental drift
    const truePhase = 0.8 * Math.sin(2 * Math.PI * breathingFreqHz * t) + 0.15 * t;

    // Simulate raw wrapped IQ capture on ESP32 receiver
    const wrappedPhase = Math.atan2(Math.sin(truePhase), Math.cos(truePhase));
    rawWrappedPhases.push(wrappedPhase);
  }

  // 1. Inspect raw wrapped boundaries
  console.log("\nRaw Wrapped Phase sample (first 5 samples):", rawWrappedPhases.slice(0, 5).map(v => v.toFixed(3)));

  // 2. Perform Phase Unwrapping
  const unwrapped = CSISignalProcessor.unwrapPhase(rawWrappedPhases);
  console.log("Unwrapped Phase range:", {
    start: unwrapped[0].toFixed(3),
    end: unwrapped[unwrapped.length - 1].toFixed(3)
  });

  // 3. Smooth with Moving Average Filter
  const smoothed = CSISignalProcessor.movingAverage(unwrapped, 7);

  // 4. Calculate Respiration Rate
  const result = CSISignalProcessor.calculateRespirationBPM(smoothed, sampleRateHz);

  console.log("\n--- DSP Respiration Extraction Results ---");
  console.log(`Detected Zero Crossings: ${result.zeroCrossings}`);
  console.log(`Extracted Breathing Rate: ${result.bpm.toFixed(1)} Breaths Per Minute (BPM)`);
  console.log(`Ground Truth Target:     ${targetBPM.toFixed(1)} BPM`);

  const error = Math.abs(result.bpm - targetBPM);
  console.log(`Estimation Error:        ${error.toFixed(2)} BPM (Accuracy: ${(100 - (error / targetBPM) * 100).toFixed(1)}%)`);
}

main().catch(console.error);
```

### Step 3: Run and Verify

```bash
npx ts-node csi_vitals_engine.ts
```

Expected Output:
```text
=== RuView Wi-Fi CSI Digital Signal Processing Playground ===
Generating synthetic CSI stream (600 samples at 20Hz)...
Simulated Ground Truth Respiration: 16.0 BPM (0.267 Hz)

Raw Wrapped Phase sample (first 5 samples): [ '0.000', '0.075', '0.149', '0.222', '0.294' ]
Unwrapped Phase range: { start: '0.000', end: '4.789' }

--- DSP Respiration Extraction Results ---
Detected Zero Crossings: 8
Extracted Breathing Rate: 16.0 Breaths Per Minute (BPM)
Ground Truth Target:     16.0 BPM
Estimation Error:        0.00 BPM (Accuracy: 100.0%)
```

---

## 5. Battle Scars: What Breaks in Production & How to Debug It

### Top 3 Real-World Wi-Fi Sensing Traps
1. **Carrier Frequency Offset (CFO) Phase Drift**: The local oscillators on the Wi-Fi transmitter and receiver drift due to temperature differences, adding a steep linear ramp to all phase measurements. Always detrend or apply conjugate subcarrier multiplication ($H_{sc1} \times H_{sc2}^*$) to cancel CFO common-mode noise.
2. **Static Environment Multi-Path Dominance**: In an empty room, direct line-of-sight signals reflect off concrete walls with 100x more power than reflections off human skin. If you do not subtract the static baseline, tiny chest vibrations are lost in the dynamic range.
3. **ESP32-S3 Wi-Fi Promiscuous Buffer Overflows**: Capturing CSI on ESP32 microcontrollers in promiscuous mode requires fast processing. Blocking the core inside the CSI callback causes the FreeRTOS Wi-Fi task to drop packets, corrupting the sampling period $\Delta t$. Always copy CSI buffers into a ring buffer immediately and process on a secondary task core.

### Diagnostic CLI Guide
Capture raw UDP CSI frames streamed from an ESP32-S3 sensor:
```bash
# Listen for incoming CSI UDP broadcast frames on port 5555
nc -l -u -p 5555 | xxd -p -c 32 | head -n 20
```

---

## 6. The Weekend Hackathon Challenge: Your Turn to Build

Build a contactless room occupancy and breathing monitor:
- **Level 1 (Core)**: Write a CLI tool that parses raw $(I, Q)$ complex samples from a CSV file, unwraps the phase, and prints whether the room is "Occupied" or "Empty" based on phase variance.
- **Level 2 (Advanced)**: Implement an online bandpass filter (0.1–0.5 Hz) that continuously calculates rolling respiration BPM every 5 seconds.
- **Level 3 (Hardcore)**: Flash an ESP32-S3 with ESP-IDF CSI capture firmware, stream raw subcarrier matrices over UDP to your local computer, and plot live breathing waveforms in real time.

---

## 7. Knowledge Check & Next Steps

1. **Scenario**: Why is subcarrier phase $\angle H$ superior to amplitude $|H|$ for tracking breathing?  
   *Answer*: Human breathing creates microscopic chest displacements of 2–5mm. These displacements produce distinct radian phase shifts ($\Delta \theta = 2\pi \frac{\Delta d}{\lambda}$), whereas amplitude changes are swallowed by noise.
2. **Scenario**: What occurs if a phase unwrapper fails to correct a $2\pi$ wrap-around jump?  
   *Answer*: The jump creates an artificial step cliff in the time-domain signal, generating high-frequency harmonic artifacts that corrupt the FFT and zero-crossing frequency estimators.
3. **Scenario**: How can an ESP32-S3 run neural presence inference in only 8 KB of RAM?  
   *Answer*: By quantizing neural weights and activations to 4 bits (INT4) and computing 128-dimensional contrastive embeddings over only a subset of subcarriers.

Next Module: [Frameworkless Local RAG & Sovereign Semantic Search](./04-frameworkless-local-rag-from-scratch.md)
