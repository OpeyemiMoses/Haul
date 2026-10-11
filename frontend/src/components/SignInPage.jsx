import React, { useState, useEffect } from 'react';
import { MapPin, ArrowLeft, ShieldCheck, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { useAuth } from '../lib/auth/AuthContext';
import HualBrand from './HualLogo';
import { BUYER_LOCATIONS } from '../lib/catalogData';

export default function SignInPage({ onSignInSuccess, onBackToLanding }) {
  const { updateUserLocation, isAgeVerified, setAgeVerificationOpen } = useAuth();
  
  // Official Privy Authentication Hooks
  const { ready: privyReady, authenticated: privyAuthenticated, user: privyUser, login: privyLogin } = usePrivy();

  const [userName, setUserName] = useState(() => localStorage.getItem('hual_user_name') || '');
  const [location, setLocation] = useState(() => localStorage.getItem('hual_user_location') || 'New York City, NY');
  const [customLoc, setCustomLoc] = useState('');
  const [useCustomLoc, setUseCustomLoc] = useState(false);
  const [error, setError] = useState(null);

  const selectedLocation = useCustomLoc && customLoc.trim() ? customLoc.trim() : location;

  const handleApplyLoginSuccess = () => {
    updateUserLocation(selectedLocation);
    localStorage.setItem('hual_user_location', selectedLocation);
    localStorage.setItem('hual_user_role', 'consumer');
    if (userName.trim()) {
      localStorage.setItem('hual_user_name', userName.trim());
    }
    localStorage.setItem('hual_onboarded', 'true');

    if (!isAgeVerified) {
      setAgeVerificationOpen(true);
      return;
    }

    if (onSignInSuccess) {
      onSignInSuccess();
    }
  };

  // Official Privy Login with Lifecycle Callbacks
  const { login: openPrivyLogin } = useLogin({
    onComplete: (user, isNewUser, wasAlreadyAuthenticated, loginMethod) => {
      handleApplyLoginSuccess();
    },
    onError: (err) => {
      console.warn('Privy authentication notification:', err);
      if (err?.message && !err.message.includes('exited_auth_flow')) {
        setError(err.message);
      }
    }
  });

  // Watch for Privy authentication completion
  useEffect(() => {
    if (privyAuthenticated && privyUser) {
      handleApplyLoginSuccess();
    }
  }, [privyAuthenticated, privyUser]);

  // Trigger Official Privy Modal
  const handleTriggerPrivy = () => {
    setError(null);
    updateUserLocation(selectedLocation);
    localStorage.setItem('hual_user_location', selectedLocation);
    localStorage.setItem('hual_user_role', 'consumer');
    if (userName.trim()) {
      localStorage.setItem('hual_user_name', userName.trim());
    }
    localStorage.setItem('hual_onboarded', 'true');

    try {
      if (openPrivyLogin && typeof openPrivyLogin === 'function') {
        openPrivyLogin();
      } else if (privyLogin && typeof privyLogin === 'function') {
        privyLogin();
      }
    } catch (err) {
      console.warn('Privy trigger notice:', err);
      setError(err?.message || 'Unable to open Privy authentication.');
    }
  };

  return (
    <div className="page-fade-in" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'transparent',
      color: '#FFFFFF',
      fontFamily: "'Sora', sans-serif",
      position: 'relative',
      zIndex: 1
    }}>
      {/* Top minimal header */}
      <header style={{
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div 
            onClick={onBackToLanding || onSignInSuccess} 
            style={{ cursor: 'pointer' }}
            title="Hual - Home"
          >
            <HualBrand size={20} name="Hual" showTagline={false} />
          </div>
        </div>

        {/* Privy Security Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(132, 244, 59, 0.12)',
          border: '1px solid rgba(132, 244, 59, 0.3)',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.25)',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--brand-green)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}>
          <ShieldCheck size={12} color="var(--brand-green)" />
          <span>Privy Non-Custodial Auth</span>
        </div>
      </header>

      {/* Main Apple Liquid Glass Card */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        position: 'relative',
        zIndex: 10
      }}>
        <div className="apple-liquid-glass" style={{
          width: '100%',
          maxWidth: '430px',
          padding: '30px 24px',
          borderRadius: '24px'
        }}>

          {/* Heading */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(132, 244, 59, 0.12)',
              border: '1px solid var(--brand-green-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 0 20px var(--brand-green-dim)'
            }}>
              <Lock size={18} color="var(--brand-green)" />
            </div>

            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Sign In to Hual
            </h1>
            <p style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.62)', margin: 0, lineHeight: 1.5 }}>
              Account creation and embedded wallet protection are handled directly by Privy.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              fontSize: '0.72rem',
              marginBottom: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Primary Action Buttons: Trigger Official Privy Authentication */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={handleTriggerPrivy}
              className="btn-pill-primary"
              style={{
                width: '100%',
                padding: '13px 20px',
                fontSize: '0.9rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 25px var(--brand-green-glow)'
              }}
            >
              <Lock size={15} color="#050808" />
              <span>Sign In with Privy</span>
              <ArrowRight size={15} color="#050808" />
            </button>

            <button
              type="button"
              onClick={handleTriggerPrivy}
              className="btn-pill-secondary"
              style={{
                width: '100%',
                padding: '11px 16px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google (Privy)</span>
            </button>

            {/* Privy Supported Methods Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.72rem',
              color: 'rgba(255, 255, 255, 0.65)'
            }}>
              <span>• Email</span>
              <span>• Google</span>
              <span>• Passkey</span>
              <span>• Web3 Wallet</span>
              <span>• SMS</span>
            </div>
          </div>

          {/* Privy Security Guarantee Subtext */}
          <div style={{
            marginTop: '18px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldCheck size={14} color="var(--brand-green)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.4 }}>
              Protected by Privy MPC on Monad testnet. Non-custodial embedded wallet created automatically on sign in.
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
