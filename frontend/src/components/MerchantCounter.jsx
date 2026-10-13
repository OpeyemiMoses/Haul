import React, { useState } from 'react';
import { 
  Store, 
  PackageCheck, 
  Scan, 
  CheckCircle, 
  PlusCircle, 
  ShieldCheck, 
  AlertCircle,
  Truck,
  DollarSign
} from 'lucide-react';
import { 
  markOrderReadyOnchain,
  dispatchDeliveryOnchain,
  completePickupHandoverOnchain, 
  listProductOnchain 
} from '../lib/web3';
import { toast } from '../lib/toast/ToastContext';

const CATEGORY_OPTIONS = [
  'Audio & Electronics',
  'Optics & Cameras',
  'Watches & Luxury',
  'Footwear & Apparel',
  'Accessories & EDC'
];

export default function MerchantCounter({ allPassports, onActionComplete }) {
  // Verification form state
  const [verifyOrderId, setVerifyOrderId] = useState('');
  const [verifyPIN, setVerifyPIN] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // New product form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Audio & Electronics');
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80');
  const [newProdPrice, setNewProdPrice] = useState('220');
  const [newProdWarranty, setNewProdWarranty] = useState('12');
  const [newProdStock, setNewProdStock] = useState('10');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [allowsPickup, setAllowsPickup] = useState(true);
  const [allowsDelivery, setAllowsDelivery] = useState(true);
  const [addingProduct, setAddingProduct] = useState(false);

  // Handle Mark Ready
  const handleMarkReady = async (orderId) => {
    try {
      await markOrderReadyOnchain(orderId);
      toast.success(`Order #${orderId} marked ready for pickup!`);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      toast.error('Error marking ready: ' + (err.reason || err.message));
    }
  };

  // Handle Dispatch Delivery
  const handleDispatch = async (orderId) => {
    try {
      await dispatchDeliveryOnchain(orderId);
      toast.success(`Order #${orderId} dispatched for delivery!`);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      toast.error('Error dispatching delivery: ' + (err.reason || err.message));
    }
  };

  // Handle In-Store Collection Verification
  const handleVerifyCollection = async (e) => {
    e.preventDefault();
    if (!verifyOrderId || !verifyPIN) return;
    setVerifying(true);
    setVerifyResult(null);

    try {
      const txHash = await completePickupHandoverOnchain(Number(verifyOrderId), verifyPIN);
      setVerifyResult({
        success: true,
        message: `Order #${verifyOrderId} verified! Escrow USDC released to merchant.`,
        txHash,
      });
      setVerifyOrderId('');
      setVerifyPIN('');
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setVerifyResult({
        success: false,
        message: err.message.includes('Invalid customer pickup PIN')
          ? 'Cryptographic verification failed: Invalid customer PIN!'
          : (err.reason || err.message),
      });
    } finally {
      setVerifying(false);
    }
  };

  // Handle Add Product Onchain
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAddingProduct(true);
    try {
      await listProductOnchain({
        name: newProdName,
        brand: newProdBrand,
        category: newProdCategory,
        imageUri: newProdImage,
        description: newProdDesc || `${newProdBrand} authentic product with onchain passport.`,
        priceUsd: parseFloat(newProdPrice),
        warrantyMonths: parseInt(newProdWarranty, 10),
        stock: parseInt(newProdStock, 10),
        allowsPickup,
        allowsDelivery,
      });

      setShowAddModal(false);
      setNewProdName('');
      setNewProdBrand('');
      setNewProdDesc('');
      toast.success('Product listed onchain successfully!');
      if (onActionComplete) onActionComplete();
    } catch (err) {
      toast.error('Failed to list product onchain: ' + (err.reason || err.message));
    } finally {
      setAddingProduct(false);
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <div className="badge badge-purple" style={{ marginBottom: '6px' }}>
            <Store size={12} /> MERCHANT STORE TERMINAL
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Storefront & Counter Operations</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Stage orders, verify customer pickup PINs, dispatch deliveries, and add inventory across categories.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <PlusCircle size={16} />
          List New Product Onchain
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '36px' }}>
        {/* Verification Terminal Card */}
        <div className="glass-panel" style={{ padding: '24px', background: '#121520' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Scan size={20} color="#836ef9" />
            <h3 style={{ fontSize: '1.15rem' }}>Counter Handover Verifier</h3>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            When a customer arrives for pickup, enter their Order ID and 4-digit PIN. The contract verifies the hash onchain, transfers the escrowed USDC into your merchant wallet, and advances the passport to COLLECTED.
          </p>

          <form onSubmit={handleVerifyCollection}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  ORDER ID
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={verifyOrderId}
                  onChange={(e) => setVerifyOrderId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  CUSTOMER PIN
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 4921"
                  value={verifyPIN}
                  onChange={(e) => setVerifyPIN(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    letterSpacing: '0.15em',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <PackageCheck size={16} />
              {verifying ? 'Verifying PIN...' : 'Verify PIN & Complete Handover'}
            </button>
          </form>

          {verifyResult && (
            <div style={{
              marginTop: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: verifyResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${verifyResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              fontSize: '0.8rem',
              color: verifyResult.success ? '#34d399' : '#fb7185'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                {verifyResult.success ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {verifyResult.message}
              </div>
              {verifyResult.txHash && (
                <div style={{ marginTop: '4px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  TX: {verifyResult.txHash.slice(0, 20)}...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Orders & Escrow Pipeline */}
        <div className="glass-panel" style={{ padding: '24px', background: '#121520' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Store Orders & Escrow Pipeline</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Track orders through packaging, dispatch, and escrow settlement.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
            {allPassports.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                No active orders yet.
              </div>
            ) : (
              allPassports.map((pass) => (
                <div key={pass.tokenId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem'
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      Passport #{pass.tokenId} · {pass.productName}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                      ${pass.originalPriceUsd.toFixed(2)} USDC · {pass.purchaseTimestamp}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      color: pass.currentState === 'COLLECTED' ? '#34d399' : pass.currentState === 'READY_FOR_PICKUP' ? '#fbbf24' : '#a78bfa',
                      fontWeight: 700
                    }}>
                      {pass.currentState}
                    </span>

                    {pass.currentState === 'PAID' && (
                      <button
                        onClick={() => handleMarkReady(pass.tokenId)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                      >
                        Set Ready
                      </button>
                    )}

                    {pass.currentState === 'PAID' && (
                      <button
                        onClick={() => handleDispatch(pass.tokenId)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                      >
                        <Truck size={12} /> Dispatch
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal with E-Commerce Categories */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '540px',
            width: '100%',
            padding: '32px',
            background: '#121520'
          }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>List New Product</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Stores product specifications, category, inventory, and factory warranty coverage.
            </p>

            <form onSubmit={handleAddProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    PRODUCT NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bang & Olufsen Beoplay H95"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    BRAND / CREATOR
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bang & Olufsen"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  CATEGORY
                </label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: '#0a0c12',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat} style={{ background: '#121520' }}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    PRICE (USDC)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    WARRANTY (MO)
                  </label>
                  <input
                    type="number"
                    required
                    value={newProdWarranty}
                    onChange={(e) => setNewProdWarranty(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    STOCK
                  </label>
                  <input
                    type="number"
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  IMAGE URL
                </label>
                <input
                  type="url"
                  required
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  placeholder="Product specs & digital warranty details..."
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allowsPickup}
                    onChange={(e) => setAllowsPickup(e.target.checked)}
                    style={{ accentColor: '#836ef9' }}
                  />
                  <span>Allows In-Store Pickup</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allowsDelivery}
                    onChange={(e) => setAllowsDelivery(e.target.checked)}
                    style={{ accentColor: '#836ef9' }}
                  />
                  <span>Allows Delivery Shipping</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingProduct}
                  className="btn btn-primary"
                  style={{ flex: 1.5 }}
                >
                  {addingProduct ? 'Adding Product...' : 'List Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
