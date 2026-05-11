import React, { useState, useEffect } from 'react';
import '../styles/LoadingScreen.css';

const LoadingScreen = ({ onFinish }) => {
    const [stageIndex, setStageIndex] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setStageIndex(prev => {
                if (prev >= 3) { // 4 stages: 0, 1, 2, 3
                    clearInterval(interval);
                    setTimeout(() => setFadeOut(true), 300);
                    setTimeout(() => onFinish && onFinish(), 800);
                    return prev;
                }
                return prev + 1;
            });
        }, 500);
        return () => clearInterval(interval);
    }, [onFinish]);

    return (
        <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
            <div className="loading-content">
                <img src="/aura-logo.png" alt="Aura" className="loading-logo" />
                <div className="loading-morph">
                    <img src="/aura-icon.png" alt="" className="loading-icon-animate" />
                </div>
                <div className="loading-bar">
                    <div
                        className="loading-bar-fill"
                        style={{ width: `${((stageIndex + 1) / 4) * 100}%` }}
                    />
                </div>
                <p className="loading-subtitle">Preparing your workspace…</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
