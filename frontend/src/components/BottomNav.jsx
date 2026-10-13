import React from 'react';
import { 
  ShoppingBag, 
  ShieldCheck, 
  ShoppingCart, 
  MessageSquare, 
  User, 
  Layers, 
  Store,
  PlusCircle,
  Heart,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';

export default function BottomNav({ 
  activeTab, 
  setActiveTab, 
  passportCount = 0, 
  cartCount = 0, 
  inboxCount = 0,
  wishlistCount = 0,
  onOpenSellModal,
  onOpenCreateStore
}) {
  const { user, authenticated, userRole, profilePicture } = useAuth();

  const navItems = [
    {
      id: 'shop',
      label: 'Explore',
      icon: ShoppingBag,
      badge: null
    },
    {
      id: 'stores',
      label: 'Stores',
      icon: Store,
      badge: null
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Layers,
      badge: null
    },
    {
      id: 'passports',
      label: 'Passports',
      icon: ShieldCheck,
      badge: passportCount > 0 ? passportCount : null
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : null
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: MessageSquare,
      badge: inboxCount > 0 ? inboxCount : null
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      badge: null
    }
  ];

  return (
    <nav 
      className="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'rgba(8, 14, 14, 0.92)',
        backdropFilter: 'blur(40px) saturate(220%)',
        WebkitBackdropFilter: 'blur(40px) saturate(220%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.8), 0 -1px 0 rgba(255, 255, 255, 0.08)',
        padding: '8px 10px calc(10px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        userSelect: 'none'
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            type="button"
            onClick={() => setActiveTab && setActiveTab(item.id)}
            title={item.label}
            aria-label={item.label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 2px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              position: 'relative',
              borderRadius: '16px',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              color: isActive ? 'var(--brand-green)' : 'rgba(255, 255, 255, 0.55)',
              transform: isActive ? 'scale(1.08)' : 'scale(1)'
            }}
          >
            {/* Active Pill Glow Backdrop */}
            {isActive && (
              <div 
                style={{
                  position: 'absolute',
                  inset: '2px 4px',
                  background: 'rgba(132, 244, 59, 0.14)',
                  borderRadius: '14px',
                  border: '1px solid rgba(132, 244, 59, 0.3)',
                  boxShadow: '0 0 16px rgba(132, 244, 59, 0.2)',
                  zIndex: -1,
                  animation: 'fadeIn 0.2s ease-out'
                }} 
              />
            )}

            {/* Icon Container with Badge */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 1.9}
                color={isActive ? 'var(--brand-green)' : 'currentColor'}
              />

              {/* Counter Badge */}
              {item.badge !== null && item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 4px',
                    borderRadius: '999px',
                    background: item.id === 'cart' ? 'var(--brand-green)' : '#3B82F6',
                    color: item.id === 'cart' ? '#080F0F' : '#FFFFFF',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: item.id === 'cart' ? '0 0 8px rgba(132, 244, 59, 0.6)' : '0 0 8px rgba(59, 130, 246, 0.5)',
                    border: '1.5px solid #080F0F'
                  }}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>

            {/* Active Micro Dot Indicator */}
            {isActive && (
              <div 
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'var(--brand-green)',
                  boxShadow: '0 0 8px var(--brand-green)',
                  marginTop: '4px'
                }} 
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
