/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToCollection, addToCollection,
    clearCollection, getCollectionData,
} from '../utils/firestoreHelpers';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserCollection } from '../utils/firestoreHelpers';

const AdminContext = createContext();
export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const [logs, setLogs] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!uid) { setLogs([]); setLoaded(true); return; }
        const unsub = subscribeToCollection(uid, 'admin_logs', (data) => {
            setLogs(data);
            setLoaded(true);
        }, { orderByField: 'timestamp', orderDir: 'desc', limitTo: 100 });
        return unsub;
    }, [uid]);

    const addLog = async (action, type = 'system') => {
        if (!uid) return;
        await addToCollection(uid, 'admin_logs', { action, type, timestamp: Date.now() });
    };

    const clearLogs = async () => {
        if (!uid) return;
        await clearCollection(uid, 'admin_logs');
    };

    const exportData = async () => {
        if (!uid) return;
        const collections = ['tasks', 'inbox', 'projects', 'teams', 'users', 'goals', 'events', 'workflows', 'notifications', 'admin_logs'];
        const data = {};
        for (const col of collections) {
            data[col] = await getCollectionData(uid, col);
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aura-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        await addLog('Exported all data', 'system');
    };

    const importData = async (file) => {
        if (!uid) return;
        const text = await file.text();
        try {
            const data = JSON.parse(text);
            const batch = writeBatch(db);
            for (const [colName, docs] of Object.entries(data)) {
                if (!Array.isArray(docs)) continue;
                for (const d of docs) {
                    const { id, ...rest } = d;
                    const docRef = doc(getUserCollection(uid, colName), id || `imported_${Date.now()}_${Math.random().toString(36).slice(2)}`);
                    batch.set(docRef, rest);
                }
            }
            await batch.commit();
        } catch {
            alert('Invalid backup file.');
        }
    };

    const resetSection = async (key) => {
        if (!uid) return;
        // Map old localStorage keys to Firestore collection names
        const keyMap = {
            'aura_tasks': 'tasks',
            'aura_inbox': 'inbox',
            'aura_group': ['projects', 'teams', 'users', 'goals'],
            'aura_calendar': 'events',
            'aura_workflows': 'workflows',
            'aura_notifications': 'notifications',
            'aura_admin_log': 'admin_logs',
        };
        const cols = keyMap[key];
        if (Array.isArray(cols)) {
            for (const c of cols) await clearCollection(uid, c);
        } else if (cols) {
            await clearCollection(uid, cols);
        }
        await addLog(`Reset section: ${key}`, 'system');
    };

    const resetAll = async () => {
        if (!uid) return;
        const collections = ['tasks', 'inbox', 'projects', 'teams', 'users', 'goals', 'events', 'workflows', 'notifications', 'admin_logs'];
        for (const col of collections) {
            await clearCollection(uid, col);
        }
    };

    const value = { logs, addLog, clearLogs, exportData, importData, resetSection, resetAll };

    return <AdminContext.Provider value={value}>{loaded && children}</AdminContext.Provider>;
};
