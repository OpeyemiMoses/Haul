import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Wallet, 
  Copy, 
  Check, 
  RefreshCw, 
  PlusCircle, 
  LogOut, 
  Lock,
  Sparkles,
  Store
} from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import HualBrand, { HualIcon } from './HualLogo';
import { PrivyService } from '../lib/auth/PrivyService';

export default function LaunchSplitPage({ 
  onBackToLanding, 
  onEnterStorefront 
}) {
  // Official Privy SDK Hook
  const { login, logout, authenticated, user } = usePrivy();

  const [usdcBalance, setUsdcBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fauceting, setFauceting] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState(false);

  // Active account address and email from official Privy user object
  const googleAccount = user?.linkedAccounts?.find(a => a.type === 'google') || user?.google;
  const emailAccount = user?.linkedAccounts?.find(a => a.type === 'email') || user?.email;
  const walletAccount = user?.wallet || user?.linkedAccounts?.find(a => a.type === 'wallet');

  const walletAddress = walletAccount?.address || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const shortAddr = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  const userEmail = googleAccount?.email || emailAccount?.address || (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}@haul.store` : 'Verified Account');
  const userDisplayName = googleAccount?.name || (userEmail.includes('@') ? userEmail.split('@')[0] : 'Member');

  // Read real balance for account
  const refreshWalletBalance = async () => {
    if (!walletAddress) return;
    setLoadingBalance(true);
    try {
      const bal = await PrivyService.getUsdcBalance(walletAddress);
      setUsdcBalance(bal);
    } catch (err) {
      console.warn('Failed to fetch balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (authenticated && walletAddress) {
      refreshWalletBalance();
    }
  }, [authenticated, walletAddress]);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFaucet = async () => {
    setFauceting(true);
    setFaucetSuccess(false);
    try {
      await PrivyService.faucetUsdc(walletAddress, 1000);
      await refreshWalletBalance();
      setFaucetSuccess(true);
      setTimeout(() => setFaucetSuccess(false), 3000);
    } catch (err) {
      console.error('Top-up failed:', err);
    } finally {
      setFauceting(false);
    }
  };

  return (
    <div className="page-fade-in" style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      background: '#FFFFFF',
      position: 'relative'
    }}>
      {/* ================= SIDE 1 (LEFT 50%): AUTH & PROFILE ================= */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(20px, 3.5vw, 40px)',
        borderRight: '1px solid #E5E7EB',
        background: '#FFFFFF',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Top Back Link & Brand */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div 
              onClick={onEnterStorefront || onBackToLanding}
              style={{ cursor: 'pointer' }}
              title="Haul - Enter Storefront"
            >
              <HualBrand size={22} name="Haul" />
            </div>
          </div>
        </div>

        {/* Center Container: Sign In OR Profile */}
        <div style={{ maxWidth: '380px', width: '100%', margin: '0 auto' }}>
          {!authenticated ? (
            /* STATE A: NOT SIGNED IN */
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="capsule-tag" style={{ marginBottom: '8px', padding: '4px 10px', fontSize: '0.66rem', background: '#F3F4F6', color: '#0A0D0D', border: '1px solid #E5E7EB' }}>
                  Secure Account Access
                </span>
                <h2 style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  color: '#0A0D0D',
                  marginBottom: '8px'
                }}>
                  Welcome to Haul
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.55 }}>
                  Sign in to view your digital certificates, manage warranties, and shop authentic goods.
                </p>
              </div>

              {/* Login Card */}
              <div style={{
                background: '#FAFAFA',
                border: '1px solid #E5E7EB',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
                marginBottom: '16px'
              }}>
                {/* Sign In Button */}
                <button
                  onClick={() => login()}
                  className="btn-pill-primary"
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    marginBottom: '10px'
                  }}
                >
                  <HualIcon size={16} />
                  <span>Sign In / Create Account</span>
                  <ArrowRight size={14} />
                </button>

                {/* Browse Storefront as Guest Button */}
                <button
                  onClick={onEnterStorefront}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '999px',
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    color: '#0A0D0D',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0A0D0D';
                    e.currentTarget.style.background = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  <span>Browse Storefront as Guest</span>
                  <ArrowRight size={12} />
                </button>

                {/* Divider */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '16px 0',
                  color: '#6B7280',
                  fontSize: '0.72rem',
                  letterSpacing: '0.04em'
                }}>
                  <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                  <span style={{ padding: '0 8px' }}>Fast sign-in with</span>
                  <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                </div>

                {/* Supported Methods */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {['Google', 'Email', 'SMS', 'Discord', 'X / Twitter'].map((method) => (
                    <button
                      key={method}
                      onClick={() => login()}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        color: '#4B5563',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#0A0D0D';
                        e.target.style.color = '#0A0D0D';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#E5E7EB';
                        e.target.style.color = '#4B5563';
                      }}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* STATE B: SIGNED IN */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span className="eyebrow" style={{ marginBottom: '8px' }}>
                  <span className="eyebrow-dot" />
                  Verified Identity
                </span>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  color: '#0A0D0D',
                  margin: '4px 0 2px'
                }}>
                  My Haul Account
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#4B5563' }}>
                  {userEmail}
                </p>
              </div>

              {/* Account Card */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: '#FAFAFA',
                border: '1px solid #E5E7EB',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
              }}>
                {/* Metrics Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '14px'
                }}>
                  <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.64rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: '#6B7280',
                      marginBottom: '4px',
                      fontWeight: 700
                    }}>
                      Spendable Balance
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: '#0A0D0D',
                      letterSpacing: '-0.02em'
                    }}>
                      ${usdcBalance.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--brand-green-dark)', marginTop: '2px', fontWeight: 700 }}>
                      Instant Gasless Checkout
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.64rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: '#6B7280',
                      marginBottom: '4px',
                      fontWeight: 700
                    }}>
                      Buyer Protection
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: '#15803d',
                      letterSpacing: '-0.02em'
                    }}>
                      100%
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#4B5563', marginTop: '2px', fontWeight: 600 }}>
                      Protected Escrow
                    </div>
                  </div>
                </div>

                {/* Account ID Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#FFFFFF',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                      ID
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#0A0D0D', fontWeight: 600 }}>
                      {shortAddr}
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copied ? 'var(--brand-green-dark)' : '#6B7280',
                      padding: '3px 6px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}
                  >
                    {copied ? <Check size={12} color="#15803d" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Quick Add Funds / Refresh Row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button
                    onClick={handleFaucet}
                    disabled={fauceting}
                    className="btn-pill-primary btn-pill-sm"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.76rem', fontWeight: 700 }}
                  >
                    <PlusCircle size={13} />
                    <span>{fauceting ? 'Adding...' : '+ Add $1,000 USD'}</span>
                  </button>

                  <button
                    onClick={refreshWalletBalance}
                    disabled={loadingBalance}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '999px',
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      color: '#4B5563',
                      cursor: 'pointer',
                      fontSize: '0.76rem'
                    }}
                    title="Refresh Balance"
                  >
                    <RefreshCw size={12} className={loadingBalance ? 'animate-spin' : ''} />
                  </button>
                </div>

                {faucetSuccess && (
                  <div style={{
                    marginBottom: '12px',
                    fontSize: '0.74rem',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(132, 244, 59, 0.18)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(21, 128, 61, 0.25)',
                    fontWeight: 700
                  }}>
                    <Check size={14} />
                    <span>+$1,000 added to your account</span>
                  </div>
                )}

                {/* Primary Action: Enter Storefront */}
                <button
                  onClick={onEnterStorefront}
                  className="btn-pill-primary"
                  style={{ width: '100%', marginBottom: '8px', padding: '11px', fontSize: '0.88rem', fontWeight: 800 }}
                >
                  <span>Enter Storefront</span>
                  <ArrowRight size={14} />
                </button>

                {/* Sign Out */}
                <button
                  onClick={logout}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    fontWeight: 600
                  }}
                >
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom subtle note */}
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#6B7280' }}>
          Haul Commerce · Buy it. Own it. Prove it.
        </div>
      </div>

      {/* ================= SIDE 2 (RIGHT 50%): REAL STOREFRONT IMAGE + BRAND STORY ================= */}
      <div style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: '#FAFAFA'
      }}>
        {/* Real High-Resolution Architectural Storefront Image */}
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85"
          alt="Luxury Storefront Gallery"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'contrast(1.05)'
          }}
        />

        {/* Subtle gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.4) 60%, rgba(255,255,255,0.15) 100%)'
        }} />

        {/* Floating Brand Story Card */}
        <div style={{
          position: 'absolute',
          bottom: 'clamp(20px, 3.5vw, 40px)',
          left: 'clamp(20px, 3.5vw, 40px)',
          right: 'clamp(20px, 3.5vw, 40px)',
          maxWidth: '480px',
          zIndex: 10
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid #E5E7EB',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <HualIcon size={20} />
              <span className="capsule-tag" style={{ padding: '3px 10px', fontSize: '0.66rem', background: '#F3F4F6', color: '#0A0D0D', border: '1px solid #E5E7EB' }}>
                Buy it. Own it. Prove it.
              </span>
            </div>

            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#0A0D0D',
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}>
              The modern standard for physical commerce.
            </h3>

            <p style={{
              fontSize: '0.84rem',
              color: '#4B5563',
              lineHeight: 1.55,
              marginBottom: '16px'
            }}>
              Paper receipts fade, warranties get misplaced, and secondary markets lack authenticity. Haul permanently links authentic physical goods to digital ownership certificates, with built-in buyer protection until your item is collected or delivered.
            </p>

            {/* Consumer Points */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: '#1F2937',
                padding: '8px 12px',
                borderRadius: '10px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB'
              }}>
                <Lock size={14} color="#15803d" />
                <span><strong>Protected Checkout:</strong> Payments are held safely until you collect your item or confirm delivery.</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: '#1F2937',
                padding: '8px 12px',
                borderRadius: '10px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB'
              }}>
                <ShieldCheck size={14} color="#15803d" />
                <span><strong>Digital Authenticity:</strong> Official certificates of ownership and factory warranty tracking.</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: '#1F2937',
                padding: '8px 12px',
                borderRadius: '10px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB'
              }}>
                <Sparkles size={14} color="#15803d" />
                <span><strong>Instant & Frictionless:</strong> One-tap checkout with zero processing fees.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
