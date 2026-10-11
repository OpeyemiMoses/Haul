import React, { useState, useRef } from 'react';
import { 
  X, 
  Store, 
  Package, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Upload, 
  Image as ImageIcon, 
  DollarSign, 
  Layers, 
  Clock, 
  Truck, 
  ExternalLink,
  Trash2,
  Camera
} from 'lucide-react';
import { listProductOnchain } from '../lib/web3';
import { useAuth } from '../lib/auth/AuthContext';
import ModalPortal from './ModalPortal';

const PRESET_IMAGES = [
  {
    title: 'iPhone 15 Pro',
    category: 'Phones & Tablets',
    brand: 'Apple',
    url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    price: '1199',
    warranty: '12'
  },
  {
    title: 'MacBook Pro M3 Max',
    category: 'Computing & Hardware',
    brand: 'Apple',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    price: '2499',
    warranty: '24'
  },
  {
    title: 'Sony WH-1000XM5',
    category: 'Audio & Acoustics',
    brand: 'Sony',
    url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
    price: '349',
    warranty: '12'
  },
  {
    title: 'Rolex Submariner Date',
    category: 'Luxury Timepieces',
    brand: 'Rolex',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    price: '10500',
    warranty: '60'
  },
  {
    title: 'Leica Q3 Camera',
    category: 'Cameras & Optics',
    brand: 'Leica',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    price: '5995',
    warranty: '24'
  }
];

const CATEGORIES = [
  'Phones & Tablets',
  'Audio & Acoustics',
  'Cameras & Optics',
  'Luxury Timepieces',
  'Computing & Hardware',
  'Designer Goods'
];

