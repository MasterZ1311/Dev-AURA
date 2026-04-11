import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home,
    CheckSquare,
    Inbox,
    FolderKanban,
    Calendar,
    BarChart2,
    GitMerge,
    Shield
} from 'lucide-react';
import '../styles/BottomNav.css';

const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/inbox', label: 'Inbox', icon: Inbox },
    { path: '/projects', label: 'Groups', icon: FolderKanban },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/reports', label: 'Reports', icon: BarChart2 },
    { path: '/workflows', label: 'Workflows', icon: GitMerge },
    { path: '/admin', label: 'Admin', icon: Shield },
];

const BottomNav = () => {
    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const Icon = item.icon;
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        <span className="nav-icon"><Icon size={20} /></span>
                        <span>{item.label}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
};

export default BottomNav;
