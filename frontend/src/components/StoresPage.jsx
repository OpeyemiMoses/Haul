import React, { useState, useMemo } from 'react';
import { 
  Store, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Search, 
  MessageSquare, 
  Package, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink,
  PlusCircle,
  Building,
  Heart,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';
import { VERIFIED_MERCHANTS } from '../lib/catalogData';
import { useAuth } from '../lib/auth/AuthContext';
import { calculateProximity } from '../lib/formatters';
import useScrollReveal from '../lib/useScrollReveal';

export default function StoresPage({
  products = [],
  searchQuery,
  setSearchQuery,
  onSelectStore,
  onOpenCreateStore,
  onOpenSellModal,
  onOpenInbox,
  followedStores = [],
  onToggleFollowStore,
  onNavigateToSignIn
}) {
  const { user, authenticated, userStore, userLocation } = useAuth();
  const buyerLocation = userLocation || 'Victoria Island, Lagos';

  // Always start Stores page strictly from the top of the browser window
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const [internalSearch, setInternalSearch] = useState('');
  const activeSearch = searchQuery !== undefined ? searchQuery : internalSearch;
  const handleSearchChange = (val) => {
    if (setSearchQuery) setSearchQuery(val);
    else setInternalSearch(val);
  };
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Collect all stores: User's created store, community created stores from storage, and verified flagship merchants
  const allStores = useMemo(() => {
    let createdList = [];
    try {
      const stored = localStorage.getItem('hual_all_created_stores');
      if (stored) createdList = JSON.parse(stored);
    } catch {}

    const list = [];
    if (userStore) list.push(userStore);
    if (Array.isArray(createdList)) list.push(...createdList);
    list.push(...VERIFIED_MERCHANTS);

    // Deduplicate by ID and name
    const seenIds = new Set();
    const seenNames = new Set();
    const unique = [];

    for (const s of list) {
      if (!s) continue;
      const idKey = s.id || s.handle || s.name;
      const nameKey = (s.name || '').toLowerCase().trim();
      if (!seenIds.has(idKey) && (!nameKey || !seenNames.has(nameKey))) {
        seenIds.add(idKey);
        if (nameKey) seenNames.add(nameKey);
        unique.push(s);
      }
    }

    return unique;
  }, [userStore]);

  // Compute products count and verification status for each store:
  // "thats where all verified created stores will go to when people create their store and list at least 1 item on their store.. thats the verification pass(at least 1 item is listed on the store)"
  const storesWithStatus = useMemo(() => {
    return allStores.map((store) => {
      const sName = (store.name || '').toLowerCase().trim();
      const sId = store.id;
      const isFlagship = VERIFIED_MERCHANTS.some(vm => vm.id === store.id);

      const storeProducts = products.filter((p) => {
        if (!p) return false;
        const pMerchant = (p.merchant || '').toLowerCase().trim();
        const pBrand = (p.brand || '').toLowerCase().trim();
        const pMerchantId = p.merchantId;

        if (isFlagship) {
          return (
            (pMerchant && (pMerchant === sName || pMerchant.includes(sName) || sName.includes(pMerchant))) ||
            (pMerchantId && pMerchantId === sId) ||
            (pBrand && sName.includes(pBrand))
          );
        }

        // For user-created stores: STRICT MATCHING ONLY (never match random curated brand substrings)
        return (
          (pMerchantId && String(pMerchantId) === String(sId)) ||
          (pMerchant && pMerchant === sName) ||
          (store.ownerAddress && p.seller && store.ownerAddress.toLowerCase() === p.seller.toLowerCase())
        );
      });

      const itemsCount = storeProducts.length;
      // Verification Pass: Flagships or created stores with at least 1 item listed
      const isVerified = isFlagship || itemsCount >= 1;
      const isOwner = Boolean(
        (userStore && (userStore.id === store.id || (userStore.name && userStore.name.toLowerCase() === sName))) ||
        (store.ownerAddress && user?.address && store.ownerAddress.toLowerCase() === user.address.toLowerCase())
      );

      return {
        ...store,
        products: storeProducts,
        itemsCount,
        isVerified,
        isOwner
      };
    });
  }, [allStores, products, userStore, user]);

  // Separate verified stores (public) vs pending stores (0 items)
  const verifiedStores = useMemo(() => {
    return storesWithStatus.filter(s => s.isVerified);
  }, [storesWithStatus]);

  const pendingUserStore = useMemo(() => {
    return storesWithStatus.find(s => s.isOwner && !s.isVerified);
  }, [storesWithStatus]);

  // Available categories for filtering
  const categories = useMemo(() => {
    const cats = new Set(['All']);
    verifiedStores.forEach(s => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [verifiedStores]);

  // Filter verified stores by search query & category
  const filteredVerifiedStores = useMemo(() => {
    return verifiedStores.filter((s) => {
      const query = (activeSearch || '').trim().toLowerCase();
      const matchesSearch = 
        !query ||
        s.name.toLowerCase().includes(query) ||
        (s.category && s.category.toLowerCase().includes(query)) ||
        (s.location && s.location.toLowerCase().includes(query)) ||
        (s.description && s.description.toLowerCase().includes(query));

      const sCat = (s.category || '').toLowerCase();
      const selectedCatLower = (selectedCategory || 'All').trim().toLowerCase();
      const matchesCat = 
        selectedCatLower === 'all' || 
        sCat.includes(selectedCatLower) ||
        selectedCatLower.includes(sCat);

      return matchesSearch && matchesCat;
    });
  }, [verifiedStores, activeSearch, selectedCategory]);

  // High-performance scroll reveal and micro-animations
  useScrollReveal([filteredVerifiedStores.length, selectedCategory, activeSearch]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '0 0 80px' }}>
      
      {/* Hero Header */}
      <div 
        className="apple-liquid-glass reveal-pop" 
        style={{
          padding: '36px 32px',
          borderRadius: '26px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ maxWidth: '780px', position: 'relative', zIndex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: '10px', fontSize: '0.72rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-green)' }} />
            <span>Verified Merchant Directory</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
            <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>Monad High-Throughput Protocol</span>
          </div>

          <h1 className="font-display" style={{ 
            fontSize: '2rem', 
            fontWeight: 800, 
            color: '#FFFFFF', 
            margin: '0 0 10px', 
            letterSpacing: '-0.02em',
            lineHeight: 1.15
          }}>
            Stores on Haul
          </h1>

          <p style={{ fontSize: '0.88rem', color: '#9CA3AF', lineHeight: 1.6, margin: '0 0 20px', maxWidth: '640px' }}>
            Browse verified flagship stores and authorized merchant retailers with onchain digital Product Passports.
            Stores achieve the <strong style={{ color: '#FFFFFF' }}>Verified Store Pass</strong> once at least 1 authenticated item is actively listed.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenCreateStore}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '999px',
                background: 'var(--brand-green)',
                color: '#080F0F',
                fontSize: '0.82rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(132, 244, 59, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <Store size={15} />
              <span>Create a Store</span>
            </button>

            <button
              onClick={onOpenSellModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '999px',
                background: '#162424',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(132, 244, 59, 0.35)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
            >
              <PlusCircle size={15} color="var(--brand-green)" />
              <span>List Product to Verify</span>
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(132, 244, 59, 0.08)',
              border: '1px solid rgba(132, 244, 59, 0.25)',
              fontSize: '0.74rem',
              color: 'var(--brand-green)',
              fontWeight: 700
            }}>
              <CheckCircle2 size={13} />
              <span>Verification Pass: At least 1 item listed</span>
            </div>
          </div>
        </div>

        {/* Ambient background accent */}
        <div style={{
          position: 'absolute',
          right: '-40px',
          top: '-40px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(132, 244, 59, 0.16) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* User's Pending Store Alert (If user created a store but has 0 items listed) */}
      {pendingUserStore && (
        <div style={{
          padding: '20px 24px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(20, 26, 26, 0.8) 100%)',
          border: '1.5px solid rgba(234, 179, 8, 0.35)',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#080F0F',
              border: '1.5px solid rgba(234, 179, 8, 0.4)',
              flexShrink: 0
            }}>
              <img 
                src={pendingUserStore.avatar || '/assets/air_max_95.jpg'} 
                alt={pendingUserStore.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>{pendingUserStore.name}</span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(234, 179, 8, 0.2)',
                  color: '#FACC15',
                  border: '1px solid rgba(234, 179, 8, 0.35)'
                }}>
                  Pending Verification (0 / 1 items)
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#D1D5DB', margin: 0 }}>
                Your store has been created! List at least 1 item on your store to earn the Verified Flagship Store Pass and appear in the public Stores directory.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSellModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '999px',
              background: '#FACC15',
              color: '#080F0F',
              fontSize: '0.8rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(250, 204, 21, 0.35)'
            }}
          >
            <PlusCircle size={15} />
            <span>List First Item to Verify Store</span>
          </button>
        </div>
      )}

      {/* Search and Category Filters Bar */}
      <div 
        className="reveal-on-scroll"
        style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Search Bar */}
        <div style={{
          position: 'relative',
          maxWidth: '440px',
          width: '100%'
        }}>
          <Search 
            size={16} 
            color="#9CA3AF" 
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            type="text"
            placeholder="Search stores by name, location, category..."
            value={activeSearch || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 16px 11px 44px',
              borderRadius: '999px',
              background: '#0D1616',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontSize: '0.84rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--brand-green-border)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '7px 15px',
                borderRadius: '999px',
                background: selectedCategory === cat ? 'var(--brand-green)' : '#121C1C',
                color: selectedCategory === cat ? '#080F0F' : '#9CA3AF',
                border: selectedCategory === cat ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.78rem',
                fontWeight: selectedCategory === cat ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Count Header */}
      <div 
        className="reveal-on-scroll"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}
      >
        <div>
          <h2 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 2px', color: '#FFFFFF' }}>
            Verified Flagship Stores
          </h2>
          <span style={{ fontSize: '0.76rem', color: '#9CA3AF' }}>
            Showing {filteredVerifiedStores.length} authorized retailer{filteredVerifiedStores.length === 1 ? '' : 's'} with active inventory
          </span>
        </div>
      </div>

      {/* Empty State */}
      {filteredVerifiedStores.length === 0 ? (
        <div 
          className="reveal-pop"
          style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: '#0D1616',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <Store size={44} color="#6B7280" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
            No verified stores match your search
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '20px' }}>
            Try resetting your search query or create a new store with at least 1 listed product.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              background: 'var(--brand-green)',
              color: '#080F0F',
              fontSize: '0.82rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Verified Stores Cards Grid */
        <div 
          className="stagger-group"
          style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '22px'
        }}>
          {filteredVerifiedStores.map((store, idx) => {
            const prox = calculateProximity(buyerLocation, store.location);
            const isFollowed = followedStores.includes(store.id);

            return (
              <div
                key={store.id}
                className={`liquid-glass-card store-card-animated ${idx % 2 === 0 ? 'card-reveal-left' : 'card-reveal-right'}`}
                onClick={() => onSelectStore && onSelectStore(store)}
                style={{
                  borderRadius: '22px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(132, 244, 59, 0.45)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Store Banner */}
                <div style={{
                  height: '130px',
                  width: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#0B1212'
                }}>
                  <img 
                    src={store.banner || '/assets/nike_store_banner.jpg'} 
                    alt={store.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.85
                    }} 
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(8, 14, 14, 0.2) 0%, rgba(8, 14, 14, 0.85) 100%)'
                  }} />

                  {/* Verification Pass Tag */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: 'rgba(8, 14, 14, 0.82)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(132, 244, 59, 0.4)',
                    color: 'var(--brand-green)',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.02em'
                  }}>
                    <CheckCircle2 size={12} />
                    <span>VERIFIED STORE PASS</span>
                  </div>

                  {/* Stock Count Pill */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 9px',
                    borderRadius: '999px',
                    background: 'rgba(8, 14, 14, 0.82)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}>
                    <Package size={11} color="var(--brand-green)" />
                    <span>{store.itemsCount} Item{store.itemsCount === 1 ? '' : 's'}</span>
                  </div>
                </div>

                {/* Store Body Info */}
                <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Avatar & Title Row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginTop: '-36px', marginBottom: '14px', position: 'relative', zIndex: 2 }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      background: '#080F0F',
                      border: '2px solid var(--brand-green)',
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img 
                        src={store.avatar || '/assets/air_max_95.jpg'} 
                        alt={store.name}
                        style={{ width: '92%', height: '92%', objectFit: 'contain' }}
                      />
                    </div>

                    <div style={{ paddingTop: '28px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h3 style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: '#FFFFFF',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {store.name}
                        </h3>
                        <CheckCircle2 size={14} color="var(--brand-green)" style={{ flexShrink: 0 }} />
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#9CA3AF', marginTop: '2px' }}>
                        {store.category} {store.handle ? `• ${store.handle}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Location & Proximity */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.76rem',
                    color: '#D1D5DB',
                    marginBottom: '6px'
                  }}>
                    <MapPin size={13} color="var(--brand-green)" />
                    <span style={{ fontWeight: 600 }}>{store.location}</span>
                    <span style={{ color: 'var(--brand-green)', fontWeight: 700, fontSize: '0.72rem' }}>
                      • {prox.distance}
                    </span>
                  </div>

                  {/* Hours & Collection Schedule */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    color: '#9CA3AF',
                    marginBottom: '12px'
                  }}>
                    <Clock size={12} color="#9CA3AF" />
                    <span>{store.operatingHours || `${store.openingTime || '09:00 AM'} - ${store.closingTime || '07:00 PM'}`}</span>
                  </div>

                  {/* Description snippet */}
                  <p style={{
                    fontSize: '0.74rem',
                    color: '#9CA3AF',
                    lineHeight: 1.5,
                    margin: '0 0 16px',
                    flex: 1
                  }}>
                    {(store.description || 'Verified boutique retailer offering authenticated consumer merchandise with living Product Passports.').slice(0, 110)}...
                  </p>

                  {/* Card Bottom Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '14px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    gap: '8px'
                  }}>
                    {!store.isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!authenticated || !user) {
                            if (onNavigateToSignIn) onNavigateToSignIn();
                            return;
                          }
                          if (onOpenInbox) onOpenInbox(store);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '999px',
                          background: '#121C1C',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#FFFFFF',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(132, 244, 59, 0.4)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                      >
                        <MessageSquare size={12} color="var(--brand-green)" />
                        <span>Message Store</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectStore && onSelectStore(store)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: 'var(--brand-green-dim)',
                        border: '1px solid var(--brand-green-border)',
                        color: 'var(--brand-green)',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>Storefront →</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
