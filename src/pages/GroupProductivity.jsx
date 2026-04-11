import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import {
    FolderKanban, Users, UserCircle, Target,
    Plus, X, Trash2, Edit3, Search,
    CheckCircle2, Clock, PauseCircle, AlertTriangle,
    Mail, Shield, Eye, Star,
    ChevronRight, Hash, BarChart3
} from 'lucide-react';
import '../styles/GroupProductivity.css';

/* ── Status configs ── */
const projectStatuses = [
    { value: 'not-started', label: 'Not Started', color: 'var(--text-muted)' },
    { value: 'in-progress', label: 'In Progress', color: 'var(--warning-color)' },
    { value: 'on-hold', label: 'On Hold', color: 'var(--danger-color)' },
    { value: 'completed', label: 'Completed', color: 'var(--success-color)' },
];
const goalStatuses = [
    { value: 'not-started', label: 'Not Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'achieved', label: 'Achieved' },
    { value: 'missed', label: 'Missed' },
];
const goalCategories = ['personal', 'team', 'company'];
const roleOptions = ['admin', 'manager', 'member', 'viewer'];
const statusOptions = ['active', 'away', 'offline'];
const projectColors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#ec4899'];

const tabs = [
    { key: 'projects', label: 'Projects', icon: FolderKanban },
    { key: 'teams', label: 'Teams', icon: Users },
    { key: 'users', label: 'Users', icon: UserCircle },
    { key: 'goals', label: 'Goals', icon: Target },
];

const GroupProductivity = () => {
    const ctx = useGroup();
    const [activeTab, setActiveTab] = useState('projects');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);

    // ── Form states ──
    const [form, setForm] = useState({});
    const [krText, setKrText] = useState('');

    const resetForm = () => { setForm({}); setKrText(''); setEditId(null); setShowForm(false); };

    const openCreate = () => { resetForm(); setShowForm(true); };
    const openEdit = (item) => { setForm({ ...item }); setEditId(item.id); setShowForm(true); };

    /* ═══ PROJECTS TAB ═══ */
    const renderProjects = () => {
        const filtered = ctx.projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        const stats = {
            total: ctx.projects.length,
            active: ctx.projects.filter(p => p.status === 'in-progress').length,
            done: ctx.projects.filter(p => p.status === 'completed').length,
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!form.name) return;
            if (editId) { ctx.updateProject(editId, form); }
            else { ctx.addProject({ name: form.name, description: form.description || '', status: form.status || 'not-started', color: form.color || '#4f46e5', deadline: form.deadline || '', members: form.members ? form.members.split(',').map(m => m.trim()) : [] }); }
            resetForm();
        };

        return (
            <>
                <aside className="gp-left">
                    <div className="gp-stats-card glass-panel">
                        <h4><BarChart3 size={16} /> Overview</h4>
                        <div className="gp-stat-row"><span>Total</span><strong>{stats.total}</strong></div>
                        <div className="gp-stat-row"><span>Active</span><strong className="text-warning">{stats.active}</strong></div>
                        <div className="gp-stat-row"><span>Completed</span><strong className="text-success">{stats.done}</strong></div>
                    </div>
                    <div className="gp-filter-section">
                        <span className="gp-filter-label">Status Filter</span>
                        {projectStatuses.map(s => (
                            <button key={s.value} className="gp-filter-btn" onClick={() => setSearch(s.label)}>
                                <span className="dot" style={{ background: s.color }}></span> {s.label}
                            </button>
                        ))}
                    </div>
                </aside>
                <main className="gp-center">
                    <div className="gp-card-grid">
                        {filtered.length > 0 ? filtered.map(p => (
                            <div key={p.id} className="gp-card glass-panel" onClick={() => openEdit(p)}>
                                <div className="gp-card-header">
                                    <span className="gp-color-dot" style={{ background: p.color || '#4f46e5' }}></span>
                                    <h3>{p.name}</h3>
                                    <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); ctx.deleteProject(p.id); }}><Trash2 size={14} /></button>
                                </div>
                                {p.description && <p className="gp-card-desc">{p.description}</p>}
                                <div className="gp-card-meta">
                                    <span className={`status-pill ${p.status}`}>{projectStatuses.find(s => s.value === p.status)?.label || p.status}</span>
                                    {p.deadline && <span className="gp-deadline"><Clock size={12} /> {p.deadline}</span>}
                                </div>
                                <div className="gp-progress-bar"><div className="gp-progress-fill" style={{ width: `${p.progress || 0}%` }}></div></div>
                                <span className="gp-progress-text">{p.progress || 0}% complete</span>
                            </div>
                        )) : <div className="gp-empty">No projects yet. Click "+ Create" to add one.</div>}
                    </div>
                </main>
                <aside className="gp-right">
                    {showForm ? (
                        <form className="gp-form glass-panel" onSubmit={handleSubmit}>
                            <div className="gp-form-header"><Edit3 size={18} className="accent-icon" /><h3>{editId ? 'Edit Project' : 'New Project'}</h3><button type="button" className="detail-close" onClick={resetForm}><X size={16} /></button></div>
                            <label>Name *<input className="gp-input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
                            <label>Description<textarea className="gp-textarea" rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
                            <label>Status<select className="gp-select" value={form.status || 'not-started'} onChange={e => setForm({ ...form, status: e.target.value })}>{projectStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
                            <label>Color
                                <div className="gp-color-row">{projectColors.map(c => <button type="button" key={c} className={`gp-color-swatch ${form.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />)}</div>
                            </label>
                            <label>Deadline<input type="date" className="gp-input" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} /></label>
                            <label>Members (comma separated)<input className="gp-input" value={typeof form.members === 'string' ? form.members : (form.members || []).join(', ')} onChange={e => setForm({ ...form, members: e.target.value })} /></label>
                            <label>Progress ({form.progress || 0}%)<input type="range" min="0" max="100" value={form.progress || 0} onChange={e => setForm({ ...form, progress: parseInt(e.target.value) })} className="gp-range" /></label>
                            <button type="submit" className="btn-primary">{editId ? 'Save Changes' : 'Create Project'}</button>
                        </form>
                    ) : (
                        <div className="gp-empty-panel glass-panel"><FolderKanban size={40} /><p>Select a project to edit or create a new one.</p></div>
                    )}
                </aside>
            </>
        );
    };

    /* ═══ TEAMS TAB ═══ */
    const renderTeams = () => {
        const filtered = ctx.teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!form.name) return;
            const members = form.membersRaw ? form.membersRaw.split(',').map(m => {
                const name = m.trim();
                return { name, role: 'member', initials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2), status: 'active' };
            }) : (form.members || []);
            if (editId) { ctx.updateTeam(editId, { ...form, members }); }
            else { ctx.addTeam({ name: form.name, description: form.description || '', project: form.project || '', members }); }
            resetForm();
        };

        return (
            <>
                <aside className="gp-left">
                    <div className="gp-stats-card glass-panel">
                        <h4><Users size={16} /> Teams</h4>
                        <div className="gp-stat-row"><span>Total Teams</span><strong>{ctx.teams.length}</strong></div>
                        <div className="gp-stat-row"><span>Total Members</span><strong>{ctx.teams.reduce((s, t) => s + (t.members?.length || 0), 0)}</strong></div>
                    </div>
                </aside>
                <main className="gp-center">
                    <div className="gp-card-grid">
                        {filtered.length > 0 ? filtered.map(t => (
                            <div key={t.id} className="gp-card glass-panel" onClick={() => openEdit(t)}>
                                <div className="gp-card-header">
                                    <Users size={18} className="accent-icon" />
                                    <h3>{t.name}</h3>
                                    <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); ctx.deleteTeam(t.id); }}><Trash2 size={14} /></button>
                                </div>
                                {t.description && <p className="gp-card-desc">{t.description}</p>}
                                <div className="gp-card-meta">
                                    {t.project && <span className="status-pill"><FolderKanban size={12} /> {t.project}</span>}
                                    <span className="gp-member-count"><UserCircle size={12} /> {t.members?.length || 0} members</span>
                                </div>
                                {t.members && t.members.length > 0 && (
                                    <div className="gp-avatar-stack">
                                        {t.members.slice(0, 5).map((m, i) => <span key={i} className="gp-mini-avatar">{m.initials || m.name?.[0]}</span>)}
                                        {t.members.length > 5 && <span className="gp-mini-avatar more">+{t.members.length - 5}</span>}
                                    </div>
                                )}
                            </div>
                        )) : <div className="gp-empty">No teams yet. Click "+ Create" to add one.</div>}
                    </div>
                </main>
                <aside className="gp-right">
                    {showForm ? (
                        <form className="gp-form glass-panel" onSubmit={handleSubmit}>
                            <div className="gp-form-header"><Edit3 size={18} className="accent-icon" /><h3>{editId ? 'Edit Team' : 'New Team'}</h3><button type="button" className="detail-close" onClick={resetForm}><X size={16} /></button></div>
                            <label>Team Name *<input className="gp-input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
                            <label>Description<textarea className="gp-textarea" rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
                            <label>Linked Project<input className="gp-input" value={form.project || ''} onChange={e => setForm({ ...form, project: e.target.value })} placeholder="Project name" /></label>
                            <label>Members (comma separated names)<input className="gp-input" value={form.membersRaw !== undefined ? form.membersRaw : (form.members || []).map(m => m.name).join(', ')} onChange={e => setForm({ ...form, membersRaw: e.target.value })} /></label>
                            <button type="submit" className="btn-primary">{editId ? 'Save Changes' : 'Create Team'}</button>
                        </form>
                    ) : (
                        <div className="gp-empty-panel glass-panel"><Users size={40} /><p>Select a team to edit or create a new one.</p></div>
                    )}
                </aside>
            </>
        );
    };

    /* ═══ USERS TAB ═══ */
    const renderUsers = () => {
        const filtered = ctx.users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!form.name) return;
            if (editId) { ctx.updateUser(editId, form); }
            else { ctx.addUser({ name: form.name, email: form.email || '', role: form.role || 'member', department: form.department || '' }); }
            resetForm();
        };

        const roleBadge = (role) => {
            const map = { admin: 'danger', manager: 'warning', member: 'accent', viewer: 'muted' };
            return <span className={`role-badge ${map[role] || 'muted'}`}>{role}</span>;
        };

        const statusDot = (status) => {
            const map = { active: 'var(--success-color)', away: 'var(--warning-color)', offline: 'var(--text-muted)' };
            return <span className="status-dot" style={{ background: map[status] || 'gray' }}></span>;
        };

        return (
            <>
                <aside className="gp-left">
                    <div className="gp-stats-card glass-panel">
                        <h4><UserCircle size={16} /> Directory</h4>
                        <div className="gp-stat-row"><span>Total Users</span><strong>{ctx.users.length}</strong></div>
                        <div className="gp-stat-row"><span>Active</span><strong className="text-success">{ctx.users.filter(u => u.status === 'active').length}</strong></div>
                    </div>
                    <div className="gp-filter-section">
                        <span className="gp-filter-label">Filter by Role</span>
                        {roleOptions.map(r => (
                            <button key={r} className="gp-filter-btn" onClick={() => setSearch(r)}><Shield size={12} /> {r}</button>
                        ))}
                    </div>
                </aside>
                <main className="gp-center">
                    <div className="gp-card-grid">
                        {filtered.length > 0 ? filtered.map(u => (
                            <div key={u.id} className="gp-card glass-panel user-card" onClick={() => openEdit(u)}>
                                <div className="gp-user-avatar">{statusDot(u.status)}{u.initials || u.name?.[0]}</div>
                                <h3>{u.name}</h3>
                                {u.email && <span className="gp-user-email"><Mail size={12} /> {u.email}</span>}
                                <div className="gp-card-meta">{roleBadge(u.role)}{u.department && <span className="gp-dept">{u.department}</span>}</div>
                                <button className="icon-btn danger gp-delete-user" onClick={(e) => { e.stopPropagation(); ctx.deleteUser(u.id); }}><Trash2 size={14} /></button>
                            </div>
                        )) : <div className="gp-empty">No users yet. Click "+ Create" to add one.</div>}
                    </div>
                </main>
                <aside className="gp-right">
                    {showForm ? (
                        <form className="gp-form glass-panel" onSubmit={handleSubmit}>
                            <div className="gp-form-header"><Edit3 size={18} className="accent-icon" /><h3>{editId ? 'Edit User' : 'Add User'}</h3><button type="button" className="detail-close" onClick={resetForm}><X size={16} /></button></div>
                            <label>Full Name *<input className="gp-input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
                            <label>Email<input type="email" className="gp-input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
                            <label>Role<select className="gp-select" value={form.role || 'member'} onChange={e => setForm({ ...form, role: e.target.value })}>{roleOptions.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}</select></label>
                            <label>Department<input className="gp-input" value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })} /></label>
                            <label>Status<select className="gp-select" value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>{statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></label>
                            <button type="submit" className="btn-primary">{editId ? 'Save Changes' : 'Add User'}</button>
                        </form>
                    ) : (
                        <div className="gp-empty-panel glass-panel"><UserCircle size={40} /><p>Select a user to edit or add a new one.</p></div>
                    )}
                </aside>
            </>
        );
    };

    /* ═══ GOALS TAB ═══ */
    const renderGoals = () => {
        const filtered = ctx.goals.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));
        const stats = {
            total: ctx.goals.length,
            achieved: ctx.goals.filter(g => g.status === 'achieved').length,
            inProgress: ctx.goals.filter(g => g.status === 'in-progress').length,
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!form.title) return;
            if (editId) { ctx.updateGoal(editId, form); }
            else { ctx.addGoal({ title: form.title, description: form.description || '', category: form.category || 'personal', status: form.status || 'not-started', targetDate: form.targetDate || '', owner: form.owner || '', keyResults: form.keyResults || [] }); }
            resetForm();
        };

        const addKeyResult = () => {
            if (!krText.trim()) return;
            setForm({ ...form, keyResults: [...(form.keyResults || []), { text: krText.trim(), completed: false }] });
            setKrText('');
        };

        return (
            <>
                <aside className="gp-left">
                    <div className="gp-stats-card glass-panel">
                        <h4><Target size={16} /> Goal Stats</h4>
                        <div className="gp-stat-row"><span>Total</span><strong>{stats.total}</strong></div>
                        <div className="gp-stat-row"><span>Achieved</span><strong className="text-success">{stats.achieved}</strong></div>
                        <div className="gp-stat-row"><span>In Progress</span><strong className="text-warning">{stats.inProgress}</strong></div>
                    </div>
                    <div className="gp-filter-section">
                        <span className="gp-filter-label">Category</span>
                        {goalCategories.map(c => (
                            <button key={c} className="gp-filter-btn" onClick={() => setSearch(c)}><Hash size={12} /> {c}</button>
                        ))}
                    </div>
                </aside>
                <main className="gp-center">
                    <div className="gp-card-grid">
                        {filtered.length > 0 ? filtered.map(g => (
                            <div key={g.id} className="gp-card glass-panel" onClick={() => openEdit(g)}>
                                <div className="gp-card-header">
                                    <Target size={18} className="accent-icon" />
                                    <h3>{g.title}</h3>
                                    <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); ctx.deleteGoal(g.id); }}><Trash2 size={14} /></button>
                                </div>
                                {g.description && <p className="gp-card-desc">{g.description}</p>}
                                <div className="gp-card-meta">
                                    <span className={`status-pill ${g.status}`}>{goalStatuses.find(s => s.value === g.status)?.label || g.status}</span>
                                    <span className={`category-badge ${g.category}`}>{g.category}</span>
                                </div>
                                <div className="gp-progress-bar"><div className="gp-progress-fill" style={{ width: `${g.progress || 0}%` }}></div></div>
                                <span className="gp-progress-text">{g.progress || 0}%</span>
                                {g.keyResults && g.keyResults.length > 0 && (
                                    <div className="gp-kr-list">
                                        {g.keyResults.map((kr, i) => (
                                            <div key={i} className={`gp-kr-item ${kr.completed ? 'done' : ''}`} onClick={(e) => { e.stopPropagation(); ctx.toggleKeyResult(g.id, i); }}>
                                                <CheckCircle2 size={14} /> {kr.text}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )) : <div className="gp-empty">No goals yet. Click "+ Create" to add one.</div>}
                    </div>
                </main>
                <aside className="gp-right">
                    {showForm ? (
                        <form className="gp-form glass-panel" onSubmit={handleSubmit}>
                            <div className="gp-form-header"><Edit3 size={18} className="accent-icon" /><h3>{editId ? 'Edit Goal' : 'New Goal'}</h3><button type="button" className="detail-close" onClick={resetForm}><X size={16} /></button></div>
                            <label>Title *<input className="gp-input" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} required /></label>
                            <label>Description<textarea className="gp-textarea" rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
                            <label>Category<select className="gp-select" value={form.category || 'personal'} onChange={e => setForm({ ...form, category: e.target.value })}>{goalCategories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}</select></label>
                            <label>Status<select className="gp-select" value={form.status || 'not-started'} onChange={e => setForm({ ...form, status: e.target.value })}>{goalStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
                            <label>Target Date<input type="date" className="gp-input" value={form.targetDate || ''} onChange={e => setForm({ ...form, targetDate: e.target.value })} /></label>
                            <label>Owner<input className="gp-input" value={form.owner || ''} onChange={e => setForm({ ...form, owner: e.target.value })} /></label>
                            <div className="gp-kr-section">
                                <span className="gp-filter-label">Key Results</span>
                                {(form.keyResults || []).map((kr, i) => (
                                    <div key={i} className={`gp-kr-item ${kr.completed ? 'done' : ''}`}>
                                        <CheckCircle2 size={14} /> {kr.text}
                                        <button type="button" className="icon-btn" onClick={() => setForm({ ...form, keyResults: form.keyResults.filter((_, idx) => idx !== i) })}><X size={12} /></button>
                                    </div>
                                ))}
                                <div className="gp-kr-add">
                                    <input className="gp-input" placeholder="Add key result..." value={krText} onChange={e => setKrText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyResult(); } }} />
                                    <button type="button" className="icon-btn accent" onClick={addKeyResult}><Plus size={16} /></button>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary">{editId ? 'Save Changes' : 'Create Goal'}</button>
                        </form>
                    ) : (
                        <div className="gp-empty-panel glass-panel"><Target size={40} /><p>Select a goal to edit or create a new one.</p></div>
                    )}
                </aside>
            </>
        );
    };

    const renderContent = { projects: renderProjects, teams: renderTeams, users: renderUsers, goals: renderGoals };

    return (
        <div className="gp-page">
            {/* Tab Bar + Search + Create */}
            <div className="gp-topbar">
                <div className="gp-tabs">
                    {tabs.map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.key} className={`gp-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => { setActiveTab(t.key); setSearch(''); resetForm(); }}>
                                <Icon size={16} /> {t.label}
                            </button>
                        );
                    })}
                </div>
                <div className="gp-topbar-actions">
                    <div className="gp-search-bar">
                        <Search size={16} />
                        <input type="text" placeholder={`Search ${activeTab}...`} value={search} onChange={e => setSearch(e.target.value)} />
                        {search && <button onClick={() => setSearch('')} className="search-clear"><X size={14} /></button>}
                    </div>
                    <button className="btn-primary gp-create-btn" onClick={openCreate}><Plus size={16} /> Create</button>
                </div>
            </div>

            {/* Body */}
            <div className="gp-body">
                {renderContent[activeTab]()}
            </div>
        </div>
    );
};

export default GroupProductivity;
