import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMessaging } from '../context/MessagingContext';
import {
  Home, CheckSquare, Inbox, Calendar, GitMerge,
  BarChart2, Shield, MessageSquare, NotebookPen
} from 'lucide-react';
import '../styles/BottomNav.css';

const BottomNav = () => {
  const { totalUnread } = useMessaging();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/inbox', label: 'Inbox', icon: Inbox },
    { path: '/messages', label: 'Messages', icon: MessageSquare, badge: totalUnread },
    { path: '/notes', label: 'Notes', icon: NotebookPen },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/workflows', label: 'Workflows', icon: GitMerge },
    { path: '/reports', label: 'Reports', icon: BarChart2 },
    { path: '/admin', label: 'Admin', icon: Shield },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${item.path === '/tasks' ? 'tour-nav-link-tasks' : ''}`
            }
          >
            <span className="nav-icon" style={{ position: 'relative' }}>
              <Icon size={20} />
              {item.badge > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -6,
                  background: 'var(--accent-color)', color: '#fff',
                  fontSize: '0.62rem', fontWeight: 700,
                  borderRadius: '50%', width: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{item.badge > 9 ? '9+' : item.badge}</span>
              )}
            </span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
