import React from 'react';
import { 
  Heart, 
  Trash2, 
  ShoppingBag, 
  Store, 
  MapPin, 
  MessageSquare, 
  ArrowLeft, 
  CheckCircle2, 
  Star,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../lib/formatters';

export default function WishlistPage({
  wishlist = [],
  onRemoveFromWishlist,
  onClearWishlist,
  onNavigateToShop,
  onStartCheckout,
  onOpenChat,
  onOpenStore,
  onOpenRateSeller
}) {
  return (
    <div className="page-fade-in" style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '0 0 60px' }}>
      
      {/* Top Banner / Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <button
            onClick={onNavigateToShop}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: '#121C1C',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#9CA3AF',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = 'var(--brand-green)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9CA3AF';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Storefront</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Saved Wishlist
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'var(--brand-green-dim)',
              color: 'var(--brand-green)',
              padding: '3px 10px',
              borderRadius: '999px',
              border: '1px solid var(--brand-green-border)',
              fontSize: '0.74rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)'
            }}>
              <Heart size={12} fill="var(--brand-green)" />
              {wishlist.length} {wishlist.length === 1 ? 'ITEM' : 'ITEMS'}
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '4px 0 0' }}>
            Items you've bookmarked across verified merchant stores. Everything you save stays stored here.
          </p>
        </div>

        {wishlist.length > 0 && (
          <button
            onClick={onClearWishlist}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '999px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#F87171',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Trash2 size={13} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {wishlist.length === 0 ? (
        <div 
          className="liquid-glass-card"
          style={{
            textAlign: 'center',
            padding: '70px 24px',
            maxWidth: '560px',
            margin: '40px auto',
            borderRadius: '26px'
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(255, 59, 48, 0.08)',
            border: '1px solid rgba(255, 59, 48, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            boxShadow: '0 0 25px rgba(255, 59, 48, 0.15)'
          }}>
            <Heart size={28} color="#FF3B30" />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
            Your Wishlist is Empty
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#9CA3AF', lineHeight: 1.5, marginBottom: '24px' }}>
            Tap the heart icon on any product in the General Storefront or Merchant Stores to save it here for later.
          </p>

          <button
            onClick={onNavigateToShop}
            className="btn-pill-primary"
            style={{ padding: '10px 24px', fontSize: '0.84rem', fontWeight: 800 }}
          >
            <ShoppingBag size={14} />
            <span>Explore General Storefront</span>
          </button>
        </div>
      ) : (
        /* Saved Items Grid */
        <div className="stagger-group perspective-container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '22px'
        }}>
          {wishlist.map((item) => (
            <div
              key={item.productId}
              className="liquid-glass-card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              {/* Product Image Frame */}
              <div>
                <div style={{
                  width: '100%',
                  height: '220px',
                  borderRadius: '14px',
                  background: '#0D1616',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}>
                  <img 
                    src={item.imageUri} 
                    alt={item.name} 
                    style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                  />

                  {/* Active Wishlist Heart Toggle */}
                  <button
                    onClick={() => onRemoveFromWishlist(item.productId)}
                    title="Remove from Wishlist"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(255, 59, 48, 0.2)',
                      border: '1px solid rgba(255, 59, 48, 0.5)',
                      color: '#FF3B30',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255, 59, 48, 0.3)'
                    }}
                  >
                    <Heart size={15} fill="#FF3B30" />
                  </button>
                </div>

                {/* Title & Brand */}
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px', lineHeight: 1.3 }}>
                  {item.name}
                </h3>

                {/* Merchant Store Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px' }}>
                  <div 
                    onClick={() => onOpenStore && onOpenStore(item)}
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--brand-green)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                    title="Visit store front"
                  >
                    <Store size={12} />
                    <span>Sold by {item.merchant || 'Verified Flagship'}</span>
                    <CheckCircle2 size={10} />
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} color="var(--brand-green)" />
                    <span>{item.merchantLocation || 'Victoria Island, Lagos'}</span>
                  </div>

                  {/* Merchant Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Star size={11} fill="#FBBF24" />
                      {item.rating || '4.9'} ({formatNumber(item.reviewsCount || 120)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Action Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(item.priceUsd)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onOpenChat && onOpenChat(item)}
                    title="Chat with merchant about this product"
                    style={{
                      background: '#121C1C',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '999px',
                      padding: '6px 10px',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MessageSquare size={13} color="var(--brand-green)" />
                  </button>

                  <button
                    onClick={() => onStartCheckout && onStartCheckout(item)}
                    className="btn-pill-primary btn-pill-sm"
                    style={{ padding: '6px 14px', fontSize: '0.76rem', fontWeight: 800 }}
                  >
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
