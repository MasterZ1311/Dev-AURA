/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/apiClient';
import { useAuth } from './AuthContext';

const MessagingContext = createContext();
export const useMessaging = () => useContext(MessagingContext);

export const MessagingProvider = ({ children }) => {
  const { currentUser, findUserByAuraUID } = useAuth();
  const uid = currentUser?.uid;

  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchResult, setSearchResult] = useState(null); // user found by AURA-XXXX
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  /* ─── Subscribe to all conversations for this user ─── */
  useEffect(() => {
    if (!uid) { setConversations([]); return; }

    const fetchConvos = async () => {
      try {
        const data = await api.get('/global/conversations?whereField=participants&whereOp=array-contains&whereVal=req.uid');
        // Sort by lastAt desc
        setConversations(data.sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)));
      } catch (err) {
        console.error('[Messaging] conversations error:', err);
      }
    };

    fetchConvos();
    const intv = setInterval(fetchConvos, 3000);
    return () => clearInterval(intv);
  }, [uid]);

  /* ─── Subscribe to messages in active conversation ─── */
  useEffect(() => {
    if (!activeConvoId) { setMessages([]); return; }

    const fetchMessages = async () => {
      try {
        const data = await api.get(`/global/conversations/${activeConvoId}/messages`);
        setMessages(data);
      } catch (err) { }
    };

    fetchMessages();
    const intv = setInterval(fetchMessages, 2000);

    // Mark as read when opening a conversation
    if (uid) {
      api.patch(`/global/conversations/${activeConvoId}`, { [`unreadBy.${uid}`]: 0 }).catch(() => {});
    }

    return () => clearInterval(intv);
  }, [activeConvoId, uid]);

  /* ─── Find user by AURA-XXXX code ─── */
  const searchByAuraUID = useCallback(async (code) => {
    if (!code.trim()) { setSearchResult(null); return; }
    setSearching(true);
    try {
      const user = await findUserByAuraUID(code.trim().toUpperCase());
      if (user && user.uid === uid) {
        setSearchResult({ error: "That's your own AURA code!" });
      } else {
        setSearchResult(user || { error: 'No user found with this code.' });
      }
    } catch {
      setSearchResult({ error: 'Search failed. Please try again.' });
    } finally {
      setSearching(false);
    }
  }, [findUserByAuraUID, uid]);

  /* ─── Get or create a conversation with another user ─── */
  const getOrCreateConversation = useCallback(async (theirUID, theirProfile) => {
    if (!uid || !theirUID) return null;

    // Check if a conversation already exists
    const existing = conversations.find(c =>
      c.participants.includes(uid) && c.participants.includes(theirUID)
    );
    if (existing) {
      setActiveConvoId(existing.id);
      return existing.id;
    }

    // Create new conversation
    const convoData = {
      participants: [uid, theirUID],
      participantNames: {
        [uid]: currentUser?.name || 'You',
        [theirUID]: theirProfile?.displayName || 'User',
      },
      participantAuraUIDs: {
        [uid]: currentUser?.auraUID || '',
        [theirUID]: theirProfile?.auraUID || '',
      },
      participantPhotos: {
        [uid]: currentUser?.photoURL || null,
        [theirUID]: theirProfile?.photoURL || null,
      },
      lastMessage: '',
      lastAt: Date.now(),
      unreadBy: { [uid]: 0, [theirUID]: 0 },
    };

    const ref = await api.post('/global/conversations', convoData);
    setActiveConvoId(ref.id);
    return ref.id;
  }, [uid, conversations, currentUser]);

  /* ─── Send a message ─── */
  const sendMessage = useCallback(async (convoId, text) => {
    if (!uid || !text.trim() || !convoId) return;
    setSending(true);
    try {
      const convo = conversations.find(c => c.id === convoId);
      const recipientUID = convo?.participants?.find(p => p !== uid);

      // Add message to subcollection
      await api.post(`/global/conversations/${convoId}/messages`, {
        from: uid,
        fromName: currentUser?.name || 'You',
        text: text.trim(),
        time: Date.now(),
        read: false,
      });

      // Update conversation metadata
      const updates = {
        lastMessage: text.trim().slice(0, 80),
        lastAt: Date.now(),
      };
      if (recipientUID) {
        updates[`unreadBy.${recipientUID}`] = (convo?.unreadBy?.[recipientUID] || 0) + 1;
      }
      await api.patch(`/global/conversations/${convoId}`, updates);
    } finally {
      setSending(false);
    }
  }, [uid, conversations, currentUser]);

  /* ─── Total unread count across all conversations ─── */
  const totalUnread = conversations.reduce((sum, c) => {
    return sum + (c.unreadBy?.[uid] || 0);
  }, 0);

  const value = {
    conversations,
    activeConvoId, setActiveConvoId,
    messages,
    searchResult, setSearchResult,
    searching,
    sending,
    totalUnread,
    searchByAuraUID,
    getOrCreateConversation,
    sendMessage,
  };

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
};
