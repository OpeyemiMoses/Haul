import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Layers, 
  ExternalLink,
  ShoppingBag,
  Award
} from 'lucide-react';
import { HualIcon } from './HualLogo';
import useScrollReveal from '../lib/useScrollReveal';

const SHOWCASE_ITEMS = [
  {
    id: 'headset',
    category: 'High-End Audio & Acoustics',
    title: 'Aurora Pro ANC Wireless Studio Headset',
    subtitle: 'Studio-Grade Lossless Fidelity with Monad Digital Passport',
    brand: 'Haul Studio Flagship',
    brandHandle: '@haul.official',
    price: '$320.00',
    priceCents: 32000,
    imageUri: '/assets/3d_headset.jpg',
    imageSide: 'left',
    floatClass: 'float-3d-headset',
    accentColor: '#84F43B',
    passportId: '#HUAL-PASSPORT-SNY-99214',
    warranty: '12 Months Full Studio Coverage',
    specs: [
      { label: 'Acoustics', value: '40mm Beryllium Driver' },
      { label: 'Codec', value: 'LDAC 24-Bit / 96kHz' },
      { label: 'Battery', value: '30h Active Playback' },
      { label: 'Chassis', value: 'Emerald Contour LED' }
    ]
  },
  {
    id: 'phone',
    category: 'Next-Gen Spatial Tech',
    title: 'iPhone 16 Pro Max 256GB Titanium',
    subtitle: 'Grade 5 Aerospace Titanium with A18 Pro Spatial Bionic Engine',
    brand: 'Haul Verified Boutique',
    brandHandle: '@haul.tech',
    price: '$1,099.00',
    priceCents: 109900,
    imageUri: '/assets/3d_phone.jpg',
    imageSide: 'right',
    floatClass: 'float-3d-phone',
    accentColor: '#84F43B',
    passportId: '#HUAL-PASSPORT-APL-88219',
    warranty: '24 Months AppleCare Digital Passport',
    specs: [
      { label: 'Chassis', value: 'Grade 5 Titanium' },
      { label: 'Chipset', value: 'A18 Pro 3nm Bionic' },
      { label: 'Camera', value: '48MP Quad-Pixel Fusion' },
      { label: 'Display', value: '6.3" ProMotion 120Hz' }
    ]
  },
  {
    id: 'jacket',
    category: 'Streetwear & Tech Apparel',
    title: 'Cyber Tech Nanotech Windrunner Jacket',
    subtitle: 'Weatherproof Obsidian Ripstop with Living Provenance Record',
    brand: 'Haul Studio Atelier',
    brandHandle: '@haul.atelier',
    price: '$180.00',
    priceCents: 18000,
    imageUri: '/assets/3d_jacket.jpg',
    imageSide: 'left',
    floatClass: 'float-3d-jacket',
    accentColor: '#84F43B',
    passportId: '#HUAL-PASSPORT-NKE-11092',
    warranty: '6 Months Living Product Warranty',
    specs: [
      { label: 'Material', value: 'Nanotech Weatherproof Ripstop' },
      { label: 'Seams', value: 'Laser-Bonded Waterproof' },
      { label: 'Lighting', value: 'Emerald Reflective Seams' },
      { label: 'Fit', value: 'Tailored Streetwear Cut' }
    ]
  }
];

