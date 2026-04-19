/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeToCollection, addToCollection,
  updateInCollection, deleteFromCollection,
} from '../utils/firestoreHelpers';

const NotesContext = createContext();
export const useNotes = () => useContext(NotesContext);

export const NotesProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!uid) { setNotes([]); setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToCollection(uid, 'notes', (data) => {
      setNotes(data);
      setLoading(false);
    }, { orderByField: 'updatedAt', orderDir: 'desc' });
    return unsub;
  }, [uid]);

  /**
   * Create a note (optionally pre-filled from an inbox message).
   */
  const createNote = async ({ title, content = '', sourceType = 'manual', sourceId = null, sourceSummary = '' } = {}) => {
    if (!uid) return null;
    const now = Date.now();
    const id = await addToCollection(uid, 'notes', {
      title: title || 'Untitled Note',
      content,
      sourceType,   // 'gmail' | 'aura' | 'manual'
      sourceId,     // original inbox item id
      sourceSummary, // snippet from the original message
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  };

  /**
   * Create a note from an inbox item. Pre-fills title from subject and sourceSummary from body.
   */
  const createNoteFromMessage = async (inboxItem) => {
    return createNote({
      title: inboxItem.subject || 'Note from message',
      content: '',
      sourceType: inboxItem.source || 'aura',
      sourceId: inboxItem.id,
      sourceSummary: inboxItem.body || inboxItem.preview || '',
    });
  };

  const updateNote = async (id, updates) => {
    if (!uid) return;
    await updateInCollection(uid, 'notes', id, { ...updates, updatedAt: Date.now() });
  };

  const deleteNote = async (id) => {
    if (!uid) return;
    await deleteFromCollection(uid, 'notes', id);
  };

  const pinNote = async (id) => {
    if (!uid) return;
    const note = notes.find(n => n.id === id);
    if (note) await updateInCollection(uid, 'notes', id, { pinned: !note.pinned, updatedAt: Date.now() });
  };

  const addTag = async (id, tag) => {
    if (!uid || !tag.trim()) return;
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const trimmed = tag.trim().toLowerCase();
    if (!note.tags?.includes(trimmed)) {
      await updateInCollection(uid, 'notes', id, { tags: [...(note.tags || []), trimmed], updatedAt: Date.now() });
    }
  };

  const removeTag = async (id, tag) => {
    if (!uid) return;
    const note = notes.find(n => n.id === id);
    if (!note) return;
    await updateInCollection(uid, 'notes', id, { tags: (note.tags || []).filter(t => t !== tag), updatedAt: Date.now() });
  };

  /**
   * Client-side search across notes titles + content.
   */
  const searchNotes = (query) => {
    if (!query.trim()) return notes;
    const q = query.toLowerCase();
    return notes.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q) ||
      (n.sourceSummary || '').toLowerCase().includes(q) ||
      (n.tags || []).some(t => t.includes(q))
    );
  };

  const pinnedNotes = notes.filter(n => n.pinned);
  const unpinnedNotes = notes.filter(n => !n.pinned);

  const value = {
    notes,
    pinnedNotes,
    unpinnedNotes,
    loading,
    createNote,
    createNoteFromMessage,
    updateNote,
    deleteNote,
    pinNote,
    addTag,
    removeTag,
    searchNotes,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
};