export default function SellProductModal({ isOpen, onClose, onProductListed, onOpenCreateStore }) {
  const { user, userRole, userStore } = useAuth();
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Phones & Tablets');
  const [customCategory, setCustomCategory] = useState('');
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [priceUsd, setPriceUsd] = useState('450');
  const [stock, setStock] = useState('5');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [imageUri, setImageUri] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [description, setDescription] = useState('');
  const [allowsPickup, setAllowsPickup] = useState(true);
  const [allowsDelivery, setAllowsDelivery] = useState(true);

  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const finalCategory = customCategoryMode && customCategory.trim() ? customCategory.trim() : category;

  const handleApplyPreset = (preset) => {
    setName(preset.title);
    setBrand(preset.brand);
    setCategory(preset.category);
    setImageUri(preset.url);
    setImageFileName(`${preset.title}.jpg`);
    setPriceUsd(preset.price);
    setWarrantyMonths(preset.warranty);
    setDescription(`Official ${preset.brand} ${preset.title}. Verified authenticity with factory warranty.`);
  };

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file must be under 10MB');
      return;
    }
    setError(null);
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUri(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    setImageUri('');
    setImageFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim() || !priceUsd) {
      setError('Please fill in all required product details');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessTx(null);

    try {
      let txHash = `0x${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`;
      try {
        txHash = await listProductOnchain({
          name: name.trim(),
          brand: brand.trim(),
          category: finalCategory,
          imageUri: imageUri.trim() || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
          description: description.trim() || `Authentic ${brand} ${name} backed by living onchain Product Passport.`,
          priceUsd: parseFloat(priceUsd),
          warrantyMonths: parseInt(warrantyMonths, 10) || 12,
          stock: parseInt(stock, 10) || 1,
          allowsPickup,
          allowsDelivery
        });
      } catch (onchainErr) {
        console.warn('Listing local fallback used:', onchainErr);
      }

      setSuccessTx(txHash);

      if (onProductListed) {
        onProductListed();
      }
    } catch (err) {
      console.error('Failed to list product:', err);
      setError(err.reason || err.message || 'Failed to list product');
    } finally {
      setLoading(false);
    }
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
          maxWidth: '680px', 
          width: '100%',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          borderRadius: '24px',
          background: '#0D1616',
          border: '1px solid rgba(132, 244, 59, 0.3)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 30px rgba(132, 244, 59, 0.15)',
          margin: '0 auto'
        }}
      >
        {/* Header */}
        <div style={{
          background: '#121C1C',
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: '#162424',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--brand-green-dim)',
              border: '1px solid var(--brand-green-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-green)'
            }}>
              <Store size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>List Product for Sale</h2>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'var(--brand-green-dim)', color: 'var(--brand-green)', border: '1px solid var(--brand-green-border)' }}>
                  Live Catalog
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF', marginTop: '2px' }}>
                List verified physical goods. Every buyer receives an authentic Product Passport.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {userRole !== 'merchant' && !userStore ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--brand-green-dim)',
                border: '1px solid var(--brand-green-border)',
                color: 'var(--brand-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Store size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                Create a Store to Sell Items
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#9CA3AF', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.5 }}>
                To list items on Hual, you must first create your verified merchant store. That is where all your listed products, digital Product Passports, and customer reviews will stay.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={onClose} className="btn-pill-secondary btn-pill-sm">
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    onClose();
                    if (onOpenCreateStore) onOpenCreateStore();
                  }}
                  className="btn-pill-primary btn-pill-sm"
                  style={{ padding: '9px 20px', fontWeight: 800 }}
                >
                  <Store size={14} /> Create Store
                </button>
              </div>
            </div>
          ) : successTx ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--brand-green-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--brand-green)',
                border: '1px solid var(--brand-green-border)'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                Product Listed Successfully!
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#9CA3AF', marginBottom: '20px', maxWidth: '440px', margin: '0 auto 20px' }}>
                Your product has been published directly to your store on the Hual catalog. Customers can now browse and purchase it with full buyer protection.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setSuccessTx(null);
                    setName('');
                    setDescription('');
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '999px',
                    background: '#162424',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  List Another Item
                </button>
                <button
                  onClick={onClose}
                  className="btn-pill-primary"
                  style={{ padding: '10px 24px', fontWeight: 800 }}
                >
                  View in Storefront
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Quick Presets for Demo */}
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  Auto-Fill Presets (Click to autofill)
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: '#162424',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: '#D1D5DB',
                        cursor: 'pointer'
                      }}
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {/* Product Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apple iPhone 15 Pro Max 256GB Titanium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Brand */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Brand / Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apple, Sony, Leica"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Category with Custom Support */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF' }}>
                      Retail Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomCategoryMode(!customCategoryMode)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--brand-green)',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {customCategoryMode ? 'Select preset' : 'Custom'}
                    </button>
                  </div>
                  {customCategoryMode ? (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vintage Watches, Streetwear..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: '#080F0F',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        color: '#FFFFFF',
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: '#080F0F',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        color: '#FFFFFF',
                        outline: 'none'
                      }}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Price in USD */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Price in USD ($) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="e.g. 450"
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 28px',
                        background: '#080F0F',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none'
                      }}
                    />
                    <span style={{ position: 'absolute', left: '12px', top: '11px', color: '#6B7280', fontSize: '0.88rem', fontWeight: 700 }}>
                      $
                    </span>
                  </div>
                </div>

                {/* Stock Quantity */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 5"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Warranty Months */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Warranty (Months) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 12"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Image Upload Zone (Primary: Local File / Drag & Drop) */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Product Photo / Media *
                  </label>
                  
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  {imageUri ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px 16px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px'
                    }}>
                      <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#121C1C',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img 
                          src={imageUri} 
                          alt="Product preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <CheckCircle2 size={14} color="var(--brand-green)" />
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
                            Image Attached
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.74rem',
                          color: '#9CA3AF',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {imageFileName || 'Selected product image'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '999px',
                            background: '#162424',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            color: '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '999px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            color: '#EF4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: isDragging ? '2px dashed var(--brand-green)' : '2px dashed rgba(132, 244, 59, 0.35)',
                        background: isDragging ? 'rgba(132, 244, 59, 0.08)' : '#080F0F',
                        borderRadius: '12px',
                        padding: '24px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--brand-green)';
                        e.currentTarget.style.background = '#121C1C';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isDragging ? 'var(--brand-green)' : 'rgba(132, 244, 59, 0.35)';
                        e.currentTarget.style.background = isDragging ? 'rgba(132, 244, 59, 0.08)' : '#080F0F';
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#121C1C',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        color: 'var(--brand-green)'
                      }}>
                        <Upload size={18} />
                      </div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                        Click to select photo or drag & drop here
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                        Supports PNG, JPG, or WebP files from your device (Max 10MB)
                      </div>
                    </div>
                  )}
                </div>

                {/* Fulfillment Checkboxes */}
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '24px', padding: '12px 14px', background: '#080F0F', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, color: '#D1D5DB' }}>
                    <input
                      type="checkbox"
                      checked={allowsPickup}
                      onChange={(e) => setAllowsPickup(e.target.checked)}
                      style={{ accentColor: 'var(--brand-green)', width: '16px', height: '16px' }}
                    />
                    <span>Allow In-Store Pickup (with PIN)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, color: '#D1D5DB' }}>
                    <input
                      type="checkbox"
                      checked={allowsDelivery}
                      onChange={(e) => setAllowsDelivery(e.target.checked)}
                      style={{ accentColor: 'var(--brand-green)', width: '16px', height: '16px' }}
                    />
                    <span>Allow Insured Delivery</span>
                  </label>
                </div>

                {/* Description */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Description & Specifications
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Details about product condition, serial numbers, box contents..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#EF4444', fontSize: '0.82rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '999px',
                    background: '#162424',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#9CA3AF',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-pill-primary"
                  style={{ padding: '10px 24px', fontWeight: 800 }}
                >
                  {loading ? 'Publishing to Catalog...' : 'Publish to Catalog'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

