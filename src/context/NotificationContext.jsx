/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToCollection, addToCollection,
    updateInCollection, clearCollection,
} from '../utils/firestoreHelpers';

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!uid) { setNotifications([]); return; }
        const unsub = subscribeToCollection(uid, 'notifications', setNotifications, {
            orderByField: 'timestamp',
            orderDir: 'desc',
            limitTo: 50,
        });
        return unsub;
    }, [uid]);

    const addNotification = useCallback(async (notification) => {
        if (!uid) return;
        await addToCollection(uid, 'notifications', {
            timestamp: Date.now(),
            read: false,
            ...notification,
        });
    }, [uid]);

    const markAsRead = useCallback(async (id) => {
        if (!uid) return;
        await updateInCollection(uid, 'notifications', id, { read: true });
    }, [uid]);

    const markAllRead = useCallback(async () => {
        if (!uid) return;
        await Promise.all(
            notifications.filter(n => !n.read).map(n =>
                updateInCollection(uid, 'notifications', n.id, { read: true })
            )
        );
    }, [uid, notifications]);

    const clearAll = useCallback(async () => {
        if (!uid) return;
        await clearCollection(uid, 'notifications');
    }, [uid]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications, addNotification, markAsRead, markAllRead, clearAll, unreadCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
