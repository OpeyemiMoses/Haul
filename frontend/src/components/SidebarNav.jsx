import React, { useState } from 'react';
import { 
  ShoppingBag, 
  ShieldCheck, 
  Store, 
  PlusCircle, 
  User, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft,
  Home,
  Menu,
  CheckCircle2,
  Wallet
} from 'lucide-react';
import { HualIcon } from './HualLogo';

export default function SidebarNav({
  activeTab,
  setActiveTab,
  passportCount = 0,
  onOpenProfileModal,
  onOpenSellModal,
  user,
  usdcBalance = 0,
  defaultCollapsed = true
}) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);

  const email = user?.email || user?.google?.email || 'account@haul.store';
  const displayName = email.split('@')[0];
  const initial = (displayName[0] || 'U').toUpperCase();

  const navItems = [
    {
      id: 'shop',
      label: 'Storefront',
      icon: ShoppingBag,
      badge: null,
      onClick: () => setActiveTab('shop')
    },
    {
      id: 'stores',
      label: 'Stores',
      icon: Store,
      badge: null,
      onClick: () => setActiveTab('stores')
    },
    {
      id: 'passports',
      label: 'My Certificates',
      icon: ShieldCheck,
      badge: passportCount > 0 ? passportCount : null,
      onClick: () => setActiveTab('passports')
    },
    {
      id: 'merchant',
      label: 'Store Counter',
      icon: Store,
      badge: null,
      onClick: () => setActiveTab('merchant')
    }
  ];

  return (
    <aside 
      className={`sidebar-rail ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={() => !isExpanded && setIsExpanded(true)}
      onMouseLeave={() => isExpanded && defaultCollapsed && setIsExpanded(false)}
    >
      {/* Top: Logo & Toggle Button */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          marginBottom: '24px',
          padding: '0 4px'
        }}>
          <div 
            onClick={() => onSelectTab && onSelectTab('shop')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer',
              overflow: 'hidden'
            }}
            title="Haul - Shop"
          >
            <HualIcon size={28} />
            {isExpanded && (
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}>
                Haul
              </span>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '5px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: isExpanded ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Primary Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                style={{
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  padding: isExpanded ? '10px 14px' : '10px 0'
                }}
                title={item.label}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Icon size={18} />
                  {!isExpanded && item.badge && (
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-8px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'var(--brand-green)',
                      color: '#0B0F0F',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    {item.label}
                  </span>
                )}

                {isExpanded && item.badge && (
                  <span style={{
                    background: isActive ? '#0B0F0F' : 'var(--brand-green)',
                    color: isActive ? 'var(--brand-green)' : '#0B0F0F',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick List Product Action */}
          <div style={{ margin: '10px 0' }}>
            <button
              onClick={onOpenSellModal}
              className="sidebar-nav-item"
              style={{
                background: 'rgba(132, 244, 59, 0.08)',
                border: '1px solid var(--brand-green-border)',
                color: 'var(--brand-green)',
                justifyContent: isExpanded ? 'flex-start' : 'center',
                padding: isExpanded ? '10px 14px' : '10px 0',
                fontWeight: 700
              }}
              title="Sell on Haul"
            >
              <PlusCircle size={18} />
              {isExpanded && (
                <span>+ List Product</span>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Area: Profile Circle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* User Profile Circle Trigger (Privy Details) */}
        <div 
          onClick={onOpenProfileModal}
          className="profile-circle-btn"
          style={{
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '8px 10px' : '8px'
          }}
          title="My Account & Privy Details"
        >
          {/* Avatar Circle with Online Status Indicator */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand-green) 0%, #3bb314 100%)',
              color: '#0B0F0F',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(132, 244, 59, 0.3)'
            }}>
              {initial}
            </div>
            <span style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #0B0F0F'
            }} />
          </div>

          {/* Expanded Profile Info */}
          {isExpanded && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#FFFFFF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: '0.74rem',
                color: 'var(--brand-green)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700
              }}>
                ${usdcBalance.toFixed(2)} USD
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
