import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  MapPin, 
  Clock, 
  Phone, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  Sparkles,
  Save,
  Tag
} from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function EditStoreModal({ isOpen, onClose, store, onSave }) {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [category, setCategory] = useState('Footwear & Apparel');
  const [location, setLocation] = useState('Victoria Island, Lagos');
  const [fullAddress, setFullAddress] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00 AM');
  const [closingTime, setClosingTime] = useState('07:00 PM');
  const [operatingHours, setOperatingHours] = useState('Mon - Sat: 9:00 AM - 7:00 PM');
  const [phone, setPhone] = useState('+234 1 800 4825');
  const [chatRep, setChatRep] = useState('Store Lead');
  const [pickupTime, setPickupTime] = useState('Ready in 30 mins');
  const [deliveryTime, setDeliveryTime] = useState('Same-day courier');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('/assets/air_max_95.jpg');
  const [banner, setBanner] = useState('/assets/nike_store_banner.jpg');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setHandle(store.handle || '');
      setCategory(store.category || 'Footwear & Apparel');
      setLocation(store.location || 'Victoria Island, Lagos');
      setFullAddress(store.fullAddress || store.location || '');
      setOpeningTime(store.openingTime || '09:00 AM');
      setClosingTime(store.closingTime || '07:00 PM');
      setOperatingHours(store.operatingHours || 'Mon - Sat: 9:00 AM - 7:00 PM');
      setPhone(store.phone || '+234 1 800 4825');
      setChatRep(store.chatRep || `${store.name ? store.name.split(' ')[0] : 'Lead'} (Store Lead)`);
      setPickupTime(store.pickupTime || 'Ready in 30 mins');
      setDeliveryTime(store.deliveryTime || 'Same-day courier');
      setDescription(store.description || '');
      setAvatar(store.avatar || '/assets/air_max_95.jpg');
      setBanner(store.banner || '/assets/nike_store_banner.jpg');
      setSavedSuccess(false);
    }
  }, [store, isOpen]);

  if (!isOpen) return null;

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setBanner(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setAvatar(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    const updated = {
      ...store,
      name: name.trim(),
      handle: handle.trim(),
      category,
      location: location.trim(),
      fullAddress: fullAddress.trim() || location.trim(),
      openingTime: openingTime.trim(),
      closingTime: closingTime.trim(),
      operatingHours: operatingHours.trim(),
      phone: phone.trim(),
      chatRep: chatRep.trim(),
      pickupTime: pickupTime.trim(),
      deliveryTime: deliveryTime.trim(),
      description: description.trim(),
      avatar,
      banner
    };

    setTimeout(() => {
      if (onSave) onSave(updated);
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 700);
    }, 400);
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '620px',
            width: '100%',
            maxHeight: 'calc(100vh - 48px)',
            overflowY: 'auto',
            background: 'rgba(14, 20, 20, 0.88)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid rgba(132, 244, 59, 0.35)',
            borderRadius: '26px',
            padding: '28px',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(132, 244, 59, 0.15)',
            color: '#FFFFFF',
            position: 'relative',
            margin: '0 auto'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(132, 244, 59, 0.15)',
                border: '1px solid var(--brand-green-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Store size={20} color="var(--brand-green)" />
              </div>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Edit Storefront Details
                </h3>
                <div style={{ fontSize: '0.74rem', color: '#9CA3AF' }}>
                  Update location, office hours, schedule & contact info
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '6px' }}
            >
              <X size={20} />
            </button>
          </div>

          {savedSuccess ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(132, 244, 59, 0.15)',
                border: '1.5px solid var(--brand-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 0 25px rgba(132, 244, 59, 0.3)'
              }}>
                <CheckCircle2 size={36} color="var(--brand-green)" />
              </div>
              <h4 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
                Storefront Updated Successfully!
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                Your new office hours and store details are live across Hual.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Row 1: Name & Handle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Store Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Store Handle
                  </label>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: 'var(--brand-green)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Location */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                  City / Region
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Victoria Island, Lagos"
                  style={{
                    width: '100%',
                    background: '#080F0F',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Full Physical Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                  Full Physical Street Address (for Pickup & Maps)
                </label>
                <input
                  type="text"
                  required
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Plot 14B Adetokunbo Ademola St, Victoria Island, Lagos"
                  style={{
                    width: '100%',
                    background: '#080F0F',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Operating Hours Box */}
              <div style={{
                background: 'rgba(18, 28, 28, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green)', fontSize: '0.78rem', fontWeight: 800 }}>
                  <Clock size={15} />
                  <span>Store Hours & Office Schedule</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '4px' }}>
                      Opening Time
                    </label>
                    <input
                      type="text"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      placeholder="e.g. 09:00 AM"
                      style={{
                        width: '100%',
                        background: '#080F0F',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '4px' }}>
                      Closing Time
                    </label>
                    <input
                      type="text"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      placeholder="e.g. 07:00 PM"
                      style={{
                        width: '100%',
                        background: '#080F0F',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '4px' }}>
                    Office Hours & Working Days Summary
                  </label>
                  <input
                    type="text"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    placeholder="Mon - Sat: 9:00 AM - 7:00 PM • Sun: 12:00 PM - 5:00 PM"
                    style={{
                      width: '100%',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Logistics & Contact Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 801 234 5678"
                    style={{
                      width: '100%',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Pickup Readiness Window
                  </label>
                  <input
                    type="text"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    placeholder="Ready in 30 mins"
                    style={{
                      width: '100%',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Store Bio / Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                  Store Bio & Authenticity Guarantee
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Official merchant flagship on Hual..."
                  style={{
                    width: '100%',
                    background: '#080F0F',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Branding Media Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Store Logo / Avatar
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                      src={avatar} 
                      alt="Logo Preview" 
                      style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', background: '#080F0F', border: '1px solid rgba(255,255,255,0.1)' }} 
                    />
                    <label style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                      Upload Logo
                      <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Store Banner Cover
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                      src={banner} 
                      alt="Banner Preview" 
                      style={{ width: '80px', height: '44px', borderRadius: '8px', objectFit: 'cover', background: '#080F0F', border: '1px solid rgba(255,255,255,0.1)' }} 
                    />
                    <label style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                      Upload Banner
                      <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-pill-primary"
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving Store Changes...' : 'Save Store Details'}</span>
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={onClose}
                  className="btn-pill-secondary"
                  style={{ padding: '12px 20px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </ModalPortal>
  );
}
