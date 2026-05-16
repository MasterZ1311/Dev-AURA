/**
 * AURA — Generic CRUD routes for any user-scoped collection.
 *
 * GET    /api/:collection          → list all docs (ordered by createdAt desc)
 * POST   /api/:collection          → create a new doc
 * PATCH  /api/:collection/:id      → update a doc
 * DELETE /api/:collection/:id      → delete a doc
 * DELETE /api/:collection          → delete ALL docs in the collection
 *
 * Supported collections: tasks | inbox | notes | calendar_events |
 *                        workflows | notifications | messages |
 *                        admin_logs | groups | goals | teams
 */
import { Router } from 'express';
import { db } from '../firebase.js';
import { requireAuth } from '../middleware/auth.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// Apply auth to every route in this file
router.use(requireAuth);

/**
 * Helper: get the user-scoped collection ref
 * users/{uid}/{collection}
 */
const userCol = (uid, col) => db.collection('users').doc(uid).collection(col);

// ─── ALLOW LIST ─────────────────────────────────────────────────────────────
const ALLOWED_COLLECTIONS = new Set([
    'tasks', 'inbox', 'notes', 'calendar_events', 'workflows',
    'notifications', 'admin_logs', 'groups', 'goals', 'teams',
    'users_meta', 'messages', 'settings',
]);

function validateCollection(req, res, next) {
    if (!ALLOWED_COLLECTIONS.has(req.params.collection)) {
        return res.status(400).json({ error: `Unknown collection: ${req.params.collection}` });
    }
    next();
}

// ─── LIST ────────────────────────────────────────────────────────────────────
router.get('/:collection', validateCollection, async (req, res) => {
    try {
        const { orderBy = 'createdAt', orderDir = 'desc', limitTo } = req.query;
        let q = userCol(req.uid, req.params.collection).orderBy(orderBy, orderDir);
        if (limitTo) q = q.limit(parseInt(limitTo, 10));

        const snapshot = await q.get();
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json(data);
    } catch (err) {
        console.error(`[GET /${req.params.collection}]`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── CREATE ──────────────────────────────────────────────────────────────────
router.post('/:collection', validateCollection, async (req, res) => {
    try {
        const payload = {
            ...req.body,
            createdAt: req.body.createdAt ?? Date.now(),
            updatedAt: Date.now(),
        };
        const docRef = await userCol(req.uid, req.params.collection).add(payload);
        res.status(201).json({ id: docRef.id, ...payload });
    } catch (err) {
        console.error(`[POST /${req.params.collection}]`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── UPDATE ──────────────────────────────────────────────────────────────────
router.patch('/:collection/:id', validateCollection, async (req, res) => {
    try {
        const ref = userCol(req.uid, req.params.collection).doc(req.params.id);
        await ref.update({ ...req.body, updatedAt: Date.now() });
        res.json({ success: true });
    } catch (err) {
        console.error(`[PATCH /${req.params.collection}/${req.params.id}]`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE ONE ──────────────────────────────────────────────────────────────
router.delete('/:collection/:id', validateCollection, async (req, res) => {
    try {
        await userCol(req.uid, req.params.collection).doc(req.params.id).delete();
        res.json({ success: true });
    } catch (err) {
        console.error(`[DELETE /${req.params.collection}/${req.params.id}]`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE ALL (reset collection) ───────────────────────────────────────────
router.delete('/:collection', validateCollection, async (req, res) => {
    try {
        const snapshot = await userCol(req.uid, req.params.collection).get();
        const batch = db.batch();
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        res.json({ success: true, deleted: snapshot.size });
    } catch (err) {
        console.error(`[DELETE ALL /${req.params.collection}]`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── GLOBAL COLLECTIONS (Admin bypassing rules) ─────────────────────────────
const GLOBAL_COLLECTIONS = new Set(['conversations', 'messages']);

router.post('/global/:collection', async (req, res) => {
    if (!GLOBAL_COLLECTIONS.has(req.params.collection)) return res.status(400).json({ error: 'Not allowed' });
    try {
        const payload = { ...req.body, createdAt: req.body.createdAt ?? Date.now(), updatedAt: Date.now() };
        const docRef = await db.collection(req.params.collection).add(payload);
        res.status(201).json({ id: docRef.id, ...payload });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/global/:collection/:id', async (req, res) => {
    if (!GLOBAL_COLLECTIONS.has(req.params.collection)) return res.status(400).json({ error: 'Not allowed' });
    try {
        await db.collection(req.params.collection).doc(req.params.id).update({ ...req.body, updatedAt: Date.now() });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/global/:collection', async (req, res) => {
    if (!GLOBAL_COLLECTIONS.has(req.params.collection)) return res.status(400).json({ error: 'Not allowed' });
    try {
        let q = db.collection(req.params.collection);
        if (req.query.whereField && req.query.whereOp && req.query.whereVal) {
            let val = req.query.whereVal;
            if (val === 'req.uid') val = req.uid;
            q = q.where(req.query.whereField, req.query.whereOp, val);
        }
        const snapshot = await q.get();
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/global/conversations/:id/messages', async (req, res) => {
    try {
        const payload = { ...req.body, time: req.body.time ?? Date.now() };
        const docRef = await db.collection('conversations').doc(req.params.id).collection('messages').add(payload);
        res.status(201).json({ id: docRef.id, ...payload });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/global/conversations/:id/messages', async (req, res) => {
    try {
        const snapshot = await db.collection('conversations').doc(req.params.id).collection('messages').orderBy('time', 'asc').get();
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
