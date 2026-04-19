import React, { useMemo } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { useTasks } from '../context/TaskContext';
import { generateTimeRiver, findEnergyPockets, suggestFolding } from '../utils/chronosEngine';
import { AlertTriangle, Sparkles, MoveHorizontal } from 'lucide-react';
import '../styles/TimeRiver.css';

const TimeRiver = ({ dateStr }) => {
    const { events } = useCalendar();
    const { tasks, batchTasksToHour } = useTasks();

    const river = useMemo(() => {
        return generateTimeRiver(events.filter(e => e.date === dateStr), tasks.filter(t => t.date === dateStr));
    }, [events, tasks, dateStr]);

    const pockets = useMemo(() => findEnergyPockets(river, 'Deep Focus'), [river]);
    const foldingSuggestions = useMemo(() => suggestFolding(tasks), [tasks]);

    const handleFold = (suggestion, targetHour) => {
        const targetTime = `${String(targetHour).padStart(2, '0')}:00`;
        const taskIds = tasks
            .filter(t => !t.completed && t.energyType === suggestion.type)
            .map(t => t.id);
        batchTasksToHour(taskIds, targetTime);
    };

    const formatHour = (h) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH} ${period}`;
    };

    return (
        <div className="time-river-container">
            <div className="river-day-header">
                <h3>Temporal Topology: {dateStr}</h3>
                <p style={{fontSize: '0.8rem', opacity: 0.6}}>Navigating energy density and interactive flow folding</p>
            </div>

            {foldingSuggestions.length > 0 && (
                <div className="folding-banner glass-panel">
                    <MoveHorizontal className="text-accent" />
                    <div>
                        <strong>Temporal Folding Opportunity</strong>
                        <p>{foldingSuggestions[0].message}</p>
                    </div>
                </div>
            )}

            <div className="temporal-river-base">
                <svg className="river-svg-bg" viewBox="0 0 100 2880" preserveAspectRatio="none">
                    <defs>
                        <filter id="river-turbulence">
                            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.05" numOctaves="3" result="noise" seed="1">
                                <animate attributeName="baseFrequency" values="0.01 0.05;0.01 0.1;0.01 0.05" dur="10s" repeatCount="indefinite" />
                            </feTurbulence>
                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" />
                        </filter>
                        
                        <linearGradient id="river-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="var(--accent-color)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                    
                    <path 
                        className="river-path" 
                        filter="url(#river-turbulence)"
                        d={`M 0 0 ${river.map((s, i) => `L ${s.energyDensity / 2} ${i * 120} L ${s.energyDensity / 2} ${(i+1) * 120}`).join(' ')} L 0 2880 Z`} 
                        fill="url(#river-gradient)"
                    />
                    
                    <path 
                        className="river-flow-line"
                        d={`M 50 0 ${river.map((s, i) => `L 50 ${(i+1) * 120}`).join(' ')}`}
                        fill="none"
                        stroke="var(--accent-color)"
                        strokeWidth="0.5"
                        strokeOpacity="0.3"
                        strokeDasharray="5 5"
                    />
                </svg>

                {river.map((slot) => {
                    const fold = foldingSuggestions.find(s => slot.capacity > 60 && slot.tasks.length === 0);

                    return (
                        <div key={slot.hour} className="river-hour-slot">
                            <div className="river-hour-label">{formatHour(slot.hour)}</div>
                            
                            <div className="river-energy-stream">
                                <div className="energy-node-glow" style={{ 
                                    height: `${slot.capacity}%`, 
                                    background: slot.isParadox ? 'var(--danger-color)' : 'var(--accent-color)',
                                    opacity: 0.1 + (slot.energyDensity / 150)
                                }}></div>

                                {fold && (
                                    <div 
                                        className="temporal-vortex-active" 
                                        onClick={() => handleFold(fold, slot.hour)}
                                        title={`Fold ${fold.count} tasks here`}
                                    >
                                        <div className="vortex-core"><MoveHorizontal size={14} /></div>
                                        <div className="vortex-rings"></div>
                                    </div>
                                )}

                                {slot.isParadox && (
                                    <div className="temporal-paradox" title="Energy conflict">
                                        <AlertTriangle size={18} className="text-danger" style={{position: 'relative', zIndex: 5}}/>
                                    </div>
                                )}

                                {slot.events.map(ev => (
                                    <div key={ev.id} className="river-item event">
                                        <span className="time">{ev.startTime}</span>
                                        <h5>{ev.title}</h5>
                                    </div>
                                ))}

                                {slot.tasks.map(t => (
                                    <div key={t.id} className="river-item task" style={{borderLeftColor: '#f59e0b'}}>
                                        <span className="time">{t.startTime}</span>
                                        <h5>{t.title}</h5>
                                        <span style={{fontSize: '0.6rem', color: '#f59e0b'}}>{t.energyType}</span>
                                    </div>
                                ))}

                                {pockets.some(p => p.hour === slot.hour) && (
                                    <div className="energy-pocket">
                                        <Sparkles size={14} />
                                        <span>Focus Pocket Available</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TimeRiver;
