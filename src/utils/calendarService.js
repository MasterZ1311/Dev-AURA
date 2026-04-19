/**
 * calendarService.js
 * Pulls events FROM Google Calendar and pushes Aura events TO Google Calendar.
 * Scope required: https://www.googleapis.com/auth/calendar.events
 */

import { googleFetch } from './googleApiHelper';

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary';

/**
 * Fetch events from the user's primary Google Calendar.
 * @param {string} accessToken
 * @param {string} timeMin - ISO date string (default: start of current month)
 * @param {string} timeMax - ISO date string (default: end of next month)
 */
export const fetchGoogleCalendarEvents = async (accessToken, timeMin, timeMax) => {
  const now = new Date();
  const defaultMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const defaultMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

  const min = timeMin || defaultMin;
  const max = timeMax || defaultMax;

  const url = `${GCAL_BASE}/events?timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}&singleEvents=true&orderBy=startTime&maxResults=100`;
  const data = await googleFetch(url, accessToken);

  return (data.items || []).map(normalizeGCalEvent);
};

/**
 * Normalize a Google Calendar event into Aura's event schema.
 */
const normalizeGCalEvent = (gcalEvent) => {
  const startRaw = gcalEvent.start?.dateTime || gcalEvent.start?.date || '';
  const endRaw = gcalEvent.end?.dateTime || gcalEvent.end?.date || '';

  // Convert to "YYYY-MM-DD" for Aura's date field
  const toDateStr = (iso) => {
    if (!iso) return '';
    return iso.substring(0, 10);
  };

  // Convert to "HH:MM" for Aura's time field
  const toTimeStr = (iso) => {
    if (!iso || !iso.includes('T')) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return {
    googleId: gcalEvent.id,
    source: 'google',
    title: gcalEvent.summary || '(No Title)',
    date: toDateStr(startRaw),
    startTime: toTimeStr(startRaw),
    endTime: toTimeStr(endRaw),
    description: gcalEvent.description || '',
    location: gcalEvent.location || '',
    color: '#4285F4', // Google blue for imported events
    allDay: !gcalEvent.start?.dateTime,
    createdAt: Date.now(),
  };
};

/**
 * Push a single Aura event TO Google Calendar.
 * @param {string} accessToken
 * @param {Object} auraEvent - Aura event object
 * @returns {Object} Created Google Calendar event
 */
export const pushEventToGoogleCalendar = async (accessToken, auraEvent) => {
  const { title, date, startTime, endTime, description, allDay } = auraEvent;

  let start, end;

  if (allDay || !startTime) {
    start = { date };
    end = { date };
  } else {
    const startISO = new Date(`${date}T${startTime || '09:00'}:00`).toISOString();
    const endISO = new Date(`${date}T${endTime || startTime || '10:00'}:00`).toISOString();
    start = { dateTime: startISO, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    end = { dateTime: endISO, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  }

  const body = {
    summary: title,
    description: description || '',
    start,
    end,
  };

  const data = await googleFetch(`${GCAL_BASE}/events`, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return data;
};

/**
 * Push all Aura events (non-google-sourced) to Google Calendar.
 * Returns count of successfully pushed events.
 */
export const pushAllEventsToGoogleCalendar = async (accessToken, auraEvents) => {
  const localEvents = auraEvents.filter(ev => ev.source !== 'google');
  let pushed = 0;

  for (const event of localEvents) {
    try {
      await pushEventToGoogleCalendar(accessToken, event);
      pushed++;
    } catch (e) {
      console.warn('[Calendar] Failed to push event:', event.title, e.message);
    }
  }

  return pushed;
};
