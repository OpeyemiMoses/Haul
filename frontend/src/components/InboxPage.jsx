import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Store, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  ExternalLink, 
  Search, 
  ArrowRight, 
  UserPlus, 
  UserCheck, 
  Sparkles,
  ShoppingBag,
  Clock,
  PhoneCall,
  User,
  Inbox,
  Tag,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import { formatCurrency } from '../lib/formatters';
import { 
  getAllSharedConversations, 
  getConversationsForUser, 
  sendCustomerMessage, 
  sendMerchantReply, 
  markConversationRead 
} from '../lib/messageRegistry';
import useScrollReveal from '../lib/useScrollReveal';

export default function InboxPage({ 
  onOpenStore,
  onStartCheckout,
  followedStores = [],
  onToggleFollowStore,
  targetContext = null
}) {
  const { user, userStore, userRole } = useAuth();
  const userKey = user?.address || user?.email || user?.id || 'guest';
  
  // Folder: 'buyer' (customer chatting with stores) or 'store' (merchant receiving customer inquiries)
  const [activeFolder, setActiveFolder] = useState('buyer');

  // Load conversations from universal message registry
  const [conversationsPool, setConversationsPool] = useState(() => {
    return getAllSharedConversations();
  });

  const refreshConversations = () => {
    setConversationsPool(getAllSharedConversations());
  };

  // Sync when storage or custom event changes
  useEffect(() => {
    const handleUpdate = () => {
      refreshConversations();
    };
    window.addEventListener('hual_messages_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('hual_messages_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const { buyerConvs, storeConvs } = getConversationsForUser(userKey, userStore);
  const currentList = activeFolder === 'buyer' ? buyerConvs : storeConvs;

  const [selectedConvId, setSelectedConvId] = useState(() => {
    if (targetContext?.merchant?.id) {
      return `conv-${targetContext.merchant.id}-${userKey.toLowerCase()}`;
    }
    return buyerConvs[0]?.id || null;
  });

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const chatScrollRef = useRef(null);
  const isInitialMountRef = useRef(true);

  // Always start Inbox page strictly from the top of the browser window
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // If targetContext changes (e.g. user clicked "Message Store" on a store or product)
  useEffect(() => {
    if (targetContext?.merchant) {
      const m = targetContext.merchant;
      const isMyOwnStore = Boolean(
        userStore && (
          (m.id && userStore.id && String(m.id) === String(userStore.id)) ||
          (m.name && userStore.name && m.name.toLowerCase() === userStore.name.toLowerCase()) ||
          (m.ownerAddress && userStore.ownerAddress && m.ownerAddress.toLowerCase() === userStore.ownerAddress.toLowerCase()) ||
          (m.owner && user?.address && m.owner.toLowerCase() === user.address.toLowerCase()) ||
          (m.ownerAddress && user?.address && m.ownerAddress.toLowerCase() === user.address.toLowerCase())
        )
      );
      if (isMyOwnStore) {
        return;
      }

      setActiveFolder('buyer');
      const storeId = m.id || `store-${(m.name || 'custom').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const convId = `conv-${storeId}-${userKey.toLowerCase()}`;

      // Check if conversation exists
      const existing = conversationsPool.find(c => 
        c.id === convId || 
        (c.storeId === storeId && (c.buyerIdentifier?.toLowerCase() === userKey.toLowerCase() || c.buyerIdentifier === 'default'))
      );

      if (existing) {
        if (targetContext.product) {
          // If message was triggered specifically from an item listing, send a listing inquiry
          const initiated = sendCustomerMessage({
            store: m,
            buyer: user,
            text: `Hi! Inquiring about ${targetContext.product.name} ($${targetContext.product.priceUsd} USDC). Is this available for order or pickup?`,
            product: targetContext.product
          });
          if (initiated) {
            refreshConversations();
            setSelectedConvId(initiated.id);
          } else {
            setSelectedConvId(existing.id);
          }
        } else {
          setSelectedConvId(existing.id);
          markConversationRead(existing.id, 'buyer');
        }
      } else {
        // Automatically initiate conversation with the store
        const initiated = sendCustomerMessage({
          store: m,
          buyer: user,
          text: targetContext.product 
            ? `Hi! Inquiring about ${targetContext.product.name} ($${targetContext.product.priceUsd} USDC). Is this available for order or pickup?` 
            : `Hi! I have an inquiry for ${m.name}.`,
          product: targetContext.product || null
        });
        if (initiated) {
          refreshConversations();
          setSelectedConvId(initiated.id);
        }
      }
    }
  }, [targetContext]);

  // Mark active conversation as read
  useEffect(() => {
    if (selectedConvId) {
      markConversationRead(selectedConvId, activeFolder === 'buyer' ? 'buyer' : 'merchant');
    }
  }, [selectedConvId, activeFolder]);

  // Active conversation object
  const selectedConv = currentList.find(c => c.id === selectedConvId) || currentList[0] || null;

  // Scroll only internal chat feed, NEVER scroll window down
  useEffect(() => {
    if (!chatScrollRef.current) return;
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      return;
    }
    chatScrollRef.current.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [selectedConv?.messages?.length, selectedConvId]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConv) return;

    const textToSend = inputText.trim();
    setInputText('');

    if (activeFolder === 'buyer') {
      sendCustomerMessage({
        store: {
          id: selectedConv.storeId,
          name: selectedConv.storeName,
          handle: selectedConv.storeHandle,
          avatar: selectedConv.storeAvatar,
          location: selectedConv.storeLocation,
          chatRep: selectedConv.chatRep,
          verified: selectedConv.verified
        },
        buyer: user,
        text: textToSend,
        product: selectedConv.pinnedProduct || null
      });
    } else {
      sendMerchantReply({
        convId: selectedConv.id,
        merchantName: userStore?.name || user?.name || 'Store Owner',
        text: textToSend
      });
    }

    refreshConversations();
  };

  const filteredConversations = currentList.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.storeName || '').toLowerCase().includes(q) ||
      (c.storeHandle || '').toLowerCase().includes(q) ||
      (c.buyerName || '').toLowerCase().includes(q)
    );
  });

  const totalStoreUnread = storeConvs.reduce((acc, c) => acc + (c.unreadForStore || 0), 0);
  const totalBuyerUnread = buyerConvs.reduce((acc, c) => acc + (c.unreadForBuyer || 0), 0);

  // Scroll reveal and entrance micro-animations
  useScrollReveal([activeFolder, selectedConvId, conversationsPool.length]);

  return (
    <div className="page-fade-in" style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 0 60px' }}>
      
      {/* Header Banner */}
      <div 
        className="apple-liquid-glass reveal-pop"
        style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        padding: '20px 24px',
        background: '#0D1616',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--brand-green-dim)',
            border: '1px solid var(--brand-green-border)',
            color: 'var(--brand-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Store Messaging & Live Commerce Inquiries
            </h1>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#9CA3AF' }}>
              Direct cross-user communication with verified merchant stores and customers.
            </p>
          </div>
        </div>

        {/* Store Owner Quick Indicator */}
        {userStore && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'rgba(132, 244, 59, 0.08)',
            border: '1px solid rgba(132, 244, 59, 0.25)',
            fontSize: '0.76rem',
            color: 'var(--brand-green)',
            fontWeight: 700
          }}>
            <Store size={14} />
            <span>Store Owner: {userStore.name}</span>
          </div>
        )}
      </div>

      {/* Main Two-Column Messenger Layout */}
      <div 
        className="inbox-messenger-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: '20px',
          minHeight: '700px',
          alignItems: 'stretch'
        }}
      >
        
        {/* Left Column: Folder Switcher + Conversation List */}
        <div 
          className={`reveal-on-scroll inbox-sidebar-column ${selectedConv ? 'inbox-sidebar-mobile-hidden' : ''}`}
          style={{
          background: '#0D1616',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Folder Toggle (Customer Chats vs Store Inquiries) */}
          {userStore && (
            <div style={{ padding: '12px 14px 6px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                background: '#080F0F',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFolder('buyer');
                    if (buyerConvs[0]) setSelectedConvId(buyerConvs[0].id);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: activeFolder === 'buyer' ? 'var(--brand-green)' : 'transparent',
                    color: activeFolder === 'buyer' ? '#080F0F' : '#9CA3AF',
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: activeFolder === 'buyer' ? 800 : 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ShoppingBag size={13} />
                  <span>My Chats</span>
                  {totalBuyerUnread > 0 && (
                    <span style={{
                      background: activeFolder === 'buyer' ? '#080F0F' : 'var(--brand-green)',
                      color: activeFolder === 'buyer' ? 'var(--brand-green)' : '#080F0F',
                      padding: '1px 5px',
                      borderRadius: '999px',
                      fontSize: '0.62rem',
                      fontWeight: 900
                    }}>
                      {totalBuyerUnread}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFolder('store');
                    if (storeConvs[0]) setSelectedConvId(storeConvs[0].id);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: activeFolder === 'store' ? 'var(--brand-green)' : 'transparent',
                    color: activeFolder === 'store' ? '#080F0F' : '#9CA3AF',
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: activeFolder === 'store' ? 800 : 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Store size={13} />
                  <span>Store Inbox</span>
                  {totalStoreUnread > 0 && (
                    <span style={{
                      background: activeFolder === 'store' ? '#080F0F' : 'var(--brand-green)',
                      color: activeFolder === 'store' ? 'var(--brand-green)' : '#080F0F',
                      padding: '1px 5px',
                      borderRadius: '999px',
                      fontSize: '0.62rem',
                      fontWeight: 900
                    }}>
                      {totalStoreUnread}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Search Input */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#121C1C',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              padding: '6px 12px'
            }}>
              <Search size={14} color="#6B7280" style={{ marginRight: '8px' }} />
              <input
                type="text"
                placeholder={activeFolder === 'buyer' ? "Search stores..." : "Search customer inquiries..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="stagger-group tab-fade-in" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filteredConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6B7280', fontSize: '0.8rem' }}>
                <Inbox size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                {activeFolder === 'buyer' ? (
                  <div>No conversations yet. Visit any storefront and click "Message Store" to start chatting.</div>
                ) : (
                  <div>No customer inquiries received yet. When buyers message your store, inquiries will appear here.</div>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConv?.id;
                const lastMsg = conv.messages[conv.messages.length - 1];
                const unreadCount = activeFolder === 'buyer' ? (conv.unreadForBuyer || 0) : (conv.unreadForStore || 0);

                const displayName = activeFolder === 'buyer' ? conv.storeName : (conv.buyerName || 'Customer');
                const displayAvatar = activeFolder === 'buyer' ? conv.storeAvatar : '/assets/air_max_95.jpg';

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      markConversationRead(conv.id, activeFolder === 'buyer' ? 'buyer' : 'merchant');
                      refreshConversations();
                    }}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '14px',
                      background: isSelected ? 'rgba(132, 244, 59, 0.08)' : 'transparent',
                      border: isSelected ? '1px solid rgba(132, 244, 59, 0.25)' : '1px solid transparent',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img 
                        src={displayAvatar} 
                        alt={displayName} 
                        style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', background: '#080F0F' }} 
                      />
                      {conv.verified && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          background: 'var(--brand-green)',
                          borderRadius: '50%',
                          width: '14px',
                          height: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #0D1616'
                        }}>
                          <CheckCircle2 size={10} color="#080F0F" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayName}
                        </span>
                        <span style={{ fontSize: '0.66rem', color: '#6B7280' }}>
                          {conv.lastMessageTime || 'Recently'}
                        </span>
                      </div>

                      {/* Inquiry Type indicator */}
                      <div style={{ marginBottom: '4px' }}>
                        {conv.pinnedProduct ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(132, 244, 59, 0.1)',
                            border: '1px solid rgba(132, 244, 59, 0.25)',
                            color: 'var(--brand-green)',
                            fontSize: '0.62rem',
                            fontWeight: 700
                          }}>
                            <Tag size={9} />
                            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Listing: {conv.pinnedProduct.name}
                            </span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#9CA3AF',
                            fontSize: '0.62rem',
                            fontWeight: 600
                          }}>
                            <MessageSquare size={9} />
                            <span>General Inquiry</span>
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.74rem',
                          color: isSelected ? '#D1D5DB' : '#9CA3AF',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '180px'
                        }}>
                          {lastMsg ? lastMsg.text : 'Start conversation...'}
                        </span>
                        {unreadCount > 0 && (
                          <span style={{
                            background: 'var(--brand-green)',
                            color: '#080F0F',
                            fontSize: '0.62rem',
                            fontWeight: 900,
                            padding: '1px 6px',
                            borderRadius: '999px'
                          }}>
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Feed */}
        {selectedConv ? (
          <div 
            className="card-reveal-right inbox-feed-column"
            style={{
            background: '#0D1616',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0A1212',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedConvId(null)}
                  className="mobile-back-to-inbox-btn"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '999px',
                    padding: '5px 10px',
                    color: 'var(--brand-green)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'none',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Chats</span>
                </button>
                <img 
                  src={selectedConv.storeAvatar} 
                  alt={selectedConv.storeName} 
                  style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover', background: '#080F0F', border: '1px solid rgba(255,255,255,0.1)' }} 
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {activeFolder === 'buyer' ? selectedConv.storeName : `Customer: ${selectedConv.buyerName || 'Buyer'}`}
                    </h2>
                    {selectedConv.verified && (
                      <span style={{
                        background: 'var(--brand-green-dim)',
                        color: 'var(--brand-green)',
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '999px',
                        border: '1px solid var(--brand-green-border)'
                      }}>
                        VERIFIED STORE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span>{selectedConv.chatRep || 'Store Lead'}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--brand-green)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-green)' }} />
                      Online
                    </span>
                    {selectedConv.storeLocation && (
                      <>
                        <span>•</span>
                        <span>{selectedConv.storeLocation}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Action: View Store Page */}
              {activeFolder === 'buyer' && onOpenStore && (
                <button
                  type="button"
                  onClick={() => onOpenStore({
                    id: selectedConv.storeId,
                    name: selectedConv.storeName,
                    handle: selectedConv.storeHandle,
                    avatar: selectedConv.storeAvatar,
                    location: selectedConv.storeLocation
                  })}
                  className="btn-pill-secondary btn-pill-sm"
                  style={{ padding: '6px 14px', fontSize: '0.74rem' }}
                >
                  <Store size={13} color="var(--brand-green)" />
                  <span>View Storefront</span>
                </button>
              )}
            </div>

            {/* Pinned Product Preview Bar or General Status */}
            {selectedConv.pinnedProduct ? (
              <div style={{
                padding: '10px 18px',
                background: 'rgba(18, 28, 28, 0.95)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <img 
                    src={selectedConv.pinnedProduct.imageUri || '/assets/hual_pwa_icon.png'} 
                    alt={selectedConv.pinnedProduct.name} 
                    style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain', background: '#080F0F' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(132, 244, 59, 0.15)',
                        border: '1px solid rgba(132, 244, 59, 0.3)',
                        color: 'var(--brand-green)',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}>
                        Item Listing Inquiry
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedConv.pinnedProduct.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--brand-green)', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      ${selectedConv.pinnedProduct.priceUsd} USDC
                    </div>
                  </div>
                </div>

                {onStartCheckout && activeFolder === 'buyer' && (
                  <button
                    type="button"
                    onClick={() => onStartCheckout(selectedConv.pinnedProduct)}
                    className="btn-pill-primary btn-pill-sm"
                    style={{ padding: '6px 14px', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}
                  >
                    <span>Instant Checkout</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.72rem',
                color: '#9CA3AF'
              }}>
                <MessageSquare size={13} color="var(--brand-green)" />
                <span>General Store Direct Inquiry • Standard Support Channel</span>
              </div>
            )}

            {/* Message Feed */}
            <div 
              ref={chatScrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {selectedConv.messages.map((msg) => {
                const isFromMe = (activeFolder === 'buyer' && msg.sender === 'user') || (activeFolder === 'store' && msg.sender === 'merchant');

                return (
                  <div
                    key={msg.id}
                    className="chat-bubble-in"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isFromMe ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      alignSelf: isFromMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {!isFromMe && (
                      <span style={{ fontSize: '0.68rem', color: '#6B7280', marginBottom: '3px', fontWeight: 600 }}>
                        {msg.senderName || (msg.sender === 'merchant' ? selectedConv.storeName : selectedConv.buyerName)}
                      </span>
                    )}

                    {/* Inline product card preview if message was item listing inquiry */}
                    {msg.isListingInquiry && msg.product && (
                      <div style={{
                        background: isFromMe ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(132, 244, 59, 0.25)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <img 
                          src={msg.product.imageUri || '/assets/hual_pwa_icon.png'} 
                          alt="" 
                          style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'contain', background: '#0D1616', border: '1px solid rgba(255,255,255,0.06)' }} 
                        />
                        <div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--brand-green)', fontWeight: 800, textTransform: 'uppercase' }}>
                            Item Listing Inquiry
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 700, maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {msg.product.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>
                            ${msg.product.priceUsd} USDC
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{
                      padding: '12px 16px',
                      borderRadius: isFromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isFromMe ? 'var(--brand-green)' : '#121C1C',
                      color: isFromMe ? '#080F0F' : '#FFFFFF',
                      border: isFromMe ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.84rem',
                      lineHeight: 1.5,
                      boxShadow: isFromMe ? '0 4px 16px rgba(132, 244, 59, 0.25)' : 'none'
                    }}>
                      {msg.text}
                    </div>

                    <span style={{ fontSize: '0.64rem', color: '#6B7280', marginTop: '3px', padding: '0 4px' }}>
                      {msg.timestamp || 'Just now'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="inbox-input-form" style={{
              padding: '12px 16px',
              paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#0A1212',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              position: 'sticky',
              bottom: 0,
              zIndex: 10
            }}>
              <input
                type="text"
                placeholder={activeFolder === 'buyer' ? `Message ${selectedConv.storeName}...` : `Reply to ${selectedConv.buyerName || 'customer'} as ${userStore?.name || 'store'}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  flex: 1,
                  background: '#121C1C',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '999px',
                  padding: '12px 18px',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="btn-pill-primary"
                style={{
                  padding: '12px 20px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  gap: '6px',
                  opacity: inputText.trim() ? 1 : 0.5,
                  cursor: inputText.trim() ? 'pointer' : 'default'
                }}
              >
                <span>Send</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        ) : (
          <div 
            className="card-reveal-right"
            style={{
            background: '#0D1616',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Inbox size={32} color="#6B7280" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
              Your Inbox is Clear
            </h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.84rem', maxWidth: '380px', margin: '0 0 20px', lineHeight: 1.5 }}>
              No active conversations found. When you message a merchant or receive customer inquiries at your store, they will appear here in real-time.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
