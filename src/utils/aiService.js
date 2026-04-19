/**
 * AURA AI Service — Refactored
 * ─────────────────────────────────────────────────────────────
 * All AI calls now route through universalAIService (fetch-based).
 * No SDK dependencies. No bundled API keys.
 * Each function accepts jobConfig from AISettingsContext.getJobConfig(jobId).
 *
 * If jobConfig is null (user hasn't configured AI), functions return
 * graceful fallback strings — the app never breaks.
 */

import { callAI, parseAIJson } from './universalAIService';

class AIService {

    /**
     * Extract structured tasks from a voice transcript.
     * Job: 'voice_capture'
     */
    async extractTasksFromVoice(text, jobConfig) {
        const system = `You are AURA, an advanced productivity AI.
Analyze the transcript and extract actionable tasks.
Return ONLY a JSON array of objects with keys: title, priority (Low/Medium/High), category, and estimatedMinutes.
If no tasks are found, return [].`;

        const result = await callAI(jobConfig, system, `Transcript: "${text}"`);
        return parseAIJson(result, []);
    }

    /**
     * Emotional echo — empathetic 1-2 sentence response.
     * Job: 'emotional_echo'
     */
    async getEmotionalEcho(text, bioBattery = 100, jobConfig) {
        const system = `You are the AURA Emotional Echo system.
Analyze the user's voice transcript.
Bio-Battery level: ${bioBattery}%.
Provide a 1-2 sentence response that validates their feelings and suggests a productivity stance.
Keep it poetic, futuristic, and empathetic.`;

        const result = await callAI(jobConfig, system, text);
        return result || 'Your resonance is received. Take a breath — your next step is smaller than it feels.';
    }

    /**
     * Break down a procrastination task into 3 micro-steps.
     * Job: 'procrastination'
     */
    async breakdownProcrastination(taskTitle, jobConfig) {
        const system = `You are AURA, a world-class productivity coach.
Give exactly 3 tiny micro-steps (each under 5 minutes) to break through procrastination.
Make them concrete, achievable, and encouraging. Number them 1, 2, 3.`;

        const result = await callAI(jobConfig, system,
            `The user is stuck on: "${taskTitle}". Give them 3 micro-steps to start.`
        );
        return result || '1. Open the relevant document or tool.\n2. Write or type just one sentence or line.\n3. Set a 5-minute timer and allow yourself to stop after it.';
    }

    /**
     * Agentic Schedule Healer
     * Job: 'heal_schedule'
     */
    async healSchedule(tasks, currentFocus, jobConfig) {
        const system = `You are AURA, a schedule optimization AI.
Analyze this day's tasks and the user's current focus/energy state.
Re-prioritize and suggest an optimized order with brief reasoning.
Be concise — max 80 words.`;

        const userMsg = `Current Focus/Energy: "${currentFocus}"
Tasks: ${JSON.stringify(tasks.slice(0, 10))}

Suggest an optimized order for these tasks.`;

        const result = await callAI(jobConfig, system, userMsg);
        return result || 'Focus on your highest-priority task first while your energy is peak. Batch similar tasks together in the afternoon.';
    }

    /**
     * Meeting context synthesis.
     * Job: 'meeting_briefing'
     */
    async synthesizeMeetingContext(event, relatedData, jobConfig) {
        const system = `You are AURA, a meeting preparation assistant.
Provide a 3-point AURA Briefing:
1. Core objective of this meeting
2. Key open questions to address
3. Relevant context from recent tasks

Keep it under 60 words total. Be specific and actionable.`;

        const userMsg = `Meeting: "${event.title}"
Related Tasks/Notes: ${JSON.stringify(relatedData?.slice(0, 5) ?? [])}`;

        const result = await callAI(jobConfig, system, userMsg);
        return result || `Briefing for ${event.title}: Review your key discussion points before joining. Arrive with clear objectives and leave with defined next steps.`;
    }

    /**
     * Unified Morning Triage.
     * Job: 'morning_triage'
     */
    async generateUnifiedTriage(tasks, events, notifications, userName = 'User', jobConfig) {
        const system = `You are AURA, an advanced productivity AI writing a morning briefing.
Write a 3-paragraph daily briefing (max 100 words total):
1. A futuristic greeting using the user's name.
2. The single most critical task for today and why.
3. The most important event/meeting + one motivational sentence.
Tone: Concise, confident, inspired.`;

        const userMsg = `User: ${userName}
Top Pending Tasks: ${JSON.stringify(tasks.filter(t => !t.completed).slice(0, 5))}
Upcoming Events: ${JSON.stringify(events.slice(0, 3))}
Recent Alerts: ${JSON.stringify(notifications.slice(0, 3))}`;

        const result = await callAI(jobConfig, system, userMsg);
        return result || `Good morning, ${userName}. Your productivity field is active. Focus on your most urgent task first, and let momentum carry you through the rest of the day. Make today count.`;
    }

    /**
     * Summarize a long inbox message.
     * Job: 'inbox_summary'
     */
    async summarizeInboxMessage(subject, body, jobConfig) {
        if (!body || body.length < 80) return null;

        const system = `Summarize this productivity app inbox message in 1-2 crisp sentences (max 40 words).
No preamble. Just the summary. Be direct and factual.`;

        const result = await callAI(jobConfig, system,
            `Subject: ${subject}\nBody: ${body.slice(0, 600)}`
        );
        return result;
    }

    /**
     * Suggest workflow stage for a Kanban card.
     * Job: 'workflow_suggest'
     */
    async suggestWorkflowStage(cardTitle, cardDescription, stages, jobConfig) {
        const stageNames = stages.map(s => s.name).join(', ');

        const system = `You are a project management AI. Reply with ONLY the stage name — nothing else.`;

        const result = await callAI(jobConfig, system,
            `Workflow stages: [${stageNames}]
Card title: "${cardTitle}"
Description: "${cardDescription || 'No description'}"
Which stage fits best?`
        );
        return result?.trim() ?? null;
    }

    /**
     * Convert inbox message into a task.
     * Job: 'inbox_to_task'
     */
    async convertInboxToTask(subject, body, priority, jobConfig) {
        const system = `Extract a clean task from an inbox message.
Reply with ONLY valid JSON in this exact format:
{"title": "action-oriented task title under 60 chars", "priority": "High|Medium|Low", "project": "Development|Marketing|Design|Operations|Personal"}`;

        const result = await callAI(jobConfig, system,
            `Subject: "${subject}"
Body: "${(body || '').slice(0, 300)}"
Inbox Priority: ${priority}`
        );

        const parsed = parseAIJson(result);
        if (parsed?.title) return parsed;

        // Graceful fallback
        return {
            title: subject.slice(0, 60),
            priority: priority?.charAt(0).toUpperCase() + (priority?.slice(1) ?? 'Medium'),
            project: 'Operations',
        };
    }
}

export const aiService = new AIService();
