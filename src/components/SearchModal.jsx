import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import { useGroup } from '../context/GroupContext';
import { useCalendar } from '../context/CalendarContext';
import { useWorkflow } from '../context/WorkflowContext';
import { useInbox } from '../context/InboxContext';
import {
    Search, X, CheckSquare, Inbox, FolderKanban, Users, Target,
    Calendar, GitBranch, ArrowRight
} from 'lucide-react';
import '../styles/SearchModal.css';

const SearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const { tasks } = useTasks();
    const { projects, teams, goals } = useGroup();
    const { events } = useCalendar();
    const { workflows } = useWorkflow();
    const { items: inboxItems } = useInbox();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setQuery('');
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const items = [];

        tasks.forEach(t => {
            if (t.title.toLowerCase().includes(q))
                items.push({ type: 'Task', icon: CheckSquare, text: t.title, sub: t.project || '', route: '/tasks' });
        });
        projects.forEach(p => {
            if (p.name.toLowerCase().includes(q))
                items.push({ type: 'Project', icon: FolderKanban, text: p.name, sub: `${p.tasks?.length || 0} tasks`, route: '/projects' });
        });
        teams.forEach(t => {
            if (t.name.toLowerCase().includes(q))
                items.push({ type: 'Team', icon: Users, text: t.name, sub: `${t.members?.length || 0} members`, route: '/projects' });
        });
        goals.forEach(g => {
            if (g.title.toLowerCase().includes(q))
                items.push({ type: 'Goal', icon: Target, text: g.title, sub: g.status, route: '/projects' });
        });
        events.forEach(e => {
            if (e.title?.toLowerCase().includes(q))
                items.push({ type: 'Event', icon: Calendar, text: e.title, sub: e.date || '', route: '/calendar' });
        });
        workflows.forEach(w => {
            if (w.name.toLowerCase().includes(q))
                items.push({ type: 'Workflow', icon: GitBranch, text: w.name, sub: `${w.columns?.length || 0} columns`, route: '/workflows' });
        });
        inboxItems.forEach(i => {
            if (i.subject?.toLowerCase().includes(q) || i.from?.toLowerCase().includes(q))
                items.push({ type: 'Inbox', icon: Inbox, text: i.subject, sub: i.from || '', route: '/inbox' });
        });

        return items.slice(0, 15);
    }, [query, tasks, projects, teams, goals, events, workflows, inboxItems]);

    const handleSelect = useCallback((route) => {
        navigate(route);
        onClose();
    }, [navigate, onClose]);

    if (!isOpen) return null;

    return (
        <div className="search-overlay" onClick={onClose}>
            <div className="search-modal" onClick={e => e.stopPropagation()}>
                <div className="search-input-row">
                    <Search size={20} className="search-input-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search tasks, projects, events, teams…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="search-input"
                    />
                    <kbd className="search-kbd">ESC</kbd>
                    <button className="search-close" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="search-results">
                    {query.trim() && results.length === 0 && (
                        <div className="search-empty">No results for "{query}"</div>
                    )}
                    {results.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <button key={i} className="search-result-item" onClick={() => handleSelect(item.route)}>
                                <Icon size={18} className="result-icon" />
                                <div className="result-body">
                                    <span className="result-text">{item.text}</span>
                                    <span className="result-sub">{item.sub}</span>
                                </div>
                                <span className="result-type">{item.type}</span>
                                <ArrowRight size={14} className="result-arrow" />
                            </button>
                        );
                    })}
                    {!query.trim() && (
                        <div className="search-hints">
                            <p>Try searching for tasks, projects, events, or team members…</p>
                            <div className="search-shortcuts">
                                <span><kbd>Ctrl</kbd>+<kbd>K</kbd> Search</span>
                                <span><kbd>Ctrl</kbd>+<kbd>N</kbd> New Task</span>
                                <span><kbd>Ctrl</kbd>+<kbd>\\</kbd> Settings</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
