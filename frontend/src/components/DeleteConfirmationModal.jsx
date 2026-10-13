import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  product
}) {
  if (!isOpen || !product) return null;

  const productName = product.name || 'Store Item';
  const productBrand = product.brand || 'Unbranded';
  const priceDisplay = product.priceUsd 
    ? `$${Number(product.priceUsd).toLocaleString()}` 
    : (product.priceUsdCents ? `$${(Number(product.priceUsdCents) / 100).toLocaleString()}` : null);

  return (
    <ModalPortal>
      <div 
        className="modal-overlay" 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100050,
          padding: '16px'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="liquid-glass-card"
          style={{
            maxWidth: '440px',
            width: '100%',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, #101616 0%, #080D0D 100%)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(239, 68, 68, 0.15)',
            padding: '28px',
            position: 'relative',
            animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={15} />
          </button>

          {/* Warning Icon Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.08) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle size={24} color="#EF4444" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Delete Store Listing?
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Irreversible Action
              </span>
            </div>
          </div>

          {/* Item Preview Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            marginBottom: '16px'
          }}>
            {product.imageUri ? (
              <img 
                src={product.imageUri} 
                alt={productName}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  background: '#1A2323'
                }}
              />
            ) : (
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: '#1A2323',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280'
              }}>
                <Trash2 size={20} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {productName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#9CA3AF', marginTop: '2px' }}>
                <span>{productBrand}</span>
                {priceDisplay && (
                  <>
                    <span>•</span>
                    <strong style={{ color: 'var(--brand-green)' }}>{priceDisplay}</strong>
                  </>
                )}
              </div>
            </div>
          </div>

          <p style={{
            fontSize: '0.82rem',
            color: '#D1D5DB',
            lineHeight: 1.55,
            marginBottom: '22px'
          }}>
            Are you sure you want to permanently delete this listing? It will be immediately removed from your store catalog, and customers will no longer be able to discover or purchase it.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-pill-secondary"
              style={{
                flex: 1,
                padding: '12px 18px',
                fontSize: '0.84rem',
                fontWeight: 700,
                textAlign: 'center',
                justifyContent: 'center'
              }}
            >
              Keep Listing
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(product);
                onClose();
              }}
              className="btn-pill-primary"
              style={{
                flex: 1,
                padding: '12px 18px',
                fontSize: '0.84rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                borderColor: 'rgba(239, 68, 68, 0.5)',
                color: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)',
                textAlign: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={15} />
              <span>Delete Item</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
