import React, { useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
    X, CheckCircle2, AlertTriangle, Calendar, Bell, Trash2, CheckCheck
} from 'lucide-react';
import '../styles/NotificationPanel.css';

const ICONS = {
    success: CheckCircle2,
    warning: AlertTriangle,
    event: Calendar,
    info: Bell,
};

const NotificationPanel = ({ isOpen, onClose }) => {
    const { notifications, markAsRead, markAllRead, clearAll, unreadCount } = useNotifications();
    const panelRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const timeAgo = (ts) => {
        // eslint-disable-next-line react-hooks/purity
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="notif-panel glass-panel" ref={panelRef}>
            <div className="notif-header">
                <h3><Bell size={16} /> Notifications {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}</h3>
                <div className="notif-actions">
                    <button onClick={markAllRead} title="Mark all read"><CheckCheck size={16} /></button>
                    <button onClick={clearAll} title="Clear all"><Trash2 size={16} /></button>
                    <button onClick={onClose}><X size={16} /></button>
                </div>
            </div>
            <div className="notif-list">
                {notifications.length === 0 && (
                    <div className="notif-empty">
                        <Bell size={28} />
                        <p>No notifications yet</p>
                    </div>
                )}
                {notifications.map(n => {
                    const Icon = ICONS[n.type] || Bell;
                    return (
                        <div
                            key={n.id}
                            className={`notif-item ${n.read ? 'read' : 'unread'}`}
                            onClick={() => markAsRead(n.id)}
                        >
                            <Icon size={18} className={`notif-icon notif-${n.type || 'info'}`} />
                            <div className="notif-body">
                                <span className="notif-text">{n.message}</span>
                                <span className="notif-time">{timeAgo(n.timestamp)}</span>
                            </div>
                            {!n.read && <span className="notif-dot" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NotificationPanel;
