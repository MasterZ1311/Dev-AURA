import React from 'react';

/**
 * ErrorBoundary — catches any unhandled render errors from child components.
 * Prevents the entire app from going blank on a bug.
 * Usage: Wrap any top-level provider or page with <ErrorBoundary>.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[Aura ErrorBoundary]', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    gap: '1.5rem',
                    background: 'var(--bg-color, #0d0f17)',
                    color: 'var(--text-color, #e2e8f0)',
                    padding: '2rem',
                    textAlign: 'center',
                    fontFamily: 'system-ui, sans-serif',
                }}>
                    <div style={{ fontSize: '3rem' }}>⚡</div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Something went wrong</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted, #64748b)', maxWidth: '480px' }}>
                        {this.props.message || 'An unexpected error occurred in this section of Aura.'}
                    </p>
                    {this.state.error && (
                        <details style={{ fontSize: '0.8rem', color: '#ef4444', maxWidth: '600px', textAlign: 'left' }}>
                            <summary>Error details</summary>
                            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '0.5rem' }}>
                                {this.state.error.toString()}
                            </pre>
                        </details>
                    )}
                    <button
                        onClick={this.handleReset}
                        style={{
                            padding: '0.6rem 1.5rem',
                            background: 'var(--accent-color, #00b4d8)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
