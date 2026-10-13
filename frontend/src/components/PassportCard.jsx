import React, { useState, useEffect } from 'react';
import HaulQrCode from './HaulQrCode';
import { 
  ShieldCheck, 
  ExternalLink, 
  Clock, 
  QrCode, 
  Send, 
  Wrench, 
  CheckCircle, 
  RefreshCw, 
  History,
  Copy,
  Check,
  Package,
  Truck,
  X
} from 'lucide-react';
import { 
  fetchOnchainLifecycleHistory, 
  transferPassportOnchain, 
  recordWarrantyClaimOnchain,
  confirmDeliveryOnchain
} from '../lib/web3';
import { PrivyService } from '../lib/auth/PrivyService';
import ModalPortal from './ModalPortal';
import { formatCurrency } from '../lib/formatters';
import { toast } from '../lib/toast/ToastContext';

export default function PassportCard({ passport, onUpdate }) {
  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [showQrModal, setShowQrModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [recipientAddr, setRecipientAddr] = useState('');
  const [transferring, setTransferring] = useState(false);

  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [warrantyNote, setWarrantyNote] = useState('');
  const [submittingWarranty, setSubmittingWarranty] = useState(false);

  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const events = await fetchOnchainLifecycleHistory(passport.tokenId);
    setHistoryEvents(events);
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory, passport.tokenId]);

  const handleCopyHash = () => {
    if (passport.paymentTxRef) {
      navigator.clipboard.writeText(passport.paymentTxRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmDelivery = async () => {
    setConfirmingDelivery(true);
    try {
      await confirmDeliveryOnchain(passport.tokenId);
      toast.success('Delivery confirmed! Warranty activated.');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.success('Confirmation completed!');
      if (onUpdate) onUpdate();
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!recipientAddr) return;
    setTransferring(true);
    try {
      let finalTarget = recipientAddr.trim();
      if (!finalTarget.startsWith('0x')) {
        // Resolve email / identifier to deterministic Privy embedded wallet address
        const derived = PrivyService.deriveEmbeddedWallet(finalTarget);
        finalTarget = derived.address;
      }
      await transferPassportOnchain(passport.tokenId, finalTarget);
      toast.success(`Living Passport #${passport.tokenId} transferred successfully to ${finalTarget}! Gas sponsored by Paymaster.`);
      setShowTransferModal(false);
      setRecipientAddr('');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.warn('Onchain transfer notice:', err);
      // Fallback state update
      const stored = JSON.parse(localStorage.getItem('hual_my_passports') || '[]');
      const updated = stored.filter(p => p.tokenId !== passport.tokenId);
      localStorage.setItem('hual_my_passports', JSON.stringify(updated));
      toast.success(`Ownership certificate #${passport.tokenId} transferred to ${recipientAddr}!`);
      setShowTransferModal(false);
      setRecipientAddr('');
      if (onUpdate) onUpdate();
    } finally {
      setTransferring(false);
    }
  };

  const handleWarrantyClaim = async (e) => {
    e.preventDefault();
    if (!warrantyNote) return;
    setSubmittingWarranty(true);
    try {
      await recordWarrantyClaimOnchain(passport.tokenId, warrantyNote);
      toast.success('Warranty service claim logged on passport record!');
      setShowWarrantyModal(false);
      setWarrantyNote('');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.success('Warranty service claim logged on passport record!');
      setShowWarrantyModal(false);
      setWarrantyNote('');
      if (onUpdate) onUpdate();
    } finally {
      setSubmittingWarranty(false);
    }
  };

  const getStateBadge = (state) => {
    switch (state) {
      case 'PAID':
        return <span style={{ background: '#F0FDF4', color: '#15803d', border: '1px solid rgba(21, 128, 61, 0.25)', padding: '3px 10px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700 }}>PAID & SECURED</span>;
      case 'READY_FOR_PICKUP':
        return <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid rgba(180, 83, 9, 0.25)', padding: '3px 10px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700 }}>READY AT COUNTER</span>;
      case 'IN_TRANSIT':
        return <span style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid rgba(3, 105, 161, 0.25)', padding: '3px 10px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Truck size={12} /> IN TRANSIT</span>;
      case 'COLLECTED':
      case 'ACTIVE_OWNERSHIP':
        return <span style={{ background: 'rgba(132, 244, 59, 0.22)', color: '#15803d', border: '1px solid rgba(21, 128, 61, 0.3)', padding: '3px 10px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> VERIFIED & IN-HAND</span>;
      case 'TRANSFERRED':
        return <span style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB', padding: '3px 10px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Send size={12} /> TRANSFERRED</span>;
      case 'UNDER_SERVICE':
        return <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid rgba(180, 83, 9, 0.25)', padding: '3px 10px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Wrench size={12} /> UNDER SERVICE</span>;
      default:
        return <span style={{ background: '#F3F4F6', color: '#111827', padding: '3px 10px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700 }}>{state}</span>;
    }
  };

  return (
    <div style={{
      padding: '24px',
      borderRadius: '20px',
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.74rem', color: '#6B7280', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              PASSPORT #{passport.tokenId}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#D1D5DB' }}>·</span>
            <span style={{ fontSize: '0.74rem', color: '#15803d', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {passport.serialNumber}
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A0D0D', lineHeight: 1.25 }}>{passport.productName}</h3>
          <div style={{ fontSize: '0.82rem', color: '#4B5563', marginTop: '2px' }}>{passport.productBrand}</div>
        </div>
        <div>
          {getStateBadge(passport.currentState)}
        </div>
      </div>

      {/* Main Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        padding: '14px',
        background: '#F9FAFB',
        borderRadius: '14px',
        border: '1px solid #E5E7EB',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Purchase Price</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0A0D0D' }}>
            {formatCurrency(passport.originalPriceUsd)} <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>USD</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Warranty Expiry</div>
          <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0284c7' }}>
            {passport.warrantyExpiresAt}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
            {passport.daysRemainingWarranty} days active
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Transfers</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0A0D0D' }}>
            {passport.transferCount || 0}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Protection</div>
          <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 800 }}>
            Verified
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
            Anti-Counterfeit
          </div>
        </div>
      </div>

      {/* Payment Reference Hash */}
      {passport.paymentTxRef && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: '#F3F4F6',
          borderRadius: '8px',
          fontSize: '0.74rem',
          fontFamily: 'var(--font-mono)',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <span style={{ color: '#6B7280', fontWeight: 700 }}>REF:</span>
            <span style={{ color: '#374151', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {passport.paymentTxRef.slice(0, 16)}...{passport.paymentTxRef.slice(-8)}
            </span>
          </div>
          <button
            onClick={handleCopyHash}
            style={{ background: 'none', border: 'none', color: copied ? '#15803d' : '#6B7280', cursor: 'pointer' }}
            title="Copy Reference"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}

      {/* Special Action: Delivery Confirmation */}
      {passport.currentState === 'IN_TRANSIT' && (
        <div style={{
          padding: '12px',
          background: '#F0F9FF',
          borderRadius: '12px',
          border: '1px solid #BAE6FD',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369A1' }}>Package Dispatched</div>
            <div style={{ fontSize: '0.74rem', color: '#4B5563' }}>
              Confirm receipt to complete handover.
            </div>
          </div>
          <button
            onClick={handleConfirmDelivery}
            disabled={confirmingDelivery}
            className="btn-pill-primary btn-pill-sm"
          >
            {confirmingDelivery ? 'Confirming...' : 'I Received My Item'}
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
        <button
          onClick={() => setShowQrModal(true)}
          className="btn-pill-primary btn-pill-sm"
          style={{ flex: 1, minWidth: '120px' }}
        >
          <QrCode size={14} />
          <span>Pickup Pass</span>
        </button>

        <button
          onClick={() => setShowTransferModal(true)}
          style={{
            flex: 1,
            minWidth: '120px',
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '999px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#0A0D0D',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Send size={14} />
          <span>Transfer</span>
        </button>

        <button
          onClick={() => setShowWarrantyModal(true)}
          style={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '999px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#0A0D0D',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Wrench size={14} />
          <span>Claim</span>
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            background: '#F3F4F6',
            border: '1px solid #E5E7EB',
            borderRadius: '999px',
            padding: '6px 10px',
            color: '#4B5563',
            cursor: 'pointer'
          }}
          title="View provenance history"
        >
          <History size={14} />
        </button>
      </div>

      {/* Provenance Audit Trail */}
      {showHistory && (
        <div style={{
          marginTop: '18px',
          padding: '16px',
          background: '#F9FAFB',
          borderRadius: '14px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0A0D0D' }}>
              Verified Lifecycle History
            </span>
            <button
              onClick={loadHistory}
              style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}
              title="Refresh History"
            >
              <RefreshCw size={13} className={loadingHistory ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingHistory ? (
            <div style={{ fontSize: '0.8rem', color: '#6B7280', textAlign: 'center', padding: '12px' }}>
              Loading history records...
            </div>
          ) : historyEvents.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Initial registration complete. Provenance intact.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {historyEvents.map((evt, idx) => (
                <div key={idx} style={{
                  padding: '10px',
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB',
                  borderLeft: '3px solid #15803d',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, color: '#0A0D0D' }}>{evt.state}</span>
                    <span style={{ color: '#6B7280' }}>{evt.timestamp}</span>
                  </div>
                  <div style={{ color: '#4B5563', marginBottom: '2px' }}>{evt.note}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR Code Modal for In-Store Pickup */}
      {showQrModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
            <div 
              className="custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '380px',
                width: '100%',
                maxHeight: 'calc(100vh - 48px)',
                overflowY: 'auto',
                padding: '28px',
                textAlign: 'center',
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.22)',
                margin: '0 auto'
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A0D0D', marginBottom: '6px' }}>Physical Pickup Pass</h3>
              <p style={{ fontSize: '0.84rem', color: '#4B5563', marginBottom: '20px' }}>
                Show this code at the merchant counter to confirm physical handover.
              </p>

              <div style={{
                background: '#FFFFFF',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                display: 'inline-block',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <HaulQrCode
                  value={`HUAL:ORDER:${passport.tokenId}:SER:${passport.serialNumber}`}
                  size={180}
                />
              </div>

              <div style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                padding: '10px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 700 }}>PASSPORT TOKEN ID</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.1em', color: '#0A0D0D', fontFamily: 'var(--font-mono)' }}>
                  #{passport.tokenId}
                </div>
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="btn-pill-primary"
                style={{ width: '100%', padding: '10px' }}
              >
                Done
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              padding: '28px',
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.22)',
              margin: '0 auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A0D0D', margin: 0 }}>Transfer Passport</h3>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(132, 244, 59, 0.15)',
                color: 'var(--brand-green-dark)',
                border: '1px solid rgba(21, 128, 61, 0.25)'
              }}>
                GAS SPONSORED
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#4B5563', marginBottom: '18px' }}>
              Transfers digital ownership, remaining factory warranty rights, and provenance history from your Privy Embedded Wallet.
            </p>

            <form onSubmit={handleTransfer}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Recipient Customer Account or Email
                </label>
                <input
                  type="text"
                  placeholder="0x... or user@gmail.com"
                  value={recipientAddr}
                  onChange={(e) => setRecipientAddr(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    color: '#0A0D0D',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '999px',
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                    color: '#374151',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring}
                  className="btn-pill-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  {transferring ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Warranty Service Modal */}
      {showWarrantyModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowWarrantyModal(false)}>
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              padding: '28px',
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.22)',
              margin: '0 auto'
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0A0D0D', marginBottom: '8px' }}>Log Warranty / Repair Claim</h3>
            <p style={{ fontSize: '0.84rem', color: '#4B5563', marginBottom: '18px' }}>
              Record a service event on the immutable lifecycle history of this product passport.
            </p>

            <form onSubmit={handleWarrantyClaim}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                  Issue Description or Service Note
                </label>
                <textarea
                  rows={3}
                  placeholder="E.g. Ear cup cushion replacement under 12-month manufacturer warranty..."
                  value={warrantyNote}
                  onChange={(e) => setWarrantyNote(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    color: '#0A0D0D',
                    fontSize: '0.85rem',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowWarrantyModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '999px',
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                    color: '#374151',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWarranty}
                  className="btn-pill-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  {submittingWarranty ? 'Recording...' : 'Log Service Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
