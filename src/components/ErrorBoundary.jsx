import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          padding: '2rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--accent-red)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem',
            maxWidth: '550px',
            width: '100%',
            textAlign: 'center',
            boxShadow: 'var(--shadow-main)'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              color: 'var(--accent-red)',
              marginBottom: '1rem'
            }}>
              <AlertTriangle size={48} />
            </div>

            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.5rem',
              color: '#fff',
              marginBottom: '0.5rem'
            }}>
              Something Went Wrong
            </h2>

            <p style={{
              color: 'var(--text-muted)',
              marginBottom: '1.5rem',
              fontSize: '0.95rem'
            }}>
              An unexpected battle exception occurred. You can return safely to the lobby or refresh the arena.
            </p>

            <div style={{
              background: '#0d1117',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#f87171',
              textAlign: 'left',
              marginBottom: '1.5rem',
              overflowX: 'auto'
            }}>
              {this.state.error?.message || 'Unknown runtime error'}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                className="btn-primary"
                onClick={this.handleReset}
              >
                <Home size={18} />
                Return to Lobby
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
