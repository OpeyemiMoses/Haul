import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  Calendar,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { HualIcon } from './HualLogo';

export default function AgeVerificationModal({ isOpen, onClose, onVerified, onRejected }) {
  // Date of Birth Inputs: Default to adult age (e.g. 2000-01-01)
  const [year, setYear] = useState('2000');
  const [month, setMonth] = useState('01');
  const [day, setDay] = useState('01');
  const [attested, setAttested] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isUnderage, setIsUnderage] = useState(false);

  // Calculate live age
  const calculatedAge = useMemo(() => {
    if (!year || !month || !day) return null;
    const birthDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [year, month, day]);

  const isEligible = calculatedAge !== null && calculatedAge >= 18;

  if (!isOpen) return null;

  const handleConfirm = () => {
    setSubmitted(true);
    if (!isEligible) {
      setIsUnderage(true);
      if (onRejected) onRejected(calculatedAge);
      return;
    }

    const dobString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    localStorage.setItem('hual_age_verified', 'true');
    localStorage.setItem('hual_user_dob', dobString);
    localStorage.setItem('hual_user_age', calculatedAge.toString());

    if (onVerified) {
      onVerified({ dob: dobString, age: calculatedAge });
    }
    if (onClose) {
      onClose();
    }
  };

  const handleReset = () => {
    setYear('2000');
    setMonth('01');
    setDay('01');
    setAttested(false);
    setSubmitted(false);
    setIsUnderage(false);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: 'blur(30px) saturate(200%)' }}>
      <div 
        className="custom-scrollbar"
        style={{
          maxWidth: '480px',
          width: '100%',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          padding: '36px 28px',
          background: 'linear-gradient(180deg, #142020 0%, #091010 100%)',
          border: '1px solid rgba(132, 244, 59, 0.4)',
          borderRadius: '28px',
          position: 'relative',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), 0 0 50px rgba(132, 244, 59, 0.22)',
          color: '#FFFFFF',
          fontFamily: "'Sora', sans-serif",
          margin: '0 auto'
        }}
      >
        {/* Underage Access Denied Screen */}
        {isUnderage ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#EF4444'
            }}>
              <XCircle size={32} />
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '999px',
              padding: '4px 12px',
              color: '#F87171',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '14px'
            }}>
              <span>ACCESS RESTRICTED • 18+ ONLY</span>
            </div>

            <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px' }}>
              Age Requirement Not Met
            </h2>

            <p style={{ fontSize: '0.86rem', color: '#9CA3AF', lineHeight: 1.55, marginBottom: '24px' }}>
              Hual enforces a strict 18+ policy for purchasing authenticated physical goods, minting onchain Product Passports, and executing smart contracts. Based on the birthdate entered, access cannot be granted.
            </p>

            <button
              onClick={handleReset}
              className="btn-pill-secondary"
              style={{ width: '100%', padding: '12px', fontSize: '0.85rem', fontWeight: 700, gap: '8px' }}
            >
              <RotateCcw size={15} />
              <span>Re-enter Date of Birth</span>
            </button>
          </div>
        ) : (
          /* Standard 18+ Verification Form */
          <div>
            {/* Top Badge */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
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
                <Lock size={13} />
                <span>18+ LEGAL AGE VERIFICATION</span>
              </div>

              <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF' }}>
                Verify Your Age
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
                To access Hual verified commerce and trade digital Product Passports, you must be at least 18 years of age.
              </p>
            </div>

            {/* Date of Birth Selection Matrix */}
            <div style={{
              background: 'rgba(8, 15, 15, 0.75)',
              borderRadius: '18px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#D1D5DB',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px'
              }}>
                <Calendar size={14} color="var(--brand-green)" />
                <span>Date of Birth</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: '8px' }}>
                {/* Month Selector */}
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 8px',
                      background: '#121C1C',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {[
                      { v: '01', l: '01 - January' },
                      { v: '02', l: '02 - February' },
                      { v: '03', l: '03 - March' },
                      { v: '04', l: '04 - April' },
                      { v: '05', l: '05 - May' },
                      { v: '06', l: '06 - June' },
                      { v: '07', l: '07 - July' },
                      { v: '08', l: '08 - August' },
                      { v: '09', l: '09 - September' },
                      { v: '10', l: '10 - October' },
                      { v: '11', l: '11 - November' },
                      { v: '12', l: '12 - December' }
                    ].map(m => (
                      <option key={m.v} value={m.v} style={{ background: '#0D1616', color: '#FFF' }}>{m.l}</option>
                    ))}
                  </select>
                </div>

                {/* Day Selector */}
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Day</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 8px',
                      background: '#121C1C',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {Array.from({ length: 31 }, (_, i) => {
                      const val = (i + 1).toString().padStart(2, '0');
                      return <option key={val} value={val} style={{ background: '#0D1616', color: '#FFF' }}>{val}</option>;
                    })}
                  </select>
                </div>

                {/* Year Selector */}
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 8px',
                      background: '#121C1C',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {Array.from({ length: 80 }, (_, i) => {
                      const yr = (2026 - i).toString();
                      return <option key={yr} value={yr} style={{ background: '#0D1616', color: '#FFF' }}>{yr}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Legal Attestation Checkbox */}
            <div 
              onClick={() => setAttested(!attested)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: attested ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                marginBottom: '24px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '5px',
                border: attested ? '1.5px solid var(--brand-green)' : '1.5px solid rgba(255, 255, 255, 0.3)',
                background: attested ? 'var(--brand-green)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {attested && <CheckCircle2 size={13} color="#080F0F" />}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#D1D5DB', lineHeight: 1.45 }}>
                I certify under penalty of perjury that I am at least 18 years of age and legally authorized to enter commerce agreements.
              </span>
            </div>

            {/* Confirmation CTA */}
            <button
              onClick={handleConfirm}
              disabled={!isEligible || !attested}
              className="btn-pill-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.86rem',
                fontWeight: 800,
                gap: '8px',
                opacity: (!isEligible || !attested) ? 0.45 : 1,
                cursor: (!isEligible || !attested) ? 'not-allowed' : 'pointer'
              }}
            >
              <ShieldCheck size={16} />
              <span>Confirm 18+ Age & Enter Hual</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
