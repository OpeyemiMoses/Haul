import React from 'react';
import { 
  Layers, 
  Sparkles, 
  ArrowRight, 
  Tag, 
  ShieldCheck, 
  Zap,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { CURATED_CATALOG } from '../lib/catalogData';
import { formatCurrency } from '../lib/formatters';

const CATEGORIES_DATA = [
  {
    id: 'Footwear',
    name: 'Footwear & Apparel',
    subtitle: 'Living Provenance & Certified Drops',
    itemCount: 8,
    imageUri: '/assets/air_max_95.jpg',
    accent: 'var(--brand-green)',
    popularBrands: ['Nike', 'Jordan', 'Kith', 'Y-3'],
    badge: 'Trending Pop-Ups'
  },
  {
    id: 'Audio',
    name: 'High-End Audio & Acoustics',
    subtitle: 'Studio Monitors & Cinema Noise Canceling',
    itemCount: 6,
    imageUri: '/assets/sony_passport.jpg',
    accent: '#38BDF8',
    popularBrands: ['Sony', 'Bowers & Wilkins', 'Sennheiser', 'Bang & Olufsen'],
    badge: '12-Mo Warranty'
  },
  {
    id: 'Tech',
    name: 'Consumer & Spatial Tech',
    subtitle: 'Next-Gen Computing & Wearables',
    itemCount: 5,
    imageUri: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80',
    accent: '#A855F7',
    popularBrands: ['Apple', 'Teenage Engineering', 'Nothing', 'Dyson'],
    badge: 'Verified Serial Numbers'
  },
  {
    id: 'Synthesizers',
    name: 'Synthesizers & Lab Hardware',
    subtitle: 'Boutique Swedish Electronic Instruments',
    itemCount: 4,
    imageUri: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=85',
    accent: '#F59E0B',
    popularBrands: ['Teenage Engineering', 'Elektron', 'Moog', 'Arturia'],
    badge: 'Exclusive Authorized'
  },
  {
    id: 'Watches',
    name: 'Luxury Watches & Horology',
    subtitle: 'Certified Chronographs & Vault Timepieces',
    itemCount: 5,
    imageUri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    accent: '#10B981',
    popularBrands: ['Rolex', 'Audemars Piguet', 'Omega', 'Cartier'],
    badge: 'Onchain Provenance'
  },
  {
    id: 'Eyewear',
    name: 'Designer Optics & Frames',
    subtitle: 'Handmade Acetate & Titanium Eyewear',
    itemCount: 4,
    imageUri: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80',
    accent: '#EC4899',
    popularBrands: ['Gentle Monster', 'Jacques Marie Mage', 'Chrome Hearts'],
    badge: 'Limited Run'
  }
];

export default function CategoriesExplorer({ onSelectCategory }) {
  return (
    <div className="page-fade-in" style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 0 60px' }}>
      
      {/* Header Banner */}
      <div className="reveal-pop" style={{
        padding: '36px',
        background: 'linear-gradient(135deg, rgba(14, 24, 24, 0.95) 0%, rgba(8, 15, 15, 0.95) 100%)',
        borderRadius: '26px',
        border: '1px solid rgba(132, 244, 59, 0.25)',
        marginBottom: '36px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'var(--brand-green-dim)',
            border: '1px solid var(--brand-green-border)',
            color: 'var(--brand-green)',
            fontSize: '0.74rem',
            fontWeight: 800,
            marginBottom: '12px'
          }}>
            <Layers size={13} />
            <span>CURATED LUXURY CATEGORIES</span>
          </div>

          <h1 className="font-display" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 10px', lineHeight: 1.15 }}>
            Explore Verified Goods by Category
          </h1>

          <p style={{ fontSize: '0.9rem', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
            Every category features living digital Product Passports minted on Monad with guaranteed authentic chain of custody.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div 
        className="stagger-group perspective-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}
      >
        {CATEGORIES_DATA.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory && onSelectCategory(cat.id)}
            style={{
              background: '#0D1616',
              borderRadius: '22px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--brand-green)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(132, 244, 59, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4)';
            }}
          >
            {/* Image Preview Banner */}
            <div style={{
              height: '180px',
              background: '#080F0F',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}>
              <img 
                src={cat.imageUri} 
                alt={cat.name} 
                style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain', transition: 'transform 0.3s' }} 
              />
              
              <div style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(6, 10, 10, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                {cat.badge}
              </div>
            </div>

            {/* Content Details */}
            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px' }}>
                  {cat.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '0 0 16px', lineHeight: 1.4 }}>
                  {cat.subtitle}
                </p>

                {/* Popular Brand Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                  {cat.popularBrands.map(b => (
                    <span 
                      key={b}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#D1D5DB',
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Link */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--brand-green)', fontWeight: 800 }}>
                  Browse Collection
                </span>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--brand-green-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-green)'
                }}>
                  <ArrowRight size={14} />
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
