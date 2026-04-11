import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/LiveBackground.css';

/*
 * Each theme has a unique animated background built with pure CSS.
 * The user can toggle this on/off and adjust intensity from Settings.
 */
const themeBgConfig = {
    'OLED Dark': {
        className: 'live-bg-oled',
        elements: 6,
    },
    'Clean Light': {
        className: 'live-bg-clean',
        elements: 5,
    },
    'Synthwave': {
        className: 'live-bg-synthwave',
        elements: 8,
    },
    'Cyberpunk': {
        className: 'live-bg-cyberpunk',
        elements: 10,
    },
    'Crimson': {
        className: 'live-bg-crimson',
        elements: 7,
    },
    'Forest': {
        className: 'live-bg-forest',
        elements: 8,
    },
    'Ocean': {
        className: 'live-bg-ocean',
        elements: 6,
    },
    'Dune': {
        className: 'live-bg-dune',
        elements: 5,
    },
    'Sakura': {
        className: 'live-bg-sakura',
        elements: 12,
    },
    'Solarized': {
        className: 'live-bg-solarized',
        elements: 5,
    },
    'Dracula': {
        className: 'live-bg-dracula',
        elements: 8,
    },
    'Nord': {
        className: 'live-bg-nord',
        elements: 6,
    },
};

const LiveBackground = () => {
    const { theme, liveBg, liveBgIntensity } = useTheme();

    const config = themeBgConfig[theme];
    const elements = useMemo(() => {
        if (!config) return [];
        return Array.from({ length: config.elements }, (_, i) => (
            <div key={i} className={`live-bg-element el-${i}`} />
        ));
    }, [config]);

    if (!liveBg || !config) return null;

    // Map intensity (0-100) to opacity (0.0–1.0)
    const opacity = liveBgIntensity / 100;

    return (
        <div
            className={`live-bg-container ${config.className}`}
            style={{ opacity }}
            aria-hidden="true"
        >
            {elements}
        </div>
    );
};

export default LiveBackground;
