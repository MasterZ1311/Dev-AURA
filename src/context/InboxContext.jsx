/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeToCollection, addToCollection,
  updateInCollection, deleteFromCollection, logActivity,
} from '../utils/firestoreHelpers';
import { syncGmailToFirestore } from '../utils/gmailService';
import { callWithAutoRetry } from '../utils/googleApiHelper';

const InboxContext = createContext();
export const useInbox = () => useContext(InboxContext);

export const InboxProvider = ({ children }) => {
  const { currentUser, googleAccessToken, setGoogleAccessToken, silentGoogleReauth } = useAuth();
  const uid = currentUser?.uid;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gmailSyncing, setGmailSyncing] = useState(false);
  const [lastGmailSync, setLastGmailSync] = useState(null);
  const [gmailSyncMessage, setGmailSyncMessage] = useState('');

  // Persistent session states for AI features
  const [convertedIds, setConvertedIds] = useState(new Set());
  const [aiSummaries, setAiSummaries] = useState({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!uid) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToCollection(uid, 'inbox', (data) => {
      setItems(data);
      setLoading(false);
    }, { orderByField: 'time', orderDir: 'desc' });
    return unsub;
  }, [uid]);

  const addItem = async (item) => {
    if (!uid) return;
    await addToCollection(uid, 'inbox', {
      time: Date.now(),
      read: false,
      starred: false,
      archived: false,
      relatedTask: null,
      source: 'aura',
      ...item,
    });
    logActivity(uid, `Composed message: "${item.subject || 'No subject'}"`, 'inbox');
  };

  const updateItem = async (id, updates) => {
    if (!uid) return;
    await updateInCollection(uid, 'inbox', id, updates);
  };

  const markRead = async (id) => {
    if (!uid) return;
    await updateInCollection(uid, 'inbox', id, { read: true });
  };

  const markAllRead = async () => {
    if (!uid) return;
    await Promise.all(
      items.filter(i => !i.read).map(i => updateInCollection(uid, 'inbox', i.id, { read: true }))
    );
  };

  const toggleStar = async (id) => {
    if (!uid) return;
    const item = items.find(i => i.id === id);
    if (item) await updateInCollection(uid, 'inbox', id, { starred: !item.starred });
  };

  const archiveItem = async (id) => {
    if (!uid) return;
    await updateInCollection(uid, 'inbox', id, { archived: true });
    logActivity(uid, 'Archived inbox message', 'inbox');
  };

  const deleteItem = async (id) => {
    if (!uid) return;
    await deleteFromCollection(uid, 'inbox', id);
    logActivity(uid, 'Deleted inbox message', 'inbox');
  };

  const markAsConverted = (id) => {
    setConvertedIds(prev => new Set([...prev, id]));
  };

  const saveSummary = (id, summary) => {
    setAiSummaries(prev => ({ ...prev, [id]: summary }));
  };

  /* ─── Gmail Sync with auto-retry ─── */
  const syncGmail = async () => {
    if (!uid) return;
    const token = googleAccessToken;
    if (!token) {
      setGmailSyncMessage('Connect Google account to sync Gmail.');
      return;
    }

    setGmailSyncing(true);
    setGmailSyncMessage('');
    try {
      const added = await callWithAutoRetry(
        (t) => syncGmailToFirestore(uid, t),
        token,
        setGoogleAccessToken
      );
      setLastGmailSync(Date.now());
      setGmailSyncMessage(`✅ Synced ${added} new message${added !== 1 ? 's' : ''} from Gmail.`);
      logActivity(uid, `Synced Gmail: ${added} new messages`, 'inbox');
    } catch (err) {
      if (err.status === 401) {
        const newToken = await silentGoogleReauth();
        if (newToken) return syncGmail();
        setGmailSyncMessage('Google session expired. Please reconnect.');
      } else {
        setGmailSyncMessage('Gmail sync failed. Please try again.');
        console.error('[Inbox] Gmail sync error:', err);
      }
    } finally {
      setGmailSyncing(false);
    }
  };

  const unreadCount = items.filter(i => !i.read && !i.archived).length;

  const value = {
    items, addItem, updateItem, markRead, markAllRead,
    toggleStar, archiveItem, deleteItem, unreadCount,
    syncGmail, gmailSyncing, lastGmailSync, gmailSyncMessage,
    isGoogleConnected: !!googleAccessToken,
    convertedIds, markAsConverted, aiSummaries, saveSummary,
  };

  return (
    <InboxContext.Provider value={value}>
      {children}
    </InboxContext.Provider>
  );
};
