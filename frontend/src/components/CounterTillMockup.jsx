import React, { useState } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  Wifi, 
  RotateCcw, 
  Sparkles,
  ArrowRight,
  Clock,
  Layers
} from 'lucide-react';
import HaulQrCode from './HaulQrCode';

export default function CounterTillMockup() {
  const [amount, setAmount] = useState('12.50');
  const [paid, setPaid] = useState(false);
  const [settling, setSettling] = useState(false);

  const handleKeyPress = (val) => {
    if (paid) return;
    if (val === '⌫') {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (val === '.') {
      if (!amount.includes('.')) setAmount(prev => prev + '.');
    } else {
      if (amount === '0') setAmount(val);
      else if (amount.length < 7) setAmount(prev => prev + val);
    }
  };

  const handleSimulatePayment = () => {
    setSettling(true);
    setTimeout(() => {
      setSettling(false);
      setPaid(true);
    }, 700);
  };

  const handleReset = () => {
    setPaid(false);
    setSettling(false);
    setAmount('12.50');
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '1px',
      background: 'var(--border-line)',
      border: '1px solid var(--border-line)',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Side 1: Merchant In-Person Keypad Till */}
      <div style={{
        background: '#FFFFFF',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--brand-green)' }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#0A0D0D',
                fontWeight: 700
              }}>
                Physical Counter Terminal
              </span>
            </div>

            <button
              onClick={handleReset}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem'
              }}
              title="Reset terminal"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div style={{
            background: '#F9FAFB',
            border: '1px solid var(--border-line)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '20px'
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.66rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '4px'
            }}>
              Charge Customer
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#0A0D0D',
              letterSpacing: '-0.03em',
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px'
            }}>
              <span style={{ color: '#16A34A' }}>$</span>
              <span>{amount || '0'}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>USD</span>
            </div>
          </div>
        </div>

        {/* Numeric Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '18px'
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              style={{
                padding: '16px',
                background: '#FFFFFF',
                border: '1px solid var(--border-line)',
                borderRadius: '12px',
                color: '#0A0D0D',
                fontFamily: 'var(--font-mono)',
                fontSize: '1.15rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F3F4F6';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = 'var(--border-line)';
              }}
            >
              {key}
            </button>
          ))}
        </div>

        <div style={{
          fontSize: '0.74rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Wifi size={13} color="#16A34A" />
          <span>Real-time sync with customer display and living receipts</span>
        </div>
      </div>

      {/* Side 2: Customer Facing Screen */}
      <div style={{
        background: '#FAFAFA',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={15} color="#0A0D0D" />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-secondary)'
              }}>
                Customer Screen
              </span>
            </div>

            <span style={{
              background: paid ? '#DCFCE7' : '#F3F4F6',
              border: `1px solid ${paid ? '#86EFAC' : '#E5E7EB'}`,
              color: paid ? '#166534' : '#0A0D0D',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '999px',
              textTransform: 'uppercase'
            }}>
              {paid ? 'PAID & VERIFIED' : (settling ? 'VERIFYING ORDER...' : 'AWAITING SCAN')}
            </span>
          </div>

          {/* Center Card: QR or Paid State */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-line)',
            borderRadius: '20px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '20px',
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
          }}>
            {!paid ? (
              <>
                <div style={{
                  padding: '12px',
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid var(--border-line)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  marginBottom: '16px',
                  display: 'inline-block'
                }}>
                  <HaulQrCode value={`haul:pay?amt=${amount}`} size={130} />
                </div>

                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#0A0D0D',
                  marginBottom: '4px'
                }}>
                  ${amount} USD
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  Scan with iPhone camera or contactless tap
                </div>
              </>
            ) : (
              <div style={{ padding: '16px 0' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#DCFCE7',
                  border: '2px solid #22C55E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#16A34A'
                }}>
                  <CheckCircle2 size={32} />
                </div>

                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A0D0D', marginBottom: '4px' }}>
                  Payment Confirmed
                </div>
                <div style={{ fontSize: '0.76rem', color: '#166534', fontFamily: 'var(--font-mono)', marginBottom: '12px', fontWeight: 600 }}>
                  Order #89201 · Living Product Passport Issued
                </div>
                <div style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-secondary)',
                  background: '#F9FAFB',
                  border: '1px solid var(--border-line)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  display: 'inline-block'
                }}>
                  Receipt and active warranty certificate added to customer profile
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button: Simulate or Reset */}
        <div>
          {!paid ? (
            <button
              onClick={handleSimulatePayment}
              disabled={settling}
              className="btn-pill-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.86rem',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={14} color="var(--brand-green)" />
              <span>{settling ? 'Confirming...' : 'Simulate Customer Payment'}</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="btn-pill-secondary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.84rem',
                justifyContent: 'center'
              }}
            >
              <RotateCcw size={13} />
              <span>New Counter Sale</span>
            </button>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            <span>Instant Handover</span>
            <span>Zero Card Delay</span>
            <span>Living Warranty Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
