/**
 * AURA — User Profile Routes
 *
 * GET  /api/user/profile    → get the user's profile doc
 * POST /api/user/profile    → create/update profile
 * GET  /api/user/settings/:settingId  → get a specific settings doc
 * POST /api/user/settings/:settingId  → upsert a settings doc
 */
import { Router } from 'express';
import { db } from '../firebase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const userDoc = (uid) => db.collection('users').doc(uid);

// ─── Profile ─────────────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
    try {
        const snap = await userDoc(req.uid).get();
        if (!snap.exists) return res.status(404).json({ error: 'Profile not found.' });
        res.json({ id: snap.id, ...snap.data() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/profile', async (req, res) => {
    try {
        await userDoc(req.uid).set({ ...req.body, updatedAt: Date.now() }, { merge: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get('/settings/:settingId', async (req, res) => {
    try {
        const ref = userDoc(req.uid).collection('settings').doc(req.params.settingId);
        const snap = await ref.get();
        if (!snap.exists) return res.json(null);
        res.json({ id: snap.id, ...snap.data() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/settings/:settingId', async (req, res) => {
    try {
        const ref = userDoc(req.uid).collection('settings').doc(req.params.settingId);
        await ref.set({ ...req.body, updatedAt: Date.now() }, { merge: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Aura Code lookup ─────────────────────────────────────────────────────────
router.get('/aura-code/:code', async (req, res) => {
    try {
        const ref = db.collection('users_by_aura_code').doc(req.params.code);
        const snap = await ref.get();
        if (!snap.exists) return res.status(404).json({ error: 'Aura code not found.' });
        res.json(snap.data());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/aura-code', async (req, res) => {
    try {
        const { auraUID, displayName, photoURL } = req.body;
        const ref = db.collection('users_by_aura_code').doc(auraUID);
        await ref.set({ uid: req.uid, displayName: displayName || 'User', photoURL: photoURL || null, auraUID });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
