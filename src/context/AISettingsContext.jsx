/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────
//  Supported AI Providers
// ─────────────────────────────────────────────────────────────
export const AI_PROVIDERS = {
    gemini: {
        id: 'gemini',
        label: 'Google Gemini',
        icon: '✦',
        color: '#4285F4',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        keyPlaceholder: 'AIzaSy...',
        keyLink: 'https://aistudio.google.com/app/apikey',
        keyLinkLabel: 'Get key at Google AI Studio',
        models: [
            { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Fast)' },
            { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
            { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Quality)' },
        ],
    },
    openai: {
        id: 'openai',
        label: 'OpenAI',
        icon: '⬡',
        color: '#10a37f',
        baseUrl: 'https://api.openai.com/v1/chat/completions',
        keyPlaceholder: 'sk-...',
        keyLink: 'https://platform.openai.com/api-keys',
        keyLinkLabel: 'Get key at OpenAI Platform',
        models: [
            { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
            { id: 'gpt-4o', label: 'GPT-4o (Quality)' },
            { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)' },
        ],
    },
    groq: {
        id: 'groq',
        label: 'Groq',
        icon: '⚡',
        color: '#f55036',
        baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
        keyPlaceholder: 'gsk_...',
        keyLink: 'https://console.groq.com/keys',
        keyLinkLabel: 'Get key at Groq Console',
        models: [
            { id: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B (Default)' },
            { id: 'llama-3.1-8b-instant', label: 'LLaMA 3.1 8B (Ultra-fast)' },
            { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
        ],
    },
    anthropic: {
        id: 'anthropic',
        label: 'Anthropic Claude',
        icon: '◆',
        color: '#d4a27f',
        baseUrl: 'https://api.anthropic.com/v1/messages',
        keyPlaceholder: 'sk-ant-...',
        keyLink: 'https://console.anthropic.com/settings/keys',
        keyLinkLabel: 'Get key at Anthropic Console',
        models: [
            { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast)' },
            { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Quality)' },
            { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Max Quality)' },
        ],
    },
    ollama: {
        id: 'ollama',
        label: 'Ollama (Local)',
        icon: '🦙',
        color: '#7c3aed',
        baseUrl: 'http://localhost:11434/api/chat',
        keyPlaceholder: 'No key needed',
        keyLink: 'https://ollama.com/download',
        keyLinkLabel: 'Download Ollama (runs locally)',
        models: [
            { id: 'llama3', label: 'LLaMA 3 (local)' },
            { id: 'mistral', label: 'Mistral (local)' },
            { id: 'phi3', label: 'Phi-3 Mini (local)' },
            { id: 'gemma2', label: 'Gemma 2 (local)' },
        ],
    },
};

// AI "job slots" — each feature in AURA has its own assignable provider
export const AI_JOBS = [
    {
        id: 'morning_triage',
        label: 'Morning Triage',
        icon: '🌅',
        desc: 'Generates your daily briefing — tasks, events, and a motivational nudge.',
        requiresQuality: true,
    },
    {
        id: 'voice_capture',
        label: 'Voice Task Extraction',
        icon: '🎙️',
        desc: 'Converts your voice transcripts into structured actionable tasks.',
        requiresQuality: true,
    },
    {
        id: 'emotional_echo',
        label: 'Emotional Echo',
        icon: '💜',
        desc: 'Provides an empathetic, poetic response to your voice check-in.',
        requiresQuality: false,
    },
    {
        id: 'procrastination',
        label: 'Procrastination Coach',
        icon: '🧠',
        desc: 'Breaks down a daunting task into 3 tiny 5-minute micro-steps.',
        requiresQuality: false,
    },
    {
        id: 'meeting_briefing',
        label: 'Meeting Briefing',
        icon: '📋',
        desc: 'Synthesizes context before an upcoming meeting from your tasks and notes.',
        requiresQuality: true,
    },
    {
        id: 'inbox_summary',
        label: 'Inbox Summarizer',
        icon: '📥',
        desc: 'TL;DR summaries of long inbox messages.',
        requiresQuality: false,
    },
    {
        id: 'workflow_suggest',
        label: 'Workflow Stage Suggester',
        icon: '🗂️',
        desc: 'Recommends the best Kanban stage for a new card.',
        requiresQuality: false,
    },
    {
        id: 'inbox_to_task',
        label: 'Inbox → Task Converter',
        icon: '✉️➜✅',
        desc: 'Converts an inbox message into a clean, categorized task.',
        requiresQuality: false,
    },
    {
        id: 'heal_schedule',
        label: 'Schedule Healer',
        icon: '🩺',
        desc: 'Re-optimizes a chaotic day\'s schedule based on your energy levels.',
        requiresQuality: true,
    },
];

// ─────────────────────────────────────────────────────────────
//  Default Config
// ─────────────────────────────────────────────────────────────
const DEFAULT_PROVIDER_CONFIG = {
    gemini:    { apiKey: '', model: 'gemini-2.0-flash' },
    openai:    { apiKey: '', model: 'gpt-4o-mini' },
    groq:      { apiKey: '', model: 'llama-3.3-70b-versatile' },
    anthropic: { apiKey: '', model: 'claude-3-haiku-20240307' },
    ollama:    { apiKey: '', model: 'llama3' },
};

// Default job → provider assignments
const DEFAULT_JOB_ASSIGNMENTS = {
    morning_triage:    null,
    voice_capture:     null,
    emotional_echo:    null,
    procrastination:   null,
    meeting_briefing:  null,
    inbox_summary:     null,
    workflow_suggest:  null,
    inbox_to_task:     null,
    heal_schedule:     null,
};

const STORAGE_KEY = 'aura_ai_settings';

const loadFromStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const saveToStorage = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // localStorage quota or private mode
    }
};

// ─────────────────────────────────────────────────────────────
//  Context
// ─────────────────────────────────────────────────────────────
const AISettingsContext = createContext();
export const useAISettings = () => useContext(AISettingsContext);

export const AISettingsProvider = ({ children }) => {
    const stored = loadFromStorage();

    const [providerConfig, setProviderConfig] = useState(
        stored?.providerConfig ?? DEFAULT_PROVIDER_CONFIG
    );
    const [jobAssignments, setJobAssignments] = useState(
        stored?.jobAssignments ?? DEFAULT_JOB_ASSIGNMENTS
    );
    const [aiEnabled, setAiEnabled] = useState(
        stored?.aiEnabled ?? false
    );

    const persist = useCallback((pc, ja, enabled) => {
        saveToStorage({ providerConfig: pc, jobAssignments: ja, aiEnabled: enabled });
    }, []);

    // Update a single provider's config (apiKey or model)
    const updateProviderConfig = useCallback((providerId, field, value) => {
        setProviderConfig(prev => {
            const next = { ...prev, [providerId]: { ...prev[providerId], [field]: value } };
            persist(next, jobAssignments, aiEnabled);
            return next;
        });
    }, [jobAssignments, aiEnabled, persist]);

    // Assign a provider to a job slot
    const assignJobProvider = useCallback((jobId, providerId) => {
        setJobAssignments(prev => {
            const next = { ...prev, [jobId]: providerId };
            persist(providerConfig, next, aiEnabled);
            return next;
        });
    }, [providerConfig, aiEnabled, persist]);

    // Global AI toggle
    const toggleAI = useCallback((val) => {
        const next = val ?? !aiEnabled;
        setAiEnabled(next);
        persist(providerConfig, jobAssignments, next);
    }, [aiEnabled, providerConfig, jobAssignments, persist]);

    // Returns { provider, apiKey, model } for a given job, or null if not configured
    const getJobConfig = useCallback((jobId) => {
        if (!aiEnabled) return null;
        const providerId = jobAssignments[jobId];
        if (!providerId) return null;
        const cfg = providerConfig[providerId];
        if (!cfg) return null;
        // Ollama doesn't need a key
        if (providerId !== 'ollama' && !cfg.apiKey?.trim()) return null;
        return {
            providerId,
            provider: AI_PROVIDERS[providerId],
            apiKey: cfg.apiKey,
            model: cfg.model,
        };
    }, [aiEnabled, jobAssignments, providerConfig]);

    // True if at least one job is configured
    const hasAnyJobConfigured = Object.keys(jobAssignments).some(j => {
        const cfg = getJobConfig(j);
        return cfg !== null;
    });

    const value = {
        aiEnabled,
        toggleAI,
        providerConfig,
        updateProviderConfig,
        jobAssignments,
        assignJobProvider,
        getJobConfig,
        hasAnyJobConfigured,
        AI_PROVIDERS,
        AI_JOBS,
    };

    return (
        <AISettingsContext.Provider value={value}>
            {children}
        </AISettingsContext.Provider>
    );
};
