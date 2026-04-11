/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToCollection, addToCollection,
    updateInCollection, deleteFromCollection,
} from '../utils/firestoreHelpers';

const CalendarContext = createContext();
export const useCalendar = () => useContext(CalendarContext);

export const CalendarProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [events, setEvents] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!uid) { setEvents([]); setLoaded(true); return; }
        const unsub = subscribeToCollection(uid, 'events', (data) => {
            setEvents(data);
            setLoaded(true);
        }, { orderByField: 'createdAt', orderDir: 'desc' });
        return unsub;
    }, [uid]);

    const addEvent = async (ev) => {
        if (!uid) return;
        await addToCollection(uid, 'events', { createdAt: Date.now(), ...ev });
    };

    const updateEvent = async (id, updates) => {
        if (!uid) return;
        await updateInCollection(uid, 'events', id, updates);
    };

    const deleteEvent = async (id) => {
        if (!uid) return;
        await deleteFromCollection(uid, 'events', id);
    };

    const getEventsForDate = (dateStr) => events.filter(ev => ev.date === dateStr);

    const value = { events, addEvent, updateEvent, deleteEvent, getEventsForDate };

    return <CalendarContext.Provider value={value}>{loaded && children}</CalendarContext.Provider>;
};
