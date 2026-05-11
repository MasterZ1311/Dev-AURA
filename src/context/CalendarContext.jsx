/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeToCollection, addToCollection,
  updateInCollection, deleteFromCollection,
} from '../utils/firestoreHelpers';
import { aiService } from '../utils/aiService';
import { useAISettings } from './AISettingsContext';
import { fetchGoogleCalendarEvents, pushAllEventsToGoogleCalendar } from '../utils/calendarService';
import { callWithAutoRetry } from '../utils/googleApiHelper';

const CalendarContext = createContext();
export const useCalendar = () => useContext(CalendarContext);

export const CalendarProvider = ({ children }) => {
  const { currentUser, googleAccessToken, setGoogleAccessToken, silentGoogleReauth } = useAuth();
  const { getJobConfig } = useAISettings();
  const uid = currentUser?.uid;
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [healResult, setHealResult] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastGoogleSync, setLastGoogleSync] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!uid) { setEvents([]); setLoaded(true); return; }
    const unsub = subscribeToCollection(uid, 'events', (data) => {
      setEvents(data);
      setLoaded(true);
    }, { orderByField: 'createdAt', orderDir: 'desc' });
    return unsub;
  }, [uid]);

  /* ─── Local CRUD ─── */
  const addEvent = async (ev) => {
    if (!uid) return;
    await addToCollection(uid, 'events', { createdAt: Date.now(), source: 'aura', ...ev });
  };

  const updateEvent = async (id, updates) => {
    if (!uid) return;
    await updateInCollection(uid, 'events', id, updates);
  };

  const deleteEvent = async (id) => {
    if (!uid) return;
    await deleteFromCollection(uid, 'events', id);
  };

  /* ─── Pull FROM Google Calendar ─── */
  const pullFromGoogle = async () => {
    if (!uid) return;
    const token = googleAccessToken;
    if (!token) {
      setSyncMessage('Please connect Google first.');
      return;
    }

    setIsSyncing(true);
    setSyncMessage('');
    try {
      const googleEvents = await callWithAutoRetry(
        (t) => fetchGoogleCalendarEvents(t),
        token,
        setGoogleAccessToken
      );

      // Get existing Google event IDs to avoid duplicates
      const existingGoogleIds = new Set(events.filter(e => e.source === 'google').map(e => e.googleId));
      const newEvents = googleEvents.filter(e => !existingGoogleIds.has(e.googleId));

      await Promise.all(newEvents.map(ev => addToCollection(uid, 'events', ev)));
      setLastGoogleSync(Date.now());
      setSyncMessage(`✅ Imported ${newEvents.length} new event${newEvents.length !== 1 ? 's' : ''} from Google Calendar.`);
    } catch (err) {
      if (err.status === 401) {
        const newToken = await silentGoogleReauth();
        if (newToken) return pullFromGoogle();
        setSyncMessage('Google session expired. Please reconnect.');
      } else {
        setSyncMessage('Failed to sync. Check your Google connection.');
        console.error('[Calendar] Pull failed:', err);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  /* ─── Push TO Google Calendar ─── */
  const pushToGoogle = async () => {
    if (!uid) return;
    const token = googleAccessToken;
    if (!token) {
      setSyncMessage('Please connect Google first.');
      return;
    }

    setIsSyncing(true);
    setSyncMessage('');
    try {
      const pushed = await callWithAutoRetry(
        (t) => pushAllEventsToGoogleCalendar(t, events),
        token,
        setGoogleAccessToken
      );
      setLastGoogleSync(Date.now());
      setSyncMessage(`✅ Pushed ${pushed} event${pushed !== 1 ? 's' : ''} to Google Calendar.`);
    } catch (err) {
      if (err.status === 401) {
        const newToken = await silentGoogleReauth();
        if (newToken) return pushToGoogle();
        setSyncMessage('Google session expired. Please reconnect.');
      } else {
        setSyncMessage('Push failed. Check your Google connection.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  /* ─── AI Schedule Healing ─── */
  const healSchedule = async (dateStr, currentFocus = 'Steady Progress') => {
    if (!uid) return;
    setIsHealing(true);
    setHealResult(null);
    try {
      const dayEvents = events.filter(ev => ev.date === dateStr);
      const jobConfig = getJobConfig('heal_schedule');
      const recommendation = await aiService.healSchedule(dayEvents, currentFocus, jobConfig);
      setHealResult(recommendation);
      console.log('AURA AI Recommendation:', recommendation);
    } catch (error) {
      console.error('Schedule Healing failed:', error);
      setHealResult('Schedule healing failed. Please check your AI configuration.');
    } finally {
      setIsHealing(false);
    }
  };

  const clearHealResult = () => setHealResult(null);

  const getEventsForDate = (dateStr) => events.filter(ev => ev.date === dateStr);

  const value = {
    events, addEvent, updateEvent, deleteEvent,
    getEventsForDate, healSchedule, isHealing, healResult, clearHealResult,
    pullFromGoogle, pushToGoogle, isSyncing, lastGoogleSync, syncMessage, setSyncMessage,
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
};
