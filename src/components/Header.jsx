import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import SearchModal from './SearchModal';
import NotificationPanel from './NotificationPanel';
import { Search, Bell, Settings, User, Zap } from 'lucide-react';
import '../styles/Header.css';

const Header = ({ onOpenSettings, onOpenSearch }) => {
    const { currentUser, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const profileRef = useRef(null);
    const notifRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [profileRef]);

    const initials = currentUser?.name
        ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'AU';

    return (
        <header className="header">
            <div className="header-left">
                <button className="btn-icon" onClick={onOpenSearch} title="Search (Ctrl+K)">
                    <Search size={20} />
                </button>
            </div>

                <div className="header-center">
                    <div className="brand-area">
                        <img src="/aura-logo.png" alt="Aura" className="brand-logo" />
                        <div className="brand-info">
                            <div className="brand-subtitle">Clarity for your work, peace for your mind.</div>
                        </div>
                    </div>
                </div>

                <div className="header-right">
                    <div style={{ position: 'relative' }} ref={notifRef}>
                        <button className="btn-icon notif-trigger" onClick={() => setShowNotifs(prev => !prev)}>
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="notif-count-badge">{unreadCount}</span>}
                        </button>
                        <NotificationPanel isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
                    </div>
                    <button className="btn-icon" onClick={onOpenSettings} title="Settings (Ctrl+\\)">
                        <Settings size={20} />
                    </button>

                    <div className="profile-container" ref={profileRef} style={{ position: 'relative' }}>
                        <div
                            className="user-avatar"
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            {initials}
                        </div>

                                {showProfileMenu && (
                                    <div className="profile-dropdown glass-panel">
                                        <div className="profile-info">
                                            <h4>{currentUser?.name || 'Admin User'}</h4>
                                            <p>{currentUser?.email || 'admin@example.com'}</p>
                                            {currentUser?.auraUID && (
                                                <div className="profile-id-row" onClick={() => {
                                                    navigator.clipboard.writeText(currentUser.auraUID);
                                                    alert('Aura ID copied!');
                                                }} title="Click to copy ID">
                                                    <Zap size={12} className="accent-icon" />
                                                    <span>{currentUser.auraUID}</span>
                                                </div>
                                            )}
                                        </div>
                                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
                                        <button className="logout-btn" onClick={logout}>Sign Out</button>
                </div>
            )}
                </div>
            </div>
        </header>
    );
};

export default Header;
