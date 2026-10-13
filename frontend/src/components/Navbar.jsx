import React, { useState } from 'react';
import { 
  Search, 
  PlusCircle, 
  Wallet, 
  Store, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  User,
  CheckCircle2,
  Tag,
  Heart,
  ShoppingBag,
  MessageSquare,
  Bot,
  Settings
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import { formatCurrency } from '../lib/formatters';
import HualBrand, { HualIcon } from './HualLogo';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  passportCount = 0, 
  wishlistCount = 0,
  cartCount = 0,
  inboxCount = 0,
  onOpenProfileModal,
  onOpenSellModal,
  onOpenCreateStore,
  onOpenMyStore,
  onOpenAiSupport,
  searchQuery,
  setSearchQuery,
  onBackToLanding,
  onNavigateToSignIn
}) {
  const { user, authenticated, login, usdcBalance, refreshBalance, userRole, userLocation, profilePicture, userStore } = useAuth();
  const [cartPulse, setCartPulse] = useState(false);

  // Trigger pulse whenever cartCount increases
  React.useEffect(() => {
    if (cartCount > 0) {
      setCartPulse(true);
      const timer = setTimeout(() => setCartPulse(false), 900);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Member');
  const handle = user?.email ? `@${user.email.split('@')[0]}.ont` : '@member.ont';
  const initial = (displayName[0] || 'M').toUpperCase();

  return (
    <header 
      className="mobile-header-bar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10, 16, 16, 0.72)',
        backdropFilter: 'blur(36px) saturate(210%)',
        WebkitBackdropFilter: 'blur(36px) saturate(210%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 10px 30px rgba(0, 0, 0, 0.5)',
        padding: '12px 24px',
      }}
    >
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        
        {/* Left: Brand & Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <div 
            onClick={() => {
              if (onBackToLanding) onBackToLanding();
              else if (setActiveTab) setActiveTab('shop');
            }}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            title="Hual - Go to Landing Page"
          >
            <HualBrand size={26} name="Hual" showTagline={false} />
          </div>

          {/* Desktop Primary View Switcher */}
          <div className="desktop-nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              height: '20px', 
              width: '1px', 
              background: 'rgba(255, 255, 255, 0.1)' 
            }} />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#121C1C',
              padding: '3px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
            <button
              onClick={() => setActiveTab && setActiveTab('shop')}
              style={{
                padding: '6px 13px',
                borderRadius: '999px',
                background: activeTab === 'shop' ? 'var(--brand-green)' : 'transparent',
                border: 'none',
                color: activeTab === 'shop' ? '#080F0F' : '#9CA3AF',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'shop' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <ShoppingBag size={13} color={activeTab === 'shop' ? '#080F0F' : 'currentColor'} />
              <span>Shop</span>
            </button>

            <button
              onClick={() => setActiveTab && setActiveTab('stores')}
              style={{
                padding: '6px 13px',
                borderRadius: '999px',
                background: activeTab === 'stores' ? 'var(--brand-green)' : 'transparent',
                border: 'none',
                color: activeTab === 'stores' ? '#080F0F' : '#9CA3AF',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'stores' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Store size={13} color={activeTab === 'stores' ? '#080F0F' : 'currentColor'} />
              <span>Stores</span>
            </button>

            <button
              onClick={() => setActiveTab && setActiveTab('categories')}
              style={{
                padding: '6px 13px',
                borderRadius: '999px',
                background: activeTab === 'categories' ? 'var(--brand-green)' : 'transparent',
                border: 'none',
                color: activeTab === 'categories' ? '#080F0F' : '#9CA3AF',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'categories' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Tag size={13} color={activeTab === 'categories' ? '#080F0F' : 'currentColor'} />
              <span>Categories</span>
            </button>

            <button
              onClick={() => (authenticated && user ? setActiveTab && setActiveTab('passports') : onNavigateToSignIn && onNavigateToSignIn())}
              style={{
                padding: '6px 13px',
                borderRadius: '999px',
                background: activeTab === 'passports' ? 'var(--brand-green)' : 'transparent',
                border: 'none',
                color: activeTab === 'passports' ? '#080F0F' : '#9CA3AF',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'passports' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <ShieldCheck size={13} color={activeTab === 'passports' ? '#080F0F' : 'currentColor'} />
              <span>Passports</span>
              <span style={{
                background: activeTab === 'passports' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === 'passports' ? '#080F0F' : '#FFFFFF',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.66rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700
              }}>
                {passportCount}
              </span>
            </button>

            <button
              onClick={() => (authenticated && user ? setActiveTab && setActiveTab('cart') : onNavigateToSignIn && onNavigateToSignIn())}
              style={{
                padding: '6px 13px',
                borderRadius: '999px',
                background: activeTab === 'cart' ? 'var(--brand-green)' : (cartPulse ? 'rgba(132, 244, 59, 0.15)' : 'transparent'),
                border: cartPulse ? '1px solid var(--brand-green)' : '1px solid transparent',
                color: activeTab === 'cart' ? '#080F0F' : (cartPulse ? 'var(--brand-green)' : '#9CA3AF'),
                fontSize: '0.78rem',
                fontWeight: activeTab === 'cart' || cartPulse ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: cartPulse ? 'scale(1.08)' : 'scale(1)',
                boxShadow: cartPulse ? '0 0 16px var(--brand-green-glow)' : 'none'
              }}
            >
              <ShoppingBag size={13} color={activeTab === 'cart' ? '#080F0F' : (cartPulse ? 'var(--brand-green)' : 'currentColor')} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span style={{
                  background: activeTab === 'cart' ? '#080F0F' : 'var(--brand-green)',
                  color: activeTab === 'cart' ? 'var(--brand-green)' : '#080F0F',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontSize: '0.66rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 900,
                  transform: cartPulse ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                  boxShadow: cartPulse ? '0 0 10px var(--brand-green)' : 'none'
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => (authenticated && user ? setActiveTab && setActiveTab('inbox') : onNavigateToSignIn && onNavigateToSignIn())}
              style={{
                padding: '6px 13px',
                borderRadius: '999px',
                background: activeTab === 'inbox' ? 'var(--brand-green)' : 'transparent',
                border: 'none',
                color: activeTab === 'inbox' ? '#080F0F' : '#9CA3AF',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'inbox' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageSquare size={13} color={activeTab === 'inbox' ? '#080F0F' : 'currentColor'} />
              <span>Inbox</span>
              {inboxCount > 0 && (
                <span style={{
                  background: activeTab === 'inbox' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(132, 244, 59, 0.25)',
                  color: activeTab === 'inbox' ? '#080F0F' : 'var(--brand-green)',
                  padding: '1px 5px',
                  borderRadius: '999px',
                  fontSize: '0.66rem',
                  fontWeight: 800
                }}>
                  {inboxCount}
                </span>
              )}
            </button>

            <button
              onClick={() => (authenticated && user ? setActiveTab && setActiveTab('wishlist') : onNavigateToSignIn && onNavigateToSignIn())}
              style={{
                padding: '6px 13px',
                borderRadius: '999px',
                background: activeTab === 'wishlist' ? 'var(--brand-green)' : 'transparent',
                border: 'none',
                color: activeTab === 'wishlist' ? '#080F0F' : '#9CA3AF',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'wishlist' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Heart size={13} color={activeTab === 'wishlist' ? '#080F0F' : 'currentColor'} fill={activeTab === 'wishlist' ? '#080F0F' : 'transparent'} />
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span style={{
                  background: activeTab === 'wishlist' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 59, 48, 0.25)',
                  color: activeTab === 'wishlist' ? '#080F0F' : '#FF3B30',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontSize: '0.66rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700
                }}>
                  {wishlistCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

        {/* Center: Search Input */}
        <div 
          className="mobile-search-container"
          style={{
            flex: 1,
            maxWidth: '480px',
            display: 'flex',
            alignItems: 'center',
            background: '#121C1C',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            padding: '4px 6px 4px 14px',
            transition: 'all 0.2s ease'
          }}
        >
          <Search size={14} color="#6B7280" style={{ marginRight: '8px', flexShrink: 0 }} />
          
          <input
            type="text"
            placeholder="Search products, brands, or merchants..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '6px 0',
              fontSize: '0.8rem',
              color: '#FFFFFF',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />

          <div 
            className="desktop-only-header-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#6B7280',
              fontSize: '0.66rem',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: '4px',
              marginLeft: '4px',
              flexShrink: 0
            }}
          >
            ⌘K
          </div>
        </div>

        {/* Right: Balance, Sell CTA, Profile Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          
          {/* USD Balance Pill - ONLY for authenticated members */}
          {authenticated && user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#121C1C',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              padding: '4px 10px 4px 12px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.8rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: '#FFFFFF'
              }}>
                <span style={{ color: 'var(--brand-green)', fontSize: '0.72rem', fontWeight: 800 }}>USD</span>
                <span>{formatCurrency(usdcBalance)}</span>
              </div>
            </div>
          )}

          {/* Create Store for Consumers */}
          {!userStore && userRole !== 'merchant' && onOpenCreateStore && (
            <button
              onClick={() => (authenticated && user ? onOpenCreateStore() : onNavigateToSignIn && onNavigateToSignIn())}
              className="desktop-only-header-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(132, 244, 59, 0.08)',
                border: '1px solid var(--brand-green-border)',
                color: 'var(--brand-green)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--brand-green-dim)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(132, 244, 59, 0.08)';
              }}
              title="Open your verified merchant storefront"
            >
              <Store size={13} />
              <span>Create Store</span>
            </button>
          )}

          {/* Quick My Store Button for Store Owners */}
          {(userStore || userRole === 'merchant') && (
            <button
              onClick={() => {
                if (onOpenMyStore) onOpenMyStore(userStore);
                else if (setActiveTab) setActiveTab('shop');
              }}
              className="desktop-only-header-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(132, 244, 59, 0.12)',
                border: '1px solid var(--brand-green-border)',
                color: 'var(--brand-green)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Manage your storefront page"
            >
              <Store size={13} />
              <span>My Store</span>
            </button>
          )}

          {/* Sell / List Product Button - ONLY for verified store owners / merchants */}
          {userRole === 'merchant' && (
            <button
              onClick={() => {
                if (authenticated && user) {
                  if (onOpenSellModal) onOpenSellModal();
                } else {
                  if (onNavigateToSignIn) onNavigateToSignIn();
                }
              }}
              className="btn-pill-primary btn-pill-sm"
              style={{
                padding: '7px 16px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
              title="List a new product in your store"
            >
              <PlusCircle size={13} />
              <span>Sell</span>
            </button>
          )}

          {/* Settings & Theme Switcher Button */}
          <button
            id="nav-settings-btn"
            onClick={() => (authenticated && user ? setActiveTab && setActiveTab('settings') : onNavigateToSignIn && onNavigateToSignIn())}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: activeTab === 'settings' ? 'var(--brand-green)' : '#121C1C',
              border: activeTab === 'settings' ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: activeTab === 'settings' ? '#080F0F' : '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title="Settings (Appearance, Theme & Network)"
            aria-label="Settings"
          >
            <Settings size={15} color={activeTab === 'settings' ? '#080F0F' : 'currentColor'} />
          </button>

          {/* User Profile Circle (Avatar Only, No Text) or Sign In Button */}
          {authenticated && user ? (
            <button
              onClick={() => setActiveTab ? setActiveTab('profile') : onOpenProfileModal()}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: profilePicture || user?.profilePicture ? 'transparent' : 'var(--brand-green)',
                border: '1.5px solid var(--brand-green)',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 0 12px rgba(132, 244, 59, 0.25)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.boxShadow = '0 0 18px rgba(132, 244, 59, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(132, 244, 59, 0.25)';
              }}
              title={`${displayName} • View Profile`}
            >
              {profilePicture || user?.profilePicture ? (
                <img
                  src={profilePicture || user?.profilePicture}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{
                  color: '#080F0F',
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-main)'
                }}>
                  {initial}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                if (login) login();
                else if (onNavigateToSignIn) onNavigateToSignIn();
              }}
              className="btn-pill-primary"
              style={{
                padding: '6px 16px',
                fontSize: '0.78rem',
                fontWeight: 700,
                boxShadow: '0 0 12px rgba(132, 244, 59, 0.2)'
              }}
            >
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
