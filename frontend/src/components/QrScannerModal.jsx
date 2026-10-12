import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Image as ImageIcon, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let mounted = true;

    const startScanner = async () => {
      try {
        setCameraError(null);
        // Small delay to ensure DOM element is mounted
        await new Promise(r => setTimeout(r, 200));
        if (!mounted) return;

        const qrContainer = document.getElementById('qr-reader-container');
        if (!qrContainer) return;

        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch {}
          html5QrCodeRef.current = null;
        }

        const scanner = new Html5Qrcode('qr-reader-container');
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: facingMode },
          {
            fps: 12,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (mounted) {
              stopScanner();
              if (onScanSuccess) {
                onScanSuccess(decodedText);
              }
              onClose();
            }
          },
          () => {
            // scan failure ignored per frame
          }
        );

        if (mounted) setIsScanning(true);
      } catch (err) {
        console.warn('QR camera startup notice:', err);
        if (mounted) {
          setIsScanning(false);
          setCameraError(err.message || 'Camera access unavailable. You can upload an image of the QR code below.');
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear();
          html5QrCodeRef.current = null;
        }).catch(() => {
          html5QrCodeRef.current = null;
        });
      } catch {
        html5QrCodeRef.current = null;
      }
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCameraError(null);
      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode('qr-reader-container');
        html5QrCodeRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, true);
      stopScanner();
      if (onScanSuccess) {
        onScanSuccess(decodedText);
      }
      onClose();
    } catch (err) {
      console.warn('File QR decode notice:', err);
      setCameraError('No valid QR code found in the selected image. Please try another photo.');
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999999 }}>
        <div
          className="custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '460px',
            width: '92%',
            background: 'rgba(11, 18, 18, 0.95)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            border: '1px solid rgba(132, 244, 59, 0.25)',
            borderRadius: '24px',
            padding: '24px',
            color: '#FFFFFF',
            fontFamily: "'Sora', sans-serif",
            position: 'relative',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(132, 244, 59, 0.12)',
            margin: '0 auto'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--brand-green-dim)',
                border: '1px solid var(--brand-green-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-green)'
              }}>
                <Camera size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Scan Customer QR Code
                </h3>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#9CA3AF' }}>
                  Point camera at customer's Living Passport QR
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9CA3AF',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Scanner Viewport */}
          <div style={{
            position: 'relative',
            borderRadius: '18px',
            overflow: 'hidden',
            background: '#040707',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minHeight: '280px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div
              id="qr-reader-container"
              style={{ width: '100%', height: '100%', minHeight: '280px' }}
            />

            {/* Scanning Overlay Reticle */}
            {isScanning && !cameraError && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '210px',
                  height: '210px',
                  border: '2px solid var(--brand-green)',
                  borderRadius: '16px',
                  boxShadow: '0 0 25px rgba(132, 244, 59, 0.4), inset 0 0 25px rgba(132, 244, 59, 0.2)',
                  position: 'relative'
                }}>
                  {/* Corner Accents */}
                  <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid #FFFFFF', borderLeft: '4px solid #FFFFFF', borderTopLeftRadius: '16px' }} />
                  <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid #FFFFFF', borderRight: '4px solid #FFFFFF', borderTopRightRadius: '16px' }} />
                  <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #FFFFFF', borderLeft: '4px solid #FFFFFF', borderBottomLeftRadius: '16px' }} />
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #FFFFFF', borderRight: '4px solid #FFFFFF', borderBottomRightRadius: '16px' }} />
                </div>
              </div>
            )}

            {/* Error or Permission fallback */}
            {cameraError && (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <AlertCircle size={32} color="#F59E0B" />
                <div style={{ fontSize: '0.86rem', color: '#E5E7EB', lineHeight: 1.45, maxWidth: '300px' }}>
                  {cameraError}
                </div>
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                padding: '11px 16px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <ImageIcon size={15} color="var(--brand-green)" />
              <span>Upload QR Image</span>
            </button>

            <button
              onClick={toggleCamera}
              style={{
                padding: '11px 16px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#9CA3AF',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Flip camera (front / back)"
            >
              <RefreshCw size={15} />
              <span>Flip</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </ModalPortal>
  );
}
