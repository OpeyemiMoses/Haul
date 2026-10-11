import React, { useState } from 'react';
import { Star, X, CheckCircle2, Store, Sparkles, ShieldCheck } from 'lucide-react';
import { formatNumber } from '../lib/formatters';
import ModalPortal from './ModalPortal';

const DEFAULT_REVIEW_TAGS = [
  'Fast Pickup',
  'Authentic Goods',
  'Responsive Seller',
  'Pristine Packaging',
  'Seamless Checkout',
  'Great Customer Service'
];

export default function StoreReviewModal({
  isOpen,
  onClose,
  merchant,
  product = null,
  passport = null,
  currentUser = null,
  onReviewSubmitted
}) {
  if (!isOpen || !merchant) return null;

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['Fast Pickup', 'Authentic Goods']);
  const [reviewText, setReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState(
    currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Verified Shopper')
  );
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const activeProduct = passport || product;
  const activeProductName = passport?.productName || product?.productName || product?.name || 'Authenticated Luxury Item';
  const activeProductImage = passport?.imageUri || product?.imageUri || '/assets/air_max_95.jpg';
  const activeTokenId = passport?.tokenId || product?.tokenId || null;
  const activeSerial = passport?.serialNumber || product?.serialNumber || null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!merchant?.id) return;

    const newReview = {
      id: `rev-${Date.now()}`,
      merchantId: merchant.id,
      merchantName: merchant.name,
      productId: activeProduct?.productId || activeProduct?.id || null,
      productName: activeProductName,
      passportTokenId: activeTokenId,
      serialNumber: activeSerial,
      rating,
      title: `${rating === 5 ? 'Exceptional Experience' : rating >= 4 ? 'Great Item & Service' : 'Authentic Item'}`,
      comment: reviewText.trim() || 'Verified purchase. Excellent merchant, fast collection, and authentic onchain passport.',
      tags: selectedTags,
      reviewerName: reviewerName.trim() || 'Verified Buyer',
      date: 'Just now',
      verified: true
    };

    // Save to localStorage under merchant reviews key
    try {
      const storageKey = `hual_store_reviews_${merchant.id}`;
      const existingStr = localStorage.getItem(storageKey);
      const existingReviews = existingStr ? JSON.parse(existingStr) : [];
      const updated = [newReview, ...existingReviews];
      localStorage.setItem(storageKey, JSON.stringify(updated));

      // Also save to user's scoped reviews key
      const userKey = currentUser?.id || (currentUser?.email ? currentUser.email.toLowerCase() : 'guest');
      const userRevKey = `hual_my_reviews_${userKey}`;
      const existingUserStr = localStorage.getItem(userRevKey);
      const existingUserRevs = existingUserStr ? JSON.parse(existingUserStr) : [];
      localStorage.setItem(userRevKey, JSON.stringify([newReview, ...existingUserRevs]));

      // Trigger callback to update merchant stats in UI
      if (onReviewSubmitted) {
        onReviewSubmitted(merchant.id, newReview, updated);
      }
    } catch (err) {
      console.warn('Failed to save review to storage:', err);
    }

    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  const ratingDescriptions = {
    1: 'Poor Experience',
    2: 'Needs Improvement',
    3: 'Average / Acceptable',
    4: 'Very Good Service',
    5: 'Exceptional • Highly Recommended'
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
      <div 
        className="liquid-glass-card custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          background: 'rgba(14, 22, 22, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '26px',
          padding: '28px',
          boxShadow: 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.25), 0 30px 90px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          margin: '0 auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#9CA3AF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '40px 10px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(132, 244, 59, 0.12)',
              border: '2px solid var(--brand-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 0 30px var(--brand-green-dim)'
            }}>
              <CheckCircle2 size={32} color="var(--brand-green)" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
              Review Submitted!
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#9CA3AF', margin: 0 }}>
              Your verified rating for <strong style={{ color: '#FFFFFF' }}>{merchant.name}</strong> has been recorded and updated live.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header / Store Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: '#080F0F',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {merchant.avatar ? (
                  <img src={merchant.avatar} alt={merchant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Store size={22} color="var(--brand-green)" />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {merchant.name}
                  </h3>
                  <CheckCircle2 size={13} color="var(--brand-green)" />
                </div>
                <div style={{ fontSize: '0.74rem', color: '#9CA3AF', marginTop: '2px' }}>
                  {merchant.location || 'Victoria Island, Lagos'} • Rating: {merchant.rating || '4.9'} ({formatNumber(merchant.reviewsCount || 120)} reviews)
                </div>
              </div>
            </div>

            {/* Verified Onchain Purchase Card */}
            {activeProduct && (
              <div style={{
                background: 'rgba(132, 244, 59, 0.05)',
                border: '1px solid rgba(132, 244, 59, 0.25)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <img 
                  src={activeProductImage} 
                  alt={activeProductName} 
                  style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'contain', background: '#0D1616', border: '1px solid rgba(255, 255, 255, 0.08)', flexShrink: 0 }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ 
                      fontSize: '0.66rem', 
                      fontWeight: 800, 
                      color: 'var(--brand-green)', 
                      background: 'var(--brand-green-dim)', 
                      padding: '2px 8px', 
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <ShieldCheck size={12} />
                      <span>VERIFIED ONCHAIN PURCHASE</span>
                    </span>
                    {activeTokenId && (
                      <span style={{ fontSize: '0.66rem', color: '#9CA3AF' }}>
                        Token #{activeTokenId}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeProductName}
                  </div>
                  {activeSerial && (
                    <div style={{ fontSize: '0.68rem', color: '#6B7280', fontFamily: 'monospace', marginTop: '1px' }}>
                      SN: {activeSerial}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interactive Star Selection */}
            <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Your Star Rating
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = (hoverRating || rating) >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starVal)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <Star 
                        size={32} 
                        color={isFilled ? '#FBBF24' : '#4B5563'} 
                        fill={isFilled ? '#FBBF24' : 'transparent'} 
                        style={{ filter: isFilled ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))' : 'none' }}
                      />
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#FBBF24', fontWeight: 700, marginTop: '8px', minHeight: '18px' }}>
                {ratingDescriptions[hoverRating || rating]}
              </div>
            </div>

            {/* Quick Experience Tags */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Experience Highlights (Tap to select)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {DEFAULT_REVIEW_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: active ? 'var(--brand-green-dim)' : 'rgba(255, 255, 255, 0.05)',
                        border: active ? '1px solid var(--brand-green-border)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: active ? 'var(--brand-green)' : '#9CA3AF',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Review */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Your Review
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share details about fulfillment speed, product condition, communication, or store pickup..."
                rows={3}
                style={{
                  width: '100%',
                  background: '#0A1212',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '0.82rem',
                  color: '#FFFFFF',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Reviewer Name */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Reviewing As
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0A1212',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  color: '#FFFFFF',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9CA3AF',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-pill-primary"
                style={{
                  flex: 2,
                  padding: '11px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={14} />
                <span>Submit Verified Review</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
