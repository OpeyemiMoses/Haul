import React, { useState } from 'react';
import { ShieldCheck, Key, Copy, Check, Fuel, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function PrivyModal({ isOpen, onClose }) {
  const { user, usdcBalance, loadingBalance, checkBalance } = useAuth();
  const [copied, setCopied] = useState(false);
  const [privyAppId, setPrivyAppId] = useState(import.meta.env.VITE_PRIVY_APP_ID || '');

  if (!isOpen) return null;

  const handleCopy = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '30px',
        background: '#121520',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #836ef9 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Privy Embedded Account</h3>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Non-custodial identity & payment vault on Monad
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
          Your embedded wallet manages your digital Product Passports, USDC payments, and escrow releases without seed phrases or gas fees.
        </p>

        {/* Account Details Box */}
        <div style={{
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACCOUNT ID</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>
                {user?.address ? `${user.address.slice(0, 10)}...${user.address.slice(-8)}` : 'Loading...'}
              </span>
              <button
                onClick={handleCopy}
                style={{ background: 'none', border: 'none', color: copied ? '#10b981' : 'var(--text-muted)', cursor: 'pointer' }}
                title="Copy Address"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>USDC BALANCE</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                ${usdcBalance.toFixed(2)} USDC
              </div>
            </div>
          </div>
        </div>

        {/* Account Security status */}
        <div style={{
          padding: '12px 14px',
          background: 'rgba(132, 244, 59, 0.08)',
          borderRadius: '8px',
          border: '1px solid var(--brand-green-border)',
          marginBottom: '22px',
          fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--brand-green)', marginBottom: '4px' }}>
            <Key size={14} /> SECURE ONE-TAP CHECKOUT
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Your account is verified and ready for instant purchases with full buyer protection.
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
