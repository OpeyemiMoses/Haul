import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  ShieldCheck, 
  Settings, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Store,
  DollarSign,
  ChevronRight
} from 'lucide-react';

export default function MerchantDashboard({ onBackToStore, onOpenSellModal, userStore, user, products = [] }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const storeName = userStore?.name || (user?.email ? user.email.split('@')[0] : 'My Merchant Portal');
  const storeLocation = userStore?.location || 'Victoria Island, Lagos';
  
  const myStoreProducts = products.filter(p => {
    if (!p) return false;
    if (userStore?.id && (String(p.merchantId) === String(userStore.id) || String(p.sellerId) === String(userStore.id))) return true;
    if (userStore?.name && (p.merchant || '').toLowerCase() === userStore.name.toLowerCase()) return true;
    if (user?.address && (p.seller || '').toLowerCase() === user.address.toLowerCase()) return true;
    return false;
  });

  const orders = [];

  return (
    <div className="page-fade-in" style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '0 0 60px' }}>
      
      {/* ================= HEADER ================= */}
      <div style={{
        background: '#0D1616',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '24px 32px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: '#080F0F',
            border: '2px solid rgba(132, 244, 59, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 900,
            color: '#FFFFFF'
          }}>
            ✓
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                {storeName}
              </h1>
              <span style={{
                background: 'var(--brand-green-dim)',
                color: 'var(--brand-green)',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid var(--brand-green-border)'
              }}>
                VERIFIED MERCHANT
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '2px' }}>
              Merchant Portal • Monad Settlement Layer • {storeLocation}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onOpenSellModal}
            className="btn-pill-primary"
            style={{ padding: '8px 20px', fontSize: '0.82rem', fontWeight: 800 }}
          >
            <PlusCircle size={14} />
            <span>List New Product</span>
          </button>
        </div>
      </div>

      {/* ================= 2-COLUMN LAYOUT (SIDEBAR + MAIN METRICS) ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
        
        {/* Left Sidebar */}
        <div style={{
          background: '#0D1616',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '16px',
          height: 'fit-content'
        }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'inventory', label: 'Inventory', icon: Store },
            { id: 'passports', label: 'Passports', icon: ShieldCheck },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: isActive ? 'var(--brand-green-dim)' : 'transparent',
                  border: isActive ? '1px solid var(--brand-green-border)' : '1px solid transparent',
                  color: isActive ? 'var(--brand-green)' : '#9CA3AF',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  marginBottom: '4px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Main Content (Screen 11 of Figma Spec) */}
        <div>
          {/* Top 3 Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
            
            {/* Today's Sales */}
            <div style={{
              background: '#0D1616',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 600 }}>Today's Sales</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--brand-green)', fontWeight: 700 }}>+18%</span>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                $2,490
              </div>
              {/* Mini Sparkline Visualization */}
              <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                {[30, 45, 60, 40, 75, 90, 85, 100].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--brand-green)', borderRadius: '2px', opacity: 0.4 + (i * 0.08) }} />
                ))}
              </div>
            </div>

            {/* Total Orders */}
            <div style={{
              background: '#0D1616',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 600 }}>Total Orders</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--brand-green)', fontWeight: 700 }}>+8%</span>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                48
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                42 Completed • 6 Pending Pickup
              </div>
            </div>

            {/* Active Products */}
            <div style={{
              background: '#0D1616',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 600 }}>Active Products</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--brand-green)', fontWeight: 700 }}>Live</span>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                {myStoreProducts.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                All backed by Monad Passports
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div style={{
            background: '#0D1616',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Recent Store Orders
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#6B7280' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Order ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '36px 16px', textAlign: 'center', color: '#9CA3AF' }}>
                        No orders recorded yet. When customers purchase from your store, orders will appear here.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#FFFFFF' }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {ord.id}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                          {ord.product}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>
                          {ord.customer}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: ord.status === 'PAID' ? 'var(--brand-green-dim)' : '#162424',
                            color: ord.status === 'PAID' ? 'var(--brand-green)' : '#9CA3AF',
                            border: ord.status === 'PAID' ? '1px solid var(--brand-green-border)' : '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            {ord.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {ord.amount}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#6B7280' }}>
                          {ord.time}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
