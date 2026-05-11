/**
 * AURA — Backend API Client
 * ─────────────────────────────────────────────────────────────────────
 * All communication between the React frontend and the Render backend
 * goes through this single module.
 *
 * Every call automatically:
 *   1. Gets the current user's Firebase ID token
 *   2. Attaches it as a Bearer token in the Authorization header
 *   3. Routes to the Render backend (or localhost in dev mode)
 *
 * Usage:
 *   import api from '../utils/api';
 *   const tasks = await api.list('tasks');
 *   await api.create('tasks', { title: 'Build something' });
 *   await api.update('tasks', id, { completed: true });
 *   await api.remove('tasks', id);
 */

import { auth } from '../firebase';

// ─── Base URL ────────────────────────────────────────────────────────────────
// In development: hits localhost:4000
// In production:  hits your Render backend URL
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

// ─── Auth Token Helper ────────────────────────────────────────────────────────
async function getAuthHeaders() {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────
async function request(method, path, body = null) {
    const headers = await getAuthHeaders();
    const opts = { method, headers };
    if (body !== null) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);

    if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
            const json = await res.json();
            errMsg = json.error ?? errMsg;
        } catch { /* empty */ }
        throw new Error(errMsg);
    }

    return res.json();
}

// ─── CRUD Helpers ─────────────────────────────────────────────────────────────
const api = {
    /** List all documents in a collection */
    list(collection, params = {}) {
        const qs = new URLSearchParams(params).toString();
        return request('GET', `/api/${collection}${qs ? `?${qs}` : ''}`);
    },

    /** Create a new document */
    create(collection, data) {
        return request('POST', `/api/${collection}`, data);
    },

    /** Update an existing document */
    update(collection, id, data) {
        return request('PATCH', `/api/${collection}/${id}`, data);
    },

    /** Delete a single document */
    remove(collection, id) {
        return request('DELETE', `/api/${collection}/${id}`);
    },

    /** Delete all documents in a collection */
    clearCollection(collection) {
        return request('DELETE', `/api/${collection}`);
    },

    // ─── User ────────────────────────────────────────────────────────────────
    getProfile() {
        return request('GET', '/api/user/profile');
    },
    updateProfile(data) {
        return request('POST', '/api/user/profile', data);
    },
    getSetting(settingId) {
        return request('GET', `/api/user/settings/${settingId}`);
    },
    setSetting(settingId, data) {
        return request('POST', `/api/user/settings/${settingId}`, data);
    },

    // ─── AI ──────────────────────────────────────────────────────────────────
    /**
     * Call the AI proxy. Pass a jobId so the server can look up the
     * user's configured provider for that specific job.
     */
    callAI({ jobId, systemPrompt, userMessage }) {
        return request('POST', '/api/ai/call', { jobId, systemPrompt, userMessage });
    },

    /**
     * Generate a morning triage briefing (special AI route).
     */
    generateTriage({ tasks, events, notifications, userName }) {
        return request('POST', '/api/ai/triage', { tasks, events, notifications, userName });
    },

    // ─── Health / Keep-Alive ─────────────────────────────────────────────────
    ping() {
        return fetch(`${BASE_URL}/ping`).then(r => r.text()).catch(() => 'offline');
    },
    health() {
        return fetch(`${BASE_URL}/health`).then(r => r.json()).catch(() => ({ status: 'offline' }));
    },

    // ─── Real-time Messaging ──────────────────────────────────────────────────
    getMessages(groupId) {
        return request('GET', `/api/messages/${groupId}`);
    },

    // ─── File Uploads ─────────────────────────────────────────────────────────
    getUploadUrl({ fileName, fileType, folder }) {
        return request('POST', '/api/upload/signed-url', { fileName, fileType, folder });
    }
};

export default api;
