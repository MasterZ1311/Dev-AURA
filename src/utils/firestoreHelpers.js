import {
    collection, doc, addDoc, updateDoc, deleteDoc,
    onSnapshot, query, orderBy, limit, writeBatch, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

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
        console.error(`Firestore error on ${collectionName}:`, error);
    });
};

/**
 * Add a document to a user-scoped collection. Returns the new doc ID.
 */
export const addToCollection = async (uid, collectionName, data) => {
    const colRef = getUserCollection(uid, collectionName);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
};

/**
 * Update a document in a user-scoped collection.
 */
export const updateInCollection = async (uid, collectionName, docId, updates) => {
    const docRef = getUserDoc(uid, collectionName, docId);
    await updateDoc(docRef, updates);
};

/**
 * Delete a document from a user-scoped collection.
 */
export const deleteFromCollection = async (uid, collectionName, docId) => {
    const docRef = getUserDoc(uid, collectionName, docId);
    await deleteDoc(docRef);
};

/**
 * Delete all documents in a user-scoped collection.
 */
export const clearCollection = async (uid, collectionName) => {
    const colRef = getUserCollection(uid, collectionName);
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
};

/**
 * Get all documents from a user-scoped collection (one-time read).
 */
export const getCollectionData = async (uid, collectionName) => {
    const colRef = getUserCollection(uid, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Write a single activity log entry to admin_logs — fire and forget.
 * Avoids context circular dependency; any provider can call this directly.
 */
export const logActivity = (uid, action, type = 'system') => {
    if (!uid) return;
    const colRef = getUserCollection(uid, 'admin_logs');
    addDoc(colRef, { action, type, timestamp: Date.now() }).catch(() => {});
};
