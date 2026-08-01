import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console
    console.error('🔴 [ErrorBoundary] Uncaught error:', error);
    console.error('🔴 [ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // Full-page error display
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#141414',
          color: '#ffffff',
          padding: '20px',
          fontFamily: 'monospace',
          textAlign: 'left',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <h1 style={{ color: '#e50914', marginBottom: '20px' }}>⚠️ React Error</h1>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #e50914',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '900px',
            width: '100%',
            overflow: 'auto',
            maxHeight: '80vh'
          }}>
            <h3 style={{ color: '#ff6b6b' }}>Error Message</h3>
            <pre style={{
              background: '#0d0d0d',
              padding: '12px',
              borderRadius: '4px',
              color: '#ffd700',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {this.state.error?.toString() || 'Unknown error'}
            </pre>

            {this.state.errorInfo && (
              <>
                <h3 style={{ color: '#ff6b6b', marginTop: '20px' }}>Component Stack</h3>
                <pre style={{
                  background: '#0d0d0d',
                  padding: '12px',
                  borderRadius: '4px',
                  color: '#4fc3f7',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '13px'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}

            <h3 style={{ color: '#ff6b6b', marginTop: '20px' }}>Full Error Object</h3>
            <pre style={{
              background: '#0d0d0d',
              padding: '12px',
              borderRadius: '4px',
              color: '#81c784',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '12px',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {JSON.stringify(this.state.error, Object.getOwnPropertyNames(this.state.error), 2)}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: '#e50914',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
