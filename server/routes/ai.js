/**
 * AURA — AI Proxy Routes
 *
 * All AI API calls are proxied through this server so that:
 *   1. User API keys (stored in Firestore) are fetched server-side
 *   2. Keys are NEVER sent to the browser in the response
 *   3. Rate limiting is applied per-user at the server level
 *
 * POST /api/ai/call     → generic AI call (any provider)
 * POST /api/ai/triage   → generate morning triage briefing
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../firebase.js';
import fetch from 'node-fetch';

const router = Router();
router.use(requireAuth);

// ─── Fetch user AI settings from Firestore ───────────────────────────────────
async function getUserAISettings(uid) {
    const ref = db.collection('users').doc(uid).collection('settings').doc('ai_settings');
    const snap = await ref.get();
    return snap.exists ? snap.data() : null;
}

// ─── Provider-specific fetch wrappers ────────────────────────────────────────

async function callGemini(apiKey, model, systemPrompt, userMessage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

async function callOpenAI(apiKey, model, systemPrompt, userMessage, baseURL = 'https://api.openai.com/v1') {
    const res = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            max_tokens: 500,
            temperature: 0.7,
        }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data?.choices?.[0]?.message?.content?.trim() ?? null;
}

async function callAnthropic(apiKey, model, systemPrompt, userMessage) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
            max_tokens: 500,
        }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data?.content?.[0]?.text?.trim() ?? null;
}

/**
 * Route the call to the correct provider based on jobConfig.
 * Falls back to server env keys if the user hasn't set their own.
 */
async function routeAICall(jobConfig, aiSettings, systemPrompt, userMessage) {
    const provider = jobConfig?.provider?.id ?? 'gemini';
    const model = jobConfig?.model ?? 'gemini-1.5-flash';

    // Priority: user's own key in Firestore → server env key
    let apiKey = aiSettings?.providers?.[provider]?.apiKey;
    if (!apiKey) {
        apiKey = {
            gemini: process.env.GEMINI_API_KEY,
            openai: process.env.OPENAI_API_KEY,
            groq: process.env.GROQ_API_KEY,
            anthropic: process.env.ANTHROPIC_API_KEY,
        }[provider];
    }

    if (!apiKey && provider !== 'ollama') {
        throw new Error(`No API key configured for provider: ${provider}`);
    }

    switch (provider) {
        case 'gemini':
            return callGemini(apiKey, model, systemPrompt, userMessage);
        case 'openai':
            return callOpenAI(apiKey, model, systemPrompt, userMessage);
        case 'groq':
            return callOpenAI(apiKey, model, systemPrompt, userMessage, 'https://api.groq.com/openai/v1');
        case 'anthropic':
            return callAnthropic(apiKey, model, systemPrompt, userMessage);
        case 'ollama': {
            const ollamaUrl = aiSettings?.providers?.ollama?.baseUrl ?? 'http://localhost:11434';
            return callOpenAI('ollama', model, systemPrompt, userMessage, `${ollamaUrl}/v1`);
        }
        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}

// ─── POST /api/ai/call ───────────────────────────────────────────────────────
router.post('/call', async (req, res) => {
    const { jobId, systemPrompt, userMessage } = req.body;

    if (!systemPrompt || !userMessage) {
        return res.status(400).json({ error: 'systemPrompt and userMessage are required.' });
    }

    try {
        const aiSettings = await getUserAISettings(req.uid);
        const jobConfig = aiSettings?.jobSlots?.[jobId] ?? null;

        if (!jobConfig && !process.env.GEMINI_API_KEY) {
            return res.json({ result: null, fallback: true });
        }

        // Use server-default if no job config (default to gemini flash)
        const effectiveConfig = jobConfig ?? {
            provider: { id: 'gemini' },
            model: 'gemini-1.5-flash',
        };

        const result = await routeAICall(effectiveConfig, aiSettings, systemPrompt, userMessage);
        res.json({ result });
    } catch (err) {
        console.error('[AI /call]', err.message);
        res.status(500).json({ error: err.message, result: null });
    }
});

// ─── POST /api/ai/triage ─────────────────────────────────────────────────────
router.post('/triage', async (req, res) => {
    const { tasks = [], events = [], notifications = [], userName = 'User' } = req.body;

    const systemPrompt = `You are AURA, an advanced productivity AI writing a morning briefing.
Write a 3-paragraph daily briefing (max 100 words total):
1. A futuristic greeting using the user's name.
2. The single most critical task for today and why.
3. The most important event/meeting + one motivational sentence.
Tone: Concise, confident, inspired.`;

    const userMessage = `User: ${userName}
Top Pending Tasks: ${JSON.stringify(tasks.filter(t => !t.completed).slice(0, 5))}
Upcoming Events: ${JSON.stringify(events.slice(0, 3))}
Recent Alerts: ${JSON.stringify(notifications.slice(0, 3))}`;

    try {
        const aiSettings = await getUserAISettings(req.uid);
        const jobConfig = aiSettings?.jobSlots?.morning_triage ?? null;
        const effectiveConfig = jobConfig ?? { provider: { id: 'gemini' }, model: 'gemini-1.5-flash' };

        const result = await routeAICall(effectiveConfig, aiSettings, systemPrompt, userMessage);
        res.json({ result });
    } catch (err) {
        console.error('[AI /triage]', err.message);
        res.status(500).json({ error: err.message, result: null });
    }
});

export default router;
