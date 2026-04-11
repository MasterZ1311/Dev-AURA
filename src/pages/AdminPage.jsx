import React, { useState, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useGroup } from '../context/GroupContext';
import { useInbox } from '../context/InboxContext';
import {
    Shield, LayoutDashboard, Users, KeyRound, Database,
    Palette, ScrollText, Download, Upload, Trash2,
    AlertTriangle, ChevronRight, RefreshCw, Search, X
} from 'lucide-react';
import '../styles/AdminPage.css';

const sections = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'roles', label: 'Roles', icon: KeyRound },
    { key: 'data', label: 'Data Management', icon: Database },
    { key: 'theme', label: 'Theme', icon: Palette },
    { key: 'logs', label: 'Activity Log', icon: ScrollText },
];

const roleDescriptions = {
    admin: { color: '#f87171', desc: 'Full access. Can manage all users, settings, data, and system configurations.' },
    manager: { color: '#fbbf24', desc: 'Can manage teams, projects, and assign tasks. Cannot access admin settings.' },
    member: { color: '#00ffcc', desc: 'Can create tasks, join teams, and track goals. Standard workspace access.' },
    viewer: { color: '#6b7280', desc: 'Read-only access. Can view dashboards, reports, and project statuses.' },
};

const resetSections = [
    { key: 'aura_tasks', label: 'Tasks' },
    { key: 'aura_inbox', label: 'Inbox' },
    { key: 'aura_calendar', label: 'Calendar' },
    { key: 'aura_workflows', label: 'Workflows' },
    { key: 'aura_group', label: 'Group Productivity' },
    { key: 'aura_admin_log', label: 'Activity Log' },
];

const timeAgo = (ts) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

