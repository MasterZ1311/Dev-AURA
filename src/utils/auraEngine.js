// ═══════════════════════════════════════════════════════════
//  AURA ENGINE — Intelligence Layer
//  Pure local heuristic scoring + optional AI via universalAIService
//  No SDK dependencies. No bundled API keys.
// ═══════════════════════════════════════════════════════════

import { callAI, parseAIJson } from './universalAIService';

// ─────────────────────────────────────────────────────────────
// 1. LOCAL AURA SCORE (No API needed, instant, always works)
// ─────────────────────────────────────────────────────────────

const PRIORITY_WEIGHTS = { High: 3, Medium: 2, Low: 1 };

/**
 * Compute an "Aura Score" (0–100) for a task.
 * Higher score = more urgent to focus on.
 * Runs 100% locally — no AI required.
 */
export const computeAuraScore = (task, streak = 0) => {
    let score = 0;

    // Priority weight (0–30 pts)
    const pw = PRIORITY_WEIGHTS[task.priority] || 1;
    score += pw * 10;

    // Deadline urgency (0–40 pts)
    if (task.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(task.dueDate + 'T00:00:00');
        const daysLeft = Math.round((due - today) / 86400000);

        if (daysLeft < 0) score += 40;       // Overdue — max urgency
        else if (daysLeft === 0) score += 35;  // Due today
        else if (daysLeft <= 2) score += 25;
        else if (daysLeft <= 7) score += 15;
        else score += 5;
    }

    // Focus flag boost (0–15 pts)
    if (task.isFocus) score += 15;

    // Streak momentum bonus (0–10 pts)
    if (streak > 0) score += Math.min(streak, 10);

    // Recency penalty — old pending tasks lose relevance
    if (task.createdAt) {
        const ageInDays = (Date.now() - task.createdAt) / 86400000;
        if (ageInDays > 30) score -= 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Sort a task list by Aura Score (descending).
 */
export const rankTasksByAura = (tasks, streak = 0) => {
    return [...tasks]
        .filter(t => !t.completed)
        .map(t => ({ ...t, auraScore: computeAuraScore(t, streak) }))
        .sort((a, b) => b.auraScore - a.auraScore);
};

/**
 * Pick the top N "Focus" tasks by Aura Score.
 */
export const getTopFocusTasks = (tasks, streak = 0, n = 3) => {
    return rankTasksByAura(tasks, streak).slice(0, n);
};

// ─────────────────────────────────────────────────────────────
// 2. AI-POWERED FEATURES (Optional — requires user's own API key)
// ─────────────────────────────────────────────────────────────

/**
 * Generate an AI "Daily Briefing" from the user's top tasks.
 * If jobConfig is null (AI not configured), returns a smart local fallback.
 *
 * @param {Array}  topTasks   - ranked task list
 * @param {string} userName
 * @param {number} streak
 * @param {object|null} jobConfig - from AISettingsContext.getJobConfig('morning_triage')
 */
export const generateDailyBriefing = async (topTasks, userName, streak, jobConfig = null) => {
    if (!topTasks || topTasks.length === 0) return null;

    // ── Local fallback (no AI needed) ──
    if (!jobConfig) {
        const top = topTasks[0];
        const streakMsg = streak > 1 ? ` You're on a ${streak}-day streak — keep the momentum.` : '';
        return `${userName}, your most urgent task today is "${top.title}" (${top.priority} priority).${streakMsg} Use your peak morning energy on this first.`;
    }

    // ── AI-powered briefing ──
    const taskList = topTasks
        .slice(0, 5)
        .map((t, i) => `${i + 1}. "${t.title}" (Priority: ${t.priority}${t.dueDate ? ', Due: ' + t.dueDate : ''})`)
        .join('\n');

    const system = `You are AURA, a world-class AI productivity coach.
Write a short, energizing daily briefing (2-3 sentences, max 60 words) with:
- One specific insight about their most urgent task
- A motivational nudge tied to their streak
- A tactical suggestion for how to approach their day
Tone: Concise, confident, human. No bullet points. No fluff.`;

    const userMsg = `User: "${userName}" | Streak: ${streak} days
Top tasks today:
${taskList}`;

    return callAI(jobConfig, system, userMsg);
};

/**
 * Summarize a long inbox message (AI optional).
 * Falls back to first 80 chars of body.
 *
 * @param {string} subject
 * @param {string} body
 * @param {object|null} jobConfig
 */
export const summarizeInboxMessage = async (subject, body, jobConfig = null) => {
    if (!body || body.length < 80) return null;

    if (!jobConfig) {
        return body.slice(0, 100).trim() + (body.length > 100 ? '…' : '');
    }

    const system = 'Summarize this productivity app inbox message in 1-2 crisp sentences (max 40 words). No preamble, just the summary.';
    return callAI(jobConfig, system, `Subject: ${subject}\nBody: ${body.slice(0, 600)}`);
};

/**
 * Suggest the best workflow stage for a Kanban card.
 * Falls back to the first stage.
 *
 * @param {string} cardTitle
 * @param {string} cardDescription
 * @param {Array}  stages
 * @param {object|null} jobConfig
 */
export const suggestWorkflowStage = async (cardTitle, cardDescription, stages, jobConfig = null) => {
    if (!jobConfig) return stages[0]?.name ?? null;

    const stageNames = stages.map(s => s.name).join(', ');
    const system = 'You are a project management AI. Reply with ONLY the stage name, nothing else.';
    const userMsg = `Stages: [${stageNames}]\nTask: "${cardTitle}"\nDesc: "${cardDescription || 'none'}"`;
    return callAI(jobConfig, system, userMsg);
};

/**
 * Generate smart task from inbox message.
 * Falls back to a structured object derived from subject.
 *
 * @param {string} subject
 * @param {string} body
 * @param {string} priority
 * @param {object|null} jobConfig
 */
export const convertInboxToTask = async (subject, body, priority, jobConfig = null) => {
    if (!jobConfig) {
        return {
            title: subject.slice(0, 60),
            priority: priority?.charAt(0).toUpperCase() + (priority?.slice(1) ?? 'Medium'),
            project: 'Operations',
        };
    }

    const system = `Extract a clean task from an inbox message.
Reply with ONLY valid JSON: {"title":"action-oriented title under 60 chars","priority":"High|Medium|Low","project":"Development|Marketing|Design|Operations|Personal"}`;

    const response = await callAI(jobConfig, system,
        `Subject: "${subject}"\nBody: "${(body || '').slice(0, 300)}"\nPriority: ${priority}`
    );
    const parsed = parseAIJson(response);
    if (parsed?.title) return parsed;
    return { title: subject.slice(0, 60), priority: 'Medium', project: 'Development' };
};
