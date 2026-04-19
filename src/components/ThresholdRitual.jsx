import React, { useState, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { X, Wind, MousePointer2, Type } from 'lucide-react';
import '../styles/ThresholdRitual.css';

const ThresholdRitual = () => {
    const { ritualData, completeRitual, cancelRitual } = useTasks();
    const [mode, setMode] = useState('breath'); // breath, trace, mantra
    const [progress, setProgress] = useState(0);
    const [instruction, setInstruction] = useState('Prepare to cross the threshold');

    if (!ritualData) return null;

    // ── BREATHING LOGIC ──
    const [breathingPhase, setBreathingPhase] = useState('exhale'); // inhale, hold, exhale
    useEffect(() => {
        if (mode !== 'breath') return;
        
        const phases = [
            { id: 'inhale', text: 'Slow Inhale...', duration: 4000 },
            { id: 'hold', text: 'Hold Resonance...', duration: 2000 },
            { id: 'exhale', text: 'Release...', duration: 4000 }
        ];

        let current = 0;
        let breaths = 0;

        const runPhase = () => {
            const phase = phases[current];
            setBreathingPhase(phase.id);
            setInstruction(phase.text);

            setTimeout(() => {
                current = (current + 1) % phases.length;
                if (current === 0) {
                    breaths++;
                    setProgress(breaths * 34); // ~3 breaths to finish
                    if (breaths >= 3) {
                        setInstruction('Threshold Aligned');
                        setTimeout(completeRitual, 1000);
                        return;
                    }
                }
                runPhase();
            }, phase.duration);
        };

        runPhase();
    }, [mode]);

    // ── TRACING LOGIC ──
    const handleMouseMove = (e) => {
        if (mode !== 'trace') return;
        if (progress < 100) setProgress(p => Math.min(100, p + 0.5));
    };

    useEffect(() => {
        if (progress >= 100) {
            setInstruction('Kinetic Alignment Complete');
            setTimeout(completeRitual, 1000);
        }
    }, [progress, completeRitual]);

    // ── MANTRA LOGIC ──
    const MANTRA_MAP = {
        'Deep Focus': "I am the focus of my world.",
        'Creative': "Flow is my natural state.",
        'Routine': "Steady steps build the foundation.",
        'Social': "I resonate with others.",
        'Default': "I am present in this work."
    };
    
    const CURRENT_MANTRA = MANTRA_MAP[ritualData.category] || MANTRA_MAP.Default;
    const [mantraInput, setMantraInput] = useState('');
    const handleMantraChange = (e) => {
        const val = e.target.value;
        setMantraInput(val);
        const match = CURRENT_MANTRA.substring(0, val.length);
        if (val === match) {
            setProgress((val.length / CURRENT_MANTRA.length) * 100);
            if (val === CURRENT_MANTRA) {
                setInstruction('Mantra Resonance Achieved');
                setTimeout(completeRitual, 1000);
            }
        }
    };

    return (
        <div className="threshold-overlay" onMouseMove={handleMouseMove}>
            <button className="ritual-cancel" onClick={cancelRitual}><X size={32} /></button>
            
            <div className="ritual-card">
                <div className="ritual-header">
                    <p>Category: {ritualData.category}</p>
                    <h2>The Threshold</h2>
                    <p>{instruction}</p>
                </div>

                <div className="ritual-modes">
                    <button className={`mode-btn ${mode === 'breath' ? 'active' : ''}`} onClick={() => {setMode('breath'); setProgress(0);}}>
                        <Wind size={14} /> Breathing
                    </button>
                    <button className={`mode-btn ${mode === 'trace' ? 'active' : ''}`} onClick={() => {setMode('trace'); setProgress(0);}}>
                        <MousePointer2 size={14} /> Kinetic Trace
                    </button>
                    <button className={`mode-btn ${mode === 'mantra' ? 'active' : ''}`} onClick={() => {setMode('mantra'); setProgress(0);}}>
                        <Type size={14} /> Mantra
                    </button>
                </div>

                <div className="ritual-visual-area">
                    {mode === 'breath' && (
                        <div className={`breathing-circle ${breathingPhase}`}></div>
                    )}

                    {mode === 'trace' && (
                        <div className="tracing-area">
                            <svg className="trace-svg" viewBox="0 0 100 100">
                                <circle className="trace-bg" cx="50" cy="50" r="40" fill="none" strokeWidth="2" />
                                <circle 
                                    className="trace-path" 
                                    cx="50" cy="50" r="40" 
                                    fill="none" strokeWidth="4"
                                    style={{ strokeDashoffset: 600 - (progress * 6) }}
                                />
                            </svg>
                            <p style={{marginTop: '1rem', fontSize: '0.8rem', opacity: 0.5}}>Move your cursor to trace the energy</p>
                        </div>
                    )}

                    {mode === 'mantra' && (
                        <div className="mantra-area">
                            <p className="mantra-text">"{CURRENT_MANTRA}"</p>
                            <input 
                                autoFocus
                                className="mantra-input"
                                placeholder="Type to align..."
                                value={mantraInput}
                                onChange={handleMantraChange}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThresholdRitual;