const AdminPage = () => {
    const admin = useAdmin();
    const group = useGroup();
    const inbox = useInbox();
    const [activeSection, setActiveSection] = useState('overview');
    const [confirmReset, setConfirmReset] = useState(null);
    const fileRef = useRef(null);

    // Storage size estimate
    const storageSize = () => {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('aura_')) total += localStorage.getItem(key).length;
        }
        return (total / 1024).toFixed(1);
    };

    // ── Overview ──
    const renderOverview = () => (
        <div className="admin-section">
            <h2>System Overview</h2>
            <div className="admin-stat-grid">
                <div className="admin-stat-card glass-panel"><span className="admin-stat-value">{group.users.length}</span><span className="admin-stat-label">Users</span></div>
                <div className="admin-stat-card glass-panel"><span className="admin-stat-value">{group.projects.length}</span><span className="admin-stat-label">Projects</span></div>
                <div className="admin-stat-card glass-panel"><span className="admin-stat-value">{group.teams.length}</span><span className="admin-stat-label">Teams</span></div>
                <div className="admin-stat-card glass-panel"><span className="admin-stat-value">{group.goals.length}</span><span className="admin-stat-label">Goals</span></div>
                <div className="admin-stat-card glass-panel"><span className="admin-stat-value">{inbox.items.length}</span><span className="admin-stat-label">Inbox Items</span></div>
                <div className="admin-stat-card glass-panel"><span className="admin-stat-value">{storageSize()} KB</span><span className="admin-stat-label">Storage Used</span></div>
            </div>
            <div className="admin-info glass-panel">
                <h4>App Info</h4>
                <div className="admin-info-row"><span>App Name</span><strong>Aura</strong></div>
                <div className="admin-info-row"><span>Version</span><strong>1.0.0</strong></div>
                <div className="admin-info-row"><span>Storage</span><strong>localStorage</strong></div>
            </div>
        </div>
    );

    // ── User Management ──
    const renderUsers = () => (
        <div className="admin-section">
            <h2>User Management</h2>
            {group.users.length > 0 ? (
                <table className="admin-table">
                    <thead>
                        <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Department</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {group.users.map(u => (
                            <tr key={u.id}>
                                <td className="admin-user-name"><span className="admin-avatar">{u.initials}</span>{u.name}</td>
                                <td>{u.email || '-'}</td>
                                <td><span className={`role-badge ${u.role === 'admin' ? 'danger' : u.role === 'manager' ? 'warning' : u.role === 'viewer' ? 'muted' : 'accent'}`}>{u.role}</span></td>
                                <td><span className={`status-indicator ${u.status}`}>{u.status}</span></td>
                                <td>{u.department || '-'}</td>
                                <td><button className="icon-btn danger" onClick={() => group.deleteUser(u.id)}><Trash2 size={14} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p className="admin-empty">No users in the directory. Add users from the Group Productivity page.</p>}
        </div>
    );

    // ── Roles ──
    const renderRoles = () => (
        <div className="admin-section">
            <h2>Role Definitions</h2>
            <div className="admin-role-grid">
                {Object.entries(roleDescriptions).map(([role, info]) => (
                    <div key={role} className="admin-role-card glass-panel" style={{ borderLeftColor: info.color }}>
                        <h3 style={{ color: info.color }}>{role.charAt(0).toUpperCase() + role.slice(1)}</h3>
                        <p>{info.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    // ── Data Management ──
    const renderData = () => (
        <div className="admin-section">
            <h2>Data Management</h2>
            <div className="admin-data-actions">
                <button className="admin-data-btn glass-panel" onClick={admin.exportData}><Download size={20} /><span>Export Data</span><small>Download all app data as JSON</small></button>
                <button className="admin-data-btn glass-panel" onClick={() => fileRef.current?.click()}><Upload size={20} /><span>Import Data</span><small>Restore from a JSON backup</small></button>
                <input type="file" ref={fileRef} accept=".json" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) admin.importData(e.target.files[0]); }} />
            </div>
            <div className="admin-reset-section">
                <h3><AlertTriangle size={16} /> Reset Sections</h3>
                <div className="admin-reset-grid">
                    {resetSections.map(s => (
                        <div key={s.key} className="admin-reset-item">
                            <span>{s.label}</span>
                            {confirmReset === s.key ? (
                                <div className="admin-confirm">
                                    <button className="btn-danger-sm" onClick={() => { admin.resetSection(s.key); setConfirmReset(null); }}>Confirm</button>
                                    <button className="btn-cancel-sm" onClick={() => setConfirmReset(null)}>Cancel</button>
                                </div>
                            ) : (
                                <button className="icon-btn danger" onClick={() => setConfirmReset(s.key)}><Trash2 size={14} /></button>
                            )}
                        </div>
                    ))}
                </div>
                <button className="btn-danger admin-reset-all" onClick={() => { if (window.confirm('Are you sure you want to reset ALL data? This cannot be undone.')) admin.resetAll(); }}>
                    <RefreshCw size={16} /> Reset Everything
                </button>
            </div>
        </div>
    );

    // ── Theme ──
    const renderTheme = () => (
        <div className="admin-section">
            <h2>Theme Settings</h2>
            <div className="admin-theme-preview glass-panel">
                <h4>Current Theme</h4>
                <div className="admin-swatch-row">
                    <div className="admin-swatch" style={{ background: 'var(--accent-color)' }}><small>Accent</small></div>
                    <div className="admin-swatch" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}><small>BG</small></div>
                    <div className="admin-swatch" style={{ background: 'var(--surface-color)' }}><small>Surface</small></div>
                    <div className="admin-swatch" style={{ background: 'var(--danger-color)' }}><small>Danger</small></div>
                    <div className="admin-swatch" style={{ background: 'var(--warning-color)' }}><small>Warning</small></div>
                    <div className="admin-swatch" style={{ background: 'var(--success-color)' }}><small>Success</small></div>
                </div>
                <p className="admin-theme-hint">Change themes from the Settings panel (gear icon in the header).</p>
            </div>
        </div>
    );

    // ── Activity Log ──
    const renderLogs = () => (
        <div className="admin-section">
            <div className="admin-log-header">
                <h2>Activity Log</h2>
                {admin.logs.length > 0 && <button className="icon-btn danger" onClick={admin.clearLogs} title="Clear log"><Trash2 size={16} /></button>}
            </div>
            {admin.logs.length > 0 ? (
                <div className="admin-log-list">
                    {admin.logs.map(log => (
                        <div key={log.id} className="admin-log-item">
                            <span className={`admin-log-type ${log.type}`}>{log.type}</span>
                            <span className="admin-log-action">{log.action}</span>
                            <span className="admin-log-time">{timeAgo(log.timestamp)}</span>
                        </div>
                    ))}
                </div>
            ) : <p className="admin-empty">No activity logged yet.</p>}
        </div>
    );

    const content = { overview: renderOverview, users: renderUsers, roles: renderRoles, data: renderData, theme: renderTheme, logs: renderLogs };

    return (
        <div className="admin-page">
            <aside className="admin-left">
                <div className="admin-left-header">
                    <Shield size={20} className="accent-icon" />
                    <h2>Admin</h2>
                </div>
                <nav className="admin-nav">
                    {sections.map(s => {
                        const Icon = s.icon;
                        return (
                            <button key={s.key} className={`admin-nav-btn ${activeSection === s.key ? 'active' : ''}`} onClick={() => setActiveSection(s.key)}>
                                <Icon size={16} /> <span>{s.label}</span> <ChevronRight size={14} className="admin-nav-arrow" />
                            </button>
                        );
                    })}
                </nav>
            </aside>
            <main className="admin-center">
                {content[activeSection]()}
            </main>
        </div>
    );
};

export default AdminPage;
