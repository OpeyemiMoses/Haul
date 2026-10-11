import React from 'react';
import { 
  Zap, 
  Shield, 
  Fuel, 
  Clock, 
  Check, 
  X, 
  Layers, 
  Cpu, 
  ExternalLink,
  Code
} from 'lucide-react';
import config from '../contracts/HualPassportConfig.json';

export default function MonadProtocolView({ totalProducts, totalPassports }) {
  return (
    <div className="page-fade-in">
      {/* Title */}
      <div style={{ marginBottom: '32px' }}>
        <div className="badge badge-purple" style={{ marginBottom: '8px' }}>
          <Cpu size={12} /> MONAD EVM STATE MACHINE
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
          Why HUAL Runs on Monad
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '720px', lineHeight: 1.6 }}>
          A product isn't a static token; it's a living asset with frequent state transitions throughout its lifespan. Monad's 10,000 TPS, sub-second block finality, and micro-cent execution make onchain retail commerce practical.
        </p>
      </div>

      {/* Contract & Chain Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DEPLOYED CONTRACT</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#a78bfa', fontFamily: 'var(--font-mono)', marginTop: '4px', wordBreak: 'break-all' }}>
            {config.address}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            ERC-721 Dynamic State Machine
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ONCHAIN PRODUCTS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
            {totalProducts}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Stored in contract state mapping
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MINTED PASSPORTS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
            {totalPassports}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Active physical/digital twins
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GAS SPONSORSHIP</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#836ef9', marginTop: '2px' }}>
            $0.00
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Paymaster sponsored for consumers
          </div>
        </div>
      </div>

      {/* Comparison Table: Traditional vs Hual */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '40px', background: '#121520' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Traditional Commerce vs. HUAL on Monad</h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          How onchain product passports replace fragmented receipts and screenshots.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>FEATURE</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>TRADITIONAL RECEIPTS (PAPER/EMAIL)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#a78bfa' }}>HUAL PRODUCT PASSPORT (MONAD)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600 }}>Post-Purchase Lifecycle</td>
                <td style={{ padding: '14px 16px', color: '#fb7185' }}>
                  <X size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Dead document. Forgotten in inbox or trash.
                </td>
                <td style={{ padding: '14px 16px', color: '#34d399' }}>
                  <Check size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Living asset following the product forever.
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600 }}>Secondary Resale Proof</td>
                <td style={{ padding: '14px 16px', color: '#fb7185' }}>
                  <X size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Screenshots, forged receipts, word-of-mouth.
                </td>
                <td style={{ padding: '14px 16px', color: '#34d399' }}>
                  <Check size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Cryptographic lineage from original merchant.
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600 }}>Warranty Claims</td>
                <td style={{ padding: '14px 16px', color: '#fb7185' }}>
                  <X size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Manual paper registration; easily lost.
                </td>
                <td style={{ padding: '14px 16px', color: '#34d399' }}>
                  <Check size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Direct onchain countdown & verifiable claim logs.
                </td>
              </tr>

              <tr>
                <td style={{ padding: '14px 16px', fontWeight: 600 }}>User Onboarding</td>
                <td style={{ padding: '14px 16px' }}>Web2 forms and email logins</td>
                <td style={{ padding: '14px 16px', color: '#34d399' }}>
                  <Check size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Privy embedded wallets + 100% gasless abstraction.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
