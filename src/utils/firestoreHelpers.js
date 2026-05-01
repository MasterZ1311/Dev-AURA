/**
 * AURA — Data Layer
 * ─────────────────────────────────────────────────────────────────────
 * WRITE operations (create, update, delete, log) → go through the
 *   Render backend API (/api/*) which uses Firebase Admin SDK server-side.
 *
 * READ / REAL-TIME subscriptions → still use the Firebase client SDK
 *   directly, because onSnapshot WebSocket connections must come from
 *   the browser. The Firestore security rules allow reads for the
 *   authenticated owner, so this is safe.
 *
 * This hybrid approach gives us:
 *   ✅ Secure writes validated on the server
 *   ✅ Real-time UI updates via Firestore's WebSocket push
 *   ✅ No polling required
 */

import {
    collection, doc,
    onSnapshot, query, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
//  REAL-TIME SUBSCRIPTIONS (client-side Firestore — must stay here)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a reference to a user-scoped collection: users/{uid}/{collectionName}
 */
export const getUserCollection = (uid, collectionName) =>
    collection(db, 'users', uid, collectionName);

/**
 * Get a reference to a specific document in a user-scoped collection
 */
export const getUserDoc = (uid, collectionName, docId) =>
    doc(db, 'users', uid, collectionName, docId);

/**
 * Subscribe to a user-scoped collection with real-time updates.
 * Returns an unsubscribe function.
 * ⚡ This must stay client-side — it uses Firestore's WebSocket push.
 */
export const subscribeToCollection = (uid, collectionName, setState, options = {}) => {
    const colRef = getUserCollection(uid, collectionName);
    const constraints = [];

    if (options.orderByField) {
        constraints.push(orderBy(options.orderByField, options.orderDir || 'desc'));
    }
    if (options.limitTo) {
        constraints.push(limit(options.limitTo));
    }

    const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setState(data);
    }, (error) => {
        console.error(`[Firestore] onSnapshot error on ${collectionName}:`, error.message);
    });
};

// ─────────────────────────────────────────────────────────────────────────────
//  WRITES — routed through the Render backend API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a document to a user-scoped collection. Returns the new doc ID.
 * ➡ Routes to: POST /api/{collection}
 */
export const addToCollection = async (_uid, collectionName, data) => {
    const result = await api.create(collectionName, data);
    return result.id;
};

/**
 * Update a document in a user-scoped collection.
 * ➡ Routes to: PATCH /api/{collection}/{id}
 */
export const updateInCollection = async (_uid, collectionName, docId, updates) => {
    await api.update(collectionName, docId, updates);
};

/**
 * Delete a document from a user-scoped collection.
 * ➡ Routes to: DELETE /api/{collection}/{id}
 */
export const deleteFromCollection = async (_uid, collectionName, docId) => {
    await api.remove(collectionName, docId);
};

/**
 * Delete all documents in a user-scoped collection.
 * ➡ Routes to: DELETE /api/{collection}
 */
export const clearCollection = async (_uid, collectionName) => {
    await api.clearCollection(collectionName);
};

/**
 * Get all documents from a user-scoped collection (one-time read).
 * ➡ Routes to: GET /api/{collection}
 */
export const getCollectionData = async (_uid, collectionName) => {
    return api.list(collectionName);
};

/**
 * Write a single activity log entry — fire and forget.
 * ➡ Routes to: POST /api/admin_logs
 */
export const logActivity = (uid, action, type = 'system') => {
    if (!uid) return;
    api.create('admin_logs', { action, type, timestamp: Date.now() }).catch(() => {});
};
