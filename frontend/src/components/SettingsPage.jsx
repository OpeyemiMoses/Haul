import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  CheckCircle2, 
  ShieldCheck, 
  Sliders, 
  Lock, 
  Copy, 
  ArrowLeft, 
  Globe, 
  Trash2, 
  RefreshCw,
  Sparkles,
  MapPin,
  Store,
  Layers,
  Fuel
} from 'lucide-react';
import { getSavedTheme, applyTheme } from '../lib/theme';
import { useAuth } from '../lib/auth/AuthContext';
import { BUYER_LOCATIONS } from '../lib/catalogData';

export default function SettingsPage({ onNavigateTab }) {
  const { user, authenticated, userRole, userStore, userLocation, updateUserLocation, isAgeVerified, setAgeVerificationOpen } = useAuth();
  
  const [themeMode, setThemeMode] = useState(() => getSavedTheme());
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  const handleSelectTheme = (mode) => {
    setThemeMode(mode);
    applyTheme(mode);
  };

  const walletAddr = user?.address || user?.wallet?.address || '0xb4825ABd70312e52083DDB55D3a00c0c309a6C09';

  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(walletAddr);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('hual_current_conversation_id');
      localStorage.removeItem('hual_deleted_passports');
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch {}
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', padding: '0 0 80px' }}>
      
      {/* Settings Header */}
      <div 
        className="apple-liquid-glass" 
        style={{
          padding: '32px 30px',
          borderRadius: '26px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: '8px', fontSize: '0.72rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-green)' }} />
            <span>Preferences & System Settings</span>
          </div>

          <h1 className="font-display" style={{ 
            fontSize: '1.9rem', 
            fontWeight: 800, 
            color: '#FFFFFF', 
            margin: '0 0 8px', 
            letterSpacing: '-0.02em' 
          }}>
            Settings
          </h1>

          <p style={{ fontSize: '0.86rem', color: '#9CA3AF', lineHeight: 1.5, margin: 0 }}>
            Configure interface appearance, theme modes, blockchain network parameters, and personal account preferences.
          </p>
        </div>

        {/* Ambient glow accent */}
        <div style={{
          position: 'absolute',
          right: '-40px',
          top: '-40px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(132, 244, 59, 0.14) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

        {/* ========================================================
            1. APPEARANCE & THEME SWITCHER (System, Light, Dark)
            ======================================================== */}
        <section 
          className="liquid-glass-card" 
          style={{
            padding: '28px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sun size={17} color="var(--brand-green)" />
              <h2 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Appearance & Theme
              </h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>
              Choose your preferred visual presentation. System mode synchronizes automatically with your operating system.
            </p>
          </div>

          {/* 3 Theme Options Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px'
          }}>
            
            {/* Option A: System */}
            <div
              onClick={() => handleSelectTheme('system')}
              style={{
                padding: '20px 18px',
                borderRadius: '18px',
                background: themeMode === 'system' 
                  ? 'linear-gradient(135deg, rgba(132, 244, 59, 0.14) 0%, rgba(14, 22, 22, 0.9) 100%)' 
                  : '#0D1616',
                border: themeMode === 'system' 
                  ? '1.5px solid var(--brand-green)' 
                  : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: themeMode === 'system' ? 'var(--brand-green)' : '#9CA3AF'
                }}>
                  <Monitor size={19} />
                </div>

                {themeMode === 'system' && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: 'var(--brand-green)',
                    color: '#080F0F',
                    fontSize: '0.66rem',
                    fontWeight: 800
                  }}>
                    <Check size={11} strokeWidth={3} />
                    <span>ACTIVE</span>
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                System Default
              </div>
              <p style={{ fontSize: '0.74rem', color: '#9CA3AF', margin: 0, lineHeight: 1.45 }}>
                Automatically match your device's light or dark mode schedule.
              </p>
            </div>

            {/* Option B: Light Mode */}
            <div
              onClick={() => handleSelectTheme('light')}
              style={{
                padding: '20px 18px',
                borderRadius: '18px',
                background: themeMode === 'light' 
                  ? 'linear-gradient(135deg, rgba(132, 244, 59, 0.14) 0%, rgba(240, 244, 244, 0.15) 100%)' 
                  : '#0D1616',
                border: themeMode === 'light' 
                  ? '1.5px solid var(--brand-green)' 
                  : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: themeMode === 'light' ? 'var(--brand-green)' : '#9CA3AF'
                }}>
                  <Sun size={19} />
                </div>

                {themeMode === 'light' && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: 'var(--brand-green)',
                    color: '#080F0F',
                    fontSize: '0.66rem',
                    fontWeight: 800
                  }}>
                    <Check size={11} strokeWidth={3} />
                    <span>ACTIVE</span>
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                Light Mode
              </div>
              <p style={{ fontSize: '0.74rem', color: '#9CA3AF', margin: 0, lineHeight: 1.45 }}>
                Crisp, luminous Apple glass surface with high-contrast typography.
              </p>
            </div>

            {/* Option C: Dark Mode */}
            <div
              onClick={() => handleSelectTheme('dark')}
              style={{
                padding: '20px 18px',
                borderRadius: '18px',
                background: themeMode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(132, 244, 59, 0.14) 0%, rgba(14, 22, 22, 0.9) 100%)' 
                  : '#0D1616',
                border: themeMode === 'dark' 
                  ? '1.5px solid var(--brand-green)' 
                  : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: themeMode === 'dark' ? 'var(--brand-green)' : '#9CA3AF'
                }}>
                  <Moon size={19} />
                </div>

                {themeMode === 'dark' && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: 'var(--brand-green)',
                    color: '#080F0F',
                    fontSize: '0.66rem',
                    fontWeight: 800
                  }}>
                    <Check size={11} strokeWidth={3} />
                    <span>ACTIVE</span>
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                Dark Mode
              </div>
              <p style={{ fontSize: '0.74rem', color: '#9CA3AF', margin: 0, lineHeight: 1.45 }}>
                Signature obsidian OLED liquid glass with neon emerald refractions.
              </p>
            </div>

          </div>
        </section>



        {/* ========================================================
            3. ACCOUNT & WALLET DETAILS
            ======================================================== */}
        <section 
          className="liquid-glass-card" 
          style={{
            padding: '28px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Lock size={17} color="var(--brand-green)" />
              <h2 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Wallet & Account Security
              </h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>
              Privy Embedded Wallet authentication and verified shopper status.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Wallet Address Row */}
            <div style={{
              padding: '16px 18px',
              borderRadius: '16px',
              background: '#0D1616',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>
                  Embedded Wallet Address (Monad)
                </div>
                <div style={{ 
                  fontSize: '0.84rem', 
                  fontFamily: 'var(--font-mono)', 
                  fontWeight: 700, 
                  color: '#FFFFFF',
                  marginTop: '3px',
                  wordBreak: 'break-all'
                }}>
                  {walletAddr}
                </div>
              </div>

              <button
                onClick={handleCopyAddress}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  background: copiedAddr ? 'rgba(132, 244, 59, 0.2)' : '#162424',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: copiedAddr ? 'var(--brand-green)' : '#FFFFFF',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {copiedAddr ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedAddr ? 'Copied' : 'Copy Address'}</span>
              </button>
            </div>

            {/* Location Selector */}
            <div style={{
              padding: '16px 18px',
              borderRadius: '16px',
              background: '#0D1616',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <MapPin size={14} color="var(--brand-green)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FFFFFF' }}>Primary Delivery Location</span>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {BUYER_LOCATIONS.slice(0, 5).map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => updateUserLocation(loc.name)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      background: userLocation === loc.name ? 'var(--brand-green)' : '#162424',
                      color: userLocation === loc.name ? '#080F0F' : '#D1D5DB',
                      border: userLocation === loc.name ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '0.74rem',
                      fontWeight: userLocation === loc.name ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {loc.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Session Cache Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '6px'
            }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>Session Cache</div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Clear temporary chat and modal preferences</div>
              </div>

              <button
                onClick={handleClearCache}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  background: resetSuccess ? 'rgba(132, 244, 59, 0.15)' : '#162424',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: resetSuccess ? 'var(--brand-green)' : '#9CA3AF',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={12} />
                <span>{resetSuccess ? 'Cache Cleared' : 'Clear Cache'}</span>
              </button>
            </div>

          </div>
        </section>

      </div>

    </div>
  );
}
