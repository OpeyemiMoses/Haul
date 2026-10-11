import React from 'react';

export function HualIcon({ size = 32, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Left Pillar */}
      <rect x="20" y="16" width="18" height="68" rx="9" fill="#84F43B" />
      
      {/* Right Pillar */}
      <rect x="62" y="16" width="18" height="68" rx="9" fill="#84F43B" />
      
      {/* Ribbon Fold Underlayer (Shadow) */}
      <path 
        d="M20 62L80 34V48L20 76Z" 
        fill="#5EB824" 
        opacity="0.9"
      />
      
      {/* Ribbon Fold Top Highlight */}
      <path 
        d="M20 44L80 20V34L20 58Z" 
        fill="#84F43B" 
      />

      {/* Subtle 3D Fold Crease */}
      <path 
        d="M38 52L62 40" 
        stroke="#A5F96E" 
        strokeWidth="2" 
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

export default function HualBrand({ size = 32, showTagline = false, name = 'Hual', lightMode = false }) {
  const textColor = lightMode ? '#080F0F' : '#FFFFFF';
  const taglineColor = lightMode ? '#505858' : '#8E9B9B';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <HualIcon size={size} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ 
          fontFamily: "'Sora', sans-serif", 
          fontSize: `${size * 0.72}px`, 
          fontWeight: 800, 
          letterSpacing: '-0.02em', 
          color: textColor,
          lineHeight: 1
        }}>
          {name || 'Hual'}
        </span>
        {showTagline && (
          <span style={{ 
            fontFamily: "'Sora', sans-serif", 
            fontSize: `${Math.max(10, size * 0.32)}px`, 
            fontWeight: 500, 
            color: taglineColor, 
            letterSpacing: '0.04em',
            marginTop: '3px'
          }}>
            Buy it. Own it. Prove it.
          </span>
        )}
      </div>
    </div>
  );
}
