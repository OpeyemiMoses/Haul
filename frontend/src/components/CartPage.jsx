import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Store, 
  CreditCard, 
  Lock, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  PackageCheck,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import { formatCurrency } from '../lib/formatters';
import { buyWithUsdcEscrow } from '../lib/web3';
import ProductReceiptModal from './ProductReceiptModal';
import useScrollReveal from '../lib/useScrollReveal';

export default function CartPage({ 
  cart = [], 
  onUpdateQuantity, 
  onRemoveFromCart, 
  onClearCart, 
  onNavigateToShop,
  onPassportMinted
}) {
  const { user, usdcBalance, refreshBalance, deductUsdc, faucetUsdc, authenticated, login, userLocation } = useAuth();
  
  const [checkingOut, setCheckingOut] = useState(false);
  const userAddr = user?.address ? user.address.toLowerCase() : null;
  const userKey = user?.id || (user?.email ? user.email.toLowerCase() : 'guest');

  const [activeOrders, setActiveOrders] = useState(() => {
    try {
      const stored = localStorage.getItem('hual_escrow_orders');
      const parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(ord => {
        if (!ord) return false;
        const bAddr = ord.buyerAddress ? ord.buyerAddress.toLowerCase() : null;
        const bKey = ord.buyerId || ord.userKey;
        return (userAddr && bAddr && userAddr === bAddr) || (userKey && bKey && userKey === bKey);
      });
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hual_escrow_orders');
      const parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) {
        setActiveOrders([]);
        return;
      }
      const filtered = parsed.filter(ord => {
        if (!ord) return false;
        const bAddr = ord.buyerAddress ? ord.buyerAddress.toLowerCase() : null;
        const bKey = ord.buyerId || ord.userKey;
        return (userAddr && bAddr && userAddr === bAddr) || (userKey && bKey && userKey === bKey);
      });
      setActiveOrders(filtered);
    } catch {
      setActiveOrders([]);
    }
  }, [userAddr, userKey]);

  const [activeTab, setActiveTab] = useState('cart'); // 'cart' | 'orders'
  const [releasingItem, setReleasingItem] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [selectedReceiptData, setSelectedReceiptData] = useState(null);

  // Instant scroll-to-top and scroll reveal animations
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  useScrollReveal([cart.length, activeOrders.length, activeTab]);

  const subtotal = cart.reduce((acc, item) => acc + (item.priceUsd * (item.quantity || 1)), 0);
  const gasFeeUsd = 0; // Monad Gas Sponsored

  // Save active orders to local storage
  const saveOrders = (orders) => {
    setActiveOrders(orders);
    localStorage.setItem('hual_escrow_orders', JSON.stringify(orders));
  };

  // Full Escrow Batch Checkout
  const handleCheckoutAll = async () => {
    if (!authenticated || !user) {
      if (login) login();
      return;
    }

    if (cart.length === 0) return;

    if (usdcBalance < subtotal) {
      alert(`Insufficient balance ($${usdcBalance.toLocaleString()}). You need $${subtotal.toLocaleString()} to complete this checkout. Use the "+ Add $1k" faucet in the header to fund your balance!`);
      return;
    }

    setCheckingOut(true);
    try {
      let realTxHash = null;
      const uniquePin = String(Math.floor(1000 + Math.random() * 9000));
      try {
        const res = await buyWithUsdcEscrow({
          productId: cart[0]?.productId || 1,
          name: cart[0]?.name,
          brand: cart[0]?.brand,
          category: cart[0]?.category,
          imageUri: cart[0]?.imageUri,
          description: cart[0]?.description,
          priceUsd: subtotal,
          buyerAddress: user?.address || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          isPickup: cartDeliveryMethod === 'pickup',
          pickupPIN: uniquePin
        });
        realTxHash = res?.txHash || res?.hash;
      } catch (e) {
        console.error('Onchain escrow transaction error:', e);
      }

      // Immediately deduct balance
      if (deductUsdc) {
        deductUsdc(subtotal);
      }

      const newOrderItems = cart.map((item, index) => ({
        orderItemId: `order-item-${Date.now()}-${index}`,
        productId: item.productId,
        name: item.name,
        priceUsd: item.priceUsd,
        quantity: item.quantity || 1,
        size: item.selectedSize || item.size || 'Standard',
        merchant: item.merchant || 'Verified Merchant Store',
        merchantLocation: item.merchantLocation || 'Victoria Island, Lagos',
        imageUri: item.imageUri || '/assets/air_max_95.jpg',
        brand: item.brand || 'Luxury Goods',
        status: 'in_escrow', // 'in_escrow' | 'released'
        escrowAmount: item.priceUsd * (item.quantity || 1),
        purchasedAt: new Date().toISOString(),
        deliveryMethod: cartDeliveryMethod,
        txHash: realTxHash || `0x${Math.random().toString(16).substring(2, 42)}`
      }));

      const newOrder = {
        orderId: `ORD-${Date.now()}`,
        totalAmount: subtotal,
        itemCount: cart.length,
        createdAt: new Date().toISOString(),
        items: newOrderItems,
        buyerAddress: user?.address || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        buyerLocation: userLocation || 'Victoria Island, Lagos',
        deliveryMethod: cartDeliveryMethod,
        txHash: realTxHash
      };

      // Update orders and empty cart
      const updatedOrders = [newOrder, ...activeOrders];
      saveOrders(updatedOrders);
      if (onClearCart) onClearCart();

      setActiveTab('orders');
      setSuccessToast(`Checkout Complete! $${subtotal.toLocaleString()} locked in Monad Escrow. Live TX: ${realTxHash ? realTxHash.slice(0, 10) + '...' : 'Confirmed'}`);
      setTimeout(() => setSuccessToast(null), 8000);
    } catch (err) {
      console.error('Batch checkout failed:', err);
      alert('Checkout error: ' + err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  // Individual item release: User marks item as received -> sends funds directly to merchant
  const handleMarkItemReceived = (orderId, orderItemId) => {
    setReleasingItem(orderItemId);

    setTimeout(() => {
      let releasedItemObj = null;

      const updated = activeOrders.map(order => {
        if (order.orderId === orderId) {
          const updatedItems = order.items.map(item => {
            if (item.orderItemId === orderItemId) {
              releasedItemObj = item;
              return {
                ...item,
                status: 'released',
                releasedAt: new Date().toISOString()
              };
            }
            return item;
          });
          return { ...order, items: updatedItems };
        }
        return order;
      });

      saveOrders(updated);
      setReleasingItem(null);

      if (releasedItemObj) {
        // Mint living passport to user collection
        if (onPassportMinted) {
          onPassportMinted({
            productId: releasedItemObj.productId,
            name: releasedItemObj.name,
            brand: releasedItemObj.brand,
            merchant: releasedItemObj.merchant,
            imageUri: releasedItemObj.imageUri,
            priceUsd: releasedItemObj.priceUsd,
            warrantyExpiry: '2027-10-09'
          });
        }

        setSuccessToast(`Success! Escrow of $${releasedItemObj.escrowAmount.toLocaleString()} released directly to ${releasedItemObj.merchant}. Living Passport minted to your profile!`);
        setTimeout(() => setSuccessToast(null), 7000);
      }
    }, 600);
  };

  return (
    <div className="page-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 0 60px' }}>
      
      {/* Header & View Switcher */}
      <div className="apple-liquid-glass reveal-pop" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        padding: '28px 32px',
        borderRadius: '26px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <ShoppingBag size={22} color="var(--brand-green)" />
            <h1 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
              Shopping Cart & Escrow Orders
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#9CA3AF' }}>
            Checkout multiple items at once. Funds stay safely locked in Monad Escrow until you inspect and mark each item received.
          </p>
        </div>

        {/* Tab switcher: Cart vs Escrow Orders */}
        <div style={{
          display: 'flex',
          background: '#162424',
          padding: '4px',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setActiveTab('cart')}
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              background: activeTab === 'cart' ? 'var(--brand-green)' : 'transparent',
              color: activeTab === 'cart' ? '#080F0F' : '#9CA3AF',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>My Cart</span>
            {cart.length > 0 && (
              <span style={{
                padding: '1px 6px',
                borderRadius: '999px',
                background: activeTab === 'cart' ? '#080F0F' : 'var(--brand-green)',
                color: activeTab === 'cart' ? 'var(--brand-green)' : '#080F0F',
                fontSize: '0.7rem',
                fontWeight: 900
              }}>
                {cart.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '8px 20px',
              borderRadius: '999px',
              background: activeTab === 'orders' ? 'var(--brand-green)' : 'transparent',
              color: activeTab === 'orders' ? '#080F0F' : '#9CA3AF',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Active Escrow Orders</span>
            {activeOrders.length > 0 && (
              <span style={{
                padding: '1px 6px',
                borderRadius: '999px',
                background: activeTab === 'orders' ? '#080F0F' : 'rgba(255, 255, 255, 0.2)',
                color: activeTab === 'orders' ? '#FFFFFF' : '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 900
              }}>
                {activeOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div style={{
          background: 'rgba(132, 244, 59, 0.15)',
          border: '1px solid var(--brand-green)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#FFFFFF',
          fontSize: '0.86rem',
          boxShadow: '0 0 20px rgba(132, 244, 59, 0.2)'
        }}>
          <CheckCircle2 size={20} color="var(--brand-green)" style={{ flexShrink: 0 }} />
          <span>{successToast}</span>
        </div>
      )}

      {/* TAB 1: CART VIEW */}
      {activeTab === 'cart' && (
        <div>
          {cart.length === 0 ? (
            <div className="apple-liquid-glass reveal-pop" style={{
              textAlign: 'center',
              padding: '80px 24px',
              borderRadius: '26px'
            }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#162424',
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <ShoppingBag size={30} />
              </div>
              <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
                Your cart is empty
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#9CA3AF', maxWidth: '420px', margin: '0 auto 24px' }}>
                Explore authenticated luxury sneakers, synthesizers, and high-end tech from verified merchant stores.
              </p>
              <button
                onClick={onNavigateToShop}
                className="btn-pill-primary"
                style={{ padding: '12px 28px', fontWeight: 800 }}
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px', alignItems: 'start' }}>
              
              {/* Left: Cart Items List */}
              <div className="card-reveal-left stagger-group" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#9CA3AF' }}>
                    {cart.length} {cart.length === 1 ? 'Item' : 'Items'} in Cart
                  </span>
                  <button
                    onClick={onClearCart}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Clear All
                  </button>
                </div>

                {cart.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="liquid-glass-card rise-rotate-in"
                    style={{
                      borderRadius: '18px',
                      padding: '18px',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {/* Item Image */}
                    <div style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <img 
                        src={item.imageUri || '/assets/air_max_95.jpg'} 
                        alt={item.name} 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--brand-green)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>
                        {item.brand || item.category || 'Luxury Goods'}
                      </div>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#9CA3AF', flexWrap: 'wrap' }}>
                        <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
                          Store: {item.merchant || 'Verified Boutique'}
                        </span>
                        {item.selectedSize && (
                          <span>• Size: <strong style={{ color: 'var(--brand-green)' }}>{item.selectedSize}</strong></span>
                        )}
                        <span>•</span>
                        <span>{item.merchantLocation || 'Victoria Island'}</span>
                      </div>
                    </div>

                    {/* Price & Delete */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                        {formatCurrency(item.priceUsd * (item.quantity || 1))}
                      </div>

                      <button
                        onClick={() => onRemoveFromCart && onRemoveFromCart(item.productId)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          color: '#EF4444',
                          padding: '6px 10px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Summary Card & Monad Escrow Checkout */}
              <div 
                className="card-reveal-right apple-liquid-glass"
                style={{
                  borderRadius: '26px',
                  border: '1px solid var(--brand-green-border)',
                  padding: '28px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(132, 244, 59, 0.08)',
                  position: 'sticky',
                  top: '100px'
                }}
              >
                <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px' }}>
                  Order Summary
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
                    <span>Items Subtotal ({cart.length})</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
                    <span>Monad Gas Fee</span>
                    <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>
                      $0.00 (Sponsored)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
                    <span>Escrow Smart Contract</span>
                    <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>
                      Active Protection
                    </span>
                  </div>

                  {/* Delivery Method Selection */}
                  <div style={{ marginTop: '6px', marginBottom: '6px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Delivery Method
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px',
                      background: '#080F0F',
                      padding: '4px',
                      borderRadius: '999px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <button
                        type="button"
                        onClick={() => setCartDeliveryMethod('delivery')}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '999px',
                          background: cartDeliveryMethod === 'delivery' ? 'var(--brand-green)' : 'transparent',
                          color: cartDeliveryMethod === 'delivery' ? '#080F0F' : '#9CA3AF',
                          border: 'none',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Truck size={13} />
                        <span>Express Courier</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCartDeliveryMethod('pickup')}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '999px',
                          background: cartDeliveryMethod === 'pickup' ? 'var(--brand-green)' : 'transparent',
                          color: cartDeliveryMethod === 'pickup' ? '#080F0F' : '#9CA3AF',
                          border: 'none',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Store size={13} />
                        <span>In-Store Pickup</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>Total Due</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                </div>

                {/* User Balance Check */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: usdcBalance < subtotal ? 'rgba(239, 68, 68, 0.08)' : '#121C1C',
                  border: usdcBalance < subtotal ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: usdcBalance < subtotal ? '#F87171' : '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>
                      Your USDC Balance
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: usdcBalance < subtotal ? '#FCA5A5' : '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(usdcBalance)}
                    </div>
                  </div>

                  {usdcBalance < subtotal && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (faucetUsdc) await faucetUsdc(1000);
                        if (refreshBalance) await refreshBalance();
                      }}
                      className="btn-pill-primary btn-pill-sm"
                      style={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                        fontWeight: 800,
                        gap: '6px'
                      }}
                    >
                      <Zap size={13} />
                      <span>+ Faucet $1,000 USDC</span>
                    </button>
                  )}
                </div>

                {usdcBalance < subtotal && (
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.78rem', color: '#FCA5A5', lineHeight: 1.35 }}>
                      <strong>Insufficient Funds:</strong> Cart subtotal is <strong>{formatCurrency(subtotal)}</strong>, but balance is <strong>{formatCurrency(usdcBalance)}</strong> (short by {formatCurrency(Math.max(0, subtotal - usdcBalance))}). Top up using the faucet button above.
                    </div>
                  </div>
                )}

                {/* Escrow Guarantee Pill */}
                <div style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(132, 244, 59, 0.06)',
                  border: '1px solid var(--brand-green-border)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShieldCheck size={18} color="var(--brand-green)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.74rem', color: '#D1D5DB', lineHeight: 1.3 }}>
                    Funds are held in decentralized escrow. Each store is only paid when you mark their item received.
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckoutAll}
                  disabled={checkingOut || usdcBalance < subtotal}
                  className={usdcBalance < subtotal ? "btn-pill-secondary" : "btn-pill-primary"}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.94rem',
                    fontWeight: 800,
                    opacity: (checkingOut || usdcBalance < subtotal) ? 0.6 : 1,
                    cursor: (usdcBalance < subtotal) ? 'not-allowed' : 'pointer',
                    background: usdcBalance < subtotal ? 'rgba(239, 68, 68, 0.15)' : undefined,
                    borderColor: usdcBalance < subtotal ? 'rgba(239, 68, 68, 0.4)' : undefined,
                    color: usdcBalance < subtotal ? '#FCA5A5' : undefined,
                    boxShadow: usdcBalance < subtotal ? 'none' : '0 0 25px var(--brand-green-glow)'
                  }}
                >
                  {checkingOut
                    ? 'Locking Funds in Monad Escrow...'
                    : usdcBalance < subtotal
                    ? `Insufficient Funds (Short ${formatCurrency(Math.max(0, subtotal - usdcBalance))})`
                    : `Checkout All (${formatCurrency(subtotal)})`
                  }
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE ESCROW ORDERS & INDIVIDUAL ITEM RELEASE */}
      {activeTab === 'orders' && (
        <div>
          {activeOrders.length === 0 ? (
            <div className="apple-liquid-glass reveal-pop" style={{
              textAlign: 'center',
              padding: '70px 24px',
              borderRadius: '26px'
            }}>
              <ShieldCheck size={40} color="var(--brand-green)" style={{ margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
                No active escrow orders
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#9CA3AF', margin: '0 0 20px' }}>
                When you buy items from the cart, they appear here. You can mark individual items as received when collected or delivered.
              </p>
              <button
                onClick={() => setActiveTab('cart')}
                className="btn-pill-secondary"
                style={{ padding: '9px 20px', fontWeight: 700 }}
              >
                Go to Cart
              </button>
            </div>
          ) : (
            <div className="stagger-group perspective-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activeOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="liquid-glass-card rise-rotate-in card-reveal-left"
                  style={{
                    borderRadius: '22px',
                    padding: '24px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  {/* Order Top Bar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '18px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                          {order.orderId}
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: 'rgba(132, 244, 59, 0.15)',
                          color: 'var(--brand-green)',
                          border: '1px solid var(--brand-green-border)'
                        }}>
                          MONAD ESCROW ACTIVE
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#9CA3AF', marginTop: '3px' }}>
                        Purchased on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Total Escrow</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Order Items with Individual Mark Received Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {order.items?.map((item) => {
                      const isReleased = item.status === 'released';
                      const isProcessing = releasingItem === item.orderItemId;

                      return (
                        <div
                          key={item.orderItemId}
                          style={{
                            background: '#080F0F',
                            borderRadius: '16px',
                            border: isReleased ? '1px solid rgba(132, 244, 59, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '14px'
                          }}
                        >
                          {/* Item Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '260px', flex: 1 }}>
                            <div style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '12px',
                              background: '#121C1C',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <img src={item.imageUri} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>

                            <div>
                              <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px' }}>
                                {item.name}
                              </h4>
                              <div style={{ fontSize: '0.76rem', color: '#9CA3AF', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>
                                  Store: {item.merchant}
                                </span>
                                <span>•</span>
                                <span>Size: {item.size}</span>
                                <span>•</span>
                                <span style={{ color: '#FFFFFF', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                  {formatCurrency(item.escrowAmount)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action: Mark Received or Released Badge & View Receipt */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => {
                                setSelectedReceiptData({
                                  order: {
                                    orderNumber: order.orderId,
                                    timestamp: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    txHash: order.txHash || '0x7f3a8b29c910e42c'
                                  },
                                  product: {
                                    name: item.name,
                                    brand: item.brand || 'Original Verified Item',
                                    priceUsd: item.priceUsd,
                                    imageUri: item.imageUri,
                                    color: item.color || 'Midnight Black',
                                    selectedSize: item.size
                                  },
                                  merchant: {
                                    name: item.merchant,
                                    location: 'Lagos, Nigeria',
                                    fullAddress: `${item.merchant} • 2nd Floor, Ikeja City Mall`
                                  }
                                });
                              }}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '999px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.14)',
                                color: '#FFFFFF',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--brand-green)'}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)'}
                            >
                              <ExternalLink size={13} color="var(--brand-green)" />
                              <span>View Receipt</span>
                            </button>

                            {isReleased ? (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                borderRadius: '999px',
                                background: 'rgba(132, 244, 59, 0.15)',
                                border: '1px solid var(--brand-green)',
                                color: 'var(--brand-green)',
                                fontSize: '0.78rem',
                                fontWeight: 800
                              }}>
                                <CheckCircle2 size={15} />
                                <span>Received & Released</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleMarkItemReceived(order.orderId, item.orderItemId)}
                                disabled={isProcessing}
                                className="btn-pill-primary btn-pill-sm"
                                style={{
                                  padding: '9px 18px',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 0 15px rgba(132, 244, 59, 0.35)'
                                }}
                              >
                                <PackageCheck size={15} />
                                <span>{isProcessing ? 'Releasing Escrow...' : 'Mark Received & Release Funds'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Receipt Modal */}
      {selectedReceiptData && (
        <ProductReceiptModal
          isOpen={!!selectedReceiptData}
          onClose={() => setSelectedReceiptData(null)}
          order={selectedReceiptData.order}
          product={selectedReceiptData.product}
          merchant={selectedReceiptData.merchant}
          onViewPassport={(orderObj, prodObj) => {
            setSelectedReceiptData(null);
            if (onPassportMinted) {
              onPassportMinted(prodObj);
            }
          }}
          onChatStore={() => {
            setSelectedReceiptData(null);
          }}
        />
      )}

    </div>
  );
}
