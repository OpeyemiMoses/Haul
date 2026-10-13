import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

// Global dispatcher for non-react calls
export const toast = {
  show: (message, type = 'info', title) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hual_toast', {
        detail: { message, type, title }
      }));
    }
  },
  success: (message, title = 'Success') => toast.show(message, 'success', title),
  error: (message, title = 'Error') => toast.show(message, 'error', title),
  warning: (message, title = 'Notice') => toast.show(message, 'warning', title),
  info: (message, title = 'Info') => toast.show(message, 'info', title)
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', title = null) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast = {
      id,
      message: String(message || ''),
      type, // 'success' | 'error' | 'warning' | 'info'
      title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Notice' : 'Information'),
      createdAt: Date.now()
    };

    setToasts(prev => [...prev.slice(-4), newToast]); // keep up to 5 on screen

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  // Intercept window.alert so no browser alerts ever freeze the page
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalAlert = window.alert;
    window.alert = (msg) => {
      const text = String(msg || '');
      const isErr = text.toLowerCase().includes('fail') || text.toLowerCase().includes('error');
      addToast(text, isErr ? 'error' : 'warning');
    };

    // Listen for custom hual_toast events
    const handleToastEvent = (e) => {
      if (e.detail) {
        addToast(e.detail.message, e.detail.type || 'info', e.detail.title);
      }
    };
    window.addEventListener('hual_toast', handleToastEvent);

    return () => {
      window.alert = originalAlert;
      window.removeEventListener('hual_toast', handleToastEvent);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showToast: addToast, toast }}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 100060,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '380px',
            width: 'calc(100% - 40px)',
            pointerEvents: 'none'
          }}
        >
          {toasts.map(t => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isWarning = t.type === 'warning';

            const borderColor = isSuccess 
              ? 'rgba(132, 244, 59, 0.45)' 
              : isError 
              ? 'rgba(239, 68, 68, 0.45)' 
              : isWarning 
              ? 'rgba(245, 158, 11, 0.45)' 
              : 'rgba(131, 110, 249, 0.45)';

            const accentColor = isSuccess 
              ? '#84F43B' 
              : isError 
              ? '#EF4444' 
              : isWarning 
              ? '#F59E0B' 
              : '#836EF9';

            const bgGlow = isSuccess
              ? 'rgba(132, 244, 59, 0.12)'
              : isError
              ? 'rgba(239, 68, 68, 0.12)'
              : isWarning
              ? 'rgba(245, 158, 11, 0.12)'
              : 'rgba(131, 110, 249, 0.12)';

            return (
              <div
                key={t.id}
                style={{
                  pointerEvents: 'auto',
                  borderRadius: '16px',
                  background: 'rgba(14, 20, 20, 0.94)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${borderColor}`,
                  boxShadow: `0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px ${bgGlow}`,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: 'toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Icon badge */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: bgGlow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isSuccess && <CheckCircle2 size={18} color={accentColor} />}
                  {isError && <AlertCircle size={18} color={accentColor} />}
                  {isWarning && <AlertTriangle size={18} color={accentColor} />}
                  {!isSuccess && !isError && !isWarning && <Info size={18} color={accentColor} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '2px' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#D1D5DB', lineHeight: 1.45, wordBreak: 'break-word' }}>
                    {t.message}
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: toast.show,
      toast
    };
  }
  return context;
}
