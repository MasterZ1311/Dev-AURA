import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { useGroup } from '../context/GroupContext';
import { useCalendar } from '../context/CalendarContext';
import { useWorkflow } from '../context/WorkflowContext';
import { useInbox } from '../context/InboxContext';
import {
    BarChart3, TreePine, Sparkles, TrendingUp,
    CheckCircle2, Target, FolderKanban, Users,
    Star, Flame, Trophy, Zap, Crown, Heart,
    Clock, Calendar, Award
} from 'lucide-react';
import '../styles/ReportsPage.css';

/* ═══════════════════════════════════════════
   GROVE SYSTEM — trees grow from productivity
   ═══════════════════════════════════════════ */

const TREE_STAGES = [
    { name: 'Empty Plot', emoji: '', minTasks: 0 },
    { name: 'Seed', emoji: '🌱', minTasks: 1 },
    { name: 'Sprout', emoji: '🌿', minTasks: 3 },
    { name: 'Sapling', emoji: '🌳', minTasks: 6 },
    { name: 'Tree', emoji: '🌲', minTasks: 10 },
    { name: 'Blooming Tree', emoji: '🌸', minTasks: 15 },
    { name: 'Fruit Tree', emoji: '🍎', minTasks: 20 },
    { name: 'Golden Tree', emoji: '✨🌳✨', minTasks: 30 },
];

const TREE_TYPES = [
    { emoji: '🌲', name: 'Pine', color: '#059669' },
    { emoji: '🌳', name: 'Oak', color: '#16a34a' },
    { emoji: '🌴', name: 'Palm', color: '#65a30d' },
    { emoji: '🌸', name: 'Cherry Blossom', color: '#ec4899' },
    { emoji: '🍁', name: 'Maple', color: '#ea580c' },
    { emoji: '🎄', name: 'Evergreen', color: '#047857' },
    { emoji: '🌺', name: 'Hibiscus', color: '#e11d48' },
    { emoji: '🎋', name: 'Bamboo', color: '#4ade80' },
];

const getTreeForIndex = (index, completedTasks) => {
    const treesEarned = Math.floor(completedTasks / 3);
    if (index >= treesEarned) return { stage: 0, type: null };
    const tasksForThisTree = Math.min(completedTasks - index * 3, 30);
    const stage = TREE_STAGES.reduce((best, s, i) => tasksForThisTree >= s.minTasks ? i : best, 0);
    const type = TREE_TYPES[index % TREE_TYPES.length];
    return { stage, type };
};

/* ═══════════════════════════════════════════
   CONSTELLATION SYSTEM — star map achievements
   ═══════════════════════════════════════════ */

const CONSTELLATIONS = [
    {
        name: 'The Achiever',
        icon: Trophy,
        description: 'Complete tasks to light these stars',
        stars: [
            { x: 20, y: 25, label: 'First Task', check: (d) => d.completedTasks >= 1 },
            { x: 35, y: 15, label: '5 Tasks Done', check: (d) => d.completedTasks >= 5 },
            { x: 50, y: 22, label: '10 Tasks Done', check: (d) => d.completedTasks >= 10 },
            { x: 65, y: 12, label: '25 Tasks Done', check: (d) => d.completedTasks >= 25 },
            { x: 78, y: 20, label: '50 Tasks Done', check: (d) => d.completedTasks >= 50 },
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4]],
        color: '#fbbf24',
    },
    {
        name: 'The Architect',
        icon: FolderKanban,
        description: 'Create projects and build your empire',
        stars: [
            { x: 15, y: 55, label: 'First Project', check: (d) => d.projects >= 1 },
            { x: 30, y: 48, label: '3 Projects', check: (d) => d.projects >= 3 },
            { x: 45, y: 55, label: '5 Projects', check: (d) => d.projects >= 5 },
            { x: 35, y: 65, label: '10 Projects', check: (d) => d.projects >= 10 },
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 0]],
        color: '#818cf8',
    },
    {
        name: 'The Collaborator',
        icon: Users,
        description: 'Build teams and grow your network',
        stars: [
            { x: 60, y: 50, label: 'First Team', check: (d) => d.teams >= 1 },
            { x: 72, y: 42, label: 'First User Added', check: (d) => d.users >= 1 },
            { x: 85, y: 50, label: '3 Teams', check: (d) => d.teams >= 3 },
            { x: 75, y: 60, label: '5 Users', check: (d) => d.users >= 5 },
            { x: 68, y: 55, label: '10 Users', check: (d) => d.users >= 10 },
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]],
        color: '#34d399',
    },
    {
        name: 'The Visionary',
        icon: Target,
        description: 'Set goals and achieve greatness',
        stars: [
            { x: 18, y: 82, label: 'First Goal', check: (d) => d.goals >= 1 },
            { x: 32, y: 78, label: '3 Goals', check: (d) => d.goals >= 3 },
            { x: 28, y: 90, label: 'First Achieved', check: (d) => d.goalsAchieved >= 1 },
            { x: 42, y: 85, label: '5 Achieved', check: (d) => d.goalsAchieved >= 5 },
        ],
        connections: [[0, 1], [1, 3], [0, 2], [2, 3]],
        color: '#f472b6',
    },
    {
        name: 'The Flame',
        icon: Flame,
        description: 'Build daily streaks of productivity',
        stars: [
            { x: 60, y: 78, label: '3 Day Streak', check: (d) => d.streak >= 3 },
            { x: 72, y: 72, label: '7 Day Streak', check: (d) => d.streak >= 7 },
            { x: 82, y: 80, label: '14 Day Streak', check: (d) => d.streak >= 14 },
            { x: 88, y: 72, label: '30 Day Streak', check: (d) => d.streak >= 30 },
            { x: 75, y: 88, label: '60 Day Streak', check: (d) => d.streak >= 60 },
        ],
        connections: [[0, 1], [1, 2], [2, 3], [1, 4], [0, 4]],
        color: '#fb923c',
    },
];

