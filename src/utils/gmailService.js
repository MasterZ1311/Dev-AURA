/**
 * gmailService.js
 * Fetches Gmail messages via REST API and normalizes them to Aura's inbox schema.
 * Uses AURA's universal AI service for category and priority classification.
 */

import { googleFetch } from './googleApiHelper';
import { addToCollection, getUserCollection } from './firestoreHelpers';
import { getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { callAI, parseAIJson } from './universalAIService';

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const MAX_RESULTS = 30;

/**
 * Normalize a Gmail message into Aura's inbox item schema.
 */
const normalizeGmailMessage = (gmailMsg) => {
  const headers = gmailMsg.payload?.headers || [];
  const get = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const from = get('From');
  const subject = get('Subject') || '(No Subject)';
  const date = get('Date');

  // Parse sender name vs email
  const nameMatch = from.match(/^"?([^"<]+)"?\s*<?/);
  const senderName = nameMatch ? nameMatch[1].trim() : from.split('@')[0];
  const initials = senderName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  const timestamp = date ? new Date(date).getTime() : Date.now();
  const snippet = gmailMsg.snippet || '';

  return {
    gmailId: gmailMsg.id,
    source: 'gmail',
    sender: senderName,
    senderEmail: from,
    senderInitials: initials,
    subject,
    preview: snippet.slice(0, 100),
    body: snippet,
    time: timestamp,
    read: !gmailMsg.labelIds?.includes('UNREAD'),
    starred: gmailMsg.labelIds?.includes('STARRED') || false,
    archived: false,
    category: 'announcement', // will be overridden by AI classification
    priority: 'medium',
  };
};

/**
 * AI-classify a message into Aura categories.
 * Falls back to 'announcement' on failure or when AI is not configured.
 *
 * @param {string} subject
 * @param {string} preview
 * @param {object|null} jobConfig - from AISettingsContext.getJobConfig('inbox_summary')
 */
const classifyMessage = async (subject, preview, jobConfig = null) => {
  // Local rule-based fallback (always works, no AI needed)
  if (!jobConfig) {
    const lower = (subject + ' ' + preview).toLowerCase();
    let category = 'announcement';
    let priority = 'medium';
    if (/assigned|action required|please review|complete|task/i.test(lower)) { category = 'assignment'; priority = 'high'; }
    else if (/mentioned you|@|standup|team update/i.test(lower)) { category = 'mention'; priority = 'medium'; }
    else if (/reminder|deadline|due|follow.?up/i.test(lower)) { category = 'reminder'; priority = 'medium'; }
    else if (/team|project|status|sprint/i.test(lower)) { category = 'team'; priority = 'low'; }
    return { category, priority };
  }

  const system = `You are an email classifier for a productivity app.
Classify this email into ONE category and ONE priority.
Categories: assignment (action required), mention (needs input), reminder (deadline/meeting), team (project status), announcement (FYI/newsletter).
Priority: low, medium, high.
Respond ONLY with JSON: {"category": "...", "priority": "..."}`;

  const result = await callAI(jobConfig, system,
    `Subject: "${subject}"\nPreview: "${preview}"`
  );

  const parsed = parseAIJson(result);
  if (parsed?.category) return parsed;
  return { category: 'announcement', priority: 'medium' };
};

/**
 * Main sync function: fetch Gmail → classify → write to Firestore inbox.
 * Skips messages already imported (keyed by gmailId).
 * Returns count of new messages added.
 *
 * @param {string} uid
 * @param {string} accessToken
 * @param {object|null} jobConfig - from AISettingsContext.getJobConfig('inbox_summary')
 */
export const syncGmailToFirestore = async (uid, accessToken, jobConfig = null) => {
  // 1. Fetch message IDs
  const listData = await googleFetch(
    `${GMAIL_BASE}/messages?maxResults=${MAX_RESULTS}&labelIds=INBOX`,
    accessToken
  );

  const messages = listData.messages || [];
  if (messages.length === 0) return 0;

  // 2. Get already-imported Gmail IDs from Firestore
  const inboxRef = getUserCollection(uid, 'inbox');
  const existingSnap = await getDocs(query(inboxRef, where('source', '==', 'gmail')));
  const existingGmailIds = new Set(existingSnap.docs.map(d => d.data().gmailId).filter(Boolean));

  // 3. Filter to only new ones
  const newMessages = messages.filter(m => !existingGmailIds.has(m.id));
  if (newMessages.length === 0) return 0;

  // 4. Fetch full details + classify + write
  let added = 0;
  const batchSize = 10; // avoid hammering API
  const toFetch = newMessages.slice(0, batchSize);

  await Promise.all(
    toFetch.map(async ({ id }) => {
      try {
        const detail = await googleFetch(
          `${GMAIL_BASE}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          accessToken
        );
        const normalized = normalizeGmailMessage(detail);
        // Pass jobConfig so classification uses user's chosen AI (or local rules)
        const classification = await classifyMessage(normalized.subject, normalized.preview, jobConfig);
        const finalItem = { ...normalized, ...classification };
        await addToCollection(uid, 'inbox', finalItem);
        added++;
      } catch (e) {
        console.warn('[Gmail] Failed to fetch message', id, e.message);
      }
    })
  );

  return added;
};
