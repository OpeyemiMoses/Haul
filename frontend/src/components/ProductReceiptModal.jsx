import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  Headphones, 
  QrCode, 
  Package, 
  X, 
  ChevronRight,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import HualBrand, { HualIcon } from './HualLogo';
import { formatCurrency } from '../lib/formatters';
import ModalPortal from './ModalPortal';

export default function ProductReceiptModal({ 
  isOpen, 
  onClose, 
  order, 
  product, 
  merchant, 
  onViewPassport, 
  onChatStore 
}) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  // Dynamic order & product details
  const orderId = order?.orderNumber || order?.id || `#HUL-${Date.now().toString().slice(-4)}`;
  const cleanId = orderId.startsWith('#') ? orderId : `#${orderId}`;
  const orderDate = order?.timestamp || new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  const txHash = order?.txHash || order?.paymentTxRef || '0x7f3a8b29c910e42c';
  const shortHash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;

  const passportObj = order?.passport || null;
  const prodName = product?.name || passportObj?.productName || 'Authentic Item';
  const prodDesc = product?.brand || product?.description || passportObj?.productBrand || 'Verified Living Product Passport';
  const prodPrice = product?.priceUsd ? formatCurrency(product.priceUsd) : (passportObj?.originalPriceUsd ? formatCurrency(passportObj.originalPriceUsd) : '$250.00');
  const prodImage = product?.imageUri || product?.images?.[0] || passportObj?.imageUri || '/assets/air_max_95.jpg';
  const prodColor = product?.color || 'Original';
  const prodSize = product?.selectedSize || product?.size || 'Standard';
  const prodCondition = 'Brand New';

  const merchName = merchant?.name || product?.merchant || passportObj?.originalMerchant || 'Verified Merchant Store';
  const merchLocation = merchant?.location || merchant?.fullAddress || product?.merchantLocation || 'Victoria Island, Lagos';
  const merchStoreAddress = merchant?.fullAddress || `${merchName} • ${merchLocation}`;
  const merchInitial = (merchName[0] || 'V').toUpperCase() + (merchName.split(' ')[1]?.[0] || 'M').toUpperCase();
  const merchWebsite = `${merchName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" style={{ zIndex: 999999, backdropFilter: 'blur(32px) saturate(200%)' }}>
      <div 
        className="custom-scrollbar"
        style={{
          maxWidth: '620px',
          width: '100%',
          maxHeight: 'calc(100vh - 36px)',
          overflowY: 'auto',
          padding: '32px',
          background: 'linear-gradient(180deg, #091111 0%, #050808 100%)',
          border: '1px solid rgba(132, 244, 59, 0.3)',
          borderRadius: '28px',
          position: 'relative',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 50px rgba(132, 244, 59, 0.15)',
          color: '#FFFFFF',
          fontFamily: "'Sora', sans-serif",
          margin: '0 auto'
        }}
      >
        {/* Top Dismiss Button */}
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
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#9CA3AF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9CA3AF';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          <X size={16} />
        </button>

        {/* 1. Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <HualBrand size={22} name="Hual" showTagline={true} />
            <h1 className="font-display" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', margin: '14px 0 4px', letterSpacing: '-0.02em' }}>
              Product Receipt
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: 0 }}>
              Your purchase is now a verified digital passport on Monad.
            </p>
          </div>

          <div style={{ textAlign: 'right', marginRight: '36px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'var(--brand-green-dim)',
              border: '1px solid var(--brand-green-border)',
              color: 'var(--brand-green)',
              fontSize: '0.72rem',
              fontWeight: 800,
              marginBottom: '8px'
            }}>
              <CheckCircle2 size={13} />
              <span>Verified Passport</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                {cleanId}
              </span>
              <button
                onClick={() => copyToClipboard(cleanId, 'id')}
                style={{ background: 'none', border: 'none', color: copiedId ? 'var(--brand-green)' : '#9CA3AF', cursor: 'pointer', padding: 0 }}
                title="Copy Purchase ID"
              >
                {copiedId ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>
              {orderDate}
            </div>
          </div>
        </div>

        {/* 2. Product Summary Card */}
        <div style={{
          background: '#0D1717',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '18px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          marginBottom: '14px'
        }}>
          {/* Square Image Frame with Green Ambience */}
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '16px',
            background: 'radial-gradient(circle at center, #132424 0%, #070D0D 100%)',
            border: '1px solid rgba(132, 244, 59, 0.25)',
            boxShadow: 'inset 0 0 20px rgba(132, 244, 59, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            <img 
              src={prodImage} 
              alt={prodName} 
              style={{ width: '90%', height: '90%', objectFit: 'contain' }} 
            />
          </div>

          {/* Product Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 2px' }}>
              {prodName}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: '0 0 10px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {prodDesc}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                {prodPrice}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'var(--brand-green)',
                color: '#080F0F',
                fontSize: '0.68rem',
                fontWeight: 900
              }}>
                <Check size={12} strokeWidth={3} />
                <span>Paid (In Escrow)</span>
              </span>
            </div>

            {/* Spec Row: Color, Quantity, Condition */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.74rem', color: '#D1D5DB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38BDF8' }} />
                <span style={{ color: '#9CA3AF' }}>Color:</span>
                <span style={{ fontWeight: 600 }}>{prodColor}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Package size={13} color="#9CA3AF" />
                <span style={{ color: '#9CA3AF' }}>Quantity:</span>
                <span style={{ fontWeight: 600 }}>1</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={13} color="var(--brand-green)" />
                <span style={{ color: '#9CA3AF' }}>Condition:</span>
                <span style={{ fontWeight: 600 }}>{prodCondition}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Verified Merchant Card */}
        <div style={{
          background: '#0D1717',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#1A2929',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
              color: '#FFFFFF'
            }}>
              {merchInitial}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF' }}>{merchName}</span>
                <CheckCircle2 size={14} color="var(--brand-green)" />
              </div>
              <div style={{ fontSize: '0.74rem', color: '#9CA3AF', marginTop: '2px' }}>
                {merchLocation}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', fontSize: '0.74rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#D1D5DB', cursor: 'pointer' }}>
              <MapPin size={13} color="var(--brand-green)" />
              <span style={{ fontWeight: 600 }}>Verified Store</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#9CA3AF' }}>
              <Globe size={13} />
              <span>{merchWebsite}</span>
            </div>
          </div>
        </div>

        {/* 4. Payment Details Card */}
        <div style={{
          background: '#0D1717',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 20px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFFFFF' }}>Payment & Escrow Details</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'var(--brand-green-dim)',
              border: '1px solid var(--brand-green-border)',
              color: 'var(--brand-green)',
              fontSize: '0.7rem',
              fontWeight: 800
            }}>
              <Check size={11} strokeWidth={3} />
              <span>Deposited Onchain</span>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '4px' }}>USDC (Sponsored)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#2775CA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  color: '#FFF'
                }}>$</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  {prodPrice}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '4px' }}>Transaction Hash</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <a
                  href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ 
                    fontSize: '0.82rem', 
                    fontWeight: 700, 
                    color: 'var(--brand-green)', 
                    fontFamily: 'var(--font-mono)', 
                    textDecoration: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px' 
                  }}
                  title="View on Monad Explorer"
                >
                  <span>{shortHash}</span>
                  <ExternalLink size={12} />
                </a>
                <button
                  onClick={() => copyToClipboard(txHash, 'hash')}
                  style={{ background: 'none', border: 'none', color: copiedHash ? 'var(--brand-green)' : '#9CA3AF', cursor: 'pointer', padding: 0 }}
                  title="Copy Transaction Hash"
                >
                  {copiedHash ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '4px' }}>Network</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', transform: 'rotate(45deg)', background: '#A855F7', display: 'inline-block' }} />
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFFFFF' }}>Monad Testnet</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Escrow Status & Handover Verification Card */}
        <div style={{
          background: '#0D1717',
          borderRadius: '18px',
          border: '1px solid rgba(132, 244, 59, 0.25)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#122020',
              border: '1px solid rgba(132, 244, 59, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-green)'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFFFFF' }}>Monad Smart Escrow</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(132, 244, 59, 0.15)',
                  border: '1px solid var(--brand-green-border)',
                  color: 'var(--brand-green)',
                  fontSize: '0.66rem',
                  fontWeight: 800
                }}>
                  Funds Locked in Escrow
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#9CA3AF', marginTop: '2px' }}>
                Protected on Monad • Released upon physical handover verification (PIN or delivery confirm)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF', fontSize: '0.74rem' }}>
            <div>
              <div style={{ color: '#9CA3AF' }}>Settlement Condition</div>
              <div style={{ color: '#FFFFFF', fontWeight: 600 }}>Inspection & Handover</div>
            </div>
          </div>
        </div>

        {/* 6. Two-Column Row: Purchase Timeline & Product Passport */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
          {/* Left: Purchase Timeline */}
          <div style={{
            background: '#0D1717',
            borderRadius: '18px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '18px 20px'
          }}>
            <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px' }}>
              Purchase Timeline
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { title: 'Order Created', time: 'Just now', completed: true },
                { title: 'Payment Locked in Escrow', time: 'Just now', completed: true },
                { title: 'Merchant Handover / Dispatch', time: 'Pending fulfillment', completed: false },
                { title: 'Physical Inspection & Escrow Settlement', time: 'Awaiting your confirmation', completed: false }
              ].map((step, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: step.completed ? 'var(--brand-green)' : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: step.completed ? '#080F0F' : '#6B7280'
                    }}>
                      {step.completed ? <Check size={11} strokeWidth={3} /> : <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9CA3AF' }} />}
                    </div>
                    <span style={{ color: step.completed ? '#FFFFFF' : '#9CA3AF', fontWeight: step.completed ? 600 : 400 }}>{step.title}</span>
                  </div>
                  <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>{step.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product Passport Card */}
          <div style={{
            background: '#0D1717',
            borderRadius: '18px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '18px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px' }}>
                Product Passport
              </h4>

              {/* Glowing QR Frame with Bracket Corners */}
              <div style={{
                width: '90px',
                height: '90px',
                margin: '0 auto 10px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#060B0B',
                borderRadius: '12px',
                border: '1px solid rgba(132, 244, 59, 0.4)',
                boxShadow: '0 0 25px rgba(132, 244, 59, 0.25)'
              }}>
                <QrCode size={56} color="var(--brand-green)" />
              </div>

              <p style={{ fontSize: '0.7rem', color: '#9CA3AF', margin: '0 0 14px', lineHeight: 1.35 }}>
                Scan to verify authenticity and ownership
              </p>
            </div>

            <button
              onClick={() => {
                if (onViewPassport) onViewPassport();
                if (onClose) onClose();
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '999px',
                background: 'transparent',
                border: '1px solid var(--brand-green)',
                color: 'var(--brand-green)',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--brand-green)';
                e.currentTarget.style.color = '#080F0F';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--brand-green)';
              }}
            >
              <span>View Passport</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* 7. Warranty & Support Card */}
        <div style={{
          background: '#0D1717',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '22px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#122020',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-green)'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFFFFF' }}>Warranty & Support</div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.74rem', marginTop: '2px' }}>
                <span style={{ color: '#9CA3AF' }}>Warranty Period: <strong style={{ color: '#FFF' }}>12 Months</strong></span>
                <span style={{ color: '#9CA3AF' }}>Remaining: <strong style={{ color: 'var(--brand-green)' }}>11 Months</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onChatStore) onChatStore();
              if (onClose) onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#142020',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '999px',
              padding: '6px 14px',
              color: '#FFFFFF',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Headphones size={13} color="var(--brand-green)" />
            <span>Request Support</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {/* 8. Footer Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.7rem',
          color: '#6B7280',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HualIcon size={16} />
            <span style={{ fontWeight: 800, color: '#FFFFFF' }}>Hual</span>
          </div>

          <div>
            Powered by <strong style={{ color: '#9CA3AF' }}>Monad</strong> &nbsp;×&nbsp; Secured by <strong style={{ color: '#9CA3AF' }}>Privy</strong>
          </div>

          <div>
            Purchase ID: <span style={{ fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}>{cleanId}</span>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