/* ═══════════════════════════════════════════
   STREAK LEVEL SYSTEM
   ═══════════════════════════════════════════ */
const getStreakLevel = (streak) => {
    if (streak >= 60) return { level: 'Legendary', color: '#fbbf24', emoji: '🔥👑' };
    if (streak >= 30) return { level: 'Inferno', color: '#fb923c', emoji: '🔥🔥' };
    if (streak >= 14) return { level: 'Blazing', color: '#ef4444', emoji: '🔥' };
    if (streak >= 7) return { level: 'Warm', color: '#f97316', emoji: '🌡️' };
    if (streak >= 3) return { level: 'Kindling', color: '#a3e635', emoji: '✨' };
    return { level: 'Cold Start', color: 'var(--text-muted)', emoji: '❄️' };
};


const ReportsPage = () => {
    const { stats } = useTasks();
    const group = useGroup();
    const calendar = useCalendar();
    const workflow = useWorkflow();
    const inbox = useInbox();
    const [activeTab, setActiveTab] = useState('overview');
    const canvasRef = useRef(null);

    // Current time
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Aggregate data
    const data = useMemo(() => {
        const streak = parseInt(localStorage.getItem('aura_streak') || '0');
        return {
            totalTasks: stats.total,
            completedTasks: stats.completed,
            pendingTasks: stats.pending,
            projects: group.projects.length,
            teams: group.teams.length,
            users: group.users.length,
            goals: group.goals.length,
            goalsAchieved: group.goals.filter(g => g.status === 'achieved').length,
            events: calendar.events.length,
            workflows: workflow.workflows.length,
            inboxItems: inbox.items.length,
            streak,
            productivity: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        };
    }, [stats, group, calendar, workflow, inbox]);

    const streakInfo = getStreakLevel(data.streak);

    // Grove stats
    const groveStats = useMemo(() => {
        const treesEarned = Math.floor(data.completedTasks / 3);
        const totalPlots = 24;
        const grownTrees = Math.min(treesEarned, totalPlots);
        const nextTreeProgress = data.completedTasks % 3;
        return { treesEarned, totalPlots, grownTrees, nextTreeProgress };
    }, [data.completedTasks]);

    // Constellation stats
    const constellationStats = useMemo(() => {
        let totalStars = 0, unlockedStars = 0;
        CONSTELLATIONS.forEach(c => {
            c.stars.forEach(star => {
                totalStars++;
                if (star.check(data)) unlockedStars++;
            });
        });
        return { totalStars, unlockedStars, percentage: totalStars > 0 ? Math.round((unlockedStars / totalStars) * 100) : 0 };
    }, [data]);

    // Upcoming events (next 5)
    const upcomingEvents = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return calendar.events
            .filter(e => e.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5);
    }, [calendar.events]);

    // Draw constellation canvas
    useEffect(() => {
        if (activeTab !== 'constellation' || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < 120; i++) {
            const bx = Math.random() * canvas.width;
            const by = Math.random() * canvas.height;
            const br = Math.random() * 1.2;
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.05})`;
            ctx.fill();
        }

        CONSTELLATIONS.forEach(constellation => {
            const resolvedStars = constellation.stars.map(star => ({
                ...star,
                px: (star.x / 100) * canvas.width,
                py: (star.y / 100) * canvas.height,
                unlocked: star.check(data),
            }));

            constellation.connections.forEach(([a, b]) => {
                const sa = resolvedStars[a], sb = resolvedStars[b];
                const bothUnlocked = sa.unlocked && sb.unlocked;
                ctx.beginPath();
                ctx.moveTo(sa.px, sa.py);
                ctx.lineTo(sb.px, sb.py);
                ctx.strokeStyle = bothUnlocked ? constellation.color + '80' : 'rgba(255,255,255,0.06)';
                ctx.lineWidth = bothUnlocked ? 1.5 : 0.5;
                ctx.stroke();
            });

            resolvedStars.forEach(star => {
                ctx.beginPath();
                if (star.unlocked) {
                    const gradient = ctx.createRadialGradient(star.px, star.py, 0, star.px, star.py, 12);
                    gradient.addColorStop(0, constellation.color);
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.arc(star.px, star.py, 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(star.px, star.py, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = constellation.color;
                    ctx.fill();
                } else {
                    ctx.arc(star.px, star.py, 2, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.fill();
                }
            });
        });
    }, [activeTab, data]);

    /* ═══ LEFT PANEL — shared across all tabs ═══ */
    const renderLeftPanel = () => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        // Mini calendar
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const calendarDays = [];
        for (let i = 0; i < firstDay; i++) calendarDays.push(null);
        for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

        return (
            <aside className="rpt-left-panel">
                {/* Live Clock */}
                <div className="rpt-clock-card glass-panel">
                    <div className="rpt-clock-time">
                        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="rpt-clock-date">
                        {dayNames[now.getDay()]}, {monthNames[month]} {today}, {year}
                    </div>
                </div>

                {/* Streak Level */}
                <div className="rpt-streak-card glass-panel">
                    <div className="rpt-streak-emoji">{streakInfo.emoji}</div>
                    <div className="rpt-streak-val" style={{ color: streakInfo.color }}>{data.streak}</div>
                    <div className="rpt-streak-label">Day Streak</div>
                    <div className="rpt-streak-level" style={{ color: streakInfo.color }}>{streakInfo.level}</div>
                    <div className="rpt-streak-bar">
                        <div className="rpt-streak-bar-fill" style={{
                            width: `${Math.min((data.streak / 60) * 100, 100)}%`,
                            background: streakInfo.color
                        }} />
                    </div>
                    <div className="rpt-streak-next">
                        {data.streak < 3 && '3 days → Kindling'}
                        {data.streak >= 3 && data.streak < 7 && '7 days → Warm'}
                        {data.streak >= 7 && data.streak < 14 && '14 days → Blazing'}
                        {data.streak >= 14 && data.streak < 30 && '30 days → Inferno'}
                        {data.streak >= 30 && data.streak < 60 && '60 days → Legendary'}
                        {data.streak >= 60 && '🏆 Max level reached!'}
                    </div>
                </div>

                {/* Mini Calendar */}
                <div className="rpt-mini-cal glass-panel">
                    <div className="rpt-mini-cal-header">
                        <Calendar size={14} />
                        <span>{monthNames[month]} {year}</span>
                    </div>
                    <div className="rpt-mini-cal-days">
                        {dayNames.map(d => <span key={d} className="rpt-cal-dayname">{d[0]}</span>)}
                    </div>
                    <div className="rpt-mini-cal-grid">
                        {calendarDays.map((d, i) => (
                            <span key={i} className={`rpt-cal-day ${d === today ? 'today' : ''} ${!d ? 'empty' : ''}`}>
                                {d || ''}
                            </span>
                        ))}
                    </div>
                    {upcomingEvents.length > 0 && (
                        <div className="rpt-upcoming">
                            <span className="rpt-upcoming-title">Upcoming</span>
                            {upcomingEvents.map((e, i) => (
                                <div key={i} className="rpt-upcoming-item">
                                    <span className="rpt-upcoming-dot" />
                                    <span className="rpt-upcoming-text">{e.title}</span>
                                    <span className="rpt-upcoming-date">{e.date?.slice(5)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Productivity Ring */}
                <div className="rpt-score-card glass-panel">
                    <div className="rpt-score-ring">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-color)" strokeWidth="6" />
                            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent-color)" strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={`${data.productivity * 2.64} ${264 - data.productivity * 2.64}`}
                                transform="rotate(-90 50 50)" />
                        </svg>
                        <span className="rpt-score-value">{data.productivity}%</span>
                    </div>
                    <span className="rpt-score-label">Productivity</span>
                </div>
            </aside>
        );
    };

    /* ═══ OVERVIEW TAB ═══ */
    const renderOverview = () => (
        <div className="rpt-overview">
            {/* Stats grid */}
            <div className="rpt-stat-grid">
                <div className="rpt-stat glass-panel"><CheckCircle2 size={20} className="stat-icon green" /><div><span className="rpt-stat-val">{data.completedTasks}</span><span className="rpt-stat-lbl">Done</span></div></div>
                <div className="rpt-stat glass-panel"><Clock size={20} className="stat-icon yellow" /><div><span className="rpt-stat-val">{data.pendingTasks}</span><span className="rpt-stat-lbl">Pending</span></div></div>
                <div className="rpt-stat glass-panel"><FolderKanban size={20} className="stat-icon purple" /><div><span className="rpt-stat-val">{data.projects}</span><span className="rpt-stat-lbl">Projects</span></div></div>
                <div className="rpt-stat glass-panel"><Target size={20} className="stat-icon pink" /><div><span className="rpt-stat-val">{data.goalsAchieved}/{data.goals}</span><span className="rpt-stat-lbl">Goals</span></div></div>
                <div className="rpt-stat glass-panel"><Users size={20} className="stat-icon cyan" /><div><span className="rpt-stat-val">{data.teams}</span><span className="rpt-stat-lbl">Teams</span></div></div>
                <div className="rpt-stat glass-panel"><Calendar size={20} className="stat-icon cyan" /><div><span className="rpt-stat-val">{data.events}</span><span className="rpt-stat-lbl">Events</span></div></div>
                <div className="rpt-stat glass-panel"><Zap size={20} className="stat-icon yellow" /><div><span className="rpt-stat-val">{data.workflows}</span><span className="rpt-stat-lbl">Flows</span></div></div>
                <div className="rpt-stat glass-panel"><Flame size={20} className="stat-icon orange" /><div><span className="rpt-stat-val">{data.streak}</span><span className="rpt-stat-lbl">Streak</span></div></div>
            </div>

            {/* Quick links */}
            <div className="rpt-quicklinks">
                <div className="rpt-quicklink glass-panel" onClick={() => setActiveTab('grove')}>
                    <TreePine size={22} className="accent-icon" />
                    <div>
                        <h4>Productivity Grove</h4>
                        <p>{groveStats.grownTrees} trees grown • {groveStats.nextTreeProgress}/3 to next</p>
                    </div>
                    <span className="rpt-ql-arrow">→</span>
                </div>
                <div className="rpt-quicklink glass-panel" onClick={() => setActiveTab('constellation')}>
                    <Sparkles size={22} className="accent-icon" />
                    <div>
                        <h4>Achievement Constellations</h4>
                        <p>{constellationStats.unlockedStars}/{constellationStats.totalStars} stars unlocked ({constellationStats.percentage}%)</p>
                    </div>
                    <span className="rpt-ql-arrow">→</span>
                </div>
            </div>
        </div>
    );

    /* ═══ GROVE TAB ═══ */
    const renderGrove = () => (
        <div className="rpt-grove">
            <div className="grove-header">
                <h2><TreePine size={22} className="accent-icon" /> Your Productivity Grove</h2>
                <p>Every 3 completed tasks plants a tree. Keep growing!</p>
            </div>

            {/* Grove stats strip */}
            <div className="grove-stats-strip">
                <div className="grove-ministat glass-panel">
                    <span className="grove-ministat-val">{groveStats.grownTrees}</span>
                    <span className="grove-ministat-lbl">Trees</span>
                </div>
                <div className="grove-ministat glass-panel">
                    <span className="grove-ministat-val">{data.completedTasks}</span>
                    <span className="grove-ministat-lbl">Tasks</span>
                </div>
                <div className="grove-progress glass-panel">
                    <span>Next tree</span>
                    <div className="grove-progress-bar">
                        <div className="grove-progress-fill" style={{ width: `${(groveStats.nextTreeProgress / 3) * 100}%` }}></div>
                    </div>
                    <span className="grove-progress-text">{groveStats.nextTreeProgress}/3</span>
                </div>
            </div>

            {/* Tree grid */}
            <div className="grove-grid">
                {Array.from({ length: groveStats.totalPlots }).map((_, i) => {
                    const tree = getTreeForIndex(i, data.completedTasks);
                    const stageInfo = TREE_STAGES[tree.stage];
                    return (
                        <div key={i} className={`grove-plot ${tree.stage > 0 ? 'has-tree' : 'empty'} stage-${tree.stage}`}>
                            <div className="grove-tree-visual">
                                {tree.stage > 0 ? (
                                    <span className="grove-tree-emoji">{stageInfo.emoji || (tree.type?.emoji)}</span>
                                ) : (
                                    <span className="grove-plot-empty"></span>
                                )}
                            </div>
                            <span className="grove-plot-label">{tree.stage > 0 ? stageInfo.name : `Plot ${i + 1}`}</span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="grove-legend glass-panel">
                <h4>Growth Stages</h4>
                <div className="grove-legend-items">
                    {TREE_STAGES.filter(s => s.minTasks > 0).map(s => (
                        <div key={s.name} className="grove-legend-item">
                            <span className="grove-legend-emoji">{s.emoji}</span>
                            <span className="grove-legend-name">{s.name}</span>
                            <span className="grove-legend-req">{s.minTasks}+</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ═══ CONSTELLATION TAB ═══ */
    const renderConstellation = () => (
        <div className="rpt-constellation">
            <div className="const-header">
                <h2><Sparkles size={22} className="accent-icon" /> Achievement Constellations</h2>
                <div className="const-stats-inline">
                    <div className="const-stat"><Star size={16} /><span>{constellationStats.unlockedStars}/{constellationStats.totalStars} stars</span></div>
                    <div className="const-stat"><Award size={16} /><span>{constellationStats.percentage}% complete</span></div>
                </div>
            </div>

            {/* Star map */}
            <div className="const-sky">
                <canvas ref={canvasRef} className="const-canvas" />
                {CONSTELLATIONS.map(c => {
                    const avgX = c.stars.reduce((s, st) => s + st.x, 0) / c.stars.length;
                    const avgY = c.stars.reduce((s, st) => s + st.y, 0) / c.stars.length;
                    const unlocked = c.stars.filter(s => s.check(data)).length;
                    return (
                        <div key={c.name} className="const-label" style={{ left: `${avgX}%`, top: `${avgY - 8}%`, color: c.color }}>
                            {c.name} <span className="const-label-count">({unlocked}/{c.stars.length})</span>
                        </div>
                    );
                })}
            </div>

            {/* Cards */}
            <div className="const-cards">
                {CONSTELLATIONS.map(c => {
                    const Icon = c.icon;
                    const unlocked = c.stars.filter(s => s.check(data)).length;
                    const complete = unlocked === c.stars.length;
                    return (
                        <div key={c.name} className={`const-card glass-panel ${complete ? 'complete' : ''}`} style={{ borderColor: complete ? c.color : undefined }}>
                            <div className="const-card-header">
                                <Icon size={18} style={{ color: c.color }} />
                                <h3 style={{ color: c.color }}>{c.name}</h3>
                                {complete && <Crown size={14} style={{ color: c.color }} />}
                            </div>
                            <p className="const-card-desc">{c.description}</p>
                            <div className="const-card-stars">
                                {c.stars.map((star, i) => (
                                    <div key={i} className={`const-star-item ${star.check(data) ? 'unlocked' : 'locked'}`}>
                                        <Star size={12} style={{ color: star.check(data) ? c.color : undefined }} fill={star.check(data) ? c.color : 'none'} />
                                        <span>{star.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="const-card-progress">
                                <div className="const-progress-bar"><div className="const-progress-fill" style={{ width: `${(unlocked / c.stars.length) * 100}%`, backgroundColor: c.color }}></div></div>
                                <span>{unlocked}/{c.stars.length}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const tabs = [
        { key: 'overview', label: 'Overview', icon: BarChart3 },
        { key: 'grove', label: 'Grove', icon: TreePine },
        { key: 'constellation', label: 'Constellations', icon: Sparkles },
    ];

    return (
        <div className="rpt-page">
            <div className="rpt-tabs">
                {tabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button key={t.key} className={`rpt-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                            <Icon size={16} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {/* 3-column layout: left info | center content | right (future) */}
            <div className="rpt-layout-3col">
                {renderLeftPanel()}
                <div className="rpt-center">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'grove' && renderGrove()}
                    {activeTab === 'constellation' && renderConstellation()}
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
