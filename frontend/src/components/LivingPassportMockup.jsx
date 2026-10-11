import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  QrCode, 
  ArrowRight, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Layers,
  Lock,
  ExternalLink,
  Tag,
  Copy
} from 'lucide-react';
import HaulQrCode from './HaulQrCode';

export default function LivingPassportMockup() {
  const [seconds, setSeconds] = useState(18);
  const [transferred, setTransferred] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinRevealed, setPinRevealed] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => (prev > 0 ? prev - 1 : 59));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSimulateTransfer = () => {
    setTransferring(true);
    setTimeout(() => {
      setTransferring(false);
      setTransferred(true);
    }, 850);
  };

  const handleReset = () => {
    setTransferred(false);
    setTransferring(false);
  };

  const handleCopySerial = () => {
    navigator.clipboard.writeText('SN-LCA-99214');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      {/* Col 1: Hardware Visual & Provenance Metadata */}
      <div style={{
        background: '#FFFFFF',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          {/* Eyebrow */}
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
                Physical Hardware Twin
              </span>
            </div>

            <span style={{
              background: '#F3F4F6',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: '#0A0D0D',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              SER: SN-LCA-99214
            </span>
          </div>

          {/* Product Image Frame */}
          <div style={{
            position: 'relative',
            height: '210px',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '20px',
            border: '1px solid var(--border-line)'
          }}>
            <img 
              src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80" 
              alt="Leica M11 Rangefinder" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(10, 13, 13, 0.8) 0%, transparent 60%)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '14px',
              left: '16px',
              right: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end'
            }}>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Leica M11 Rangefinder
                </div>
                <div style={{ fontSize: '0.74rem', color: '#E5E7EB' }}>
                  Black Paint Finish · 60MP Sensor
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#FFFFFF'
              }}>
                $8,995
              </div>
            </div>
          </div>

          {/* Provenance Details */}
          <div style={{
            background: '#F9FAFB',
            border: '1px solid var(--border-line)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Serial Number</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#0A0D0D', fontWeight: 700 }}>
                  SN-LCA-99214
                </span>
                <button
                  onClick={handleCopySerial}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copied ? '#16A34A' : 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>NFC Hardware Tag</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#16A34A', fontWeight: 600 }}>
                Verified Intact
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Original Store</span>
              <span style={{ fontSize: '0.74rem', color: '#0A0D0D', fontWeight: 700 }}>
                Apex Optics Berlin
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{
          marginTop: '20px',
          fontSize: '0.74rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <ShieldCheck size={14} color="#16A34A" />
          <span>Permanently linked digital passport representing true physical ownership</span>
        </div>
      </div>

      {/* Col 2: The Living Digital Passport Certificate */}
      <div style={{
        background: '#FAFAFA',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-secondary)',
              fontWeight: 700
            }}>
              Living Passport Certificate
            </span>

            <span style={{
              background: '#DCFCE7',
              border: '1px solid #86EFAC',
              color: '#166534',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16A34A' }} />
              ACTIVE DIGITAL PASSPORT
            </span>
          </div>

          {/* Metric Grid: Warranty & Owner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1px',
            background: 'var(--border-line)',
            border: '1px solid var(--border-line)',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{ background: '#FFFFFF', padding: '16px' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.64rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                marginBottom: '4px'
              }}>
                Factory Warranty
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#0A0D0D'
              }}>
                364d 14h {seconds}s
              </div>
              <div style={{ fontSize: '0.68rem', color: '#16A34A', marginTop: '2px', fontWeight: 600 }}>
                Manufacturer Service Live
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.64rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                marginBottom: '4px'
              }}>
                Current Holder
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: transferred ? '#0284C7' : '#0A0D0D'
              }}>
                {transferred ? 'Secondary Buyer' : 'Primary Buyer'}
              </div>
              <div style={{ fontSize: '0.68rem', color: transferred ? '#0284C7' : 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                {transferred ? 'Resale Transfer Logged' : 'Initial Retail Handover'}
              </div>
            </div>
          </div>

          {/* Security PIN Box */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-line)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Counter Handover Security PIN</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.3rem',
                fontWeight: 800,
                color: '#0A0D0D',
                letterSpacing: '0.15em',
                marginTop: '2px'
              }}>
                {pinRevealed ? '4921' : '••••'}
              </div>
            </div>

            <button
              onClick={() => setPinRevealed(!pinRevealed)}
              style={{
                background: '#F3F4F6',
                border: '1px solid var(--border-line)',
                color: '#0A0D0D',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {pinRevealed ? 'Hide PIN' : 'Show PIN'}
            </button>
          </div>
        </div>

        {/* Action Button: Transfer Living Passport */}
        <div>
          {!transferred ? (
            <button
              onClick={handleSimulateTransfer}
              disabled={transferring}
              className="btn-pill-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.86rem',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={14} color="var(--brand-green)" />
              <span>{transferring ? 'Transferring Certificate...' : 'Simulate 1-Click Ownership Transfer'}</span>
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
              <RefreshCw size={13} />
              <span>Reset Passport State</span>
            </button>
          )}

          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            fontSize: '0.7rem',
            color: 'var(--text-muted)'
          }}>
            When physical goods resell, the living warranty transfers with zero paper loss.
          </div>
        </div>
      </div>
    </div>
  );
}
