import React, { useState, useEffect } from 'react';
import '../styles/LoadingScreen.css';

const stages = ['✓', '📅', '⭐', '🚀'];

const LoadingScreen = ({ onFinish }) => {
    const [stageIndex, setStageIndex] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setStageIndex(prev => {
                if (prev >= stages.length - 1) {
                    clearInterval(interval);
                    setTimeout(() => setFadeOut(true), 300);
                    setTimeout(() => onFinish && onFinish(), 800);
                    return prev;
                }
                return prev + 1;
            });
        }, 400);
        return () => clearInterval(interval);
    }, [onFinish]);

    return (
        <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
            <div className="loading-content">
                <img src="/aura-logo.png" alt="Aura" className="loading-logo" />
                <div className="loading-morph">
                    <span className="loading-morph-icon" key={stageIndex}>
                        {stages[stageIndex]}
                    </span>
                </div>
                <h1 className="loading-title">Aura</h1>
                <div className="loading-bar">
                    <div
                        className="loading-bar-fill"
                        style={{ width: `${((stageIndex + 1) / stages.length) * 100}%` }}
                    />
                </div>
                <p className="loading-subtitle">Preparing your workspace…</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
