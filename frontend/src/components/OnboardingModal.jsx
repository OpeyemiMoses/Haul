import React, { useState } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  User, 
  Store,
  Check
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import { BUYER_LOCATIONS } from '../lib/catalogData';

export default function OnboardingModal({ isOpen, onClose, onComplete }) {
  const { user, updateUserLocation, refreshBalance } = useAuth();
  
  const [displayName, setDisplayName] = useState(user?.name || 'Shopper');
  const [selectedLocation, setSelectedLocation] = useState(user?.location || 'Victoria Island, Lagos');
  const [customLocation, setCustomLocation] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setSaving(true);
    const finalLocation = useCustom && customLocation.trim() ? customLocation.trim() : selectedLocation;
    
    // Save location to user profile
    updateUserLocation(finalLocation);
    localStorage.setItem('hual_user_location', finalLocation);
    localStorage.setItem('hual_user_role', 'consumer');
    localStorage.setItem('hual_onboarded', 'true');
    localStorage.setItem('hual_user_name', displayName);

    try {
      if (user?.address && refreshBalance) await refreshBalance(user.address);
    } catch (e) {
      console.warn('Balance refresh notice:', e);
    } finally {
      setSaving(false);
      if (onComplete) onComplete('consumer');
      if (onClose) onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div 
        className="custom-scrollbar"
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          padding: '36px 32px',
          background: 'linear-gradient(180deg, #121C1C 0%, #080F0F 100%)',
          border: '1px solid rgba(132, 244, 59, 0.35)',
          borderRadius: '24px',
          position: 'relative',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(132, 244, 59, 0.15)',
          color: '#FFFFFF',
          fontFamily: "'Sora', sans-serif",
          margin: '0 auto'
        }}
      >
        {/* Top Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--brand-green-dim)',
            border: '1px solid var(--brand-green-border)',
            borderRadius: '999px',
            padding: '4px 12px',
            color: 'var(--brand-green)',
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '12px'
          }}>
            <Sparkles size={13} />
            <span>CONSUMER PROFILE SETUP</span>
          </div>

          <h2 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF' }}>
            Welcome to Hual
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
            All members begin as verified consumers. Add your primary location to calculate accurate in-store pickup readiness and courier delivery times.
          </p>
        </div>

        {/* Display Name Field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
            Your Display Name
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#080F0F',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '10px 14px',
            gap: '10px'
          }}>
            <User size={16} color="var(--brand-green)" />
            <input 
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Yemi O., Alex C."
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 600,
                width: '100%',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Location Selection Field */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>
              Your Location (In Your Profile)
            </label>
            <button
              type="button"
              onClick={() => setUseCustom(!useCustom)}
              style={{ background: 'none', border: 'none', color: 'var(--brand-green)', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {useCustom ? 'Pick from Lagos areas' : 'Type custom street address'}
            </button>
          </div>

          {!useCustom ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {BUYER_LOCATIONS.slice(0, 6).map((loc) => {
                const isSelected = selectedLocation === loc.name;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocation(loc.name)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: isSelected ? 'var(--brand-green)' : '#080F0F',
                      color: isSelected ? '#080F0F' : '#FFFFFF',
                      border: isSelected ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.08)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{loc.name}</span>
                    {isSelected && <Check size={14} color="#080F0F" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#080F0F',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '10px 14px',
              gap: '10px'
            }}>
              <MapPin size={16} color="var(--brand-green)" />
              <input 
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="e.g. 14 Admiralty Way, Lekki Phase 1, Lagos"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  width: '100%',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Consumer Benefits Pill */}
        <div style={{
          background: '#080F0F',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '14px',
          padding: '14px',
          marginBottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#D1D5DB' }}>
            <CheckCircle2 size={15} color="var(--brand-green)" />
            <span>Role: <strong>Consumer / Shopper</strong> (Stored in profile)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#D1D5DB' }}>
            <CheckCircle2 size={15} color="var(--brand-green)" />
            <span>Zero-Gas Monad Wallet Created with 1,000 USDC demo funds</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#9CA3AF' }}>
            <Store size={15} color="#9CA3AF" />
            <span>Want to sell? You can create a store anytime from your profile!</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleFinish}
          disabled={saving}
          className="btn-pill-primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '0.92rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>{saving ? 'Saving Profile & Seeding Balance...' : 'Complete Profile & Start Shopping'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
