import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import {
  NotebookPen, Search, Pin, Tag, Trash2, Plus, X,
  Mail, MessageSquare, FileText, Clock, ChevronDown
} from 'lucide-react';
import '../styles/NotesPage.css';

const timeStr = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const sourceIcon = (src) => {
  if (src === 'gmail') return <span className="note-source-badge gmail"><Mail size={11} /> Gmail</span>;
  if (src === 'aura') return <span className="note-source-badge aura"><MessageSquare size={11} /> Aura</span>;
  return <span className="note-source-badge manual"><FileText size={11} /> Manual</span>;
};

const NotesPage = () => {
  const {
    pinnedNotes, unpinnedNotes, loading,
    createNote, updateNote, deleteNote, pinNote, addTag, removeTag, searchNotes,
  } = useNotes();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [filterSource, setFilterSource] = useState('all');
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const saveTimer = useRef(null);

  // Build filtered list
  const allNotes = useMemo(() => {
    const searched = searchQuery.trim() ? searchNotes(searchQuery) : [...pinnedNotes, ...unpinnedNotes];
    if (filterSource === 'all') return searched;
    return searched.filter(n => (n.sourceType || 'manual') === filterSource);
  }, [searchQuery, pinnedNotes, unpinnedNotes, filterSource, searchNotes]);

  const selectedNote = useMemo(() => allNotes.find(n => n.id === selectedId) || null, [allNotes, selectedId]);

  // Sync editor when selection changes
  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title || '');
      setEditContent(selectedNote.content || '');
      setIsDirty(false);
    }
  }, [selectedId]);

  // Auto-save on change (debounced)
  const handleContentChange = (val) => {
    setEditContent(val);
    setIsDirty(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (selectedId) updateNote(selectedId, { content: val, title: editTitle });
    }, 1000);
  };

  const handleTitleChange = (val) => {
    setEditTitle(val);
    setIsDirty(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (selectedId) updateNote(selectedId, { title: val, content: editContent });
    }, 800);
  };

  const handleSaveNow = () => {
    if (selectedId) {
      updateNote(selectedId, { title: editTitle, content: editContent });
      setIsDirty(false);
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (!tagInput.trim() || !selectedId) return;
    addTag(selectedId, tagInput.trim());
    setTagInput('');
  };

  const handleNewNote = async () => {
    const id = await createNote({ title: 'New Note', content: '' });
    setSelectedId(id);
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="notes-page">
      {/* ── LEFT: Note List ── */}
      <aside className="notes-left">
        <div className="notes-left-header">
          <div className="notes-title-row">
            <NotebookPen size={20} className="accent-icon" />
            <h2>Notes</h2>
            <span className="notes-count">{allNotes.length}</span>
          </div>
          <button className="btn-primary btn-new-note" onClick={handleNewNote}>
            <Plus size={16} /> New Note
          </button>
        </div>

        {/* Search */}
        <div className="notes-search glass-panel">
          <Search size={16} className="notes-search-icon" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="notes-search-input"
          />
          {searchQuery && <button className="notes-search-clear" onClick={() => setSearchQuery('')}><X size={14} /></button>}
        </div>

        {/* Source Filter */}
        <div className="notes-filter-row">
          {['all', 'gmail', 'aura', 'manual'].map(f => (
            <button
              key={f}
              className={`notes-filter-btn ${filterSource === f ? 'active' : ''}`}
              onClick={() => setFilterSource(f)}
            >
              {f === 'all' ? 'All' : f === 'gmail' ? '📧 Gmail' : f === 'aura' ? '💬 Aura' : '📝 Manual'}
            </button>
          ))}
        </div>

        {/* Notes list */}
        <div className="notes-list">
          {loading ? (
            <div className="notes-loading">Loading notes...</div>
          ) : allNotes.length === 0 ? (
            <div className="notes-empty">
              <NotebookPen size={36} />
              <p>No notes yet. Save a message as a note from the Inbox, or create one manually.</p>
            </div>
          ) : allNotes.map(note => (
            <div
              key={note.id}
              className={`note-card ${selectedId === note.id ? 'selected' : ''} ${note.pinned ? 'pinned' : ''}`}
              onClick={() => setSelectedId(note.id)}
            >
              <div className="note-card-top">
                <span className="note-card-title">{note.title || 'Untitled'}</span>
                {note.pinned && <Pin size={13} className="note-pin-icon" />}
              </div>
              <span className="note-card-preview">
                {note.content ? note.content.slice(0, 70) + (note.content.length > 70 ? '…' : '') : note.sourceSummary?.slice(0, 70) || 'No content yet'}
              </span>
              <div className="note-card-footer">
                {sourceIcon(note.sourceType)}
                <span className="note-card-date"><Clock size={10} /> {timeStr(note.updatedAt)}</span>
              </div>
              {note.tags?.length > 0 && (
                <div className="note-card-tags">
                  {note.tags.slice(0, 3).map(t => <span key={t} className="note-tag-pill">{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ── RIGHT: Note Editor ── */}
      <main className="notes-editor">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="editor-header">
              <input
                type="text"
                className="editor-title-input"
                value={editTitle}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Note title..."
              />
              <div className="editor-actions">
                {isDirty && (
                  <button className="btn-save-note btn-primary" onClick={handleSaveNow}>Save</button>
                )}
                <button
                  className={`pin-btn ${selectedNote.pinned ? 'pinned' : ''}`}
                  onClick={() => pinNote(selectedNote.id)}
                  title={selectedNote.pinned ? 'Unpin' : 'Pin note'}
                >
                  <Pin size={16} />
                </button>
                <button className="delete-note-btn" onClick={() => handleDelete(selectedNote.id)} title="Delete note">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Source Reference */}
            {selectedNote.sourceSummary && (
              <div className="editor-source-ref">
                <div className="source-ref-header">
                  {sourceIcon(selectedNote.sourceType)}
                  <span className="source-ref-label">Original message</span>
                </div>
                <p className="source-ref-text">{selectedNote.sourceSummary}</p>
              </div>
            )}

            {/* Content Editor */}
            <textarea
              className="editor-textarea"
              placeholder="Write your notes here... Changes save automatically."
              value={editContent}
              onChange={e => handleContentChange(e.target.value)}
            />

            {/* Tags */}
            <div className="editor-tags-section">
              <Tag size={14} className="accent-icon" />
              <div className="editor-tags-list">
                {(selectedNote.tags || []).map(t => (
                  <span key={t} className="editor-tag">
                    {t}
                    <button onClick={() => removeTag(selectedNote.id, t)} className="tag-remove"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTag} className="tag-add-form">
                <input
                  type="text"
                  className="tag-add-input"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                />
              </form>
            </div>

            <div className="editor-meta">
              <span><Clock size={11} /> Last edited {timeStr(selectedNote.updatedAt)}</span>
              <span>Created {timeStr(selectedNote.createdAt)}</span>
            </div>
          </>
        ) : (
          <div className="editor-empty-state">
            <NotebookPen size={56} />
            <h3>Select a note to edit</h3>
            <p>Or save any inbox message as a note using the<br />"Save to Notes" button in the Inbox.</p>
            <button className="btn-primary" onClick={handleNewNote}><Plus size={16} /> Create Note</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default NotesPage;
