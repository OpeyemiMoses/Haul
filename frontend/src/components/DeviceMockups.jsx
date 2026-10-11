import React from 'react';
import { 
  ShieldCheck, 
  ShoppingBag, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  QrCode, 
  Sparkles,
  Search,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import HaulQrCode from './HaulQrCode';
import HualBrand, { HualIcon } from './HualLogo';

export default function DeviceMockups({ onLaunchApp }) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '980px', margin: '0 auto' }}>
      {/* Container holding both Laptop and Layered Phone */}
      <div style={{ position: 'relative' }}>
        
        {/* ================= 1. PC / LAPTOP MOCKUP ================= */}
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          {/* Laptop Lid / Screen Bezel */}
          <div className="laptop-frame">
            {/* Laptop Camera Lens */}
            <div className="laptop-camera" />

            {/* Laptop Screen Content (Storefront UI) */}
            <div style={{
              background: '#0B0F0F',
              minHeight: '420px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Fake Browser Chrome / Top Bar */}
              <div style={{
                background: '#070A0A',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                {/* Window Traffic Dots */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }} />
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#eab308' }} />
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#22c55e' }} />
                </div>

                {/* URL Pill */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '3px 18px',
                  borderRadius: '999px',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <Lock size={10} color="var(--brand-green)" />
                  <span style={{ color: '#FFFFFF' }}>https://haul.store/catalog</span>
                </div>

                <div style={{ width: '40px' }} />
              </div>

              {/* In-Browser Storefront Mockup Header */}
              <div style={{
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(11, 15, 15, 0.95)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HualBrand size={20} name="Haul" />
                  <span className="capsule-tag" style={{ padding: '2px 8px', fontSize: '0.6rem' }}>Storefront</span>
                </div>

                <div style={{ display: 'flex', gap: '14px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Audio</span>
                  <span>Cameras</span>
                  <span>Timepieces</span>
                  <span>Computing</span>
                </div>

                <div style={{
                  background: 'rgba(132, 244, 59, 0.1)',
                  border: '1px solid var(--brand-green-border)',
                  color: 'var(--brand-green)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px'
                }}>
                  $1,000.00 USD
                </div>
              </div>

              {/* In-Browser Storefront Catalog Grid Preview */}
              <div style={{ padding: '18px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {/* Product Card 1 */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px',
                  position: 'relative'
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80"
                    alt="Sony Headphones"
                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                  />
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#FFFFFF' }}>Sony WH-1000XM5</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--brand-green)' }}>$399.00</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Verified Stock</span>
                  </div>
                </div>

                {/* Product Card 2 */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px',
                  position: 'relative'
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80"
                    alt="Camera X1"
                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                  />
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#FFFFFF' }}>Camera X1 Prime</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--brand-green)' }}>$450.00</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Lens House</span>
                  </div>
                </div>

                {/* Product Card 3 */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px',
                  position: 'relative'
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"
                    alt="Mechanical Timepiece"
                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                  />
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#FFFFFF' }}>Chronograph Automatic</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--brand-green)' }}>$620.00</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>365d Warranty</span>
                  </div>
                </div>
              </div>

              {/* Bottom Notification Banner */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '18px',
                right: '18px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(11, 15, 15, 0.92)',
                border: '1px solid var(--brand-green-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem' }}>
                  <ShieldCheck size={14} color="var(--brand-green)" />
                  <span style={{ color: '#FFFFFF' }}>Buyer Protection Active on all orders</span>
                </div>
                <button
                  onClick={onLaunchApp}
                  className="btn-pill-primary btn-pill-sm"
                  style={{ fontSize: '0.7rem', padding: '4px 12px' }}
                >
                  <span>Explore App</span>
                  <ChevronRight size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* Laptop Base / Deck & Notch */}
          <div className="laptop-base">
            <div className="laptop-notch" />
          </div>
        </div>

        {/* ================= 2. MOBILE PHONE MOCKUP (LAYERED & FLOATING) ================= */}
        <div 
          className="phone-frame animate-float"
          style={{
            position: 'absolute',
            bottom: '-35px',
            right: '-10px',
            width: '270px',
            zIndex: 15,
            background: '#0B0F0F'
          }}
        >
          {/* Dynamic Island */}
          <div className="phone-island" />

          {/* Phone Screen: Living Product Passport View */}
          <div style={{
            background: '#101616',
            borderRadius: '26px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {/* Top Passport Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--brand-green)', fontWeight: 800, textTransform: 'uppercase' }}>
                Living Passport
              </span>
              <span style={{
                fontSize: '0.58rem',
                color: '#22c55e',
                background: 'rgba(34, 197, 94, 0.12)',
                padding: '2px 6px',
                borderRadius: '999px',
                fontWeight: 700
              }}>
                COLLECTED
              </span>
            </div>

            <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '2px' }}>
              CAMERA X1
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Owner: Verified Account · Lens House
            </div>

            {/* Scannable Real QR Box */}
            <div style={{
              background: '#070A0A',
              borderRadius: '10px',
              padding: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <div style={{ background: '#FFFFFF', padding: '4px', borderRadius: '6px', flexShrink: 0 }}>
                <HaulQrCode value="https://haul.store/verify/CAMX1" size={52} />
              </div>
              <div>
                <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#FFFFFF' }}>Scan to Verify</div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  In-store pickup PIN & warranty claims
                </div>
              </div>
            </div>

            {/* Warranty Status Bar */}
            <div style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Warranty</span>
                <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>365 Days Active</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: 'var(--brand-green)' }} />
              </div>
            </div>

            {/* Quick Action Button: Transfer Ownership */}
            <button
              onClick={onLaunchApp}
              className="btn-pill-primary"
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '0.68rem',
                borderRadius: '999px',
                fontWeight: 700
              }}
            >
              <span>1-Click Ownership Transfer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
