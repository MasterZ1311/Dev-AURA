/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToCollection, addToCollection, updateInCollection, clearCollection } from '../utils/firestoreHelpers';
import { useCalendar } from './CalendarContext';
import { aiService } from '../utils/aiService';
import { useAISettings } from './AISettingsContext';

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const { events } = useCalendar();
    const { getJobConfig } = useAISettings();
    const [notifications, setNotifications] = useState([]);
    const [processedMeetings, setProcessedMeetings] = useState(new Set());

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

    // Background checker for upcoming meetings
    useEffect(() => {
        if (!uid || events.length === 0) return;

        const checkInterval = setInterval(async () => {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            const upcoming = events.filter(ev => {
                if (ev.date !== todayStr || !ev.startTime || processedMeetings.has(ev.id)) return false;

                const [h, m] = ev.startTime.split(':').map(Number);
                const eventTime = new Date();
                eventTime.setHours(h, m, 0, 0);

                const diffMinutes = (eventTime - now) / (1000 * 60);
                return diffMinutes > 0 && diffMinutes <= 10;
            });

            for (const ev of upcoming) {
                setProcessedMeetings(prev => new Set(prev).add(ev.id));

                // Use user's configured AI for meeting briefings, or fallback
                const jobConfig = getJobConfig('meeting_briefing');
                const briefing = await aiService.synthesizeMeetingContext(ev, [], jobConfig);

                await addNotification({
                    type: 'briefing',
                    title: `AURA Briefing: ${ev.title}`,
                    message: briefing,
                    priority: 'high',
                    eventId: ev.id,
                });
            }
        }, 30000);

        return () => clearInterval(checkInterval);
    }, [uid, events, processedMeetings, getJobConfig, addNotification]);

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
