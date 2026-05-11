/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              AURA — Backend API Server                   ║
 * ║   Express + Firebase Admin + AI Proxy + Keep-Alive       ║
 * ╚══════════════════════════════════════════════════════════╝
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';
import { initFirebaseAdmin, adminAuth, storage } from './firebase.js';

// ── Routes ────────────────────────────────────────────────────────────────────
import crudRouter from './routes/crud.js';
import aiRouter from './routes/ai.js';
import userRouter from './routes/user.js';
import taskRouter from './routes/tasks.js';
import messageRouter from './routes/messages.js';
import uploadRouter from './routes/upload.js';

// ── Init Services ─────────────────────────────────────────────────────────────
initFirebaseAdmin();
const prisma = new PrismaClient();
const upstashRedis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map(o => o.trim()),
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 4000;

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
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

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { error: 'Too many requests — slow down!' },
}));

// ── Auth Middleware ───────────────────────────────────────────────────────────
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// ── API Routes ────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'aura-backend',
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
    });
});

app.get('/ping', (_req, res) => res.send('pong'));

// Mount Modular Routes
app.use('/api/user', userRouter);
app.use('/api/ai', aiRouter);
app.use('/api/tasks', authenticateUser, taskRouter(prisma));
app.use('/api/messages', authenticateUser, messageRouter(prisma));
app.use('/api/upload', authenticateUser, uploadRouter(storage.bucket()));
app.use('/api', crudRouter);

// ── Socket.io Logic ───────────────────────────────────────────────────────────
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));
        const decodedToken = await adminAuth.verifyIdToken(token);
        socket.user = decodedToken;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.user.uid);
    socket.on('join_group', (groupId) => socket.join(groupId));
    socket.on('send_message', async (data) => {
        try {
            const { groupId, content, attachmentUrl } = data;
            const message = await prisma.message.create({
                data: { groupId, senderId: socket.user.uid, content, attachmentUrl },
                include: { sender: true }
            });
            io.to(groupId).emit('new_message', message);
        } catch (err) { console.error(err); }
    });
    socket.on('task_moved', (data) => {
        if (data.teamId) socket.to(data.teamId).emit('task_updated_live', data);
    });
    socket.on('join_team_flow', (teamId) => socket.join(teamId));
    socket.on('disconnect', () => console.log('User disconnected:', socket.user.uid));
});

// ── Start Server ──────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`\n🚀 Aura Backend running on port ${PORT}`);
    startKeepAlive();
});

function startKeepAlive() {
    const RENDER_URL = process.env.RENDER_URL;
    if (!RENDER_URL) return;
    const INTERVAL_MS = 14 * 60 * 1000;
    const ping = async () => {
        try {
            const res = await fetch(`${RENDER_URL}/ping`);
            const text = await res.text();
            console.log(`[Keep-Alive] ✅ Ping → ${text}`);
        } catch (err) { console.warn(`[Keep-Alive] ⚠️  Ping failed: ${err.message}`); }
    };
    setTimeout(ping, 60_000);
    setInterval(ping, INTERVAL_MS);
}
