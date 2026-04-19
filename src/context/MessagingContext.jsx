/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, getDoc, setDoc, updateDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';
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

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
      orderBy('lastAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('[Messaging] conversations error:', err);
    });

    return unsub;
  }, [uid]);

  /* ─── Subscribe to messages in active conversation ─── */
  useEffect(() => {
    if (!activeConvoId) { setMessages([]); return; }

    const q = query(
      collection(db, 'conversations', activeConvoId, 'messages'),
      orderBy('time', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Mark as read when opening a conversation
    if (uid) {
      const convoRef = doc(db, 'conversations', activeConvoId);
      updateDoc(convoRef, { [`unreadBy.${uid}`]: 0 }).catch(() => {});
    }

    return unsub;
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
      lastAt: serverTimestamp(),
      unreadBy: { [uid]: 0, [theirUID]: 0 },
    };

    const ref = await addDoc(collection(db, 'conversations'), convoData);
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
      await addDoc(collection(db, 'conversations', convoId, 'messages'), {
        from: uid,
        fromName: currentUser?.name || 'You',
        text: text.trim(),
        time: Date.now(),
        read: false,
      });

      // Update conversation metadata
      const updates = {
        lastMessage: text.trim().slice(0, 80),
        lastAt: serverTimestamp(),
      };
      if (recipientUID) {
        updates[`unreadBy.${recipientUID}`] = (convo?.unreadBy?.[recipientUID] || 0) + 1;
      }
      await updateDoc(doc(db, 'conversations', convoId), updates);
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
