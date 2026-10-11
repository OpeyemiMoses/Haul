import React, { useState } from 'react';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';

export default function AISupportFAB({ onClick, hasPendingOrders = false }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 990,
        height: '48px',
        padding: isHovered ? '0 18px 0 14px' : '0 16px 0 12px',
        borderRadius: '999px',
        background: 'linear-gradient(135deg, rgba(14, 24, 24, 0.92) 0%, rgba(8, 14, 14, 0.95) 100%)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        border: '1.5px solid rgba(132, 244, 59, 0.45)',
        boxShadow: isHovered 
          ? '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(132, 244, 59, 0.35)' 
          : '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(132, 244, 59, 0.2)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-3px) scale(1.03)' : 'translateY(0) scale(1)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Sora', sans-serif"
      }}
      title="Open AI Support & Account Companion"
    >
      {/* Bot Icon with glowing pulse ring */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(132, 244, 59, 0.25) 0%, rgba(132, 244, 59, 0.08) 100%)',
        border: '1px solid var(--brand-green)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <Bot size={16} color="var(--brand-green)" />
        <span style={{
          position: 'absolute',
          top: '-1px',
          right: '-1px',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: 'var(--brand-green)',
          boxShadow: '0 0 8px var(--brand-green)'
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
        <span style={{
          fontSize: '0.82rem',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.01em',
          lineHeight: 1.1
        }}>
          AI Support
        </span>
        <span style={{
          fontSize: '0.62rem',
          color: 'var(--brand-green)',
          fontWeight: 700,
          lineHeight: 1
        }}>
          Online Companion
        </span>
      </div>

      <Sparkles 
        size={13} 
        color="var(--brand-green)" 
        style={{ 
          opacity: isHovered ? 1 : 0.6,
          transition: 'opacity 0.2s'
        }} 
      />
    </button>
  );
}
