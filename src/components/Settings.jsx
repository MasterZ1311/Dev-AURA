import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { X, User, Save, Keyboard, Monitor, Zap, Brain } from 'lucide-react';
import AISettingsPanel from './AISettingsPanel';
import '../styles/Settings.css';

const themes = [
    { id: 'OLED Dark', label: 'OLED Dark', class: 'theme-oled', desc: 'Pure black with teal accents' },
    { id: 'Clean Light', label: 'Clean Light', class: 'theme-clean', desc: 'Crisp white workspace' },
    { id: 'Synthwave', label: 'Synthwave', class: 'theme-synth', desc: 'Neon pink retro vibes' },
    { id: 'Cyberpunk', label: 'Cyberpunk', class: 'theme-cyber', desc: 'Dark blue with electric yellow' },
    { id: 'Crimson', label: 'Crimson', class: 'theme-crimson', desc: 'Deep red ember glow' },
    { id: 'Forest', label: 'Forest', class: 'theme-forest', desc: 'Dark green canopy' },
    { id: 'Ocean', label: 'Ocean', class: 'theme-ocean', desc: 'Deep blue with aqua' },
    { id: 'Dune', label: 'Dune', class: 'theme-dune', desc: 'Warm sand and amber' },
    { id: 'Sakura', label: 'Sakura', class: 'theme-sakura', desc: 'Soft cherry blossom pink' },
    { id: 'Solarized', label: 'Solarized', class: 'theme-solar', desc: 'Classic teal on dark' },
    { id: 'Dracula', label: 'Dracula', class: 'theme-dracula', desc: 'Purple and pink mist' },
    { id: 'Nord', label: 'Nord', class: 'theme-nord', desc: 'Arctic aurora blues' },
];

const defaultShortcuts = [
    { action: 'Search', keys: 'Ctrl+K' },
    { action: 'Settings', keys: 'Ctrl+\\' },
    { action: 'New Task', keys: 'Ctrl+N' },
    { action: 'Dashboard', keys: 'Ctrl+1' },
    { action: 'Tasks', keys: 'Ctrl+2' },
    { action: 'Inbox', keys: 'Ctrl+3' },
    { action: 'Calendar', keys: 'Ctrl+4' },
];

const Settings = ({ onClose }) => {
    const { currentUser, updateProfile } = useAuth();
    const { theme, changeTheme, liveBg, toggleLiveBg, lowGraphics, toggleLowGraphics } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [status, setStatus] = useState(currentUser?.status || 'Active');
    const [saveMsg, setSaveMsg] = useState('');

    const handleSaveProfile = () => {
        if (updateProfile) {
            updateProfile({ name, email, status });
        }
        setSaveMsg('Profile saved!');
        setTimeout(() => setSaveMsg(''), 2000);
    };

    const tabs = [
        { key: 'profile',   label: 'Profile',    icon: User },
        { key: 'themes',    label: 'Themes',     icon: Monitor },
        { key: 'ai',        label: 'AI',         icon: Brain },
        { key: 'shortcuts', label: 'Shortcuts',  icon: Keyboard },
    ];

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>Settings</h2>
                    <div className="settings-tabs">
                        {tabs.map(t => (
                            <button
                                key={t.key}
                                className={`settings-tab ${activeTab === t.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(t.key)}
                            >
                                <t.icon size={14} />
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <button className="close-btn btn-icon" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="settings-content">
                    {activeTab === 'profile' && (
                        <section className="settings-section">
                            <h3>Profile</h3>
                            <div className="profile-avatar-edit">
                                <div className="avatar-large">
                                    {name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AU'}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="Active">Active</option>
                                    <option value="Away">Away</option>
                                    <option value="Do Not Disturb">Do Not Disturb</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button className="save-btn" onClick={handleSaveProfile}>
                                    <Save size={16} /> Save Changes
                                </button>
                                {saveMsg && <span className="save-feedback">{saveMsg}</span>}
                            </div>
                        </section>
                    )}

                    {activeTab === 'themes' && (
                        <section className="settings-section">
                            <h3>Theme</h3>

                            <div className="live-bg-toggle-row">
                                <div className="live-bg-toggle-info">
                                    <Monitor size={18} />
                                    <div>
                                        <span className="live-bg-label">Live Background</span>
                                        <span className="live-bg-desc">Animated ambient effects behind your workspace</span>
                                    </div>
                                </div>
                                <button
                                    className={`toggle-switch ${liveBg ? 'active' : ''}`}
                                    onClick={toggleLiveBg}
                                    aria-label="Toggle live background"
                                >
                                    <span className="toggle-knob" />
                                </button>
                            </div>

                            <div className="live-bg-toggle-row">
                                <div className="live-bg-toggle-info">
                                    <Zap size={18} />
                                    <div>
                                        <span className="live-bg-label">Low Graphics Mode</span>
                                        <span className="live-bg-desc">Disable complex SVG filters for peak performance</span>
                                    </div>
                                </div>
                                <button
                                    className={`toggle-switch ${lowGraphics ? 'active' : ''}`}
                                    onClick={toggleLowGraphics}
                                    aria-label="Toggle low graphics"
                                >
                                    <span className="toggle-knob" />
                                </button>
                            </div>

                            <div className="theme-grid">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        className={`theme-card ${t.class} ${theme === t.id ? 'active' : ''}`}
                                        onClick={() => changeTheme(t.id)}
                                    >
                                        <span className="theme-card-name">{t.label}</span>
                                        <span className="theme-card-desc">{t.desc}</span>
                                        {theme === t.id && <span className="theme-active-badge">Active</span>}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeTab === 'ai' && <AISettingsPanel />}

                    {activeTab === 'shortcuts' && (
                        <section className="settings-section">
                            <h3>Keyboard Shortcuts</h3>
                            <div className="shortcuts-list">
                                {defaultShortcuts.map(s => (
                                    <div key={s.action} className="shortcut-row">
                                        <span className="shortcut-action">{s.action}</span>
                                        <kbd className="shortcut-key">{s.keys}</kbd>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
