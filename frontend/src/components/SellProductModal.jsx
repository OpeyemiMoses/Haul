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
  Camera,
  Tag,
  Check,
  Plus,
  Zap
} from 'lucide-react';
import { listProductOnchain } from '../lib/web3';
import { useAuth } from '../lib/auth/AuthContext';
import ModalPortal from './ModalPortal';

// Preset high-res demo items across distinct categories
const PRESET_ITEMS = [
  {
    title: 'Nike Air Max 95 OG Neon',
    category: 'Shoes & Footwear',
    brand: 'Nike',
    url: '/assets/air_max_95.jpg',
    price: '185',
    stock: '6',
    warranty: '12',
    sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'],
    color: 'Black / Neon Yellow / Cool Grey',
    condition: 'Brand New In Box (Deadstock)',
    description: 'Iconic Sergio Lozano design featuring human anatomy inspired gradient panels and dual visible Air cushioning pods. Verified authentic with Monad Product Passport.'
  },
  {
    title: 'Essentials Fear of God Heavyweight Hoodie',
    category: 'Clothing & Apparel',
    brand: 'Fear of God',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
    price: '135',
    stock: '8',
    warranty: '6',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: 'Washed Vintage Black',
    condition: 'Brand New with Tags',
    description: 'Custom 480 GSM fleece with dropped shoulders, oversized boxy silhouette, rubberized back logo patch, and ribbed hem. Certified authentic luxury streetwear.'
  },
  {
    title: 'Apple iPhone 15 Pro Max 256GB',
    category: 'Phones & Mobile Devices',
    brand: 'Apple',
    url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    price: '1199',
    stock: '4',
    warranty: '24',
    storage: '256GB',
    color: 'Natural Titanium',
    condition: 'Brand New Factory Sealed',
    description: 'Grade 5 aerospace titanium design with A17 Pro chip, Action button, and 5x optical telephoto lens. Includes 24-month manufacturer and retailer warranty.'
  },
  {
    title: 'MacBook Pro 16-inch M3 Max',
    category: 'Computing & Hardware',
    brand: 'Apple',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    price: '3499',
    stock: '3',
    warranty: '24',
    storage: '1TB SSD',
    color: 'Space Black',
    condition: 'Brand New Factory Sealed',
    description: '16-core CPU, 40-core GPU, 48GB unified memory, Liquid Retina XDR display with ProMotion. Official flagship stock with Monad escrow protection.'
  },
  {
    title: 'Rolex Submariner Date 41mm',
    category: 'Watches & Luxury Timepieces',
    brand: 'Rolex',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    price: '14200',
    stock: '1',
    warranty: '60',
    color: 'Black Sunburst / Cerachrom',
    condition: 'Unworn Full Set (2025 Card)',
    description: 'Oystersteel reference with Calibre 3235 automatic movement, unidirectional rotating bezel, and Chromalight display. Complete box, papers, and NFC tag.'
  },
  {
    title: 'Sony WH-1000XM5 Wireless Headphones',
    category: 'Audio & Electronics',
    brand: 'Sony',
    url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
    price: '399',
    stock: '5',
    warranty: '12',
    color: 'Silver Platinum',
    condition: 'Brand New Sealed',
    description: 'Industry-leading noise cancellation with two processors and 8 microphones, LDAC Hi-Res audio, and 30-hour battery life.'
  }
];

const CATEGORIES = [
  'Shoes & Footwear',
  'Clothing & Apparel',
  'Phones & Mobile Devices',
  'Computing & Hardware',
  'Watches & Luxury Timepieces',
  'Audio & Electronics',
  'Bags & Luxury Accessories',
  'General Merchandise / Other'
];

// Category size templates
const FOOTWEAR_SIZES = ['EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45', 'EU 46', 'EU 47'];
const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size'];
const PHONE_STORAGES = ['64GB', '128GB', '256GB', '512GB', '1TB'];
const COMPUTER_CONFIGS = ['16GB / 512GB', '18GB / 512GB', '36GB / 1TB', '64GB / 2TB', '128GB / 4TB'];
const WATCH_SIZES = ['36mm', '39mm', '40mm', '41mm', '42mm', '44mm'];

