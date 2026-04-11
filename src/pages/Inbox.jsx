import React, { useState, useMemo } from 'react';
import { useInbox } from '../context/InboxContext';
import {
    Search,
    Inbox as InboxIcon,
    Mail,
    MailOpen,
    Star,
    StarOff,
    Archive,
    Trash2,
    CheckCheck,
    ClipboardList,
    AtSign,
    Bell,
    Users,
    Megaphone,
    Clock,
    Flag,
    Reply,
    X,
    Plus,
    Send
} from 'lucide-react';
import '../styles/Inbox.css';

/* Category config */
const categories = [
    { key: 'all', label: 'All Inbox', icon: InboxIcon },
    { key: 'assignment', label: 'Task Assignments', icon: ClipboardList },
    { key: 'mention', label: 'Mentions', icon: AtSign },
    { key: 'reminder', label: 'Reminders', icon: Bell },
    { key: 'team', label: 'Team Updates', icon: Users },
    { key: 'announcement', label: 'Announcements', icon: Megaphone },
];

const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
];

/* Time formatting */
const timeAgo = (ts) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};

const Inbox = () => {
    const { items, addItem, markRead, markAllRead, toggleStar, archiveItem, deleteItem, unreadCount } = useInbox();

    const [activeCategory, setActiveCategory] = useState('all');
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [showCompose, setShowCompose] = useState(false);

    // Compose form state
    const [compSender, setCompSender] = useState('');
    const [compSubject, setCompSubject] = useState('');
    const [compBody, setCompBody] = useState('');
    const [compCategory, setCompCategory] = useState('assignment');
    const [compPriority, setCompPriority] = useState('medium');

    // Filtered items
    const visibleItems = useMemo(() => {
        let list = items.filter(i => !i.archived);

        if (activeCategory !== 'all') {
            list = list.filter(i => i.category === activeCategory);
        }
        if (activeFilter === 'unread') {
            list = list.filter(i => !i.read);
        } else if (activeFilter === 'starred') {
            list = list.filter(i => i.starred);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(i =>
                i.subject.toLowerCase().includes(q) ||
                i.sender.toLowerCase().includes(q) ||
                (i.preview || '').toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => b.time - a.time);
    }, [items, activeCategory, activeFilter, searchQuery]);

    // Selected item
    const selectedItem = useMemo(() => {
        return items.find(i => i.id === selectedId) || null;
    }, [items, selectedId]);

    const handleSelect = (item) => {
        setSelectedId(item.id);
        setShowCompose(false);
        if (!item.read) markRead(item.id);
    };

    // Category unread counts
    const categoryCounts = useMemo(() => {
        const counts = {};
        items.filter(i => !i.archived && !i.read).forEach(i => {
            counts[i.category] = (counts[i.category] || 0) + 1;
        });
        counts.all = items.filter(i => !i.archived && !i.read).length;
        return counts;
    }, [items]);

    // Compose submit
    const handleCompose = (e) => {
        e.preventDefault();
        if (!compSubject.trim() || !compBody.trim()) return;

        const senderName = compSender.trim() || 'You';
        const initials = senderName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

        addItem({
            category: compCategory,
            sender: senderName,
            senderInitials: initials,
            subject: compSubject.trim(),
            body: compBody.trim(),
            preview: compBody.trim().slice(0, 80) + (compBody.length > 80 ? '...' : ''),
            priority: compPriority,
        });

        // Reset form
        setCompSender('');
        setCompSubject('');
        setCompBody('');
        setCompCategory('assignment');
        setCompPriority('medium');
        setShowCompose(false);
    };

    return (
        <div className="inbox-page">
            {/* LEFT COLUMN */}
            <aside className="inbox-left">
                <div className="inbox-left-header">
                    <InboxIcon size={20} className="accent-icon" />
                    <h2>Inbox</h2>
                    {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                </div>

                {/* Compose Button */}
                <button className="compose-btn btn-primary" onClick={() => { setShowCompose(true); setSelectedId(null); }}>
                    <Plus size={18} /> Compose
                </button>

                {/* Quick Filters */}
                <div className="quick-filters">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'unread', label: 'Unread' },
                        { key: 'starred', label: 'Starred' },
                    ].map(f => (
                        <button
                            key={f.key}
                            className={`qf-btn ${activeFilter === f.key ? 'active' : ''}`}
                            onClick={() => setActiveFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Category Filters */}
                <nav className="category-nav">
                    <span className="nav-section-label">Categories</span>
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        const count = categoryCounts[cat.key] || 0;
                        return (
                            <button
                                key={cat.key}
                                className={`cat-btn ${activeCategory === cat.key ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.key)}
                            >
                                <Icon size={16} />
                                <span className="cat-label">{cat.label}</span>
                                {count > 0 && <span className="cat-count">{count}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Mark all read */}
                <button className="mark-all-btn" onClick={markAllRead}>
                    <CheckCheck size={16} /> Mark all as read
                </button>
            </aside>

            {/* CENTER COLUMN */}
            <main className="inbox-center">
                {/* Search */}
                <div className="inbox-search glass-panel">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search inbox..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => setSearchQuery('')}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="inbox-list">
                    {visibleItems.length > 0 ? visibleItems.map(item => (
                        <div
                            key={item.id}
                            className={`inbox-item ${!item.read ? 'unread' : ''} ${selectedId === item.id ? 'selected' : ''}`}
                            onClick={() => handleSelect(item)}
                        >
                            <div className={`inbox-avatar ${item.category}`}>
                                {item.senderInitials}
                            </div>
                            <div className="inbox-item-body">
                                <div className="inbox-item-top">
                                    <span className="inbox-sender">{item.sender}</span>
                                    <span className="inbox-time"><Clock size={12} /> {timeAgo(item.time)}</span>
                                </div>
                                <span className="inbox-subject">{item.subject}</span>
                                <span className="inbox-preview">{item.preview}</span>
                            </div>
                            <div className="inbox-item-indicators">
                                <span className={`priority-dot ${item.priority}`}></span>
                                <button
                                    className={`star-btn ${item.starred ? 'starred' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); toggleStar(item.id); }}
                                    title={item.starred ? 'Unstar' : 'Star'}
                                >
                                    {item.starred ? <Star size={16} /> : <StarOff size={16} />}
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="inbox-empty">
                            <MailOpen size={40} />
                            <p>{items.length === 0 ? 'Your inbox is empty. Compose a message to get started!' : 'No messages match your filters.'}</p>
                        </div>
                    )}
                </div>
            </main>

            {/* RIGHT COLUMN */}
            <aside className="inbox-right">
                {showCompose ? (
                    /* Compose Form */
                    <div className="detail-panel">
                        <div className="compose-header">
                            <Send size={20} className="accent-icon" />
                            <h3>Compose Message</h3>
                            <button className="detail-close" onClick={() => setShowCompose(false)} title="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <form className="compose-form" onSubmit={handleCompose}>
                            <div className="compose-field">
                                <label>From</label>
                                <input
                                    type="text"
                                    placeholder="Sender name"
                                    value={compSender}
                                    onChange={e => setCompSender(e.target.value)}
                                    className="compose-input"
                                />
                            </div>
                            <div className="compose-field">
                                <label>Subject <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Message subject"
                                    value={compSubject}
                                    onChange={e => setCompSubject(e.target.value)}
                                    className="compose-input"
                                    required
                                />
                            </div>
                            <div className="compose-row">
                                <div className="compose-field">
                                    <label>Category</label>
                                    <select value={compCategory} onChange={e => setCompCategory(e.target.value)} className="compose-select">
                                        {categories.filter(c => c.key !== 'all').map(c => (
                                            <option key={c.key} value={c.key}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="compose-field">
                                    <label>Priority</label>
                                    <select value={compPriority} onChange={e => setCompPriority(e.target.value)} className="compose-select">
                                        {priorityOptions.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="compose-field">
                                <label>Message <span className="required">*</span></label>
                                <textarea
                                    placeholder="Write your message..."
                                    value={compBody}
                                    onChange={e => setCompBody(e.target.value)}
                                    className="compose-textarea"
                                    rows={6}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary compose-submit">
                                <Send size={16} /> Send Message
                            </button>
                        </form>
                    </div>
                ) : selectedItem ? (
                    /* Detail Panel */
                    <div className="detail-panel">
                        <div className="detail-header">
                            <div className={`detail-avatar ${selectedItem.category}`}>
                                {selectedItem.senderInitials}
                            </div>
                            <div className="detail-meta">
                                <span className="detail-sender">{selectedItem.sender}</span>
                                <span className="detail-time">{timeAgo(selectedItem.time)}</span>
                            </div>
                            <button className="detail-close" onClick={() => setSelectedId(null)} title="Close">
                                <X size={18} />
                            </button>
                        </div>

                        <span className={`detail-category-badge ${selectedItem.category}`}>
                            {categories.find(c => c.key === selectedItem.category)?.label || selectedItem.category}
                        </span>

                        <h3 className="detail-subject">{selectedItem.subject}</h3>

                        <div className="detail-priority-row">
                            <Flag size={14} />
                            <span className={`detail-priority ${selectedItem.priority}`}>
                                {selectedItem.priority.charAt(0).toUpperCase() + selectedItem.priority.slice(1)} Priority
                            </span>
                        </div>

                        <div className="detail-body">
                            <p>{selectedItem.body}</p>
                        </div>

                        {selectedItem.relatedTask && (
                            <div className="detail-related">
                                <ClipboardList size={14} />
                                <span>Related: <strong>{selectedItem.relatedTask}</strong></span>
                            </div>
                        )}

                        <div className="detail-actions">
                            <button
                                className={`action-btn ${selectedItem.starred ? 'starred' : ''}`}
                                onClick={() => toggleStar(selectedItem.id)}
                            >
                                {selectedItem.starred ? <Star size={16} /> : <StarOff size={16} />}
                                {selectedItem.starred ? 'Unstar' : 'Star'}
                            </button>
                            <button className="action-btn" onClick={() => { archiveItem(selectedItem.id); setSelectedId(null); }}>
                                <Archive size={16} /> Archive
                            </button>
                            <button className="action-btn danger" onClick={() => { deleteItem(selectedItem.id); setSelectedId(null); }}>
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>

                        <div className="detail-reply">
                            <Reply size={16} className="accent-icon" />
                            <textarea placeholder="Quick reply..." rows={3} className="reply-textarea" />
                        </div>
                    </div>
                ) : (
                    /* Empty state */
                    <div className="detail-empty">
                        <Mail size={48} />
                        <h3>Select a message</h3>
                        <p>Click on any inbox item to view its details, or compose a new message.</p>
                    </div>
                )}
            </aside>
        </div>
    );
};

export default Inbox;
