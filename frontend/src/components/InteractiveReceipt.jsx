import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  ArrowRight, 
  Clock, 
  Store, 
  User, 
  Sparkles, 
  RefreshCw, 
  Lock,
  ChevronRight,
  PackageCheck,
  AlertTriangle,
  FileText
} from 'lucide-react';
import HaulQrCode from './HaulQrCode';

const LIFECYCLE_STAGES = [
  {
    id: 'ordered',
    name: '1. ORDERED',
    badge: 'Order Placed',
    status: 'Pending Handover',
    owner: 'Customer Account',
    note: 'Product reserved at Lens House. Checkout initiated.',
    stepNumber: 1
  },
  {
    id: 'paid',
    name: '2. PAID',
    badge: 'Protected',
    status: 'Buyer Protection Active',
    owner: 'Customer Account',
    note: 'Payment confirmed. Funds held safely in escrow until inspection.',
    stepNumber: 2
  },
  {
    id: 'ready',
    name: '3. READY',
    badge: 'Ready in Store',
    status: 'Awaiting Collection',
    owner: 'Customer Account',
    note: 'Merchant prepared serialized Camera X1 with warranty pass.',
    stepNumber: 3
  },
  {
    id: 'collected',
    name: '4. COLLECTED',
    badge: 'Handover Verified',
    status: 'Collected in Store',
    owner: 'Customer Account',
    note: 'Merchant scanned customer PIN pass. Ownership verified.',
    stepNumber: 4
  },
  {
    id: 'warranty',
    name: '5. WARRANTY',
    badge: '365 Days Active',
    status: 'Warranty Coverage Live',
    owner: 'Customer Account',
    note: 'Factory direct warranty active. Service history tracked.',
    stepNumber: 5
  },
  {
    id: 'transferred',
    name: '6. TRANSFERRED',
    badge: 'Provenance Intact',
    status: 'New Owner Registered',
    owner: 'Secondary Buyer (Transferred)',
    note: 'Transferred Camera X1 to secondary buyer. Full warranty preserved.',
    stepNumber: 6
  }
];

