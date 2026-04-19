import React, { useState } from 'react';
import { useAISettings, AI_PROVIDERS, AI_JOBS } from '../context/AISettingsContext';
import { testProviderConfig } from '../utils/universalAIService';
import {
    Brain, Key, ChevronDown, ExternalLink, CheckCircle,
    XCircle, Loader, Info, ToggleLeft, ToggleRight, Eye, EyeOff, Zap
} from 'lucide-react';
import '../styles/AISettingsPanel.css';

// ─────────────────────────────────────────────────────────────
//  Tutorial Steps
// ─────────────────────────────────────────────────────────────
const TUTORIAL_STEPS = [
    {
        step: 1,
        title: 'Choose Your AI Provider',
        icon: '🤖',
        content: `AURA supports 5 AI providers. Pick based on your preference:
• Google Gemini — Great all-rounder, generous free tier
• OpenAI — Industry-standard GPT models
• Groq — Ultra-fast inference, great free tier
• Anthropic Claude — Excellent reasoning and coding
• Ollama — Runs 100% locally on your machine, no API key needed`,
    },
    {
        step: 2,
        title: 'Get Your API Key',
        icon: '🔑',
        content: `Each provider requires a free account and API key. The links are in the provider cards below.
Your keys are stored only in your browser's localStorage — they never leave your device and are never sent to any server except the AI provider's own API endpoint.`,
    },
    {
        step: 3,
        title: 'Assign Providers to Features',
        icon: '⚡',
        content: `AURA has 9 AI-powered features ("job slots"). You can assign a different provider to each one — or use the same provider for all. For example: use Groq for fast tasks (echo, summaries) and Gemini for deeper reasoning (triage, briefings).`,
    },
    {
        step: 4,
        title: 'Test & Enable',
        icon: '✅',
        content: `Use the "Test Connection" button to verify your key works. Then toggle features on as needed. If you don't configure a feature, AURA falls back to smart local logic — the app always works.`,
    },
];

