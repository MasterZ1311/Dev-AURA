/**
 * AURA — Firebase Admin SDK Initializer
 * Uses the service account credentials from environment variables.
 * This runs server-side only; never exposes credentials to the client.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

let db, adminAuth, storage;

export function initFirebaseAdmin() {
    if (getApps().length > 0) {
        db = getFirestore();
        adminAuth = getAuth();
        storage = getStorage();
        return;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error(
            '[Firebase Admin] Missing credentials. Set FIREBASE_PROJECT_ID, ' +
            'FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.'
        );
    }

    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
        }),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
    });

    db = getFirestore();
    adminAuth = getAuth();
    storage = getStorage();

    console.log(`[Firebase Admin] Connected to project: ${process.env.FIREBASE_PROJECT_ID}`);
}

export { db, adminAuth, storage };
