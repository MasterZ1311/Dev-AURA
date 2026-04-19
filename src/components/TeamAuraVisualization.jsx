import React, { useMemo } from 'react';
import '../styles/TeamAuraVisualization.css';
import '../styles/QuantumBridge.css';

const STATE_COLORS = {
    'Focused': '#4f46e5',
    'Creative': '#f59e0b',
    'Calm': '#10b981',
    'High-Stress': '#f97316',
    'Overloaded': '#f43f5e',
    'default': '#6366f1'
};

const TeamAuraVisualization = ({ members, harmony }) => {
    const nodes = useMemo(() => {
        if (!members || members.length === 0) return [];
        
        return members.map((m, i) => {
            const angle = (i / members.length) * Math.PI * 2;
            return {
                x: 50 + Math.cos(angle) * 20,
                y: 50 + Math.sin(angle) * 20,
                size: 40 + (m.vibrationalState === 'Overloaded' ? 20 : 0),
                color: STATE_COLORS[m.vibrationalState] || STATE_COLORS.default,
                state: m.vibrationalState || 'Calm',
                focusId: m.activeFocusId,
                name: m.name
            };
        });
    }, [members]);

    const bridges = useMemo(() => {
        const activeBridges = [];
        const processed = new Set();

        nodes.forEach((a, i) => {
            if (!a.focusId) return;
            nodes.forEach((b, j) => {
                if (i >= j || !b.focusId || a.focusId !== b.focusId) return;
                activeBridges.push({ start: a, end: b, id: `${a.name}-${b.name}` });
            });
        });
        return activeBridges;
    }, [nodes]);

    return (
        <div className="team-aura-container">
            <svg className="team-aura-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <filter id="team-gooey">
                        <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(1, 4 - (harmony / 25))} result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>
                    
                    <filter id="destabilize-filter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" />
                    </filter>

                    <filter id="stress-fracture-filter">
                        <feTurbulence type="turbulence" baseFrequency="0.5" numOctaves="5" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" />
                        <feColorMatrix type="saturate" values="0.5" />
                    </filter>
                </defs>

                <g filter="url(#team-gooey)" className="resonance-active">
                    <g className="quantum-bridges">
                        {bridges.map((bridge) => (
                            <path
                                key={bridge.id}
                                className="resonance-thread"
                                d={`M ${bridge.start.x} ${bridge.start.y} Q 50 50, ${bridge.end.x} ${bridge.end.y}`}
                            />
                        ))}
                    </g>
                    {nodes.map((node, i) => (
                        <circle
                            key={i}
                            className={`member-node ${node.state === 'Overloaded' ? 'overloaded' : ''}`}
                            cx={`${node.x}%`}
                            cy={`${node.y}%`}
                            r={node.size / 5}
                            fill={node.color}
                            opacity="0.8"
                            filter={node.state === 'Overloaded' ? 'url(#stress-fracture-filter)' : ''}
                        />
                    ))}
                </g>
            </svg>

            <div className="harmony-display">
                <p className="harmony-value">{harmony}%</p>
                <p className="harmony-label">Harmony</p>
            </div>
        </div>
    );
};

export default TeamAuraVisualization;
