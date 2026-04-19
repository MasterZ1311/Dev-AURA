/**
 * AURA Universal AI Service
 * ─────────────────────────────────────────────────────────────
 * Provider-agnostic AI caller. Uses raw fetch() against each
 * provider's REST API — no SDK dependencies, no bundled keys.
 *
 * Supports: Google Gemini, OpenAI, Groq, Anthropic, Ollama
 *
 * Usage:
 *   import { callAI } from './universalAIService';
 *   const text = await callAI(jobConfig, systemPrompt, userPrompt);
 *
 * jobConfig comes from AISettingsContext.getJobConfig(jobId)
 */

// ─────────────────────────────────────────────────────────────
//  Provider-specific request builders
// ─────────────────────────────────────────────────────────────

const buildGeminiRequest = (model, systemPrompt, userPrompt, apiKey) => {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
    return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        options: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
            }),
        },
        parseResponse: (json) =>
            json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null,
    };
};

const buildOpenAICompatibleRequest = (baseUrl, model, systemPrompt, userPrompt, apiKey) => {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });

    return {
        url: baseUrl,
        options: {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1024 }),
        },
        parseResponse: (json) =>
            json?.choices?.[0]?.message?.content?.trim() ?? null,
    };
};

const buildAnthropicRequest = (model, systemPrompt, userPrompt, apiKey) => {
    return {
        url: 'https://api.anthropic.com/v1/messages',
        options: {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 1024,
                system: systemPrompt || 'You are AURA, an advanced productivity AI assistant.',
                messages: [{ role: 'user', content: userPrompt }],
            }),
        },
        parseResponse: (json) =>
            json?.content?.[0]?.text?.trim() ?? null,
    };
};

const buildOllamaRequest = (model, systemPrompt, userPrompt) => {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });

    return {
        url: 'http://localhost:11434/api/chat',
        options: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, stream: false }),
        },
        parseResponse: (json) =>
            json?.message?.content?.trim() ?? null,
    };
};

// ─────────────────────────────────────────────────────────────
//  Main caller
// ─────────────────────────────────────────────────────────────

/**
 * @param {object} jobConfig      - from AISettingsContext.getJobConfig(jobId)
 * @param {string} systemPrompt   - system / role prompt
 * @param {string} userPrompt     - actual user content
 * @returns {Promise<string|null>} - AI text response or null on failure
 */
export const callAI = async (jobConfig, systemPrompt, userPrompt) => {
    if (!jobConfig) return null;

    const { providerId, apiKey, model } = jobConfig;

    let request;

    try {
        switch (providerId) {
            case 'gemini':
                request = buildGeminiRequest(model, systemPrompt, userPrompt, apiKey);
                break;
            case 'openai':
                request = buildOpenAICompatibleRequest(
                    'https://api.openai.com/v1/chat/completions',
                    model, systemPrompt, userPrompt, apiKey
                );
                break;
            case 'groq':
                request = buildOpenAICompatibleRequest(
                    'https://api.groq.com/openai/v1/chat/completions',
                    model, systemPrompt, userPrompt, apiKey
                );
                break;
            case 'anthropic':
                request = buildAnthropicRequest(model, systemPrompt, userPrompt, apiKey);
                break;
            case 'ollama':
                request = buildOllamaRequest(model, systemPrompt, userPrompt);
                break;
            default:
                console.warn('[UniversalAI] Unknown provider:', providerId);
                return null;
        }

        const res = await fetch(request.url, request.options);
        if (!res.ok) {
            const err = await res.text();
            console.warn(`[UniversalAI] ${providerId} API error ${res.status}:`, err);
            return null;
        }

        const json = await res.json();
        return request.parseResponse(json);
    } catch (err) {
        console.warn(`[UniversalAI] ${providerId} call failed:`, err.message);
        return null;
    }
};

/**
 * Test a provider configuration. Returns { ok, message }.
 */
export const testProviderConfig = async (providerId, apiKey, model) => {
    const fakeConfig = { providerId, apiKey, model };
    try {
        const result = await callAI(
            fakeConfig,
            'You are a test assistant.',
            'Reply with exactly: "AURA connection successful"'
        );
        if (result) {
            return { ok: true, message: `✓ Connected: "${result.slice(0, 80)}"` };
        }
        return { ok: false, message: 'No response received. Check your model name.' };
    } catch (e) {
        return { ok: false, message: e.message };
    }
};

/**
 * Safely parse JSON from an AI response.
 * Strips markdown code fences if present.
 */
export const parseAIJson = (text, fallback = null) => {
    if (!text) return fallback;
    try {
        const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        return JSON.parse(clean);
    } catch {
        return fallback;
    }
};
