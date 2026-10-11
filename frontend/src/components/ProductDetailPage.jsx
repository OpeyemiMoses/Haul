import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  ShoppingBag, 
  CheckCircle2, 
  Heart, 
  MapPin, 
  Truck, 
  RotateCcw, 
  MessageSquare, 
  Share2, 
  Store, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  Lock, 
  Package, 
  ThumbsUp, 
  ChevronRight,
  Info
} from 'lucide-react';
import { formatNumber } from '../lib/formatters';
import useScrollReveal from '../lib/useScrollReveal';

export default function ProductDetailPage({
  product,
  onBack,
  onAddToCart,
  onStartCheckout,
  onOpenStore,
  onOpenChat,
  onOpenRateItem,
  hasItemInHand = false,
  wishlist = [],
  onToggleWishlist,
  buyerLocation = 'Victoria Island, Lagos'
}) {
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[2] || product?.sizes?.[0] || 10);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedCartFeedback, setAddedCartFeedback] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [productReviews, setProductReviews] = useState([]);

  // ALWAYS START FROM THE TOP WHEN OPENING A PRODUCT PAGE
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [product?.id, product?.productId]);

  // Entrance and scroll reveal micro-animations
  useScrollReveal([product?.id, productReviews.length, selectedImageIndex]);

  const isWishlisted = Boolean(wishlist.some(w => w.productId === product?.productId || w.id === product?.id));

  const allImages = useMemo(() => {
    if (product?.images && product.images.length > 0) return product.images;
    if (product?.imageUri) return [product.imageUri];
    return ['/assets/air_max_95.jpg'];
  }, [product]);

  // Load reviews specific to this product
  // Things paid for but then cancelled must NEVER have a review!
  const prodId = product?.productId || product?.id || 'prod-default';
  useEffect(() => {
    const storageKey = `hual_product_reviews_${prodId}`;
    let saved = [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) saved = JSON.parse(raw);
    } catch {}

    // Check persistent refunded map and escrow cancellations
    let refundedMap = {};
    try {
      refundedMap = JSON.parse(localStorage.getItem('hual_refunded_passports') || '{}');
    } catch {}

    let escrowCancelledIds = new Set();
    try {
      const escrowOrders = JSON.parse(localStorage.getItem('hual_escrow_orders') || '[]');
      escrowOrders.forEach(ord => {
        if (ord.status === 'cancelled' || ord.status === 'refunded') {
          if (ord.orderId) escrowCancelledIds.add(String(ord.orderId));
          if (ord.items) {
            ord.items.forEach(it => {
              if (it.id) escrowCancelledIds.add(String(it.id));
              if (it.name) escrowCancelledIds.add(it.name.toLowerCase().trim());
            });
          }
        }
      });
    } catch {}

    // Filter out any reviews from cancelled or refunded purchases
    const validReviews = saved.filter(r => {
      if (!r) return false;
      const tid = String(r.passportTokenId || r.tokenId || '');
      const serial = String(r.serialNumber || '');
      const ordId = String(r.orderId || '');
      const pId = String(r.productId || '');
      const pName = (r.productName || '').toLowerCase().trim();

      if (tid && refundedMap[tid]) return false;
      if (serial && refundedMap[serial]) return false;
      if (ordId && refundedMap[ordId]) return false;
      if (pId && refundedMap[pId]) return false;
      if (ordId && escrowCancelledIds.has(ordId)) return false;
      if (pId && escrowCancelledIds.has(pId)) return false;
      if (pName && escrowCancelledIds.has(pName)) return false;
      if (r.isCancelled || r.isRefunded) return false;
      return true;
    });

    // Zero fake seed reviews: Only verified in-hand buyers who did not cancel have reviews!
    setProductReviews(validReviews);
  }, [prodId]);

  // Dynamic average rating
  const averageRating = useMemo(() => {
    if (!productReviews || productReviews.length === 0) return null;
    const sum = productReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    return (sum / productReviews.length).toFixed(1);
  }, [productReviews]);

  // Listen for newly added reviews
  useEffect(() => {
    const handleReviewAdded = (e) => {
      const newRev = e.detail;
      if (newRev && (String(newRev.productId) === String(prodId) || newRev.productName === product?.name)) {
        setProductReviews(prev => [newRev, ...prev]);
      }
    };
    window.addEventListener('hual_review_added', handleReviewAdded);
    return () => window.removeEventListener('hual_review_added', handleReviewAdded);
  }, [prodId, product?.name]);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleHelpful = (reviewId) => {
    setHelpfulVotes(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const scrollToReviews = () => {
    document.getElementById('product-reviews-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!product) return null;

  const currentPrice = Number(product.priceUsd) || 250;

  return (
    <div className="product-detail-page page-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Top Breadcrumb Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={onBack}
          className="btn-pill-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleShare}
            className="btn-pill-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Copy share link"
          >
            <Share2 size={14} />
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={() => onToggleWishlist && onToggleWishlist(product)}
            className="btn-pill-secondary"
            style={{
              width: '38px',
              height: '38px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isWishlisted ? '#FF3B30' : undefined,
              borderColor: isWishlisted ? 'rgba(255, 59, 48, 0.4)' : undefined,
              background: isWishlisted ? 'rgba(255, 59, 48, 0.15)' : undefined
            }}
            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart size={16} fill={isWishlisted ? '#FF3B30' : 'transparent'} />
          </button>
        </div>
      </div>

      {/* Main 2-Column Product Showcase */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '36px',
        alignItems: 'start',
        marginBottom: '48px'
      }}>

        {/* LEFT COLUMN: Visual Media Gallery & Monad Digital Passport */}
        <div className="card-reveal-left">
          {/* Main Hero Image */}
          <div 
            className="liquid-glass-card reveal-pop"
            style={{
              width: '100%',
              borderRadius: '24px',
              background: '#0D1616',
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              minHeight: '380px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
          >
            <img 
              src={allImages[selectedImageIndex] || allImages[0]} 
              alt={product.name} 
              style={{
                width: '100%',
                maxHeight: '340px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 16px 30px rgba(0,0,0,0.4))',
                transition: 'transform 0.3s ease'
              }}
            />

            {/* Authenticity Badge Overlay */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(8, 15, 15, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--brand-green-border)',
              borderRadius: '999px',
              padding: '5px 12px',
              color: 'var(--brand-green)',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              <ShieldCheck size={14} />
              <span>Monad Verified Passport</span>
            </div>
          </div>

          {/* Thumbnails strip */}
          {allImages.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '14px',
                    background: '#0D1616',
                    border: selectedImageIndex === idx ? '2px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '4px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    opacity: selectedImageIndex === idx ? 1 : 0.6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}

          {/* Onchain Digital Passport Specification Box */}
          <div 
            className="apple-liquid-glass"
            style={{
              marginTop: '24px',
              padding: '20px',
              borderRadius: '20px',
              border: '1px solid rgba(132, 244, 59, 0.25)',
              background: 'linear-gradient(135deg, rgba(14, 24, 24, 0.9) 0%, rgba(8, 15, 15, 0.95) 100%)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--brand-green)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                  Digital Product Passport
                </span>
              </div>
              <span className="eyebrow" style={{ fontSize: '0.64rem', padding: '2px 8px' }}>
                Monad Testnet
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.74rem' }}>
              <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ color: '#9CA3AF', display: 'block', fontSize: '0.66rem', marginBottom: '2px' }}>Token Serial:</span>
                <strong style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>SN-HUAL-{product.productId || '9921'}</strong>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ color: '#9CA3AF', display: 'block', fontSize: '0.66rem', marginBottom: '2px' }}>Smart Contract:</span>
                <strong style={{ color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>0x34A8...89BC</strong>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ color: '#9CA3AF', display: 'block', fontSize: '0.66rem', marginBottom: '2px' }}>Warranty Period:</span>
                <strong style={{ color: '#FFFFFF' }}>12-Month Monad Protocol</strong>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ color: '#9CA3AF', display: 'block', fontSize: '0.66rem', marginBottom: '2px' }}>Transfer Rights:</span>
                <strong style={{ color: '#FFFFFF' }}>Full Onchain Ownership</strong>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Details, Pricing, Merchant Box & Actions */}
        <div className="card-reveal-right" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Title & Badges */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="eyebrow" style={{ fontSize: '0.68rem' }}>
                {product.brand || product.category || 'Luxury Goods'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--brand-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} />
                <span>Verified Merchandise</span>
              </span>
            </div>

            <h1 className="font-display" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px', lineHeight: 1.25 }}>
              {product.name}
            </h1>

            {/* Rating Snippet (Scrolls to reviews on click) */}
            <div 
              onClick={scrollToReviews}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '4px 12px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
              title="Click to view customer reviews"
            >
              {productReviews.length > 0 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#FBBF24', fontSize: '0.84rem', fontWeight: 800 }}>
                    <Star size={14} fill="#FBBF24" />
                    <span>{averageRating}</span>
                  </div>
                  <span style={{ color: '#9CA3AF', fontSize: '0.76rem', textDecoration: 'underline' }}>
                    ({productReviews.length} customer review{productReviews.length === 1 ? '' : 's'})
                  </span>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#9CA3AF', fontSize: '0.74rem' }}>
                  <ShieldCheck size={13} color="var(--brand-green)" />
                  <span>No reviews yet • Verified onchain</span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Box */}
          <div style={{
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px'
          }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>
              ${currentPrice.toFixed(2)}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#9CA3AF', fontWeight: 600 }}>USDC</span>
            <span style={{ fontSize: '0.74rem', color: '#6B7280', marginLeft: 'auto' }}>
              Gas sponsored by Monad
            </span>
          </div>

          {/* Merchant Profile Box */}
          <div style={{
            padding: '16px 18px',
            borderRadius: '16px',
            background: '#0D1616',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#080F0F',
                  border: '1px solid var(--brand-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <Store size={18} color="var(--brand-green)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{product.merchant || 'Verified Merchant'}</span>
                    <CheckCircle2 size={13} color="var(--brand-green)" />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                    {product.merchantLocation || 'Victoria Island, Lagos'} • Ready in 30 mins
                  </div>
                </div>
              </div>

              {/* Action buttons to visit store or chat with seller */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onOpenChat && onOpenChat(product)}
                  className="btn-pill-secondary btn-pill-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <MessageSquare size={12} />
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => onOpenStore && onOpenStore(product)}
                  className="btn-pill-primary btn-pill-sm"
                  style={{ padding: '6px 14px' }}
                >
                  <span>Storefront</span>
                </button>
              </div>
            </div>
          </div>

          {/* Size / Variant Selector (if applicable) */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>
                Select Size:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    style={{
                      minWidth: '46px',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      background: selectedSize === sz ? 'var(--brand-green)' : '#162424',
                      color: selectedSize === sz ? '#080F0F' : '#FFFFFF',
                      border: selectedSize === sz ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color & Variant Info (if provided) */}
          {(product.color || (product.colors && product.colors.length > 0)) && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>
                Color / Finish:
              </label>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '8px', background: '#162424', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-green)' }} />
                <span>{product.color || (Array.isArray(product.colors) ? product.colors.join(', ') : product.colors)}</span>
              </div>
            </div>
          )}

          {/* Storage / Hardware Config (if applicable) */}
          {product.storage && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>
                Configuration / Storage:
              </label>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '8px', background: '#162424', border: '1px solid var(--brand-green-border)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-green)' }}>
                <span>{product.storage}</span>
              </div>
            </div>
          )}

          {/* Fulfillment Readiness & Units Left (Stock Countdown) */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.76rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-green)', fontWeight: 700 }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--brand-green)' }} />
                <span>Ready for In-Store Pickup or Express Courier</span>
              </div>

              {/* Units Left Live Indicator */}
              {product.stock != null && (
                <div style={{
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: parseInt(product.stock, 10) <= 3 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(132, 244, 59, 0.12)',
                  border: `1px solid ${parseInt(product.stock, 10) <= 3 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(132, 244, 59, 0.3)'}`,
                  color: parseInt(product.stock, 10) <= 3 ? '#FBBF24' : 'var(--brand-green)',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}>
                  {parseInt(product.stock, 10) <= 3 
                    ? `Only ${product.stock} unit${parseInt(product.stock, 10) === 1 ? '' : 's'} left - order soon` 
                    : `${product.stock} units in stock`}
                </div>
              )}
            </div>

            <div style={{ color: '#9CA3AF' }}>
              Physical pickup desk: {product.merchantLocation || 'Victoria Island, Lagos'} (Available 9:00 AM - 7:00 PM)
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            <button
              onClick={() => {
                if (onAddToCart) onAddToCart(product, selectedSize);
                setAddedCartFeedback(true);
                setTimeout(() => setAddedCartFeedback(false), 2200);
              }}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '999px',
                background: addedCartFeedback ? 'var(--brand-green)' : '#162424',
                border: '1.5px solid var(--brand-green)',
                color: addedCartFeedback ? '#080F0F' : 'var(--brand-green)',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: addedCartFeedback ? '0 0 20px var(--brand-green-glow)' : 'none'
              }}
            >
              {addedCartFeedback ? <CheckCircle2 size={18} color="#080F0F" /> : <ShoppingBag size={18} />}
              <span>{addedCartFeedback ? 'Added to Cart!' : 'Add to Cart'}</span>
            </button>

            <button
              onClick={() => onStartCheckout && onStartCheckout(product)}
              className="btn-pill-primary"
              style={{
                flex: 1.2,
                padding: '14px',
                fontSize: '0.9rem',
                fontWeight: 800,
                boxShadow: '0 0 24px var(--brand-green-glow)'
              }}
            >
              Buy Now
            </button>
          </div>

          {/* Trust Guarantees */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            paddingTop: '16px',
            marginTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.72rem',
            color: '#9CA3AF',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Truck size={16} color="var(--brand-green)" />
              <span>Free Local Pickup</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={16} color="var(--brand-green)" />
              <span>7-Day Return</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={16} color="var(--brand-green)" />
              <span>12-Mo Warranty</span>
            </div>
          </div>

        </div>
      </div>

      {/* Seller Description & Item Details Card */}
      <div 
        className="liquid-glass-card"
        style={{
          padding: '28px',
          borderRadius: '24px',
          background: '#0D1616',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '48px'
        }}
      >
        <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 14px' }}>
          About this Item & Authenticity Specs
        </h2>
        
        <p style={{ fontSize: '0.86rem', color: '#D1D5DB', lineHeight: 1.6, margin: '0 0 20px' }}>
          {product.description || 'Authorized genuine merchandise with onchain Product Passport tracking origin, custody, and factory warranty on Monad. Ready for direct in-store collection or courier dispatch.'}
        </p>

        {/* Specifications grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <span style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>Category</span>
            <strong style={{ fontSize: '0.84rem', color: '#FFFFFF' }}>{product.category || 'Retail Goods'}</strong>
          </div>
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <span style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>Condition</span>
            <strong style={{ fontSize: '0.84rem', color: '#FFFFFF' }}>{product.condition || 'Brand New / Sealed'}</strong>
          </div>
          {product.stock != null && (
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>Units Available</span>
              <strong style={{ fontSize: '0.84rem', color: parseInt(product.stock, 10) <= 3 ? '#FBBF24' : 'var(--brand-green)' }}>
                {product.stock} Left in Stock
              </strong>
            </div>
          )}
          {(product.color || product.colors) && (
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>Color / Finish</span>
              <strong style={{ fontSize: '0.84rem', color: '#FFFFFF' }}>
                {product.color || (Array.isArray(product.colors) ? product.colors.join(', ') : product.colors)}
              </strong>
            </div>
          )}
          {product.storage && (
            <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <span style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>Configuration</span>
              <strong style={{ fontSize: '0.84rem', color: '#FFFFFF' }}>{product.storage}</strong>
            </div>
          )}
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <span style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>Warranty</span>
            <strong style={{ fontSize: '0.84rem', color: '#FFFFFF' }}>{product.warrantyMonths ? `${product.warrantyMonths} Months Active` : '12 Months Active'}</strong>
          </div>
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <span style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>Packaging</span>
            <strong style={{ fontSize: '0.84rem', color: '#FFFFFF' }}>Original Box & Monad Passport Tag</strong>
          </div>
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <span style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'block', marginBottom: '2px' }}>Escrow Protection</span>
            <strong style={{ fontSize: '0.84rem', color: 'var(--brand-green)' }}>Monad Smart Escrow Active</strong>
          </div>
        </div>
      </div>

      {/* DEDICATED CUSTOMER REVIEWS SECTION FOR THIS SPECIFIC PRODUCT */}
      <div 
        id="product-reviews-section"
        className="liquid-glass-card"
        style={{
          padding: '32px',
          borderRadius: '24px',
          background: '#0D1616',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Star size={20} fill="#FBBF24" color="#FBBF24" />
              <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Customer Reviews for {product.name}
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: 0 }}>
              Authentic feedback from verified shoppers with this item in hand.
            </p>
          </div>

          {/* Conditional "Write a Review for this Item" Action (Item In Hand Required) */}
          {hasItemInHand ? (
            <button
              onClick={() => onOpenRateItem && onOpenRateItem(product)}
              className="btn-pill-primary"
              style={{
                padding: '9px 22px',
                fontWeight: 800,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '7px'
              }}
            >
              <Star size={14} />
              <span>Write a Review for this Item</span>
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.72rem',
              color: '#9CA3AF'
            }}>
              <Info size={13} color="var(--brand-green)" />
              <span>Verified Purchasers In Hand Only</span>
            </div>
          )}
        </div>

        {/* Reviews List & Empty State */}
        {productReviews.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: '#080F0F',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <ShieldCheck size={36} color="var(--brand-green)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
              No reviews yet for this item
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0, maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
              Only verified buyers who have received this item in hand can leave an onchain review. Orders that were cancelled or refunded cannot be reviewed.
            </p>
          </div>
        ) : (
          <>
            {/* Rating Breakdown Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
              padding: '20px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  {averageRating || '5.0'}
                </div>
                <div style={{ display: 'flex', gap: '3px', margin: '6px 0', color: '#FBBF24' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} fill="#FBBF24" />
                  ))}
                </div>
                <span style={{ fontSize: '0.76rem', color: '#9CA3AF' }}>
                  Based on {productReviews.length} verified review{productReviews.length === 1 ? '' : 's'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                {[
                  { stars: 5, pct: '100%' },
                  { stars: 4, pct: '0%' },
                  { stars: 3, pct: '0%' },
                  { stars: 2, pct: '0%' },
                  { stars: 1, pct: '0%' }
                ].map(row => (
                  <div key={row.stars} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#9CA3AF' }}>
                    <span style={{ width: '24px' }}>{row.stars}★</span>
                    <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                      <div style={{ width: row.pct, height: '100%', background: 'var(--brand-green)', borderRadius: '999px' }} />
                    </div>
                    <span style={{ width: '32px', textAlign: 'right' }}>{row.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews List */}
            <div className="stagger-group" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {productReviews.map((rev) => (
            <div 
              key={rev.id}
              style={{
                padding: '20px',
                borderRadius: '16px',
                background: '#080F0F',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.9rem' }}>{rev.reviewerName}</strong>
                    <span style={{
                      fontSize: '0.66rem',
                      color: 'var(--brand-green)',
                      background: 'var(--brand-green-dim)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <CheckCircle2 size={10} />
                      <span>Item In Hand</span>
                    </span>
                    {rev.variation && (
                      <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>• {rev.variation}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '2px', color: '#FBBF24', margin: '6px 0 2px' }}>
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} size={12} fill="#FBBF24" />
                    ))}
                  </div>
                </div>

                <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                  {rev.date}
                </span>
              </div>

              {rev.title && (
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#FFFFFF', marginBottom: '6px' }}>
                  {rev.title}
                </div>
              )}

              <p style={{ fontSize: '0.82rem', color: '#D1D5DB', lineHeight: 1.55, margin: '0 0 12px' }}>
                {rev.comment}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => toggleHelpful(rev.id)}
                  style={{
                    background: helpfulVotes[rev.id] ? 'rgba(132, 244, 59, 0.15)' : 'transparent',
                    border: helpfulVotes[rev.id] ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: helpfulVotes[rev.id] ? 'var(--brand-green)' : '#9CA3AF',
                    borderRadius: '999px',
                    padding: '3px 10px',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ThumbsUp size={11} />
                  <span>Helpful ({ (rev.helpfulCount || 0) + (helpfulVotes[rev.id] ? 1 : 0) })</span>
                </button>
              </div>
            </div>
          ))}
        </div>
          </>
        )}

      </div>

    </div>
  );
}
