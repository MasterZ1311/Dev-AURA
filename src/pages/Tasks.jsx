import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import {
    Clock,
    CalendarDays,
    Plus,
    StickyNote,
    Sparkles,
    CheckCircle2,
    Circle,
    Trash2,
    Flag,
    ListTodo
} from 'lucide-react';
import '../styles/Tasks.css';

const Tasks = () => {
    const { tasks, addTask, toggleTaskCompletion, deleteTask } = useTasks();

    // ── Live Clock ──
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const shortMonth = now.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = now.getDate();

    // ── New Task Form State ──
    const [newTitle, setNewTitle] = useState('');
    const [newPriority, setNewPriority] = useState('Medium');
    const [newProject, setNewProject] = useState('Development');

    // ── Quick Note State ──
    const [quickNote, setQuickNote] = useState(() => {
        return localStorage.getItem('aura_quick_note') || '';
    });
    useEffect(() => {
        localStorage.setItem('aura_quick_note', quickNote);
    }, [quickNote]);

    // ── Filter ──
    const [filter, setFilter] = useState('all'); // all | pending | completed

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        addTask({
            title: newTitle.trim(),
            priority: newPriority,
            project: newProject,
            date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            isFocus: false
        });
        setNewTitle('');
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'pending') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    });

    const recentlyAdded = [...tasks]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 5);

    // ── Mini-calendar: days of current week ──
    const getWeekDays = () => {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay()); // Sunday
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    };
    const weekDays = getWeekDays();
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="tasks-page">
            {/* ═══════════ LEFT COLUMN ═══════════ */}
            <aside className="tasks-left-col">
                <div className="datetime-card glass-panel">
                    <div className="time-display">
                        <Clock size={20} className="datetime-icon" />
                        <span className="live-time">{timeString}</span>
                    </div>
                    <div className="date-display">
                        <CalendarDays size={18} className="datetime-icon" />
                        <span>{dateString}</span>
                    </div>
                </div>

                {/* Mini calendar */}
                <div className="mini-calendar glass-panel">
                    <div className="mini-cal-header">
                        <span className="mini-cal-month">{shortMonth}</span>
                        <span className="mini-cal-day">{dayNum}</span>
                    </div>
                    <div className="mini-cal-week">
                        {weekDays.map((d, i) => (
                            <div
                                key={i}
                                className={`mini-cal-cell ${d.toDateString() === now.toDateString() ? 'today' : ''}`}
                            >
                                <span className="mini-cal-label">{dayLabels[i]}</span>
                                <span className="mini-cal-num">{d.getDate()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Task Stats */}
                <div className="task-stats glass-panel">
                    <h4><Sparkles size={16} /> Overview</h4>
                    <div className="stat-row">
                        <span>Total</span>
                        <span className="stat-value">{tasks.length}</span>
                    </div>
                    <div className="stat-row">
                        <span>Completed</span>
                        <span className="stat-value completed-val">{tasks.filter(t => t.completed).length}</span>
                    </div>
                    <div className="stat-row">
                        <span>Pending</span>
                        <span className="stat-value pending-val">{tasks.filter(t => !t.completed).length}</span>
                    </div>
                    {tasks.length > 0 && (
                        <div className="stat-progress">
                            <div
                                className="stat-progress-bar"
                                style={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            </aside>

            {/* ═══════════ MIDDLE COLUMN ═══════════ */}
            <main className="tasks-main-col">
                <div className="tasks-main-header">
                    <div className="tasks-title-row">
                        <ListTodo size={28} className="section-icon" />
                        <h1>My Tasks</h1>
                    </div>
                    <div className="tasks-filter-tabs">
                        {['all', 'pending', 'completed'].map(f => (
                            <button
                                key={f}
                                className={`filter-tab ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="tasks-list">
                    {filteredTasks.length > 0 ? filteredTasks.map(task => (
                        <div key={task.id} className={`task-item ${task.completed ? 'done' : ''}`}>
                            <button
                                className="task-check-btn"
                                onClick={() => toggleTaskCompletion(task.id)}
                                title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                            >
                                {task.completed
                                    ? <CheckCircle2 size={22} className="check-done" />
                                    : <Circle size={22} className="check-pending" />
                                }
                            </button>
                            <div className="task-info">
                                <span className="task-title">{task.title}</span>
                                <div className="task-meta">
                                    <span className="task-date">{task.date}</span>
                                    <span className="task-project">{task.project}</span>
                                </div>
                            </div>
                            <div className="task-actions">
                                <span className={`priority-pill ${task.priority.toLowerCase()}`}>
                                    <Flag size={12} /> {task.priority}
                                </span>
                                <button
                                    className="task-delete-btn"
                                    onClick={() => deleteTask(task.id)}
                                    title="Delete task"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="tasks-empty glass-panel">
                            <Sparkles size={32} />
                            <p>No tasks here. Add one to get started!</p>
                        </div>
                    )}
                </div>
            </main>

            {/* ═══════════ RIGHT COLUMN ═══════════ */}
            <aside className="tasks-right-col">
                {/* New Task */}
                <div className="new-task-card glass-panel">
                    <h3><Plus size={18} /> New Task</h3>
                    <form onSubmit={handleAddTask} className="new-task-form">
                        <input
                            type="text"
                            placeholder="What needs to be done?"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            className="new-task-input"
                        />
                        <div className="new-task-options">
                            <select
                                value={newPriority}
                                onChange={e => setNewPriority(e.target.value)}
                                className="new-task-select"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                            <select
                                value={newProject}
                                onChange={e => setNewProject(e.target.value)}
                                className="new-task-select"
                            >
                                <option value="Marketing">Marketing</option>
                                <option value="Development">Development</option>
                                <option value="Design">Design</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-primary new-task-submit">
                            <Plus size={16} /> Add Task
                        </button>
                    </form>
                </div>

                {/* Quick Notes */}
                <div className="quick-notes-card glass-panel">
                    <h3><StickyNote size={18} /> Quick Notes</h3>
                    <textarea
                        className="quick-notes-area"
                        placeholder="Jot something down…"
                        value={quickNote}
                        onChange={e => setQuickNote(e.target.value)}
                        rows={5}
                    />
                </div>

                {/* Recently Added */}
                <div className="recent-card glass-panel">
                    <h3><Sparkles size={18} /> Recently Added</h3>
                    {recentlyAdded.length > 0 ? (
                        <ul className="recent-list">
                            {recentlyAdded.map(t => (
                                <li key={t.id} className="recent-item">
                                    <span className={`recent-dot ${t.priority.toLowerCase()}`}></span>
                                    <span className={t.completed ? 'recent-done' : ''}>{t.title}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="recent-empty">No tasks yet.</p>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default Tasks;
