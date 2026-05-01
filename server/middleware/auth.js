/**
 * AURA — Auth Middleware
 * Verifies Firebase ID tokens sent in the Authorization header.
 * Attaches the decoded uid to req.uid for use in route handlers.
 *
 * Usage: router.get('/path', requireAuth, handler)
 */
import { adminAuth } from '../firebase.js';

export async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        req.uid = decoded.uid;
        req.userEmail = decoded.email;
        next();
    } catch (err) {
        console.error('[Auth Middleware] Token verification failed:', err.code);
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}