export default function InteractiveReceipt() {
  const [activeStageIndex, setActiveStageIndex] = useState(3); // Default to 'COLLECTED'
  const currentStage = LIFECYCLE_STAGES[activeStageIndex];

  return (
    <div style={{ width: '100%' }}>
      {/* Interactive Lifecycle Step Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '14px',
        marginBottom: '24px',
        scrollbarWidth: 'none'
      }}>
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isActive = idx === activeStageIndex;
          const isPassed = idx < activeStageIndex;

          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageIndex(idx)}
              style={{
                flex: 1,
                minWidth: '105px',
                padding: '10px 12px',
                borderRadius: '12px',
                background: isActive 
                  ? '#0A0D0D' 
                  : isPassed 
                    ? '#F3F4F6' 
                    : '#FFFFFF',
                border: isActive 
                  ? '1px solid #0A0D0D' 
                  : '1px solid #E5E7EB',
                color: isActive ? '#FFFFFF' : '#4B5563',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                boxShadow: isActive ? '0 4px 12px rgba(0, 0, 0, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                color: isActive ? 'var(--brand-green)' : isPassed ? '#15803d' : '#6B7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {isPassed && <CheckCircle2 size={11} color="#15803d" />}
                <span>{stage.name}</span>
              </div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stage.badge}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Interactive Living Receipt & Value Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* ================= THE LIVING RECEIPT / PASSPORT CARD ================= */}
        <div style={{
          padding: '26px',
          borderRadius: '20px',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
          position: 'relative'
        }}>
          {/* Receipt Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span className="capsule-tag" style={{ padding: '3px 8px', fontSize: '0.64rem', marginBottom: '6px', background: '#F3F4F6', color: '#0A0D0D', border: '1px solid #E5E7EB' }}>
                Living Product Passport
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0A0D0D', letterSpacing: '-0.02em', margin: 0 }}>
                CAMERA X1
              </h3>
              <div style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Serial: #HL-CAMX1-88219
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                color: '#0A0D0D'
              }}>
                $450.00
              </div>
              <div style={{ fontSize: '0.68rem', color: '#6B7280', fontWeight: 600 }}>
                USD · Protected Checkout
              </div>
            </div>
          </div>

          {/* Live Dynamic Status Ribbon */}
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(132, 244, 59, 0.18)',
            border: '1px solid rgba(21, 128, 61, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#15803d'
              }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0A0D0D' }}>
                Status: {currentStage.status}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#15803d', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              Step {currentStage.stepNumber} of 6
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#E5E7EB', margin: '14px 0' }} />

          {/* Middle: Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            fontSize: '0.78rem',
            marginBottom: '18px'
          }}>
            <div>
              <span style={{ color: '#6B7280', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Original Merchant
              </span>
              <strong style={{ color: '#0A0D0D' }}>Lens House Store</strong>
            </div>

            <div>
              <span style={{ color: '#6B7280', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Purchase Date
              </span>
              <strong style={{ color: '#0A0D0D' }}>October 7, 2026</strong>
            </div>

            <div>
              <span style={{ color: '#6B7280', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Current Owner
              </span>
              <strong style={{ color: '#15803d' }}>{currentStage.owner}</strong>
            </div>

            <div>
              <span style={{ color: '#6B7280', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Factory Warranty
              </span>
              <strong style={{ color: '#0284c7' }}>12 Months (Active)</strong>
            </div>
          </div>

          {/* Interactive QR Code Verification Box */}
          <div style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            {/* SVG QR Code */}
            <div style={{
              background: '#FFFFFF',
              padding: '6px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}>
              <HaulQrCode 
                value={`https://haul.store/passport/HL-CAMX1-88219?stage=${currentStage.id}`}
                size={76}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '3px'
              }}>
                <QrCode size={13} />
                <span>PHYSICAL VERIFICATION QR</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#4B5563', lineHeight: 1.4, margin: 0 }}>
                {currentStage.note}
              </p>
              <div style={{
                fontSize: '0.66rem',
                color: '#6B7280',
                fontFamily: 'var(--font-mono)',
                marginTop: '4px',
                fontWeight: 600
              }}>
                Ref: 0x7f...e42 · Verified Provenance
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT: THE CONTRAST (DEAD RECEIPT VS LIVING PASSPORT) ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span className="capsule-tag" style={{ marginBottom: '8px', padding: '3px 10px', fontSize: '0.64rem', background: '#F3F4F6', color: '#0A0D0D', border: '1px solid #E5E7EB' }}>
              Why The Receipt Isn't Enough
            </span>
            <h3 style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#0A0D0D',
              letterSpacing: '-0.02em',
              marginBottom: '8px'
            }}>
              The receipt dies after checkout.<br />
              <span style={{ color: 'var(--brand-green-dark)' }}>The product doesn't.</span>
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#4B5563', lineHeight: 1.6 }}>
              Traditional commerce treats the checkout button as the end of the transaction. A paper receipt or static PDF says <em>"You bought this"</em> and gets lost in your drawer. Haul gives your product a permanent digital passport that stays alive through every lifecycle transition.
            </p>
          </div>

          {/* Comparison Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* The Dead Receipt */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              display: 'flex',
              gap: '12px'
            }}>
              <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#991B1B', display: 'block', marginBottom: '2px' }}>
                  Traditional Receipt (Static & Dead)
                </strong>
                <p style={{ fontSize: '0.78rem', color: '#7F1D1D', margin: 0, lineHeight: 1.5 }}>
                  Paper receipts fade, WhatsApp tracking gets deleted, warranties get lost, and when you resell, you have zero way to prove provenance or authenticity.
                </p>
              </div>
            </div>

            {/* Haul Living Passport */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              gap: '12px'
            }}>
              <ShieldCheck size={18} color="#15803d" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#166534', display: 'block', marginBottom: '2px' }}>
                  Haul Product Passport (Living & Transferable)
                </strong>
                <p style={{ fontSize: '0.78rem', color: '#14532D', margin: 0, lineHeight: 1.5 }}>
                  Carries merchant identity, 12-month factory warranty records, private store pickup PIN, and can be transferred to a new owner with 1 click during secondary resale.
                </p>
              </div>
            </div>
          </div>

          {/* Step through action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <button
              onClick={() => setActiveStageIndex((prev) => (prev + 1) % LIFECYCLE_STAGES.length)}
              className="btn-pill-primary btn-pill-sm"
              style={{ fontSize: '0.8rem', padding: '8px 18px', fontWeight: 700 }}
            >
              <span>Next Stage ({LIFECYCLE_STAGES[(activeStageIndex + 1) % LIFECYCLE_STAGES.length].badge})</span>
              <ArrowRight size={13} />
            </button>
            <span style={{ fontSize: '0.74rem', color: '#6B7280' }}>
              Click any stage above to inspect
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
