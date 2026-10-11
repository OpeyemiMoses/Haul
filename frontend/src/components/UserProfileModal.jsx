import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  Copy, 
  Check, 
  RefreshCw, 
  PlusCircle, 
  ShieldCheck, 
  ShoppingBag, 
  Store, 
  LogOut, 
  ArrowRight,
  ExternalLink,
  QrCode,
  Lock,
  Layers,
  User,
  Sparkles,
  Package,
  MapPin,
  Send
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import { HualIcon } from './HualLogo';
import ModalPortal from './ModalPortal';
import { BUYER_LOCATIONS } from '../lib/catalogData';
import CreateStoreModal from './CreateStoreModal';

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  onOpenSellModal, 
  onNavigateTab,
  onOpenMyStore,
  passports = [] 
}) {
  const { 
    user, 
    userLocation,
    updateUserLocation,
    userRole,
    userStore,
    usdcBalance, 
    loadingBalance, 
    refreshBalance, 
    faucetUsdc, 
    transferUsdc,
    linkGoogle,
    linkEmail,
    linkPhone,
    linkTwitter,
    linkDiscord,
    isAgeVerified,
    setAgeVerificationOpen,
    logout 
  } = useAuth();

  const [copied, setCopied] = useState(false);
  const [fauceting, setFauceting] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState(false);
  const [createStoreOpen, setCreateStoreOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  // Gasless USDC Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(null);
  const [transferError, setTransferError] = useState(null);

  if (!isOpen) return null;

  const address = user?.address || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const email = user?.email || (user?.address ? `${address.slice(0, 6)}...${address.slice(-4)}@haul.store` : 'guest@haul.store');
  const displayName = user?.name || (email.includes('@') ? email.split('@')[0] : 'Member');

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFaucet = async () => {
    setFauceting(true);
    setFaucetSuccess(false);
    try {
      await faucetUsdc(1000);
      await refreshBalance();
      setFaucetSuccess(true);
      setTimeout(() => setFaucetSuccess(false), 3000);
    } catch (err) {
      console.error('Top-up failed:', err);
    } finally {
      setFauceting(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferRecipient || !transferAmount || Number(transferAmount) <= 0) return;
    setTransferring(true);
    setTransferError(null);
    setTransferSuccess(null);
    try {
      const res = await transferUsdc({
        recipientAddress: transferRecipient.trim(),
        amount: Number(transferAmount)
      });
      setTransferSuccess(`Transferred $${Number(transferAmount).toFixed(2)} USDC! Monad Tx: ${res.txHash?.slice(0, 10)}...`);
      setTransferRecipient('');
      setTransferAmount('');
      setTimeout(() => setTransferSuccess(null), 6000);
    } catch (err) {
      setTransferError(err.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const handleLink = async (key) => {
    try {
      if (key === 'google' && linkGoogle) await linkGoogle();
      else if (key === 'email' && linkEmail) await linkEmail();
      else if (key === 'sms' && linkPhone) await linkPhone();
      else if (key === 'twitter' && linkTwitter) await linkTwitter();
      else if (key === 'discord' && linkDiscord) await linkDiscord();
    } catch (e) {
      console.warn('Privy link error:', e);
    }
  };

  const linked = user?.linkedAccounts || {
    google: user?.provider === 'google',
    email: Boolean(user?.email),
    sms: false,
    discord: false,
    twitter: false
  };

  return (
    <ModalPortal>
      <div 
        className="modal-overlay" 
        onClick={onClose}
      >
      <div 
        className="custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '580px', 
          width: '100%',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          borderRadius: '24px', 
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.22)',
          position: 'relative',
          margin: '0 auto'
        }}
      >
        {/* Top Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: '#FAFAFA',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--brand-green)' }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--brand-green-dark)',
                fontWeight: 700
              }}>
                Verified Account Identity
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--brand-green)',
                border: '2px solid #0A0D0D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0A0D0D',
                fontWeight: 900,
                fontSize: '1.25rem',
                fontFamily: 'var(--font-main)'
              }}>
                {displayName[0].toUpperCase()}
              </div>

              <div>
                <h2 style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#0A0D0D',
                  letterSpacing: '-0.02em',
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  {displayName}
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#4B5563', marginTop: '2px' }}>
                  {email}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              color: '#6B7280',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0A0D0D';
              e.currentTarget.style.borderColor = '#0A0D0D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6B7280';
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* 1. Measurable Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}>
            {/* Cell 1: Spendable Balance */}
            <div style={{ 
              background: '#F9FAFB', 
              padding: '18px 20px', 
              borderRadius: '16px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#6B7280',
                marginBottom: '6px'
              }}>
                Available Balance
              </div>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: '#0A0D0D',
                letterSpacing: '-0.02em',
                lineHeight: 1.1
              }}>
                ${usdcBalance.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--brand-green-dark)', marginTop: '4px', fontWeight: 700 }}>
                Instant Gasless Shopping
              </div>
            </div>

            {/* Cell 2: Living Certificates */}
            <div 
              onClick={() => {
                onClose();
                if (onNavigateTab) onNavigateTab('passports');
              }}
              style={{ 
                background: '#F9FAFB', 
                padding: '18px 20px', 
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0A0D0D'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#6B7280',
                marginBottom: '6px'
              }}>
                Living Passports
              </div>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: '#0A0D0D',
                letterSpacing: '-0.02em',
                lineHeight: 1.1
              }}>
                {passports.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Active Warranties</span>
                <ArrowRight size={11} />
              </div>
            </div>
          </div>

          {/* 2. Top-Up & Account Hash Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '14px',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.74rem', color: '#6B7280', fontWeight: 600 }}>Wallet Address:</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: '#0A0D0D',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                padding: '3px 8px',
                borderRadius: '6px',
                fontWeight: 600
              }}>
                {shortAddr}
              </span>
              <button
                onClick={handleCopy}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copied ? 'var(--brand-green-dark)' : '#6B7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px 4px'
                }}
                title="Copy Address"
              >
                {copied ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => refreshBalance()}
                disabled={loadingBalance}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '999px',
                  padding: '6px 10px',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '0.74rem'
                }}
                title="Refresh Balance"
              >
                <RefreshCw size={12} className={loadingBalance ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={() => {
                  setShowTransferModal(!showTransferModal);
                  setTransferError(null);
                  setTransferSuccess(null);
                }}
                className="btn-pill-secondary"
                style={{ 
                  padding: '6px 14px', 
                  fontSize: '0.76rem', 
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: showTransferModal ? '#0A0D0D' : '#FFFFFF',
                  color: showTransferModal ? '#FFFFFF' : '#374151'
                }}
              >
                <Send size={12} />
                <span>Send USDC</span>
              </button>

              <button
                onClick={handleFaucet}
                disabled={fauceting}
                className="btn-pill-primary"
                style={{ padding: '6px 14px', fontSize: '0.76rem', fontWeight: 700 }}
              >
                <PlusCircle size={13} />
                <span>{fauceting ? 'Adding...' : '+ Add $1,000 USD'}</span>
              </button>
            </div>
          </div>

          {/* Gasless USDC Transfer Drawer */}
          {showTransferModal && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={15} color="#15803d" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0A0D0D' }}>
                    Send USDC from Privy Embedded Wallet
                  </span>
                </div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(132, 244, 59, 0.15)',
                  color: 'var(--brand-green-dark)',
                  border: '1px solid rgba(21, 128, 61, 0.25)'
                }}>
                  GAS SPONSORED (0 MON)
                </span>
              </div>

              <form onSubmit={handleTransferSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', marginBottom: '4px' }}>
                      Recipient Address / Account
                    </label>
                    <input
                      type="text"
                      placeholder="0x... or friend@gmail.com"
                      value={transferRecipient}
                      onChange={(e) => setTransferRecipient(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.82rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        color: '#0A0D0D'
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B7280' }}>
                        Amount (USDC)
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                        Available: <b style={{ color: '#0A0D0D' }}>${usdcBalance.toFixed(2)}</b>
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={usdcBalance}
                        placeholder="50.00"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: '1px solid #D1D5DB',
                          fontSize: '0.82rem',
                          fontFamily: 'var(--font-mono)',
                          outline: 'none',
                          color: '#0A0D0D'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {transferError && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#FEE2E2',
                    color: '#B91C1C',
                    fontSize: '0.74rem',
                    marginBottom: '10px',
                    fontWeight: 600
                  }}>
                    {transferError}
                  </div>
                )}

                {transferSuccess && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(132, 244, 59, 0.18)',
                    color: '#15803d',
                    fontSize: '0.74rem',
                    marginBottom: '10px',
                    fontWeight: 700
                  }}>
                    {transferSuccess}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '999px',
                      background: '#F3F4F6',
                      border: '1px solid #E5E7EB',
                      color: '#4B5563',
                      fontSize: '0.76rem',
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
                    style={{ padding: '8px 18px', fontSize: '0.76rem', fontWeight: 800 }}
                  >
                    {transferring ? 'Broadcasting on Monad...' : 'Send with Sponsored Gas'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {faucetSuccess && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(132, 244, 59, 0.18)',
              border: '1px solid rgba(21, 128, 61, 0.3)',
              color: '#15803d',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Check size={15} />
              <span>+$1,000.00 USD added to your spendable balance</span>
            </div>
          )}

          {/* Profile Location & Account Mode */}
          <div style={{
            background: '#F9FAFB',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>
                  Primary Shopping & Delivery Location
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0A0D0D', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#15803d" />
                  <span>{userLocation}</span>
                </div>
              </div>

              <button
                onClick={() => setEditingLocation(!editingLocation)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '999px',
                  padding: '5px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                {editingLocation ? 'Close' : 'Change Location'}
              </button>
            </div>

            {editingLocation && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
                {BUYER_LOCATIONS.slice(0, 6).map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      updateUserLocation(loc.name);
                      setEditingLocation(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: userLocation === loc.name ? 'var(--brand-green)' : '#FFFFFF',
                      color: userLocation === loc.name ? '#080F0F' : '#374151',
                      border: '1px solid #E5E7EB',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {loc.name.split(',')[0]}
                  </button>
                ))}
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '10px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>
                  Account Role
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0A0D0D' }}>
                  {userRole === 'merchant' ? `Store Owner (${userStore?.name || 'Verified Store'})` : 'Consumer / Shopper'}
                </div>
              </div>

              {userRole !== 'merchant' ? (
                <button
                  onClick={() => setCreateStoreOpen(true)}
                  style={{
                    background: '#0A0D0D',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '6px 14px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Store size={13} />
                  <span>Create a Store</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenMyStore) {
                      onOpenMyStore(userStore);
                    } else if (onNavigateTab) {
                      onNavigateTab('shop');
                    }
                  }}
                  style={{
                    background: 'var(--brand-green)',
                    color: '#080F0F',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '6px 14px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Store size={13} />
                  <span>View My Store</span>
                </button>
              )}
            </div>
          </div>

          {/* 18+ Age & Legal Verification Status */}
          <div style={{
            background: isAgeVerified ? '#F0FDF4' : '#FEF2F2',
            borderRadius: '16px',
            border: isAgeVerified ? '1px solid #BBF7D0' : '1px solid #FECACA',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: isAgeVerified ? '#DCFCE7' : '#FEE2E2',
                border: isAgeVerified ? '1px solid #86EFAC' : '1px solid #FCA5A5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isAgeVerified ? '#16A34A' : '#DC2626'
              }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  color: isAgeVerified ? '#166534' : '#991B1B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{isAgeVerified ? '18+ Age Verified' : 'Age Unverified (18+ Required)'}</span>
                  {isAgeVerified && <CheckCircle2 size={15} color="#16A34A" />}
                </div>
                <div style={{ fontSize: '0.74rem', color: isAgeVerified ? '#15803D' : '#B91C1C', marginTop: '2px' }}>
                  {isAgeVerified 
                    ? 'Eligible for Monad smart contracts & verified physical commerce'
                    : 'Complete 18+ legal attestation to unlock buying and passport trading.'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (setAgeVerificationOpen) setAgeVerificationOpen(true);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                background: isAgeVerified ? '#FFFFFF' : '#DC2626',
                color: isAgeVerified ? '#166534' : '#FFFFFF',
                border: isAgeVerified ? '1px solid #86EFAC' : 'none',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isAgeVerified ? 'Re-verify' : 'Verify Age Now'}
            </button>
          </div>

          {/* 3. Owned Passports Preview */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#6B7280',
                fontWeight: 700
              }}>
                My Owned Passports ({passports.length})
              </span>

              <button
                onClick={() => {
                  onClose();
                  if (onNavigateTab) onNavigateTab('passports');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>View All</span>
                <ArrowRight size={11} />
              </button>
            </div>

            {passports.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '14px'
              }}>
                <Package size={24} color="#9CA3AF" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.8rem', color: '#4B5563', fontWeight: 600 }}>
                  No Passports Owned Yet
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
                  Purchase any product to mint its verifiable digital warranty passport.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {passports.slice(0, 3).map((p) => (
                  <div
                    key={p.tokenId}
                    style={{
                      padding: '12px 14px',
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0A0D0D' }}>
                        {p.productName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6B7280', fontFamily: 'var(--font-mono)' }}>
                        {p.serialNumber} · {p.productBrand}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(132, 244, 59, 0.18)',
                        color: '#15803d',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {p.daysRemainingWarranty || 365}D WARRANTY
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Fast Navigational Actions */}
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#6B7280',
              marginBottom: '10px',
              fontWeight: 700
            }}>
              Quick Actions
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => {
                  onClose();
                  onOpenSellModal();
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0A0D0D';
                  e.currentTarget.style.background = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Store size={16} color="#0A0D0D" />
                  <ArrowRight size={12} color="#9CA3AF" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0A0D0D', marginTop: '4px' }}>
                  + List Product for Sale
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                  Add item to verified catalog
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onNavigateTab) onNavigateTab('passports');
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0A0D0D';
                  e.currentTarget.style.background = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ShieldCheck size={16} color="#0284c7" />
                  <ArrowRight size={12} color="#9CA3AF" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0A0D0D', marginTop: '4px' }}>
                  My Living Passports
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                  View warranty & 1-click transfer
                </div>
              </button>
            </div>
          </div>

          {/* 5. Linked Identities */}
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#6B7280',
              marginBottom: '10px',
              fontWeight: 700
            }}>
              Linked Identities (Privy Auth)
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '1px solid #E5E7EB'
            }}>
              {[
                { key: 'google', label: 'Google Account', connected: linked.google },
                { key: 'email', label: 'Email Address', connected: linked.email },
                { key: 'sms', label: 'Phone SMS', connected: linked.sms },
                { key: 'discord', label: 'Discord', connected: linked.discord },
                { key: 'twitter', label: 'X / Twitter', connected: linked.twitter },
              ].map((acc, idx) => (
                <div
                  key={acc.key}
                  style={{
                    background: '#FFFFFF',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: idx < 4 ? '1px solid #F3F4F6' : 'none'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: '#111827', fontWeight: 600 }}>
                    {acc.label}
                  </span>

                  {acc.connected ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      color: 'var(--brand-green-dark)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700
                    }}>
                      <Check size={12} color="#15803d" /> Linked
                    </span>
                  ) : (
                    <button
                      onClick={() => handleLink(acc.key)}
                      style={{
                        background: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '999px',
                        padding: '3px 10px',
                        color: '#4B5563',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Link
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 6. Footer with Sign Out */}
          <div style={{
            paddingTop: '16px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
              Haul · Buy it. Own it. Prove it.
            </div>

            <button
              onClick={() => {
                logout();
                onClose();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </div>

      {createStoreOpen && (
        <CreateStoreModal 
          isOpen={createStoreOpen}
          onClose={() => setCreateStoreOpen(false)}
          onStoreCreated={(newStore) => {
            setCreateStoreOpen(false);
            onClose();
            if (onNavigateTab) onNavigateTab('shop');
          }}
        />
      )}
      </div>
    </ModalPortal>
  );
}
