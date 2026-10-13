import React, { useState } from 'react';
import { Bot } from 'lucide-react';

export default function AISupportFAB({ onClick, hasPendingOrders = false }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      id="ai-support-fab-btn"
      className="ai-support-fab-btn"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 990,
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        padding: 0,
        background: 'linear-gradient(135deg, rgba(14, 24, 24, 0.95) 0%, rgba(8, 14, 14, 0.98) 100%)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        border: '1.5px solid rgba(132, 244, 59, 0.45)',
        boxShadow: isHovered 
          ? '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(132, 244, 59, 0.4)' 
          : '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 18px rgba(132, 244, 59, 0.22)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-3px) scale(1.06)' : 'translateY(0) scale(1)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      title="Open AI Support"
      aria-label="Open AI Support"
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bot size={22} color="var(--brand-green)" />
        <span style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: 'var(--brand-green)',
          boxShadow: '0 0 8px var(--brand-green)'
        }} />
      </div>
    </button>
  );
}
