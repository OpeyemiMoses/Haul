import React, { useState } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Store, 
  QrCode, 
  Layers, 
  Lock, 
  RefreshCw, 
  Zap, 
  Smartphone, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  LogIn,
  User,
  Check
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import HualBrand, { HualIcon } from './HualLogo';
import LiquidGlassShowcase from './LiquidGlassShowcase';
import useScrollReveal from '../lib/useScrollReveal';

const LIFECYCLE_STEPS = [
  { step: '01', title: 'Discover & Buy', shortLabel: '01 Discover', desc: 'Browse curated goods from verified retail stores with zero gas tokens required.' },
  { step: '02', title: 'Collect & Handover', shortLabel: '02 Collect', desc: 'Present your encrypted in-store QR pass or PIN for instant physical pickup.' },
  { step: '03', title: 'Factory Warranty', shortLabel: '03 Warranty', desc: 'Access active warranty coverage and repair claims directly from your passport.' },
  { step: '04', title: 'Transfer & Resell', shortLabel: '04 Resell', desc: 'Transfer authentic ownership or resell on secondary markets with verified provenance.' }
];

export default function LandingPage({ onLaunchApp, onOpenProfileModal, onNavigateToSignIn, onOpenLoginModal }) {
  const { user, authenticated, logout, profilePicture, isAgeVerified, setAgeVerificationOpen, openLoginModal, login } = useAuth();
  const [copiedContract, setCopiedContract] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  useScrollReveal();

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'You');
  const userInitial = (displayName[0] || 'U').toUpperCase();

  const handleSignIn = () => {
    if (onOpenLoginModal) onOpenLoginModal();
    else if (openLoginModal) openLoginModal();
    else if (login) login();
    else if (onNavigateToSignIn) onNavigateToSignIn();
    else handleEnter('shop');
  };

  const handleEnter = (targetTab = 'shop') => {
    const validTab = (typeof targetTab === 'string' && targetTab) ? targetTab : 'shop';
    if (!isAgeVerified) {
      setAgeVerificationOpen(true);
      return;
    }
    if (authenticated) {
      if (onLaunchApp) onLaunchApp(validTab);
    } else {
      handleSignIn();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent', color: '#FFFFFF', fontFamily: "'Sora', sans-serif", position: 'relative', zIndex: 1, overflowX: 'hidden', width: '100%', maxWidth: '100%' }}>
      
      {/* ================= 1. FLOATING NAVIGATION BAR ================= */}
      {/* ================= 1. FLOATING NAVIGATION BAR ================= */}
      <header 
        className="landing-fixed-header"
        style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          maxWidth: '1240px',
          width: 'calc(100% - 24px)',
          margin: '0 auto',
          pointerEvents: 'none'
        }}
      >
        <div className="apple-glass-dock landing-header-dock" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          gap: '12px',
          pointerEvents: 'auto'
        }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }} onClick={() => handleEnter('shop')}>
            <HualBrand size={24} name="Hual" showTagline={false} />
          </div>

          {/* Center Links (Hidden on mobile <768px to eliminate compression) */}
          <nav className="landing-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <span 
              onClick={() => handleEnter('shop')}
              style={{ fontSize: '0.8rem', color: '#9CA3AF', cursor: 'pointer', fontWeight: 600, transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}
            >
              Shop
            </span>
            <span 
              onClick={() => handleEnter('shop')}
              style={{ fontSize: '0.8rem', color: '#9CA3AF', cursor: 'pointer', fontWeight: 600, transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}
            >
              Sell
            </span>
            <a 
              href="#how-it-works"
              style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 600, transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}
            >
              About
            </a>
          </nav>

          {/* Right Action: Sign In or Enter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {authenticated && user ? (
              <button
                onClick={() => (onLaunchApp ? onLaunchApp('shop') : handleEnter('shop'))}
                className="btn-pill-primary"
                style={{
                  padding: '7px 18px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.01em',
                  boxShadow: '0 0 18px rgba(132, 244, 59, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Enter</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="btn-pill-primary"
                style={{
                  padding: '7px 18px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.01em',
                  boxShadow: '0 0 16px rgba(132, 244, 59, 0.25)',
                  cursor: 'pointer'
                }}
              >
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ================= 2. HERO SECTION ================= */}
      <section style={{
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
        padding: 'clamp(76px, 11vw, 96px) 16px 50px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(290px, 100%), 1fr))',
        gap: '36px',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {/* Left Column: Headlines & CTA with Pop & Stagger */}
        <div className="reveal-pop" style={{ maxWidth: '100%', minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: '14px', fontSize: '0.72rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-green)' }} />
            <span>Verified Consumer Commerce</span>
          </div>

          <h1 className="font-display" style={{
            fontSize: 'clamp(1.6rem, 3.4vw, 2.4rem)',
            fontWeight: 800,
            lineHeight: 1.18,
            color: '#FFFFFF',
            margin: '0 0 14px',
            letterSpacing: '-0.02em'
          }}>
            More than just a purchase. <br />
            <span style={{ color: 'var(--brand-green)' }}>It's your product's passport.</span>
          </h1>

          <p style={{
            fontSize: '0.92rem',
            fontWeight: 600,
            color: '#D1D5DB',
            margin: '0 0 8px',
            letterSpacing: '0.01em'
          }}>
            Discover. Buy. Collect. Own. Prove. Transfer.
          </p>

          <p style={{
            fontSize: '0.82rem',
            color: '#9CA3AF',
            lineHeight: 1.55,
            maxWidth: '480px',
            margin: '0 0 28px'
          }}>
            Hual links physical luxury goods to verifiable digital Product Passports. 
            Enjoy seamless checkout where your warranty, authenticity, and resale rights follow the product for life.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <button 
              onClick={() => (authenticated ? handleEnter('shop') : handleSignIn())}
              className="btn-pill-primary"
              style={{ fontWeight: 800, padding: '9px 20px', fontSize: '0.82rem' }}
            >
              <span>{authenticated ? 'Explore Store' : 'Sign In to Shop'}</span>
              <ArrowRight size={14} />
            </button>

            <a 
              href="#how-it-works"
              className="btn-pill-secondary"
              style={{ padding: '9px 18px', fontSize: '0.82rem' }}
            >
              How It Works
            </a>
          </div>

          {/* 4 Core Pillars */}
          <div 
            className="hero-pillars-track"
            style={{
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="hero-pillar-item">
              <CheckCircle2 size={14} color="var(--brand-green)" />
              <span>Verified Merchants</span>
            </div>
            <div className="hero-pillar-item">
              <CheckCircle2 size={14} color="var(--brand-green)" />
              <span>Gasless Checkout</span>
            </div>
            <div className="hero-pillar-item">
              <CheckCircle2 size={14} color="var(--brand-green)" />
              <span>Digital Product Passport</span>
            </div>
            <div className="hero-pillar-item">
              <CheckCircle2 size={14} color="var(--brand-green)" />
              <span>Transfer & Resell</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sony WH-1000XM4 Passport Card Entering from Right Angle */}
        <div 
          className="card-reveal-right perspective-container"
          style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', maxWidth: '100%', overflow: 'hidden', padding: '16px 0' }}
        >
          {/* Glowing Green Ambient Radial Energy Vortex */}
          <div style={{
            position: 'absolute',
            width: 'min(440px, 92vw)',
            height: 'min(440px, 92vw)',
            maxWidth: '100%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(132, 244, 59, 0.35) 0%, rgba(132, 244, 59, 0.12) 45%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          {/* Futuristic Neon Green Orbit Ring from Figma Screen 01 */}
          <svg 
            width="420" 
            height="420" 
            viewBox="0 0 420 420" 
            style={{ 
              position: 'absolute', 
              zIndex: 0, 
              pointerEvents: 'none',
              filter: 'drop-shadow(0 0 25px rgba(132, 244, 59, 0.6))',
              maxWidth: '100%',
              width: 'min(420px, 92vw)',
              height: 'min(420px, 92vw)'
            }}
          >
            <defs>
              <linearGradient id="vortexGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#84F43B" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#4ADE80" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#84F43B" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <ellipse 
              cx="210" 
              cy="210" 
              rx="180" 
              ry="140" 
              fill="none" 
              stroke="url(#vortexGlow)" 
              strokeWidth="5" 
              transform="rotate(-25 210 210)" 
              strokeDasharray="900 120"
            />
          </svg>

          {/* Floating Liquid-Glass Product Passport Card with Inner Elements Rising & Rotating */}
          <div 
            onClick={() => handleEnter('shop')}
            style={{
              position: 'relative',
              zIndex: 1,
              maxWidth: '340px',
              width: '100%',
              background: 'rgba(14, 20, 20, 0.75)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '26px',
              padding: '22px',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.22), 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(132, 244, 59, 0.15)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 30px 70px rgba(0, 0, 0, 0.9), 0 0 45px rgba(132, 244, 59, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(132, 244, 59, 0.25)';
            }}
          >
            {/* Card Header (Rises into place) */}
            <div 
              className="rise-rotate-in rise-delay-1"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HualIcon size={20} />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>Product Passport</span>
              </div>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'var(--brand-green-dim)',
                color: 'var(--brand-green)',
                border: '1px solid var(--brand-green-border)'
              }}>
                VERIFIED
              </span>
            </div>

            {/* Product Image Frame: Sony WH-1000XM4 (Rises with 3D tilt into card) */}
            <div 
              className="rise-rotate-in rise-delay-1"
              style={{
                width: '100%',
                height: '200px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#080F0F',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '14px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img 
                src="/assets/sony_passport.jpg" 
                alt="Sony WH-1000XM4" 
                style={{ width: '90%', height: '90%', objectFit: 'contain' }}
              />
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '10px',
                background: 'rgba(8, 15, 15, 0.85)',
                padding: '3px 8px',
                borderRadius: '999px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                Sony Official Store
              </div>
            </div>

            {/* Product Meta (Rises into place) */}
            <div className="rise-rotate-in rise-delay-2" style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '2px' }}>
                Sony WH-1000XM4
              </div>
              <div style={{ fontSize: '0.76rem', color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>
                SN-SNY-1000XM4 • $320.00
              </div>
            </div>

            {/* Spec breakdown (Rises into place) */}
            <div 
              className="rise-rotate-in rise-delay-3"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '10px 12px',
                background: '#080F0F',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.76rem',
                marginBottom: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9CA3AF' }}>Owner</span>
                <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{displayName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9CA3AF' }}>Warranty</span>
                <span style={{ fontWeight: 600, color: '#FFFFFF' }}>12 months</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9CA3AF' }}>Status</span>
                <span style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'var(--brand-green-dim)',
                  color: 'var(--brand-green)',
                  border: '1px solid var(--brand-green-border)'
                }}>
                  Active
                </span>
              </div>
            </div>

            <button 
              onClick={() => handleEnter('passports')}
              className="btn-pill-primary rise-rotate-in rise-delay-4"
              style={{ width: '100%', padding: '9px', fontSize: '0.82rem', fontWeight: 800 }}
            >
              Open Passport
            </button>
          </div>
        </div>
      </section>

      {/* ================= 3. TRUSTED BRANDS BAR ================= */}
      <section 
        className="reveal-pop"
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(12, 18, 18, 0.55)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          padding: '20px 0',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '14px', padding: '0 16px' }}>
            Trusted Brands & Verified Merchants
          </div>

          <div 
            className="trusted-vendors-scroll-track"
            style={{
              display: 'flex',
              alignItems: 'center',
              overflowX: 'auto',
              flexWrap: 'nowrap',
              gap: '14px',
              padding: '4px 20px',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              opacity: 0.95
            }}
          >
            {[
              { name: 'NIKE', tag: 'Verified' },
              { name: 'SONY', tag: 'Official' },
              { name: 'ADIDAS', tag: 'Verified' },
              { name: 'APPLE', tag: 'Authorized' },
              { name: 'SAMSUNG', tag: 'Flagship' },
              { name: 'JBL', tag: 'Official' },
              { name: 'ROLEX', tag: 'Verified' },
              { name: 'BALENCIAGA', tag: 'Curated' },
              { name: 'PRADA', tag: 'Verified' }
            ].map((vendor) => (
              <div
                key={vendor.name}
                className="trusted-vendor-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ fontFamily: 'var(--font-main)', fontSize: '0.86rem', fontWeight: 800, letterSpacing: '0.12em', color: '#FFFFFF' }}>
                  {vendor.name}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--brand-green)', fontWeight: 700 }}>
                  • {vendor.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 3D PRODUCT PASSPORTS SHOWCASE ================= */}
      <LiquidGlassShowcase onExploreItem={() => handleEnter('shop')} />

      {/* ================= 4. HOW IT WORKS (THE 8-STEP LIFECYCLE) ================= */}
      <section id="how-it-works" style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 24px', width: '100%' }}>
        <div className="reveal-pop" style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
          <div className="eyebrow" style={{ marginBottom: '12px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-green)' }} />
            <span>Permanent Product Provenance</span>
          </div>
          <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 8px' }}>
            The Living Product Loop
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#9CA3AF', lineHeight: 1.55 }}>
            Traditional checkout ends with a dead paper receipt. Hual begins your product's living digital record that follows it forever.
          </p>
        </div>

        {/* ================= MOBILE SWITCHABLE TABS VIEW ================= */}
        <div className="lifecycle-mobile-switcher" style={{
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '100%'
        }}>
          {/* Segmented Horizontal Pill Switcher */}
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            width: '100%',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            justifyContent: 'center'
          }}>
            {LIFECYCLE_STEPS.map((item, idx) => {
              const isActive = idx === activeStepIdx;
              return (
                <button
                  key={item.step}
                  onClick={() => setActiveStepIdx(idx)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '999px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    background: isActive ? 'rgba(132, 244, 59, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                    border: isActive ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isActive ? 'var(--brand-green)' : '#9CA3AF',
                    boxShadow: isActive ? '0 0 16px rgba(132, 244, 59, 0.25)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Carousel Arrows & Dot Indicators */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px',
            marginBottom: '4px'
          }}>
            <button
              onClick={() => setActiveStepIdx(prev => (prev === 0 ? LIFECYCLE_STEPS.length - 1 : prev - 1))}
              aria-label="Previous Step"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {LIFECYCLE_STEPS.map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  onClick={() => setActiveStepIdx(dotIdx)}
                  style={{
                    width: dotIdx === activeStepIdx ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '999px',
                    background: dotIdx === activeStepIdx ? 'var(--brand-green)' : 'rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.25s ease',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setActiveStepIdx(prev => (prev === LIFECYCLE_STEPS.length - 1 ? 0 : prev + 1))}
              aria-label="Next Step"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Active Single Step Card on Mobile */}
          {(() => {
            const currentStep = LIFECYCLE_STEPS[activeStepIdx];
            return (
              <div 
                key={currentStep.step}
                className="liquid-glass-card"
                style={{
                  padding: '22px 18px',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-green)' }}>
                    {currentStep.step}
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'var(--brand-green-dim)',
                    color: 'var(--brand-green)',
                    border: '1px solid var(--brand-green-border)'
                  }}>
                    Step {activeStepIdx + 1} of 4
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {currentStep.title}
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#9CA3AF', lineHeight: 1.55, margin: 0 }}>
                  {currentStep.desc}
                </p>
              </div>
            );
          })()}
        </div>

        {/* ================= DESKTOP GRID VIEW ================= */}
        <div 
          className="lifecycle-desktop-grid stagger-group perspective-container"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}
        >
          {LIFECYCLE_STEPS.map((item, idx) => {
            const isLeft = idx % 2 === 0;
            const cardAngleClass = isLeft ? 'card-reveal-left' : 'card-reveal-right';

            return (
              <div 
                key={item.step}
                className={`liquid-glass-card ${cardAngleClass}`}
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div className="rise-rotate-in rise-delay-1">
                  <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-green)', marginBottom: '12px' }}>
                    {item.step}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#9CA3AF', lineHeight: 1.5, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="apple-liquid-glass reveal-pop" style={{
          marginTop: '40px',
          padding: '36px 24px',
          textAlign: 'center',
          borderRadius: '24px'
        }}>
          <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px' }}>
            Ready to experience verified commerce?
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '20px', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Shop authentic Nike, Sony, and Apple goods backed by permanent verified ownership and instant pickup.
          </p>
          <button onClick={() => handleEnter('shop')} className="btn-pill-primary" style={{ fontWeight: 800, padding: '9px 22px', fontSize: '0.82rem' }}>
            <ShoppingBag size={15} />
            <span>{authenticated ? 'Explore Store' : 'Sign In to Shop'}</span>
          </button>
        </div>
      </section>

      {/* ================= 5. FOOTER ================= */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(10, 16, 16, 0.65)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        padding: '36px 24px',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <HualBrand size={26} name="Hual" showTagline={true} />
            <div style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '6px' }}>
              Real products. Real ownership. Onchain.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '0.78rem', color: '#9CA3AF' }}>
            <span onClick={() => handleEnter('shop')} style={{ cursor: 'pointer' }}>Marketplace</span>
            <span onClick={() => handleEnter('passports')} style={{ cursor: 'pointer' }}>Passports</span>
            <span>Verified Merchants</span>
            <span>Buyer Protection</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
