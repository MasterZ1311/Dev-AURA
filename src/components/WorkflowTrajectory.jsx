import React, { useState, useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { useCalendar } from '../context/CalendarContext';
import { calculateProjectedDestiny } from '../utils/projectionEngine';
import { Info, Sparkles, CalendarX, Ghost, ArrowRight, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import '../styles/WorkflowTrajectory.css';

const WorkflowTrajectory = ({ onClose }) => {
    const { tasks, stats, deleteTask, updateTask } = useTasks();
    const { events, deleteEvent } = useCalendar();

    // Simulation state
    const [hiddenTasks, setHiddenTasks] = useState([]);
    const [hiddenEvents, setHiddenEvents] = useState([]);

    const filteredTasks = tasks.filter(t => !hiddenTasks.includes(t.id));
    const filteredEvents = events.filter(e => !hiddenEvents.includes(e.id));

    const projection = useMemo(() => {
        return calculateProjectedDestiny(
            filteredTasks, 
            filteredEvents
        );
    }, [filteredTasks, filteredEvents]);

    const scenarios = [
        {
            id: 'high-task',
            title: 'Defer High-Impact Task',
            desc: 'Move a Deep Focus task to tomorrow.',
            impact: '+15%',
            icon: <Ghost size={20} className="text-accent" />,
            condition: tasks.some(t => !t.completed && t.priority === 'High' && !hiddenTasks.includes(t.id)),
            action: () => {
                const target = tasks.find(t => !t.completed && t.priority === 'High' && !hiddenTasks.includes(t.id));
                if (target) setHiddenTasks([...hiddenTasks, target.id]);
            }
        },
        {
            id: 'event',
            title: 'Cancel Future Meeting',
            desc: 'Simulate freedom from an upcoming event.',
            impact: '+20%',
            icon: <CalendarX size={20} className="text-danger" />,
            condition: events.some(e => !hiddenEvents.includes(e.id)),
            action: () => {
                const target = events.find(e => !hiddenEvents.includes(e.id));
                if (target) setHiddenEvents([...hiddenEvents, target.id]);
            }
        }
    ];

    const handleApply = async () => {
        // Committing simulation to reality
        for (const id of hiddenTasks) {
            await updateTask(id, { dueDate: 'Deferred' }); // Or delete
        }
        for (const id of hiddenEvents) {
            await deleteEvent(id);
        }
        onClose();
    };

    return (
        <div className="futureself-container glass-panel">
            <div className="projection-comparison">
                <div className="projection-aura-wrapper">
                    <span className="projection-label">Now</span>
                    <span className="projection-status">Current Workload</span>
                </div>

                <div className="projection-arrow">
                    <ArrowRight size={32} />
                </div>

                <div className="projection-aura-wrapper">
                    <span className="projection-label">8:00 PM (Projected)</span>
                    <span className="projection-status" style={{color: projection.status.color}}>
                        {projection.status.label}: {projection.projectedCapacity}% Capacity
                    </span>
                </div>
            </div>

            <div className="simulation-panel">
                <div className="sim-header">
                    <h4><Sparkles size={18} className="text-accent" /> Trajectory Simulation</h4>
                    <p style={{fontSize: '0.85rem', opacity: 0.7}}>Try toggling scenarios to see how your available capacity shifts.</p>
                </div>

                <div className="sim-scenarios">
                    {scenarios.map(s => (
                        <div 
                            key={s.id} 
                            className={`sim-card glass-panel ${!s.condition ? 'disabled' : ''}`}
                            onClick={() => s.condition && s.action()}
                            style={{ opacity: s.condition ? 1 : 0.5 }}
                        >
                            <div className="sim-icon">{s.icon}</div>
                            <div className="sim-info">
                                <h5>{s.title}</h5>
                                <p>{s.desc}</p>
                            </div>
                            <div className="sim-impact">{s.impact}</div>
                        </div>
                    ))}
                    {(hiddenTasks.length > 0 || hiddenEvents.length > 0) && (
                        <button className="btn-ghost" onClick={() => {setHiddenTasks([]); setHiddenEvents([]);}}>Reset Simulation</button>
                    )}
                </div>

                {/* Destiny Breakdown Tooltip Area */}
                <div className="destiny-breakdown glass-panel">
                    <div className="breakdown-header">
                        <Info size={14} /> <span>Projection Logic Breakdown</span>
                    </div>
                    <div className="breakdown-list">
                        {projection.breakdown.boosts.map((b, i) => (
                            <div key={i} className="breakdown-item boost">
                                <Zap size={10} /> <strong>{b.label}:</strong> {b.value}
                            </div>
                        ))}
                        {projection.breakdown.penalties.map((p, i) => (
                            <div key={i} className="breakdown-item penalty">
                                <AlertTriangle size={10} /> <strong>{p.label}:</strong> {p.value}
                            </div>
                        ))}
                        {projection.breakdown.boosts.length === 0 && projection.breakdown.penalties.length === 0 && (
                            <p className="empty-breakdown">Calculating trajectory based on baseline circadian cycle.</p>
                        )}
                    </div>
                </div>

                <div className="sim-actions">
                    <button className="btn-ghost" onClick={onClose}>Keep Exploring</button>
                    <button className="btn-apply-destiny" onClick={handleApply}>
                        <CheckCircle size={16} /> Apply This Trajectory
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkflowTrajectory;
