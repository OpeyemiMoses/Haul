import React, { useState } from 'react';
import { 
  X, 
  Store, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Upload, 
  Image as ImageIcon, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import ModalPortal from './ModalPortal';

const DEFAULT_BANNER = '/assets/nike_store_banner.jpg';
const DEFAULT_LOGO = '/assets/air_max_95.jpg';

export default function CreateStoreModal({ isOpen, onClose, onStoreCreated, onNavigateToSignIn }) {
  const { user, userLocation, createStore, authenticated } = useAuth();

  const [storeName, setStoreName] = useState('');
  const [handle, setHandle] = useState('');
  const [location, setLocation] = useState(userLocation || 'Victoria Island, Lagos');
  const [fullAddress, setFullAddress] = useState('');
  const [selectedBanner, setSelectedBanner] = useState(DEFAULT_BANNER);
  const [selectedLogo, setSelectedLogo] = useState(DEFAULT_LOGO);
  const [description, setDescription] = useState('Authorized boutique offering authenticated merchandise with verifiable digital Product Passports on Monad.');
  const [pickupTime, setPickupTime] = useState('Ready in 30 mins');
  const [openingTime, setOpeningTime] = useState('09:00 AM');
  const [closingTime, setClosingTime] = useState('07:00 PM');
  const [operatingHours, setOperatingHours] = useState('Mon - Sat: 9:00 AM - 7:00 PM');
  const [phone, setPhone] = useState('+234 1 800 4825');
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Handle image upload directly from user's device
  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Banner image size must be under 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedBanner(event.target.result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo image size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedLogo(event.target.result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!authenticated || !user) {
      setError('You must sign in with Privy to create a store.');
      return;
    }
    if (!storeName.trim()) {
      setError('Please enter a store name.');
      return;
    }

    setLaunching(true);
    setError(null);
    try {
      const cleanHandle = handle.trim() ? handle.trim() : `@${storeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.hual`;
      const storeObj = createStore({
        name: storeName.trim(),
        handle: cleanHandle,
        category: 'General Store',
        location,
        fullAddress: fullAddress.trim() ? fullAddress.trim() : (location || userLocation),
        avatar: selectedLogo,
        banner: selectedBanner,
        description: description.trim(),
        pickupTime: pickupTime.trim(),
        deliveryTime: 'Same-day courier',
        openingTime: openingTime.trim(),
        closingTime: closingTime.trim(),
        operatingHours: operatingHours.trim(),
        phone: phone.trim()
      });

      setTimeout(() => {
        setLaunching(false);
        if (onStoreCreated) onStoreCreated(storeObj);
        if (onClose) onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to create store.');
      setLaunching(false);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
      <div 
        className="custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '600px',
          width: '100%',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          background: 'rgba(14, 20, 20, 0.78)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '26px',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 30px 80px rgba(0, 0, 0, 0.85)',
          color: '#FFFFFF',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Sora', sans-serif",
          position: 'relative',
          margin: '0 auto'
        }}
      >
        {/* Apple Frosted Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'rgba(14, 20, 20, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <Store size={16} color="var(--brand-green)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Open Merchant Storefront
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              Upload your store image background from your device and set your location.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* If user is not authenticated via Privy, gate store creation */}
        {!authenticated || !user ? (
          <div style={{ padding: '36px 24px', textAlign: 'center' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(132, 244, 59, 0.1)',
              border: '1px solid var(--brand-green-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Lock size={22} color="var(--brand-green)" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px' }}>
              Authentication Required
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', maxWidth: '380px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              You must create an account and sign in through Privy before you can open a store and list products.
            </p>
            <button
              onClick={() => {
                if (onClose) onClose();
                if (onNavigateToSignIn) onNavigateToSignIn();
              }}
              className="btn-pill-primary"
              style={{ fontWeight: 800, padding: '9px 24px' }}
            >
              Sign In with Privy
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '22px 24px' }}>
            {error && (
              <div style={{
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#FCA5A5',
                fontSize: '0.74rem',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            {/* 1. STORE IMAGE BACKGROUND (DEVICE PICKER ONLY - NO URLS) */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Store Image Background
                </label>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                  Device file upload
                </span>
              </div>

              {/* Live Banner Preview */}
              <div style={{
                width: '100%',
                height: '140px',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                marginBottom: '10px',
                background: '#040707',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2)'
              }}>
                <img 
                  src={selectedBanner} 
                  alt="Store Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(6, 10, 10, 0.15) 0%, rgba(6, 10, 10, 0.85) 100%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '14px 16px',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#080F0F',
                    border: '1.5px solid var(--brand-green)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <img src={selectedLogo} alt="Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF' }}>
                      {storeName.trim() || 'Storefront Preview'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--brand-green)', fontWeight: 600 }}>
                      {location}
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Image Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <div>
                  <input
                    type="file"
                    id="store-banner-file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="store-banner-file"
                    className="btn-pill-secondary"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload size={13} color="var(--brand-green)" />
                    <span>Upload Banner Image</span>
                  </label>
                </div>

                <div>
                  <input
                    type="file"
                    id="store-logo-file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="store-logo-file"
                    className="btn-pill-secondary"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <ImageIcon size={13} color="var(--brand-green)" />
                    <span>Upload Store Logo</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 2. STORE DETAILS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px', fontWeight: 600 }}>
                  Store Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lagos Luxury Sneaker Vault"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(6, 10, 10, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px', fontWeight: 600 }}>
                  Store Location (City, State, Country)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ebonyi State, Victoria Island, London, New York..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(6, 10, 10, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px', fontWeight: 600 }}>
                  Physical Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 520 Broadway, SoHo, New York or 14 Bond St, London"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(6, 10, 10, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Operating Hours & Schedule */}
              <div style={{
                background: 'rgba(18, 28, 28, 0.7)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--brand-green)', fontWeight: 800 }}>
                  <Clock size={13} />
                  <span>Opening & Closing Hours</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '2px' }}>Opening Time</label>
                    <input
                      type="text"
                      placeholder="09:00 AM"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: '#080F0F',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF',
                        fontSize: '0.76rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '2px' }}>Closing Time</label>
                    <input
                      type="text"
                      placeholder="07:00 PM"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: '#080F0F',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF',
                        fontSize: '0.76rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '2px' }}>Office Hours Summary</label>
                  <input
                    type="text"
                    placeholder="Mon - Sat: 9:00 AM - 7:00 PM"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '0.76rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px', fontWeight: 600 }}>
                  Store Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(6, 10, 10, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>
            </div>

            {/* Launch Store Button */}
            <button
              type="submit"
              disabled={launching}
              className="btn-pill-primary"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Store size={14} />
              <span>{launching ? 'Creating Store...' : 'Launch Merchant Storefront'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