// ─────────────────────────────────────────────────────────────
//  Provider Card
// ─────────────────────────────────────────────────────────────
const ProviderCard = ({ provider, config, onUpdate }) => {
    const [showKey, setShowKey] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [expanded, setExpanded] = useState(false);

    const handleTest = async () => {
        if (!config.apiKey && provider.id !== 'ollama') {
            setTestResult({ ok: false, message: 'Please enter your API key first.' });
            return;
        }
        setTesting(true);
        setTestResult(null);
        const result = await testProviderConfig(provider.id, config.apiKey, config.model);
        setTestResult(result);
        setTesting(false);
    };

    const isConfigured = provider.id === 'ollama' || !!config.apiKey?.trim();

    return (
        <div className={`ai-provider-card ${isConfigured ? 'configured' : ''}`}
            style={{ '--provider-color': provider.color }}>
            <div className="ai-provider-header" onClick={() => setExpanded(!expanded)}>
                <div className="ai-provider-identity">
                    <span className="ai-provider-icon">{provider.icon}</span>
                    <div>
                        <span className="ai-provider-name">{provider.label}</span>
                        {isConfigured && (
                            <span className="ai-provider-status configured">Configured</span>
                        )}
                        {!isConfigured && (
                            <span className="ai-provider-status">Not configured</span>
                        )}
                    </div>
                </div>
                <ChevronDown
                    size={16}
                    className={`ai-provider-chevron ${expanded ? 'rotated' : ''}`}
                />
            </div>

            {expanded && (
                <div className="ai-provider-body">
                    <a
                        href={provider.keyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ai-key-link"
                    >
                        <ExternalLink size={13} />
                        {provider.keyLinkLabel}
                    </a>

                    {provider.id !== 'ollama' && (
                        <div className="ai-input-group">
                            <label className="ai-label">
                                <Key size={13} /> API Key
                            </label>
                            <div className="ai-key-input-wrapper">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    className="ai-input"
                                    placeholder={provider.keyPlaceholder}
                                    value={config.apiKey}
                                    onChange={e => onUpdate('apiKey', e.target.value)}
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                                <button
                                    className="ai-key-toggle"
                                    onClick={() => setShowKey(!showKey)}
                                    title={showKey ? 'Hide key' : 'Show key'}
                                >
                                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {provider.id === 'ollama' && (
                        <div className="ai-ollama-note">
                            <Info size={13} />
                            Ollama runs locally on <code>localhost:11434</code>. Install Ollama and pull a model first.
                        </div>
                    )}

                    <div className="ai-input-group">
                        <label className="ai-label">Model</label>
                        <select
                            className="ai-select"
                            value={config.model}
                            onChange={e => onUpdate('model', e.target.value)}
                        >
                            {provider.models.map(m => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        className="ai-test-btn"
                        onClick={handleTest}
                        disabled={testing}
                    >
                        {testing
                            ? <><Loader size={13} className="spin" /> Testing…</>
                            : <><Zap size={13} /> Test Connection</>
                        }
                    </button>

                    {testResult && (
                        <div className={`ai-test-result ${testResult.ok ? 'ok' : 'fail'}`}>
                            {testResult.ok
                                ? <CheckCircle size={13} />
                                : <XCircle size={13} />
                            }
                            {testResult.message}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
//  Job Assignment Row
// ─────────────────────────────────────────────────────────────
const JobRow = ({ job, assignment, providerConfig, onAssign }) => {
    const configuredProviders = Object.entries(AI_PROVIDERS).filter(([id]) => {
        const cfg = providerConfig[id];
        return id === 'ollama' || !!cfg?.apiKey?.trim();
    });

    const assigned = assignment ? AI_PROVIDERS[assignment] : null;
    const isReady = !!assigned;

    return (
        <div className={`ai-job-row ${isReady ? 'ready' : ''}`}>
            <div className="ai-job-info">
                <span className="ai-job-icon">{job.icon}</span>
                <div>
                    <span className="ai-job-label">{job.label}</span>
                    <span className="ai-job-desc">{job.desc}</span>
                </div>
            </div>
            <div className="ai-job-assign">
                <select
                    className="ai-job-select"
                    value={assignment || ''}
                    onChange={e => onAssign(job.id, e.target.value || null)}
                    style={assigned ? { '--provider-color': assigned.color } : {}}
                >
                    <option value="">— Local fallback —</option>
                    {configuredProviders.map(([id, p]) => (
                        <option key={id} value={id}>
                            {p.icon} {p.label}
                        </option>
                    ))}
                    {configuredProviders.length === 0 && (
                        <option disabled>Configure a provider first ↑</option>
                    )}
                </select>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
//  Main Panel
// ─────────────────────────────────────────────────────────────
const AISettingsPanel = () => {
    const {
        aiEnabled, toggleAI,
        providerConfig, updateProviderConfig,
        jobAssignments, assignJobProvider,
        AI_JOBS,
    } = useAISettings();

    const [activeSection, setActiveSection] = useState('tutorial');

    return (
        <section className="settings-section ai-settings-panel">
            {/* Header */}
            <div className="ai-panel-header">
                <div className="ai-panel-title-row">
                    <Brain size={20} />
                    <h3>AI Intelligence</h3>
                    <div className="ai-global-toggle">
                        <span>{aiEnabled ? 'AI Enabled' : 'AI Disabled'}</span>
                        <button
                            className={`ai-master-toggle ${aiEnabled ? 'on' : 'off'}`}
                            onClick={() => toggleAI()}
                        >
                            {aiEnabled
                                ? <ToggleRight size={28} />
                                : <ToggleLeft size={28} />
                            }
                        </button>
                    </div>
                </div>
                <p className="ai-panel-subtitle">
                    AURA works fully without AI — all features have smart local fallbacks.
                    Configure your own AI provider to unlock enhanced intelligence.
                </p>
            </div>

            {/* Section tabs */}
            <div className="ai-section-tabs">
                {[
                    { id: 'tutorial', label: '📖 Tutorial' },
                    { id: 'providers', label: '🤖 Providers' },
                    { id: 'jobs', label: '⚡ Job Assignments' },
                ].map(s => (
                    <button
                        key={s.id}
                        className={`ai-section-tab ${activeSection === s.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(s.id)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Tutorial */}
            {activeSection === 'tutorial' && (
                <div className="ai-tutorial">
                    <div className="ai-tutorial-intro">
                        <Info size={16} />
                        <span>
                            AURA is provider-agnostic — bring your own API key from any supported service.
                            Your keys are stored only in your browser and never sent anywhere except the AI provider directly.
                        </span>
                    </div>
                    <div className="ai-tutorial-steps">
                        {TUTORIAL_STEPS.map(step => (
                            <div key={step.step} className="ai-tutorial-step">
                                <div className="ai-step-number">{step.step}</div>
                                <div className="ai-step-body">
                                    <div className="ai-step-title">
                                        <span>{step.icon}</span>
                                        <strong>{step.title}</strong>
                                    </div>
                                    <p className="ai-step-content">{step.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Provider quick links */}
                    <div className="ai-quick-links">
                        <h4>Quick Links — Get Your API Key</h4>
                        <div className="ai-quick-links-grid">
                            {Object.values(AI_PROVIDERS).map(p => (
                                <a
                                    key={p.id}
                                    href={p.keyLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ai-quick-link-card"
                                    style={{ '--provider-color': p.color }}
                                >
                                    <span className="ql-icon">{p.icon}</span>
                                    <span className="ql-label">{p.label}</span>
                                    <ExternalLink size={12} className="ql-ext" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Providers */}
            {activeSection === 'providers' && (
                <div className="ai-providers-list">
                    <p className="ai-section-hint">
                        Enter your API key for each provider you want to use. Keys are saved automatically.
                    </p>
                    {Object.values(AI_PROVIDERS).map(p => (
                        <ProviderCard
                            key={p.id}
                            provider={p}
                            config={providerConfig[p.id]}
                            onUpdate={(field, value) => updateProviderConfig(p.id, field, value)}
                        />
                    ))}
                </div>
            )}

            {/* Job Assignments */}
            {activeSection === 'jobs' && (
                <div className="ai-jobs-list">
                    <p className="ai-section-hint">
                        Assign a provider to each AURA AI feature. Features without a provider will use smart local fallbacks.
                    </p>
                    {AI_JOBS.map(job => (
                        <JobRow
                            key={job.id}
                            job={job}
                            assignment={jobAssignments[job.id]}
                            providerConfig={providerConfig}
                            onAssign={assignJobProvider}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default AISettingsPanel;
