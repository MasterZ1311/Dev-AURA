import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowLeft } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
    const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, signup, resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

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
        } finally {
            setIsLoading(false);
        }
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
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email) { setError('Please enter your email address.'); return; }

        setIsLoading(true);
        try {
            await resetPassword(email);
            setSuccess('Password reset email sent! Check your inbox.');
        } catch (err) {
            const code = err.code;
            if (code === 'auth/user-not-found') setError('No account found with this email.');
            else setError('Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
    };

    return (
        <div className="auth-container">
            <div className="login-card glass-panel">
                <img src="/aura-logo.png" alt="Aura" className="login-logo" />
                <h1 className="login-title">Aura</h1>

                {mode === 'login' && (
                    <>
                        <p className="login-subtitle">Sign in to your account</p>
                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
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
                            <span className="auth-switch-link" onClick={() => switchMode('signup')}>
                                Sign Up
                            </span>
                        </div>
                    </>
                )}

                {mode === 'signup' && (
                    <>
                        <p className="login-subtitle">Create your Aura account</p>
                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSignup} className="login-form">
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    className="form-input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="signup-email">Email Address</label>
                                <input
                                    type="email"
                                    id="signup-email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="signup-password">Password</label>
                                <input
                                    type="password"
                                    id="signup-password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm-password">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirm-password"
                                    className="form-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-primary btn-login" disabled={isLoading}>
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        <div className="login-footer">
                            Already have an account?{' '}
                            <span className="auth-switch-link" onClick={() => switchMode('login')}>
                                Sign In
                            </span>
                        </div>
                    </>
                )}

                {mode === 'forgot' && (
                    <>
                        <p className="login-subtitle">Reset your password</p>
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <form onSubmit={handleForgotPassword} className="login-form">
                            <div className="form-group">
                                <label htmlFor="reset-email">Email Address</label>
                                <input
                                    type="email"
                                    id="reset-email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                />
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
        </div>
    );
};

export default Login;
