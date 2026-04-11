import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import {
    CheckSquare,
    CheckCircle2,
    Circle,
    Clock,
    Hourglass,
    Target,
    Activity,
    CalendarDays,
    TrendingUp,
    Flame,
    Plus,
    ArrowRight,
    Sparkles,
    ListTodo,
    BarChart3,
    Zap,
    Flag,
    Star,
    Sun,
    Moon,
    Sunrise
} from 'lucide-react';
import '../styles/Dashboard.css';

/* ── helper: greeting based on time of day ── */
const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Good Morning', Icon: Sunrise };
    if (h < 17) return { text: 'Good Afternoon', Icon: Sun };
    return { text: 'Good Evening', Icon: Moon };
};

/* ── helper: productivity quote rotation ── */
import quotes from '../data/quotes';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const { tasks, toggleTaskCompletion, addTask, stats } = useTasks();

    // ── Live clock ──
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // ── Daily quote (changes each day) ──
    const dailyQuote = quotes[now.getDate() % quotes.length];

    // ── Greeting ──
    const greeting = getGreeting();
    const GreetIcon = greeting.Icon;

    // ── Streak (simulate based on localStorage) ──
    const [streak, setStreak] = useState(0);
    useEffect(() => {
        const lastVisit = localStorage.getItem('aura_last_visit');
        const savedStreak = parseInt(localStorage.getItem('aura_streak') || '0', 10);
        // Use a static today string for streak logic to avoid 'now' dependency
        const todayStr = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastVisit === todayStr) {
            setStreak(savedStreak);
        } else if (lastVisit === yesterdayStr) {
            const newStreak = savedStreak + 1;
            setStreak(newStreak);
            localStorage.setItem('aura_streak', String(newStreak));
            localStorage.setItem('aura_last_visit', todayStr);
        } else {
            setStreak(1);
            localStorage.setItem('aura_streak', '1');
            localStorage.setItem('aura_last_visit', todayStr);
        }
    }, []);

    // ── Derived data ──
    const completionRate = tasks.length > 0 ? Math.round((stats.completed / tasks.length) * 100) : 0;
    const focusTasks = tasks.filter(t => t.isFocus && !t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);
    const recentlyCompleted = tasks.filter(t => t.completed).slice(0, 3);
    const highPriority = tasks.filter(t => t.priority === 'High' && !t.completed);

    // ── Productivity score (gamified) ──
    const productivityScore = useMemo(() => {
        let score = 0;
        score += stats.completed * 15;  // 15 pts per completed task
        score += streak * 10;            // 10 pts per streak day
        if (completionRate > 50) score += 20;
        if (completionRate > 80) score += 30;
        return Math.min(score, 999);
    }, [stats.completed, streak, completionRate]);

    // ── Quick-add task ──
    const [quickTask, setQuickTask] = useState('');
    const handleQuickAdd = (e) => {
        e.preventDefault();
        if (!quickTask.trim()) return;
        addTask({
            title: quickTask.trim(),
            priority: 'Medium',
            project: 'Development',
            date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            isFocus: false
        });
        setQuickTask('');
    };

    // ── Mini calendar (current week) ──
    const memoDate = now.toDateString();
    const weekDays = useMemo(() => {
        const baseDate = new Date(memoDate);
        const start = new Date(baseDate);
        start.setDate(baseDate.getDate() - baseDate.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }, [memoDate]);
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // ── Task distribution by project ──
    const projectDistribution = useMemo(() => {
        const map = {};
        tasks.forEach(t => {
            map[t.project] = (map[t.project] || 0) + 1;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [tasks]);

    return (
        <div className="dashboard">
            {/* ═══════════ TOP HERO BANNER ═══════════ */}
            <section className="dash-hero glass-panel">
                <div className="hero-left">
                    <div className="hero-greeting">
                        <GreetIcon size={28} className="greeting-icon" />
                        <h1>{greeting.text}, {currentUser?.name.split(' ')[0]}!</h1>
                    </div>
                    <p className="hero-date">{dateString}</p>
                    <p className="hero-quote">"{dailyQuote.text}" <span>— {dailyQuote.author}</span></p>
                </div>
                <div className="hero-right">
                    <div className="hero-clock">{timeString}</div>
                    <div className="hero-streak">
                        <Flame size={20} className="streak-icon" />
                        <span className="streak-count">{streak}</span>
                        <span className="streak-label">day streak</span>
                    </div>
                </div>
            </section>

            {/* ═══════════ KPI METRICS ROW ═══════════ */}
            <section className="dash-metrics">
                <div className="kpi-card glass-panel">
                    <div className="kpi-icon-wrap total"><ListTodo size={22} /></div>
                    <div className="kpi-info">
                        <span className="kpi-value">{stats.total}</span>
                        <span className="kpi-label">Total Tasks</span>
                    </div>
                </div>
                <div className="kpi-card glass-panel">
                    <div className="kpi-icon-wrap completed"><CheckSquare size={22} /></div>
                    <div className="kpi-info">
                        <span className="kpi-value">{stats.completed}</span>
                        <span className="kpi-label">Completed</span>
                    </div>
                </div>
                <div className="kpi-card glass-panel">
                    <div className="kpi-icon-wrap pending"><Hourglass size={22} /></div>
                    <div className="kpi-info">
                        <span className="kpi-value">{stats.pending}</span>
                        <span className="kpi-label">Pending</span>
                    </div>
                </div>
                <div className="kpi-card glass-panel">
                    <div className="kpi-icon-wrap score"><Zap size={22} /></div>
                    <div className="kpi-info">
                        <span className="kpi-value">{productivityScore}</span>
                        <span className="kpi-label">Productivity</span>
                    </div>
                </div>
            </section>

            {/* ═══════════ 3-COLUMN BODY ═══════════ */}
            <div className="dash-body">
                {/* ── LEFT SIDEBAR ── */}
                <aside className="dash-sidebar-left">
                    {/* Mini Calendar */}
                    <div className="dash-card glass-panel">
                        <div className="dash-card-header">
                            <CalendarDays size={18} /> <h3>This Week</h3>
                        </div>
                        <div className="mini-cal-week">
                            {weekDays.map((d, i) => (
                                <div key={i} className={`cal-cell ${d.toDateString() === now.toDateString() ? 'today' : ''}`}>
                                    <span className="cal-label">{dayLabels[i]}</span>
                                    <span className="cal-num">{d.getDate()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Completion Progress */}
                    <div className="dash-card glass-panel">
                        <div className="dash-card-header">
                            <TrendingUp size={18} /> <h3>Progress</h3>
                        </div>
                        <div className="progress-ring-wrap">
                            <svg className="progress-ring" viewBox="0 0 100 100">
                                <circle className="ring-bg" cx="50" cy="50" r="42" />
                                <circle
                                    className="ring-fill"
                                    cx="50" cy="50" r="42"
                                    strokeDasharray={`${completionRate * 2.64} ${264 - completionRate * 2.64}`}
                                    strokeDashoffset="66"
                                />
                            </svg>
                            <div className="ring-center">
                                <span className="ring-pct">{completionRate}%</span>
                                <span className="ring-sub">done</span>
                            </div>
                        </div>
                    </div>

                    {/* Projects Breakdown */}
                    <div className="dash-card glass-panel">
                        <div className="dash-card-header">
                            <BarChart3 size={18} /> <h3>By Project</h3>
                        </div>
                        <div className="project-bars">
                            {projectDistribution.length > 0 ? projectDistribution.map(([name, count]) => (
                                <div key={name} className="project-bar-row">
                                    <span className="bar-label">{name}</span>
                                    <div className="bar-track">
                                        <div
                                            className="bar-fill"
                                            style={{ width: `${(count / tasks.length) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="bar-count">{count}</span>
                                </div>
                            )) : (
                                <p className="empty-text">No tasks yet</p>
                            )}
                        </div>
                    </div>
                </aside>

                {/* ── MAIN CENTER ── */}
                <main className="dash-center">
                    {/* Quick Add */}
                    <form className="quick-add glass-panel" onSubmit={handleQuickAdd}>
                        <Plus size={20} className="quick-add-icon" />
                        <input
                            type="text"
                            className="quick-add-input"
                            placeholder="Quick add a task…"
                            value={quickTask}
                            onChange={e => setQuickTask(e.target.value)}
                        />
                        <button type="submit" className="quick-add-btn">Add</button>
                    </form>

                    {/* Focus Tasks */}
                    <div className="dash-card glass-panel">
                        <div className="dash-card-header">
                            <Target size={18} /> <h3>My Focus</h3>
                            <span className="badge">{focusTasks.length}</span>
                        </div>
                        <div className="dash-task-list">
                            {focusTasks.length > 0 ? focusTasks.map(task => (
                                <div key={task.id} className="dash-task-item">
                                    <button className="task-check" onClick={() => toggleTaskCompletion(task.id)}>
                                        <Circle size={20} />
                                    </button>
                                    <div className="task-body">
                                        <span className="task-name">{task.title}</span>
                                        <span className="task-sub">{task.date} • {task.project}</span>
                                    </div>
                                    <span className={`prio ${task.priority.toLowerCase()}`}>
                                        <Flag size={12} /> {task.priority}
                                    </span>
                                </div>
                            )) : (
                                <p className="empty-text"><Star size={16} /> No focus tasks right now.</p>
                            )}
                        </div>
                    </div>

                    {/* Upcoming / Pending */}
                    <div className="dash-card glass-panel">
                        <div className="dash-card-header">
                            <Clock size={18} /> <h3>Upcoming Tasks</h3>
                            <span className="badge">{pendingTasks.length}</span>
                        </div>
                        <div className="dash-task-list">
                            {pendingTasks.slice(0, 5).map(task => (
                                <div key={task.id} className="dash-task-item">
                                    <button className="task-check" onClick={() => toggleTaskCompletion(task.id)}>
                                        <Circle size={20} />
                                    </button>
                                    <div className="task-body">
                                        <span className="task-name">{task.title}</span>
                                        <span className="task-sub">{task.date} • {task.project}</span>
                                    </div>
                                    <span className={`prio ${task.priority.toLowerCase()}`}>
                                        <Flag size={12} /> {task.priority}
                                    </span>
                                </div>
                            ))}
                            {pendingTasks.length === 0 && (
                                <p className="empty-text"><Sparkles size={16} /> All clear — no pending tasks!</p>
                            )}
                        </div>
                    </div>

                    {/* Recently Completed */}
                    <div className="dash-card glass-panel">
                        <div className="dash-card-header">
                            <CheckCircle2 size={18} /> <h3>Recently Completed</h3>
                        </div>
                        <div className="dash-task-list">
                            {recentlyCompleted.length > 0 ? recentlyCompleted.map(task => (
                                <div key={task.id} className="dash-task-item completed">
                                    <CheckCircle2 size={20} className="check-done-icon" />
                                    <div className="task-body">
                                        <span className="task-name">{task.title}</span>
                                        <span className="task-sub">{task.date} • {task.project}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="empty-text">Complete tasks to see them here.</p>
                            )}
                        </div>
                    </div>
                </main>

                {/* ── RIGHT SIDEBAR ── */}
                <aside className="dash-sidebar-right">
                    {/* High Priority Alerts */}
                    <div className="dash-card glass-panel priority-alert">
                        <div className="dash-card-header">
                            <Flame size={18} /> <h3>High Priority</h3>
                            <span className="badge danger">{highPriority.length}</span>
                        </div>
                        <div className="dash-task-list">
                            {highPriority.length > 0 ? highPriority.map(task => (
                                <div key={task.id} className="dash-task-item">
                                    <button className="task-check" onClick={() => toggleTaskCompletion(task.id)}>
                                        <Circle size={20} />
                                    </button>
                                    <div className="task-body">
                                        <span className="task-name">{task.title}</span>
                                        <span className="task-sub">{task.date}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="empty-text">No urgent tasks 🎉</p>
                            )}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="dash-card glass-panel">
                        <div className="dash-card-header">
                            <Activity size={18} /> <h3>Activity Feed</h3>
                        </div>
                        <div className="activity-list">
                            {stats.completed > 0 && (
                                <div className="activity-item">
                                    <div className="activity-dot success"></div>
                                    <span>Completed <strong>{stats.completed}</strong> task{stats.completed > 1 ? 's' : ''}</span>
                                </div>
                            )}
                            {streak > 1 && (
                                <div className="activity-item">
                                    <div className="activity-dot streak"></div>
                                    <span><strong>{streak}-day</strong> streak active!</span>
                                </div>
                            )}
                            {highPriority.length > 0 && (
                                <div className="activity-item">
                                    <div className="activity-dot danger"></div>
                                    <span><strong>{highPriority.length}</strong> high priority pending</span>
                                </div>
                            )}
                            {stats.completed === 0 && streak <= 1 && highPriority.length === 0 && (
                                <p className="empty-text">No recent activity.</p>
                            )}
                        </div>
                    </div>

                    {/* Productivity Tip */}
                    <div className="dash-card glass-panel tip-card">
                        <div className="dash-card-header">
                            <Sparkles size={18} /> <h3>Pro Tip</h3>
                        </div>
                        <p className="tip-text">
                            Mark your most important task as <strong>"Focus"</strong> in the Tasks page to keep it front and center here on your dashboard.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;
