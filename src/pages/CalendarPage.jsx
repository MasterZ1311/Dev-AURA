import React, { useState, useMemo } from 'react';
import { useCalendar } from '../context/CalendarContext';
import {
    CalendarDays, ChevronLeft, ChevronRight, Plus, X,
    Clock, Trash2, Edit3, Eye, Repeat, Tag, Waves, Sparkles
} from 'lucide-react';
import '../styles/CalendarPage.css';
import TimeRiver from '../components/TimeRiver';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const categoryColors = {
    meeting: '#4f46e5',
    deadline: '#dc2626',
    reminder: '#d97706',
    personal: '#059669',
    other: '#6b7280',
};

const categoryOptions = ['meeting', 'deadline', 'reminder', 'personal', 'other'];
const recurringOptions = ['none', 'daily', 'weekly', 'monthly'];

const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

const CalendarPage = () => {
    const { events, addEvent, updateEvent, deleteEvent, getEventsForDate, healSchedule, isHealing } = useCalendar();
    const today = new Date();
    const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

    const [view, setView] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({});

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const navigate = (dir) => {
        const d = new Date(currentDate);
        if (view === 'month') d.setMonth(d.getMonth() + dir);
        else if (view === 'week') d.setDate(d.getDate() + dir * 7);
        else d.setDate(d.getDate() + dir);
        setCurrentDate(d);
    };

    const goToday = () => { setCurrentDate(new Date()); setSelectedDate(todayStr); };

    const handleHeal = () => {
        healSchedule(selectedDate);
    };

    // Month grid
    const monthGrid = useMemo(() => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        return cells;
    }, [year, month]);

    // Week view
    const weekDates = useMemo(() => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [currentDate]);

    const selectedEvents = getEventsForDate(selectedDate);

    const upcoming = useMemo(() => {
        return events
            .filter(ev => ev.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
            .slice(0, 6);
    }, [events, todayStr]);

    // Form
    const resetForm = () => { setForm({}); setEditId(null); setShowForm(false); };
    const openCreate = (dateStr) => { resetForm(); setForm({ date: dateStr || selectedDate }); setShowForm(true); };
    const openEdit = (ev) => { setForm({ ...ev }); setEditId(ev.id); setShowForm(true); };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title) return;
        if (editId) { updateEvent(editId, form); }
        else { addEvent({ title: form.title, date: form.date || selectedDate, startTime: form.startTime || '', endTime: form.endTime || '', description: form.description || '', category: form.category || 'other', recurring: form.recurring || 'none' }); }
        resetForm();
    };

    const handleDateClick = (day) => {
        if (!day) return;
        const ds = toDateStr(year, month, day);
        setSelectedDate(ds);
    };

    // Event dots for a date
    const getDotsForDate = (dateStr) => {
        const evts = events.filter(ev => ev.date === dateStr);
        const seenCats = new Set();
        return evts.map(ev => {
            if (seenCats.has(ev.category)) return null;
            seenCats.add(ev.category);
            return <span key={ev.category} className="cal-dot" style={{ background: categoryColors[ev.category] || '#6b7280' }}></span>;
        }).filter(Boolean);
    };

    return (
        <div className={`cal-page ${isHealing ? 'healing' : ''}`}>
            {/* LEFT SIDEBAR */}
            <aside className="cal-left">
                {/* Mini month */}
                <div className="cal-mini-month glass-panel">
                    <div className="cal-mini-header">
                        <span className="cal-mini-title">{MONTHS[month]} {year}</span>
                    </div>
                    <div className="cal-mini-grid">
                        {DAYS.map(d => <span key={d} className="cal-mini-day-head">{d[0]}</span>)}
                        {monthGrid.map((day, i) => {
                            const ds = day ? toDateStr(year, month, day) : '';
                            return (
                                <span
                                    key={i}
                                    className={`cal-mini-cell ${!day ? 'empty' : ''} ${ds === todayStr ? 'today' : ''} ${ds === selectedDate ? 'selected' : ''}`}
                                    onClick={() => day && handleDateClick(day)}
                                >
                                    {day || ''}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Upcoming */}
                <div className="cal-upcoming glass-panel">
                    <h4><Clock size={16} /> Upcoming</h4>
                    {upcoming.length > 0 ? upcoming.map(ev => (
                        <div key={ev.id} className="cal-upcoming-item" onClick={() => openEdit(ev)}>
                            <span className="cal-dot" style={{ background: categoryColors[ev.category] || '#6b7280' }}></span>
                            <div className="cal-upcoming-info">
                                <span className="cal-upcoming-title">{ev.title}</span>
                                <span className="cal-upcoming-date">{ev.date} {ev.startTime && `at ${ev.startTime}`}</span>
                            </div>
                        </div>
                    )) : <p className="cal-no-events">No upcoming events</p>}
                </div>

                {/* Category legend */}
                <div className="cal-legend glass-panel">
                    <h4><Tag size={16} /> Categories</h4>
                    {categoryOptions.map(c => (
                        <div key={c} className="cal-legend-item">
                            <span className="cal-dot" style={{ background: categoryColors[c] }}></span>
                            <span>{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                        </div>
                    ))}
                </div>

                <button className="btn-primary cal-add-btn mobile-hide" onClick={() => openCreate(selectedDate)}>
                    <Plus size={16} /> Add Event
                </button>
            </aside>

            {/* MOBILE STICKY ADD BUTTON */}
            <button className="sticky-add-btn mobile-show" onClick={() => openCreate(selectedDate)}>
                <Plus size={24} />
            </button>

            {/* CENTER */}
            <main className="cal-center tour-calendar-view">
                {/* Header */}
                <div className="cal-header">
                    <div className="cal-view-tabs">
                        {['month', 'week', 'day', 'chronos'].map(v => (
                            <button key={v} className={`cal-view-tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
                                {v === 'chronos' ? <><Waves size={14} /> Chronos</> : v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="cal-nav">
                        <button className="cal-nav-btn" onClick={() => navigate(-1)}><ChevronLeft size={18} /></button>
                        <h2 className="cal-nav-title">
                            {view === 'month' && `${MONTHS[month]} ${year}`}
                            {view === 'week' && `Week of ${weekDates[0].toLocaleDateString()}`}
                            {view === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </h2>
                        <button className="cal-nav-btn" onClick={() => navigate(1)}><ChevronRight size={18} /></button>
                        <button className="cal-today-btn" onClick={goToday}>Today</button>
                        
                        <button 
                            className={`cal-heal-btn ${isHealing ? 'active' : ''}`} 
                            onClick={handleHeal}
                            disabled={isHealing}
                        >
                            <Sparkles size={16} /> {isHealing ? 'Healing...' : 'Heal Day'}
                        </button>
                    </div>
                </div>

                {/* Month View */}
                {view === 'month' && (
                    <div className="cal-month-grid">
                        {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
                        {monthGrid.map((day, i) => {
                            const ds = day ? toDateStr(year, month, day) : '';
                            const dots = day ? getDotsForDate(ds) : [];
                            return (
                                <div
                                    key={i}
                                    className={`cal-cell ${!day ? 'empty' : ''} ${ds === todayStr ? 'today' : ''} ${ds === selectedDate ? 'selected' : ''}`}
                                    onClick={() => handleDateClick(day)}
                                >
                                    {day && (
                                        <>
                                            <span className="cal-cell-day">{day}</span>
                                            {dots.length > 0 && <div className="cal-cell-dots">{dots}</div>}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Week View */}
                {view === 'week' && (
                    <div className="cal-week-grid">
                        {weekDates.map(d => {
                            const ds = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
                            const dayEvents = getEventsForDate(ds);
                            return (
                                <div key={ds} className={`cal-week-col ${ds === todayStr ? 'today' : ''} ${ds === selectedDate ? 'selected' : ''}`} onClick={() => setSelectedDate(ds)}>
                                    <div className="cal-week-day-head">
                                        <span className="cal-week-day-name">{DAYS[d.getDay()]}</span>
                                        <span className="cal-week-day-num">{d.getDate()}</span>
                                    </div>
                                    <div className="cal-week-events">
                                        {dayEvents.map(ev => (
                                            <div key={ev.id} className="cal-week-event" style={{ borderLeftColor: categoryColors[ev.category] || '#6b7280' }} onClick={(e) => { e.stopPropagation(); openEdit(ev); }}>
                                                <span className="cal-week-event-title">{ev.title}</span>
                                                {ev.startTime && <span className="cal-week-event-time">{ev.startTime}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Day View */}
                {view === 'day' && (
                    <div className="cal-day-view">
                        <h3 className="cal-day-view-title">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                        <div className="cal-day-events">
                            {(() => {
                                const ds = toDateStr(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                                const dayEvts = getEventsForDate(ds);
                                if (dayEvts.length === 0) return <p className="cal-no-events">No events for this day. Click "Add Event" to create one.</p>;
                                return dayEvts.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')).map(ev => (
                                    <div key={ev.id} className="cal-day-event-card" style={{ borderLeftColor: categoryColors[ev.category] || '#6b7280' }} onClick={() => openEdit(ev)}>
                                        <div className="cal-day-event-header">
                                            <h4>{ev.title}</h4>
                                            <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}><Trash2 size={14} /></button>
                                        </div>
                                        {ev.startTime && <span className="cal-day-event-time"><Clock size={12} /> {ev.startTime}{ev.endTime && ` - ${ev.endTime}`}</span>}
                                        <span className={`cal-category-badge ${ev.category}`}>{ev.category}</span>
                                        {ev.description && <p className="cal-day-event-desc">{ev.description}</p>}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                )}

                {/* Chronos View */}
                {view === 'chronos' && (
                    <TimeRiver dateStr={selectedDate} />
                )}

                {/* Selected date events (for month/week view) */}
                {view !== 'day' && selectedDate && (
                    <div className="cal-selected-events">
                        <h3>Events on {selectedDate}</h3>
                        {selectedEvents.length > 0 ? selectedEvents.map(ev => (
                            <div key={ev.id} className="cal-event-row" onClick={() => openEdit(ev)}>
                                <span className="cal-dot" style={{ background: categoryColors[ev.category] || '#6b7280' }}></span>
                                <span className="cal-event-row-title">{ev.title}</span>
                                {ev.startTime && <span className="cal-event-row-time">{ev.startTime}</span>}
                                <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}><Trash2 size={14} /></button>
                            </div>
                        )) : <p className="cal-no-events">No events. Click a date or "Add Event" to get started.</p>}
                    </div>
                )}
            </main>

            {/* RIGHT — Form */}
            {showForm && (
                <aside className="cal-right">
                    <form className="cal-form glass-panel" onSubmit={handleSubmit}>
                        <div className="cal-form-header">
                            <Edit3 size={18} className="accent-icon" />
                            <h3>{editId ? 'Edit Event' : 'New Event'}</h3>
                            <button type="button" className="detail-close" onClick={resetForm}><X size={16} /></button>
                        </div>
                        <label>Title *<input className="gp-input" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} required /></label>
                        <label>Date *<input type="date" className="gp-input" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} required /></label>
                        <div className="cal-time-row">
                            <label>Start Time<input type="time" className="gp-input" value={form.startTime || ''} onChange={e => setForm({ ...form, startTime: e.target.value })} /></label>
                            <label>End Time<input type="time" className="gp-input" value={form.endTime || ''} onChange={e => setForm({ ...form, endTime: e.target.value })} /></label>
                        </div>
                        <label>Category<select className="gp-select" value={form.category || 'other'} onChange={e => setForm({ ...form, category: e.target.value })}>{categoryOptions.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}</select></label>
                        <label>Recurring<select className="gp-select" value={form.recurring || 'none'} onChange={e => setForm({ ...form, recurring: e.target.value })}>{recurringOptions.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}</select></label>
                        <label>Description<textarea className="gp-textarea" rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Notes..." /></label>
                        <div className="cal-form-actions">
                            <button type="submit" className="btn-primary">{editId ? 'Save' : 'Create Event'}</button>
                            {editId && <button type="button" className="btn-danger" onClick={() => { deleteEvent(editId); resetForm(); }}><Trash2 size={14} /> Delete</button>}
                        </div>
                    </form>
                </aside>
            )}
        </div>
    );
};

export default CalendarPage;
