/**
 * AURA — Data Layer
 * ─────────────────────────────────────────────────────────────────────
 * WRITE operations (create, update, delete, log) → go through the
 *   Render backend API (/api/*) which uses Firebase Admin SDK server-side.
 *
 * READ / REAL-TIME subscriptions → still use the Firebase client SDK
 *   directly, because onSnapshot WebSocket connections must come from
 *   the browser.
 */

import {
    collection, doc,
    onSnapshot, query, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
//  REAL-TIME SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getUserCollection = (uid, collectionName) =>
    collection(db, 'users', uid, collectionName);

export const getUserDoc = (uid, collectionName, docId) =>
    doc(db, 'users', uid, collectionName, docId);

export const subscribeToCollection = (uid, collectionName, setState, options = {}) => {
    let isActive = true;

    const fetchIt = async () => {
        try {
            const data = await api.list(collectionName, {
                orderBy: options.orderByField,
                orderDir: options.orderDir,
                limitTo: options.limitTo
            });
            if (isActive) setState(data);
        } catch (error) {
            console.error(`[Firestore Helpers] Poll error on ${collectionName}:`, error.message);
        }
    };

    fetchIt();
    const interval = setInterval(fetchIt, 3000); // Poll every 3 seconds

    return () => {
        isActive = false;
        clearInterval(interval);
    };
};

// ─────────────────────────────────────────────────────────────────────────────
//  WRITES — routed through the Render backend API
// ─────────────────────────────────────────────────────────────────────────────

export const addToCollection = async (_uid, collectionName, data) => {
    const result = await api.create(collectionName, data);
    return result.id;
};

export const updateInCollection = async (_uid, collectionName, docId, updates) => {
    await api.update(collectionName, docId, updates);
};

export const deleteFromCollection = async (_uid, collectionName, docId) => {
    await api.remove(collectionName, docId);
};

export const clearCollection = async (_uid, collectionName) => {
    await api.clearCollection(collectionName);
};

export const getCollectionData = async (_uid, collectionName) => {
    return api.list(collectionName);
};

export const logActivity = (uid, action, type = 'system') => {
    if (!uid) return;
    api.create('admin_logs', { action, type, timestamp: Date.now() }).catch(() => {});
};
