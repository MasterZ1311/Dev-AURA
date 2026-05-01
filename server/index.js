/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              AURA — Backend API Server                   ║
 * ║   Express + Firebase Admin + AI Proxy + Keep-Alive       ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Deploy on Render (free tier):
 *   1. Push the /server folder contents to a GitHub repo
 *   2. Create a new "Web Service" on Render pointing to that repo
 *   3. Set Build Command: npm install
 *      Set Start Command:  npm start
 *   4. Add the environment variables from .env.example
 *   5. Done — the keep-alive pinger prevents the free-tier sleep
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initFirebaseAdmin } from './firebase.js';

// ── Routes ────────────────────────────────────────────────────────────────────
import crudRouter from './routes/crud.js';
import aiRouter from './routes/ai.js';
import userRouter from './routes/user.js';

// ── Init Firebase Admin ───────────────────────────────────────────────────────
initFirebaseAdmin();

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — only allow listed origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter — 200 requests per minute per IP
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — slow down!' },
}));

// Stricter limit for AI calls (expensive)
app.use('/api/ai', rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'AI rate limit reached. Wait a moment.' },
}));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'aura-backend',
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
    });
});

// Simple ping endpoint (used by keep-alive)
app.get('/ping', (_req, res) => res.send('pong'));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/user', userRouter);
app.use('/api/ai', aiRouter);
app.use('/api', crudRouter);       // Generic CRUD — must be last (catch-all pattern)

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({ error: err.message ?? 'Internal server error.' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Aura Backend running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   API:    http://localhost:${PORT}/api\n`);

    // Start the keep-alive pinger after server is up
    startKeepAlive();
});

// ╔══════════════════════════════════════════════════════════╗
// ║            RENDER FREE-TIER KEEP-ALIVE                   ║
// ║                                                          ║
// ║  Render's free tier spins down after 15 minutes of       ║
// ║  inactivity. This self-pings every 14 minutes so the     ║
// ║  server NEVER goes to sleep.                             ║
// ║                                                          ║
// ║  Requires RENDER_URL set to your deployed URL, e.g.:     ║
// ║    RENDER_URL=https://aura-backend.onrender.com          ║
// ╚══════════════════════════════════════════════════════════╝
function startKeepAlive() {
    const RENDER_URL = process.env.RENDER_URL;

    if (!RENDER_URL) {
        console.log('[Keep-Alive] RENDER_URL not set — skipping self-ping (only needed on Render).');
        return;
    }

    // Ping every 14 minutes (Render sleeps after 15 min of inactivity)
    const INTERVAL_MS = 14 * 60 * 1000;

    const ping = async () => {
        try {
            const res = await fetch(`${RENDER_URL}/ping`);
            const text = await res.text();
            console.log(`[Keep-Alive] ✅ Ping at ${new Date().toISOString()} → ${text}`);
        } catch (err) {
            console.warn(`[Keep-Alive] ⚠️  Ping failed: ${err.message}`);
        }
    };

    // First ping after 1 minute (give server time to fully start)
    setTimeout(ping, 60_000);

    // Then every 14 minutes
    setInterval(ping, INTERVAL_MS);

    console.log(`[Keep-Alive] 🏓 Self-ping enabled → ${RENDER_URL}/ping every 14 min`);
}
