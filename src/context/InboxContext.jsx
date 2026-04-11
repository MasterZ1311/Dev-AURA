/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToCollection, addToCollection,
    updateInCollection, deleteFromCollection,
} from '../utils/firestoreHelpers';

const InboxContext = createContext();
export const useInbox = () => useContext(InboxContext);

export const InboxProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

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
            ...item,
        });
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
    };

    const deleteItem = async (id) => {
        if (!uid) return;
        await deleteFromCollection(uid, 'inbox', id);
    };

    const unreadCount = items.filter(i => !i.read && !i.archived).length;

    const value = {
        items,
        addItem,
        updateItem,
        markRead,
        markAllRead,
        toggleStar,
        archiveItem,
        deleteItem,
        unreadCount,
    };

    return (
        <InboxContext.Provider value={value}>
            {!loading && children}
        </InboxContext.Provider>
    );
};
