import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Real, 100% ISO/IEC 18004 compliant scannable QR Code component.
 * Uses QRCodeSVG to render real 2D matrix barcodes readable by any phone camera,
 * barcode scanner, or merchant terminal.
 */
export default function HaulQrCode({ 
  value = 'https://haul.store', 
  size = 100, 
  className = '',
  bgColor = '#FFFFFF',
  fgColor = '#0B0F0F',
  level = 'M'
}) {
  if (!value) return null;

  return (
    <div 
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        borderRadius: '8px',
        padding: '6px',
        boxSizing: 'border-box'
      }}
    >
      <QRCodeSVG
        value={value}
        size={size - 12 > 20 ? size - 12 : size}
        bgColor={bgColor}
        fgColor={fgColor}
        level={level}
        marginSize={1}
      />
    </div>
  );
}
