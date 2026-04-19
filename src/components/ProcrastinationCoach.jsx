import React, { useState, useEffect } from 'react';
import { X, Sparkles, Footprints, ArrowRight } from 'lucide-react';
import { aiService } from '../utils/aiService';
import '../styles/ProcrastinationCoach.css';

const ProcrastinationCoach = ({ isOpen, task, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [steps, setSteps] = useState('');

    useEffect(() => {
        if (isOpen && task) {
            getBreakdown();
        }
    }, [isOpen, task]);

    const getBreakdown = async () => {
        setLoading(true);
        try {
            const breakdown = await aiService.breakdownProcrastination(task.title);
            setSteps(breakdown);
        } catch (error) {
            setSteps("Let's start by just opening the documents needed. One step at a time.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !task) return null;

    return (
        <div className="coach-overlay">
            <div className="coach-modal glass-panel">
                <button className="coach-close" onClick={onClose}><X size={24} /></button>
                
                <div className="coach-header">
                    <div className="coach-icon-glow">
                        <Footprints size={40} className="coach-icon" />
                    </div>
                    <h2>AURA Coach</h2>
                    <p className="coach-subtitle">You've moved "{task.title}" {task.rescheduleCount} times. Let's break the cycle.</p>
                </div>

                <div className="coach-content">
                    {loading ? (
                        <div className="coach-loading">
                            <div className="aura-spinner"></div>
                            <p>Analyzing the mountain... dissolving it into pebbles.</p>
                        </div>
                    ) : (
                        <div className="coach-steps">
                            <div className="steps-title"><Sparkles size={16} /> Your 5-Minute Entry Points</div>
                            <div className="steps-text">
                                {steps.split('\n').map((line, i) => (
                                    line.trim() && (
                                        <div key={i} className="step-item">
                                            <ArrowRight size={14} className="step-arrow" />
                                            <span>{line.replace(/^\d+\.\s*/, '')}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button className="coach-btn" onClick={onClose}>
                    I'm starting Step 1 now
                </button>
            </div>
        </div>
    );
};

export default ProcrastinationCoach;
