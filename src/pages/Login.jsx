import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ChevronRight, ExternalLink, X, CheckCircle, Circle } from 'lucide-react';
import '../styles/Login.css';

/* ─── GCP Tutorial steps ─── */
const tutorialSteps = [
  {
    id: 1, title: 'Enable Google Sign-In in Firebase',
    steps: [
      'Go to Firebase Console → Your Project (aura-a0d6f)',
      'Click Authentication → Sign-in method',
      'Find "Google" → click Enable → Save',
    ],
    link: 'https://console.firebase.google.com/project/aura-a0d6f/authentication/providers',
    linkLabel: 'Open Firebase Console',
  },
  {
    id: 2, title: 'Enable Gmail API',
    steps: [
      'Go to Google Cloud Console → APIs & Services → Library',
      'Search "Gmail API" → click Enable',
    ],
    link: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com',
    linkLabel: 'Open Gmail API',
  },
  {
    id: 3, title: 'Enable Google Calendar API',
    steps: [
      'Same page → search "Google Calendar API" → Enable',
    ],
    link: 'https://console.cloud.google.com/apis/library/calendar-json.googleapis.com',
    linkLabel: 'Open Calendar API',
  },
  {
    id: 4, title: 'OAuth Consent Screen',
    steps: [
      'Google Cloud Console → APIs & Services → OAuth consent screen',
      'Choose "External" → fill App name as "Aura"',
      'Add scopes: gmail.readonly and calendar.events',
      'Add your own email as a Test User',
    ],
    link: 'https://console.cloud.google.com/apis/credentials/consent',
    linkLabel: 'Open OAuth Screen',
  },
  {
    id: 5, title: 'Add Authorized Domain',
    steps: [
      'Firebase Console → Authentication → Settings → Authorized domains',
      'Add "localhost" for development',
      'Add your production URL when deploying',
    ],
    link: 'https://console.firebase.google.com/project/aura-a0d6f/authentication/settings',
    linkLabel: 'Open Auth Settings',
  },
];

const GCPTutorial = ({ onClose }) => {
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const toggle = (id) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="gcp-tutorial-panel">
      <div className="gcp-tutorial-header">
        <div className="gcp-tutorial-title">
          <span className="gcp-icon">🔧</span>
          <div>
            <h3>Google API Setup Guide</h3>
            <p>Complete these steps once (~5 min)</p>
          </div>
        </div>
        <button className="gcp-close" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="gcp-steps">
        {tutorialSteps.map((step) => {
          const done = completedSteps.has(step.id);
          return (
            <div key={step.id} className={`gcp-step ${done ? 'done' : ''}`}>
              <button className="gcp-step-check" onClick={() => toggle(step.id)}>
                {done ? <CheckCircle size={18} className="gcp-check-done" /> : <Circle size={18} />}
              </button>
              <div className="gcp-step-content">
                <span className="gcp-step-title">Step {step.id}: {step.title}</span>
                <ul className="gcp-step-list">
                  {step.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
                <a href={step.link} target="_blank" rel="noopener noreferrer" className="gcp-link">
                  {step.linkLabel} <ExternalLink size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="gcp-tutorial-footer">
        <span>✅ All done? Close this and try Google Sign-In again.</span>
      </div>
    </div>
  );
};

/* ─── Google Logo SVG ─── */
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { login, signup, resetPassword, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const code = err.code;
      if (code === 'auth/user-not-found') setError('No account found with this email.');
      else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') setError('Incorrect password. Please try again.');
      else if (code === 'auth/too-many-requests') setError('Too many attempts. Please try again later.');
      else setError('Login failed. Please check your credentials.');
    } finally { setIsLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email) { setError('Please enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setIsLoading(true);
    try {
      await signup(name.trim(), email, password);
      navigate('/');
    } catch (err) {
      const code = err.code;
      if (code === 'auth/email-already-in-use') setError('An account with this email already exists.');
      else if (code === 'auth/weak-password') setError('Password is too weak. Use at least 6 characters.');
      else if (code === 'auth/invalid-email') setError('Please enter a valid email address.');
      else setError('Sign up failed. Please try again.');
    } finally { setIsLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email) { setError('Please enter your email address.'); return; }
    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (err) {
      if (err.code === 'auth/user-not-found') setError('No account found with this email.');
      else setError('Failed to send reset email. Please try again.');
    } finally { setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized.');
        setShowTutorial(true);
      } else {
        setError('Google sign-in failed. Check the setup guide →');
        setShowTutorial(true);
      }
    } finally { setIsGoogleLoading(false); }
  };

  const switchMode = (newMode) => {
    setMode(newMode); setError(''); setSuccess('');
    setEmail(''); setPassword(''); setConfirmPassword('');
  };

  return (
    <div className="auth-container">
      <div className={`auth-wrapper ${showTutorial ? 'with-tutorial' : ''}`}>
        <div className="login-card glass-panel">
          <img src="/aura-logo.png" alt="Aura" className="login-logo" />

          {/* ── Google Sign-In Button ── */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="google-signin-section">
              <button
                className="btn-google"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                id="google-signin-btn"
              >
                {isGoogleLoading
                  ? <span className="google-loading">Connecting...</span>
                  : <><GoogleLogo /><span>Continue with Google</span></>
                }
              </button>
              <button
                className="gcp-setup-link"
                onClick={() => setShowTutorial(prev => !prev)}
              >
                Need to set up Google APIs? <ChevronRight size={13} />
              </button>
              <div className="auth-divider"><span>or</span></div>
            </div>
          )}

          {/* ── Login Mode ── */}
          {mode === 'login' && (
            <>
              <p className="login-subtitle">Sign in with your email</p>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" className="form-input" value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input type="password" id="password" className="form-input" value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <button type="button" className="forgot-link" onClick={() => switchMode('forgot')}>
                  Forgot Password?
                </button>
                <button type="submit" className="btn-primary btn-login" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
              <div className="login-footer">
                Don't have an account?{' '}
                <span className="auth-switch-link" onClick={() => switchMode('signup')}>Sign Up</span>
              </div>
            </>
          )}

          {/* ── Signup Mode ── */}
          {mode === 'signup' && (
            <>
              <p className="login-subtitle">Create your Aura account</p>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleSignup} className="login-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" className="form-input" value={name}
                    onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-email">Email Address</label>
                  <input type="email" id="signup-email" className="form-input" value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-password">Password</label>
                  <input type="password" id="signup-password" className="form-input" value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input type="password" id="confirm-password" className="form-input" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <button type="submit" className="btn-primary btn-login" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
              <div className="login-footer">
                Already have an account?{' '}
                <span className="auth-switch-link" onClick={() => switchMode('login')}>Sign In</span>
              </div>
            </>
          )}

          {/* ── Forgot Password ── */}
          {mode === 'forgot' && (
            <>
              <p className="login-subtitle">Reset your password</p>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <form onSubmit={handleForgotPassword} className="login-form">
                <div className="form-group">
                  <label htmlFor="reset-email">Email Address</label>
                  <input type="email" id="reset-email" className="form-input" value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <button type="submit" className="btn-primary btn-login" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <div className="login-footer">
                <span className="auth-switch-link" onClick={() => switchMode('login')}>
                  <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Back to Sign In
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── GCP Tutorial Panel ── */}
        {showTutorial && <GCPTutorial onClose={() => setShowTutorial(false)} />}
      </div>
    </div>
  );
};

export default Login;