export default function LiquidGlassShowcase({ onExploreItem }) {
  useScrollReveal();

  return (
    <section style={{
      maxWidth: '1280px',
      margin: '0 auto',
      width: '100%',
      padding: '70px 24px 90px',
      position: 'relative'
    }}>
      {/* Background Ambient Radial Glow Mesh */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '900px',
        height: '900px',
        background: 'radial-gradient(circle, rgba(132, 244, 59, 0.08) 0%, rgba(20, 184, 166, 0.05) 45%, transparent 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Section Header with Scroll Reveal Pop */}
      <div className="reveal-pop" style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 60px', position: 'relative', zIndex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: '12px', display: 'inline-flex' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-green)' }} />
          <span>LIVING 3D PRODUCT PASSPORTS</span>
        </div>
        <h2 className="font-display" style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
          fontWeight: 800,
          color: '#FFFFFF',
          margin: '0 0 14px',
          letterSpacing: '-0.02em',
          lineHeight: 1.2
        }}>
          Physical Luxury. <span style={{ color: 'var(--brand-green)' }}>Verifiable Onchain.</span>
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
          Explore physical merchandise paired with immutable digital ownership, instant store collection, and lifetime warranty tracking.
        </p>
      </div>

      {/* Showcase Cards List with Alternating Angles and Rising & Rotating Elements */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '54px', position: 'relative', zIndex: 1 }}>
        {SHOWCASE_ITEMS.map((item, index) => {
          const isImageLeft = item.imageSide === 'left';
          const imageCardClass = isImageLeft ? 'card-reveal-left' : 'card-reveal-right';
          const pillCardClass = isImageLeft ? 'card-reveal-right' : 'card-reveal-left';

          return (
            <div
              key={item.id}
              className="perspective-container"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                alignItems: 'center',
                gap: '36px',
                position: 'relative'
              }}
            >
              {/* 3D Item Card (Enters from alternating angle) */}
              <div 
                className={`${imageCardClass} ${item.floatClass}`}
                style={{
                  order: isImageLeft ? 1 : 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  padding: '16px'
                }}
              >
                {/* Ambient Halo behind 3D render */}
                <div style={{
                  position: 'absolute',
                  width: '320px',
                  height: '320px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(132, 244, 59, 0.28) 0%, rgba(132, 244, 59, 0.08) 50%, transparent 70%)',
                  filter: 'blur(35px)',
                  zIndex: 0
                }} />

                {/* 3D Floating Product Image (Rises and Rotates into place) */}
                <div 
                  className="rise-rotate-in rise-delay-1"
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: '380px',
                    borderRadius: '28px',
                    overflow: 'hidden',
                    background: 'radial-gradient(circle at center, #101B1B 0%, #060B0B 100%)',
                    border: '1px solid rgba(132, 244, 59, 0.25)',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(132, 244, 59, 0.18)',
                    cursor: 'pointer',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onClick={() => onExploreItem && onExploreItem(item.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)';
                    e.currentTarget.style.borderColor = 'var(--brand-green)';
                    e.currentTarget.style.boxShadow = '0 30px 70px rgba(0, 0, 0, 0.9), 0 0 50px rgba(132, 244, 59, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(132, 244, 59, 0.25)';
                    e.currentTarget.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(132, 244, 59, 0.18)';
                  }}
                >
                  <img
                    src={item.imageUri}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '360px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                </div>
              </div>

              {/* Apple Liquid Glass Foreground Details Pill (Enters from opposite angle) */}
              <div 
                className={`liquid-pill-dark ${pillCardClass}`}
                style={{
                  order: isImageLeft ? 2 : 1,
                  padding: '32px',
                  borderRadius: '32px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => onExploreItem && onExploreItem(item.id)}
              >
                {/* Top Pill Header (Rises into place) */}
                <div 
                  className="rise-rotate-in rise-delay-1"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--brand-green)',
                      background: 'var(--brand-green-dim)',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: '1px solid var(--brand-green-border)'
                    }}>
                      {item.category}
                    </span>
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#E5E7EB'
                  }}>
                    <CheckCircle2 size={13} color="var(--brand-green)" />
                    <span>ONCHAIN VERIFIED</span>
                  </div>
                </div>

                {/* Product Title & Subtitle (Rises with slight 3D angle) */}
                <div className="rise-rotate-in rise-delay-2">
                  <h3 className="font-display" style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    margin: '0 0 6px',
                    lineHeight: 1.25
                  }}>
                    {item.title}
                  </h3>
                  
                  <p style={{
                    fontSize: '0.82rem',
                    color: '#9CA3AF',
                    margin: '0 0 20px',
                    lineHeight: 1.5
                  }}>
                    {item.subtitle}
                  </p>
                </div>

                {/* Merchant & Price Row (Rises into card) */}
                <div 
                  className="rise-rotate-in rise-delay-2"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background: 'rgba(8, 15, 15, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '20px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Verified Merchant</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF' }}>{item.brand}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>{item.brandHandle}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Retail Price</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{item.price}</div>
                  </div>
                </div>

                {/* Specifications Matrix (Staggered internal rise) */}
                <div 
                  className="rise-rotate-in rise-delay-3"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    marginBottom: '22px'
                  }}
                >
                  {item.specs.map((spec, i) => (
                    <div 
                      key={i}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <div style={{ fontSize: '0.68rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{spec.label}</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>{spec.value}</div>
                    </div>
                  ))}
                </div>

                {/* Product Passport Fingerprint Row (Rises & docks) */}
                <div 
                  className="rise-rotate-in rise-delay-4"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'var(--brand-green-dim)',
                    border: '1px solid var(--brand-green-border)',
                    marginBottom: '22px',
                    fontSize: '0.74rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#E5E7EB' }}>
                    <ShieldCheck size={16} color="var(--brand-green)" />
                    <span>Passport: <strong style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{item.passportId}</strong></span>
                  </div>
                  <span style={{ color: 'var(--brand-green)', fontWeight: 800, fontSize: '0.7rem' }}>
                    {item.warranty}
                  </span>
                </div>

                {/* Action CTA Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onExploreItem) onExploreItem(item.id);
                  }}
                  className="btn-pill-primary rise-rotate-in rise-delay-4"
                  style={{
                    width: '100%',
                    padding: '11px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    gap: '8px'
                  }}
                >
                  <ShoppingBag size={15} />
                  <span>Inspect Passport & View Store</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
