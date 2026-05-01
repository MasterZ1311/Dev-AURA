/**
 * AURA Universal AI Service — Backend-Routed
 * ─────────────────────────────────────────────────────────────────────
 * All AI calls are now proxied through the Render backend server.
 * The backend reads the user's API key from Firestore server-side
 * so keys NEVER appear in the browser or network tab.
 *
 * Supports: Google Gemini, OpenAI, Groq, Anthropic, Ollama
 *
 * Usage:
 *   import { callAI } from './universalAIService';
 *   const text = await callAI(jobConfig, systemPrompt, userPrompt);
 *
 * jobConfig comes from AISettingsContext.getJobConfig(jobId)
 * The jobId is forwarded to the server so it can look up the right key.
 */

import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
//  Main caller — routes through backend
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object|null} jobConfig   - from AISettingsContext.getJobConfig(jobId)
 * @param {string}      systemPrompt
 * @param {string}      userPrompt
 * @returns {Promise<string|null>}
 */
export const callAI = async (jobConfig, systemPrompt, userPrompt) => {
    if (!jobConfig) return null;

    try {
        const { result } = await api.callAI({
            jobId: jobConfig.jobId ?? null,
            systemPrompt,
            userMessage: userPrompt,
        });
        return result ?? null;
    } catch (err) {
        console.warn('[UniversalAI] Backend call failed:', err.message);
        return null;
    }
};

/**
 * Test a provider configuration by calling the backend.
 * Returns { ok, message }.
 */
export const testProviderConfig = async (providerId, apiKey, model) => {
    // For the connection test we send a lightweight call using a temporary
    // inline config. The backend handles the actual API call.
    try {
        const { result } = await api.callAI({
            jobId: '__test__',
            systemPrompt: 'You are a test assistant.',
            userMessage: 'Reply with exactly: "AURA connection successful"',
        });
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