export default function SellProductModal({ 
  isOpen, 
  onClose, 
  onProductListed, 
  onOpenCreateStore,
  productToEdit = null,
  onProductUpdated = null
}) {
  const { user, userRole, userStore } = useAuth();
  
  // Basic Info
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Shoes & Footwear');
  const [customCategory, setCustomCategory] = useState('');
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [priceUsd, setPriceUsd] = useState('185');
  const [stock, setStock] = useState('5');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [description, setDescription] = useState('');
  
  // Category-Specific Dynamic Options
  const [selectedSizes, setSelectedSizes] = useState(['EU 41', 'EU 42', 'EU 43', 'EU 44']);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [color, setColor] = useState('');
  const [condition, setCondition] = useState('Brand New In Box');
  const [storage, setStorage] = useState('256GB');
  const [material, setMaterial] = useState('');
  const [fit, setFit] = useState('Regular Fit');
  const [caseDiameter, setCaseDiameter] = useState('41mm');
  const [movement, setMovement] = useState('Automatic');
  const [processor, setProcessor] = useState('');
  const [boxAndPapers, setBoxAndPapers] = useState('Full Set (Box & Papers)');

  // Media
  const [imageUri, setImageUri] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Fulfillment
  const [allowsPickup, setAllowsPickup] = useState(true);
  const [allowsDelivery, setAllowsDelivery] = useState(true);

  // Status
  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState(null);
  const [error, setError] = useState(null);

  // Prepopulate if editing
  React.useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setBrand(productToEdit.brand || '');
      setCategory(productToEdit.category || 'Shoes & Footwear');
      setPriceUsd(productToEdit.priceUsd ? String(productToEdit.priceUsd) : '185');
      setStock(productToEdit.stock !== undefined ? String(productToEdit.stock) : '1');
      setWarrantyMonths(productToEdit.warrantyMonths ? String(productToEdit.warrantyMonths) : '12');
      setDescription(productToEdit.description || '');
      setImageUri(productToEdit.imageUri || productToEdit.images?.[0] || '');
      setImageFileName(productToEdit.name ? `${productToEdit.name}.jpg` : '');
      if (productToEdit.sizes && Array.isArray(productToEdit.sizes)) {
        setSelectedSizes(productToEdit.sizes);
      }
      if (productToEdit.color) setColor(productToEdit.color);
      if (productToEdit.condition) setCondition(productToEdit.condition);
      if (productToEdit.storage) setStorage(productToEdit.storage);
      if (productToEdit.specs?.material) setMaterial(productToEdit.specs.material);
      if (productToEdit.specs?.fit) setFit(productToEdit.specs.fit);
      if (productToEdit.specs?.processor) setProcessor(productToEdit.specs.processor);
      if (productToEdit.allowsPickup !== undefined) setAllowsPickup(productToEdit.allowsPickup);
      if (productToEdit.allowsDelivery !== undefined) setAllowsDelivery(productToEdit.allowsDelivery);
    } else {
      setName('');
      setBrand('');
      setCategory('Shoes & Footwear');
      setPriceUsd('185');
      setStock('5');
      setWarrantyMonths('12');
      setDescription('');
      setImageUri('');
      setImageFileName('');
      setSelectedSizes(['EU 41', 'EU 42', 'EU 43', 'EU 44']);
      setColor('');
      setCondition('Brand New In Box');
      setAllowsPickup(true);
      setAllowsDelivery(true);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const finalCategory = customCategoryMode && customCategory.trim() ? customCategory.trim() : category;

  // Handle Preset Autofill
  const handleApplyPreset = (preset) => {
    setName(preset.title);
    setBrand(preset.brand);
    setCategory(preset.category);
    setImageUri(preset.url);
    setImageFileName(`${preset.title}.jpg`);
    setPriceUsd(preset.price);
    setStock(preset.stock || '5');
    setWarrantyMonths(preset.warranty);
    setDescription(preset.description);
    if (preset.sizes) setSelectedSizes(preset.sizes);
    if (preset.color) setColor(preset.color);
    if (preset.condition) setCondition(preset.condition);
    if (preset.storage) setStorage(preset.storage);
  };

  // Toggle size chips
  const toggleSize = (sz) => {
    setSelectedSizes(prev => 
      prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]
    );
  };

  const handleAddCustomSize = () => {
    if (customSizeInput.trim() && !selectedSizes.includes(customSizeInput.trim())) {
      setSelectedSizes(prev => [...prev, customSizeInput.trim()]);
      setCustomSizeInput('');
    }
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
    if (file) processImageFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageUri('');
    setImageFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim() || !priceUsd) {
      setError('Please fill in product name, brand, and price');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessTx(null);

    try {
      // Format applicable sizes and options based on category
      const isFootwear = finalCategory === 'Shoes & Footwear';
      const isApparel = finalCategory === 'Clothing & Apparel';
      const hasSizes = (isFootwear || isApparel) && selectedSizes.length > 0;

      if (productToEdit) {
        const updatedProduct = {
          ...productToEdit,
          name: name.trim(),
          brand: brand.trim(),
          category: finalCategory,
          sizes: hasSizes ? selectedSizes : null,
          color: color.trim() || null,
          condition: condition.trim() || 'Brand New',
          storage: finalCategory.includes('Phone') || finalCategory.includes('Computing') ? storage : null,
          specs: {
            ...(productToEdit.specs || {}),
            material: material.trim() || null,
            fit: fit.trim() || null,
            caseDiameter: finalCategory.includes('Watch') ? caseDiameter : null,
            movement: finalCategory.includes('Watch') ? movement : null,
            boxAndPapers: finalCategory.includes('Watch') ? boxAndPapers : null,
            processor: processor.trim() || null
          },
          imageUri: imageUri.trim() || productToEdit.imageUri || '/assets/air_max_95.jpg',
          images: [imageUri.trim() || productToEdit.imageUri || '/assets/air_max_95.jpg'],
          description: description.trim() || productToEdit.description,
          priceUsd: parseFloat(priceUsd),
          priceUsdCents: Math.round(parseFloat(priceUsd) * 100),
          warrantyDurationSeconds: (parseInt(warrantyMonths, 10) || 12) * 30 * 24 * 3600,
          warrantyMonths: parseInt(warrantyMonths, 10) || 12,
          stock: parseInt(stock, 10) || 1,
          merchant: userStore?.name || productToEdit.merchant || user?.name || 'Verified Merchant',
          merchantId: userStore?.id || productToEdit.merchantId || 'user-store',
          merchantLocation: userStore?.location || productToEdit.merchantLocation || 'Victoria Island, Lagos',
          merchantAvatar: userStore?.avatar || userStore?.logo || productToEdit.merchantAvatar || '/assets/air_max_95.jpg',
          storeAvatar: userStore?.avatar || userStore?.logo || productToEdit.storeAvatar || '/assets/air_max_95.jpg',
          storeImage: userStore?.avatar || userStore?.banner || productToEdit.storeImage || '/assets/nike_store_banner.jpg',
          seller: user?.address || productToEdit.seller || null,
          ownerAddress: user?.address || productToEdit.ownerAddress || null,
          allowsPickup,
          allowsDelivery
        };

        try {
          const existing = JSON.parse(localStorage.getItem('hual_custom_listed_products') || '[]');
          const updatedList = existing.map(p => 
            (String(p.id) === String(productToEdit.id) || String(p.productId) === String(productToEdit.productId)) ? updatedProduct : p
          );
          localStorage.setItem('hual_custom_listed_products', JSON.stringify(updatedList));
        } catch {}

        setSuccessTx(productToEdit.txHash || productToEdit.monadTxHash || 'updated');
        if (onProductUpdated) {
          onProductUpdated(updatedProduct);
        }
        return;
      }

      // New product onchain listing with verified transaction execution
      const txHash = await listProductOnchain({
        name: name.trim(),
        brand: brand.trim(),
        category: finalCategory,
        imageUri: imageUri.trim() || '/assets/air_max_95.jpg',
        description: description.trim() || `Authentic ${brand} ${name} backed by living onchain Product Passport.`,
        priceUsd: parseFloat(priceUsd),
        warrantyMonths: parseInt(warrantyMonths, 10) || 12,
        stock: parseInt(stock, 10) || 1,
        allowsPickup,
        allowsDelivery
      });

      const newProduct = {
        id: Date.now(),
        productId: Date.now(),
        name: name.trim(),
        brand: brand.trim(),
        category: finalCategory,
        sizes: hasSizes ? selectedSizes : null,
        color: color.trim() || null,
        condition: condition.trim() || 'Brand New',
        storage: finalCategory.includes('Phone') || finalCategory.includes('Computing') ? storage : null,
        specs: {
          material: material.trim() || null,
          fit: fit.trim() || null,
          caseDiameter: finalCategory.includes('Watch') ? caseDiameter : null,
          movement: finalCategory.includes('Watch') ? movement : null,
          boxAndPapers: finalCategory.includes('Watch') ? boxAndPapers : null,
          processor: processor.trim() || null
        },
        imageUri: imageUri.trim() || '/assets/air_max_95.jpg',
        images: [imageUri.trim() || '/assets/air_max_95.jpg'],
        description: description.trim() || `Authentic ${brand} ${name} backed by living onchain Product Passport.`,
        priceUsd: parseFloat(priceUsd),
        priceUsdCents: Math.round(parseFloat(priceUsd) * 100),
        warrantyDurationSeconds: (parseInt(warrantyMonths, 10) || 12) * 30 * 24 * 3600,
        warrantyMonths: parseInt(warrantyMonths, 10) || 12,
        stock: parseInt(stock, 10) || 1,
        merchant: userStore?.name || user?.name || 'Verified Merchant',
        merchantId: userStore?.id || 'user-store',
        merchantLocation: userStore?.location || 'Victoria Island, Lagos',
        merchantAvatar: userStore?.avatar || userStore?.logo || '/assets/air_max_95.jpg',
        storeAvatar: userStore?.avatar || userStore?.logo || '/assets/air_max_95.jpg',
        storeImage: userStore?.avatar || userStore?.banner || '/assets/nike_store_banner.jpg',
        seller: user?.address || null,
        ownerAddress: user?.address || null,
        onchain: true,
        txHash: txHash,
        monadTxHash: txHash,
        allowsPickup,
        allowsDelivery,
        active: true,
        rating: 5.0,
        reviewsCount: 1
      };

      try {
        const existing = JSON.parse(localStorage.getItem('hual_custom_listed_products') || '[]');
        localStorage.setItem('hual_custom_listed_products', JSON.stringify([newProduct, ...existing]));
      } catch {}

      setSuccessTx(txHash);

      if (onProductListed) {
        onProductListed(newProduct);
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
          maxWidth: '720px', 
          width: '100%',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          borderRadius: '24px',
          background: '#0D1616',
          border: '1px solid rgba(132, 244, 59, 0.3)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 30px rgba(132, 244, 59, 0.15)',
          margin: '0 auto'
        }}
      >
        {/* Header */}
        <div style={{
          background: '#121C1C',
          padding: '24px 28px',
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
              <Package size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {productToEdit ? 'Edit Store Listing' : 'List Any Item for Sale'}
                </h2>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'var(--brand-green-dim)', color: 'var(--brand-green)', border: '1px solid var(--brand-green-border)' }}>
                  {productToEdit ? 'Edit Mode' : 'Onchain Catalog'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF', marginTop: '3px' }}>
                {productToEdit 
                  ? 'Update product pricing, stock availability, specifications, and fulfillment options.'
                  : 'Pick a category to customize options (sizes, color, stock left, condition) for this item.'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px' }}>
          {userRole !== 'merchant' && !userStore ? (
            <div style={{ textAlign: 'center', padding: '36px 16px' }}>
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
                Create a Store to List Items
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#9CA3AF', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.5 }}>
                To sell items on Haul, create your store first. Once you list at least 1 item, your store gains the official <strong>Verified Store Pass</strong>!
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
            <div style={{ textAlign: 'center', padding: '32px 10px' }}>
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
              <p style={{ fontSize: '0.88rem', color: '#9CA3AF', marginBottom: '16px', maxWidth: '460px', margin: '0 auto 16px' }}>
                Your item has been published onchain to Monad and synced to your storefront and the marketplace.
              </p>

              {successTx && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 16px',
                  background: 'rgba(132, 244, 59, 0.08)',
                  border: '1px solid var(--brand-green-border)',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  color: 'var(--brand-green)',
                  fontFamily: 'var(--font-mono, monospace)',
                  marginBottom: '24px'
                }}>
                  <Zap size={13} />
                  <span>Monad Tx: {String(successTx).slice(0, 10)}...{String(successTx).slice(-8)}</span>
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${successTx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--brand-green)', display: 'flex', alignItems: 'center' }}
                    title="View on Monad Explorer"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

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
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* STEP 1: ITEM CATEGORY PICKER */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '16px',
                background: '#080F0F',
                border: '1px solid rgba(132, 244, 59, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1. Item Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomCategoryMode(!customCategoryMode)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand-green)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {customCategoryMode ? 'Select from list' : '+ Custom Category'}
                  </button>
                </div>

                {customCategoryMode ? (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vintage Streetwear, Collectibles, Gaming Hardware..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#121C1C',
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
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCategory(newCat);
                      if (newCat === 'Shoes & Footwear') {
                        setSelectedSizes(['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44']);
                      } else if (newCat === 'Clothing & Apparel') {
                        setSelectedSizes(['S', 'M', 'L', 'XL']);
                      } else {
                        setSelectedSizes([]);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#121C1C',
                      border: '1px solid var(--brand-green)',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* STEP 2: CORE DETAILS (NAME, BRAND, PRICE, STOCK LEFT) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {/* Product Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nike Dunk Low Retro 'Panda' or Apple iPhone 15 Pro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Brand / Designer */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                    Brand / Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nike, Apple, Fear of God, Sony"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Units Left / Stock ("how many its left") */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF' }}>
                      Units Left (Stock) *
                    </label>
                    <span style={{ fontSize: '0.68rem', color: parseInt(stock, 10) <= 3 ? '#F59E0B' : 'var(--brand-green)', fontWeight: 700 }}>
                      {parseInt(stock, 10) <= 3 ? 'Low Stock Warning' : `${stock} Units Available`}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 5"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Price USD */}
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
                      placeholder="e.g. 185"
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 28px',
                        background: '#080F0F',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--brand-green)',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none'
                      }}
                    />
                    <span style={{ position: 'absolute', left: '12px', top: '11px', color: '#6B7280', fontSize: '0.88rem', fontWeight: 700 }}>
                      $
                    </span>
                  </div>
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
                      padding: '11px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* STEP 3: DYNAMIC CATEGORY-SPECIFIC OPTIONS */}
              <div style={{
                padding: '18px',
                borderRadius: '16px',
                background: '#0A1212',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={14} />
                  <span>Applicable Options for {finalCategory}</span>
                </div>

                {/* A: FOOTWEAR OPTIONS */}
                {finalCategory === 'Shoes & Footwear' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>
                        Shoe Sizes in Stock (Click to toggle sizes):
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {FOOTWEAR_SIZES.map(sz => {
                          const active = selectedSizes.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => toggleSize(sz)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                background: active ? 'var(--brand-green)' : '#162424',
                                color: active ? '#080F0F' : '#FFFFFF',
                                border: active ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Size Adder */}
                      <div style={{ display: 'flex', gap: '8px', maxWidth: '300px' }}>
                        <input
                          type="text"
                          placeholder="Add custom size (e.g. US 10.5)"
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '6px 12px',
                            background: '#080F0F',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            color: '#FFFFFF'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSize}
                          className="btn-pill-secondary btn-pill-sm"
                          style={{ padding: '6px 12px' }}
                        >
                          <Plus size={12} /> Add
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                          Colorway / Color
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Triple Black, White/Gym Red"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                          Shoe Condition
                        </label>
                        <select
                          value={condition}
                          onChange={(e) => setCondition(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                        >
                          <option value="Brand New In Box (Deadstock)">Brand New In Box (Deadstock)</option>
                          <option value="Brand New (No Box)">Brand New (No Box)</option>
                          <option value="VNDS / Like New (Authenticated)">VNDS / Like New (Authenticated)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* B: CLOTHING & APPAREL OPTIONS */}
                {finalCategory === 'Clothing & Apparel' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>
                        Available Clothing Sizes:
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {APPAREL_SIZES.map(sz => {
                          const active = selectedSizes.includes(sz);
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => toggleSize(sz)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                background: active ? 'var(--brand-green)' : '#162424',
                                color: active ? '#080F0F' : '#FFFFFF',
                                border: active ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                          Color / Shade
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Washed Black, Navy"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                          Fabric / Material
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 100% Cotton, Fleece"
                          value={material}
                          onChange={(e) => setMaterial(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                          Fit / Cut
                        </label>
                        <select
                          value={fit}
                          onChange={(e) => setFit(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                        >
                          <option value="Regular Fit">Regular Fit</option>
                          <option value="Oversized Boxy Fit">Oversized Boxy Fit</option>
                          <option value="Slim Tailored">Slim Tailored</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* C: PHONES & MOBILE DEVICES */}
                {finalCategory === 'Phones & Mobile Devices' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                        Storage Capacity
                      </label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {PHONE_STORAGES.map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStorage(st)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: storage === st ? 'var(--brand-green)' : '#162424',
                              color: storage === st ? '#080F0F' : '#FFFFFF',
                              border: 'none',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                        Color / Finish
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Natural Titanium, Space Black"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                        Device Condition
                      </label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                      >
                        <option value="Brand New Factory Sealed">Brand New Factory Sealed</option>
                        <option value="Open Box (100% Battery)">Open Box (100% Battery)</option>
                        <option value="Refurbished Grade A">Refurbished Grade A</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                        SIM / Network Status
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Factory Unlocked (Dual SIM / eSIM)"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>
                )}

                {/* D: COMPUTING & HARDWARE */}
                {finalCategory === 'Computing & Hardware' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                        RAM & SSD Configuration
                      </label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {COMPUTER_CONFIGS.map(cfg => (
                          <button
                            key={cfg}
                            type="button"
                            onClick={() => setStorage(cfg)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              background: storage === cfg ? 'var(--brand-green)' : '#162424',
                              color: storage === cfg ? '#080F0F' : '#FFFFFF',
                              border: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {cfg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                        Color / Finish
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Space Black, Silver"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>
                )}

                {/* E: WATCHES & TIMEPIECES */}
                {finalCategory === 'Watches & Luxury Timepieces' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                        Case Diameter
                      </label>
                      <select
                        value={caseDiameter}
                        onChange={(e) => setCaseDiameter(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                      >
                        {WATCH_SIZES.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                        Dial & Bezel Color
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Black Sunburst, Blue"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                        Inclusions
                      </label>
                      <select
                        value={boxAndPapers}
                        onChange={(e) => setBoxAndPapers(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                      >
                        <option value="Full Set (Box & Papers)">Full Set (Box & Papers)</option>
                        <option value="Watch & Original Box">Watch & Original Box</option>
                        <option value="Watch Only (Authenticated)">Watch Only (Authenticated)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* F: GENERAL / AUDIO / ACCESSORIES */}
                {['Audio & Electronics', 'Bags & Luxury Accessories', 'General Merchandise / Other'].includes(finalCategory) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                        Color / Finish
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Matte Black, Tan Leather, Silver"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                        Condition
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Brand New Sealed, Pristine"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', background: '#080F0F', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.84rem' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 4: PHOTO / MEDIA UPLOAD */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                  Product Photo / Media *
                </label>
                
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
                          Image Ready
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
                        Change
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
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
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
                      Click to upload photo or drag & drop here
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                      PNG, JPG, or WebP (Max 10MB)
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 5: DESCRIPTION & FULFILLMENT */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px' }}>
                  Description & Seller Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your item, materials, packaging, provenance, or anything else you'd like buyers to know..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
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

              {/* Fulfillment Checkboxes */}
              <div style={{ display: 'flex', gap: '24px', padding: '12px 14px', background: '#080F0F', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
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

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#EF4444', fontSize: '0.82rem' }}>
                  {error}
                </div>
              )}

              {/* Submit Buttons */}
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
                  {loading 
                    ? (productToEdit ? 'Saving Changes...' : 'Publishing to Catalog...') 
                    : (productToEdit ? 'Save Changes' : 'Publish to Catalog')}
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
