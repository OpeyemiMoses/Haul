import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './lib/auth/AuthContext'

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cmuyjr9ci00860dl30qhs6ya9';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Hual Runtime Boundary Caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#080F0F', color: '#FFFFFF', minHeight: '100vh', fontFamily: "'Sora', sans-serif" }}>
          <div style={{ maxWidth: '640px', margin: '40px auto', background: '#121C1C', border: '1px solid #EF4444', borderRadius: '16px', padding: '32px' }}>
            <h2 style={{ color: '#EF4444', marginTop: 0 }}>Rendering Issue Detected</h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>An unexpected error occurred while loading this view:</p>
            <pre style={{ background: '#080F0F', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '0.8rem', color: '#FCA5A5' }}>
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/?view=landing';
              }}
              style={{ marginTop: '20px', padding: '10px 24px', borderRadius: '999px', background: '#84F43B', color: '#080F0F', fontWeight: 800, border: 'none', cursor: 'pointer' }}
            >
              Reset State & Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#84F43B',
            showWalletLoginFirst: false,
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: 'all-users',
            },
          },
          loginMethods: ['google', 'email', 'sms'],
        }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </PrivyProvider>
    </ErrorBoundary>
  </StrictMode>,
)
