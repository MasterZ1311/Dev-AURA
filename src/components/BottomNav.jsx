import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useMessaging } from '../context/MessagingContext';
import {
  Home, CheckSquare, Inbox, Calendar, GitMerge,
  BarChart2, Shield, MessageSquare, NotebookPen, Menu, X, Users
} from 'lucide-react';
import '../styles/BottomNav.css';

const BottomNav = () => {
  const { totalUnread } = useMessaging();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/workflows', label: 'Workflows', icon: GitMerge },
    { path: '/inbox', label: 'Inbox', icon: Inbox },
    { path: '/messages', label: 'Messages', icon: MessageSquare, badge: totalUnread },
    { path: '/notes', label: 'Notes', icon: NotebookPen },
    { path: '/projects', label: 'Team', icon: Users },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/reports', label: 'Reports', icon: BarChart2 },
    { path: '/admin', label: 'Admin', icon: Shield },
  ];

  const renderNavItem = (item, isMoreItem = false) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `nav-item ${isActive ? 'active' : ''} ${item.path === '/tasks' ? 'tour-nav-link-tasks' : ''} ${isMoreItem ? 'more-menu-item' : ''}`
        }
        onClick={() => {
            if (isMoreItem) setShowMoreMenu(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <span className="nav-icon" style={{ position: 'relative' }}>
          <Icon size={20} />
          {item.badge > 0 && (
            <span className="nav-badge">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </span>
        <span>{item.label}</span>
      </NavLink>
    );
  };

  const primaryItems = isMobile 
    ? allNavItems.slice(0, 4) 
    : allNavItems;
    
  const overflowItems = isMobile ? allNavItems.slice(4) : [];

  return (
    <>
      {isMobile && showMoreMenu && (
        <div className="more-menu-overlay" onClick={() => setShowMoreMenu(false)}>
          <div className="more-menu-content" onClick={e => e.stopPropagation()}>
            <div className="more-menu-header">
              <h3>More</h3>
              <button onClick={() => setShowMoreMenu(false)} className="close-menu-btn"><X size={20}/></button>
            </div>
            <div className="more-menu-grid">
              {overflowItems.map(item => renderNavItem(item, true))}
            </div>
          </div>
        </div>
      )}
      
      <nav className="bottom-nav">
        {primaryItems.map(item => renderNavItem(item))}
        
        {isMobile && (
          <button 
            className={`nav-item more-btn ${showMoreMenu ? 'active' : ''}`} 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          >
            <span className="nav-icon"><Menu size={20} /></span>
            <span>Menu</span>
          </button>
        )}
      </nav>
    </>
  );
};

export default BottomNav;
