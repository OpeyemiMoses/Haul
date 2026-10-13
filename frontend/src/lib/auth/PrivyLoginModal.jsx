import React, { useState } from 'react';
import { ShieldCheck, Mail, ArrowRight, X, Lock, CheckCircle2, User, Sparkles } from 'lucide-react';
import { PrivyService } from './PrivyService';
import HualBrand, { HualIcon } from '../../components/HualLogo';
import { toast } from '../toast/ToastContext';

export default function PrivyLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [showGoogleInput, setShowGoogleInput] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuickGoogle = async (customEmail, customName) => {
    setLoading(true);
    try {
      const email = customEmail || googleEmail.trim() || 'shopper@gmail.com';
      const name = customName || googleName.trim() || email.split('@')[0];
      const { session, isNewUser } = await PrivyService.loginWithProvider('google', email, name);
      toast.success(`Welcome to Haul, ${name}!`);
      onLoginSuccess(session, isNewUser);
      onClose();
    } catch (err) {
      toast.error('Login error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput) return;
    setLoading(true);
    try {
      const name = emailInput.split('@')[0];
      const { session, isNewUser } = await PrivyService.loginWithProvider('email', emailInput.trim(), name);
      toast.success(`Welcome back, ${name}!`);
      onLoginSuccess(session, isNewUser);
      onClose();
    } catch (err) {
      toast.error('Email login error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '16px'
    }}>
      <div style={{
        background: '#0D1616',
        border: '1px solid rgba(132, 244, 59, 0.35)',
        borderRadius: '24px',
        padding: '36px 32px',
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(132, 244, 59, 0.15)',
        color: '#FFFFFF',
        fontFamily: "'Sora', sans-serif"
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: '#84F43B',
            color: '#080F0F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 25px rgba(132, 244, 59, 0.5)'
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 3h4v7h8V3h4v18h-4v-7H8v7H4V3z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Sign In to Hual
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
            Privy non-custodial authentication creates your embedded Monad wallet in one click.
          </p>
        </div>

        {/* Google Primary Button */}
        {!showGoogleInput ? (
          <div>
            <button
              onClick={() => setShowGoogleInput(true)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: '#FFFFFF',
                color: '#080F0F',
                fontSize: '0.92rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => handleQuickGoogle('shopper.yemi@gmail.com', 'Yemi')}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--brand-green)',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '16px',
                textAlign: 'center'
              }}
            >
              Instant Demo Login (as Yemi)
            </button>
          </div>
        ) : (
          <div style={{
            background: '#080F0F',
            border: '1px solid rgba(132, 244, 59, 0.3)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-green)', marginBottom: '10px' }}>
              Sign in with your Google Account
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '4px' }}>
                YOUR NAME
              </label>
              <input
                type="text"
                placeholder="e.g. Yemi / Alex / Your Name"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: '#121C1C',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '4px' }}>
                GOOGLE EMAIL
              </label>
              <input
                type="email"
                placeholder="you@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: '#121C1C',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleQuickGoogle()}
                disabled={loading}
                className="btn-pill-primary btn-pill-sm"
                style={{ flex: 1, padding: '9px 0', justifyContent: 'center', fontWeight: 800 }}
              >
                {loading ? 'Setting up...' : 'Sign In'}
              </button>
              <button
                onClick={() => setShowGoogleInput(false)}
                className="btn-pill-secondary btn-pill-sm"
                style={{ padding: '9px 12px' }}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0', color: '#6B7280', fontSize: '0.74rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
          <span>OR CONTINUE WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="Enter email address..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  borderRadius: '999px',
                  background: '#121C1C',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontSize: '0.86rem',
                  outline: 'none'
                }}
              />
              <Mail size={16} color="#6B7280" style={{ position: 'absolute', left: '14px', top: '14px' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-pill-secondary"
            style={{ width: '100%', padding: '11px', fontWeight: 700, fontSize: '0.84rem' }}
          >
            {loading ? 'Verifying with Privy...' : 'Continue with Email'}
          </button>
        </form>

        {/* Embedded Wallet Info */}
        <div style={{
          marginTop: '20px',
          padding: '12px 14px',
          background: 'rgba(8, 15, 15, 0.6)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.74rem',
          color: '#9CA3AF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
            <Lock size={13} color="var(--brand-green)" />
            <span>Privy Non-Custodial Security</span>
          </div>
          <div>
            Automatically creates an embedded Ethereum wallet on Monad. No seed phrases or browser extensions needed.
          </div>
        </div>
      </div>
    </div>
  );
}
