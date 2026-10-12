import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Store, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import ModalPortal from './ModalPortal';
import { sendCustomerMessage, getAllSharedConversations } from '../lib/messageRegistry';

export default function CommerceChatModal({ 
  isOpen, 
  onClose, 
  merchant, 
  product, 
  onQuickCheckout,
  buyerLocation = 'Victoria Island, Lagos'
}) {
  const { user } = useAuth();
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Shopper');
  
  const merchantName = merchant?.name || product?.merchant || 'Verified Merchant';
  const merchantLocation = merchant?.location || product?.merchantLocation || 'Victoria Island, Lagos';
  const merchantRep = merchant?.chatRep || 'Tade (Store Associate • Online)';
  const storeId = merchant?.id || product?.merchantId || `store-${(merchantName || 'custom').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const buyerId = user?.address || user?.email || user?.id || 'guest';
  const convId = `conv-${storeId}-${buyerId.toLowerCase()}`;

  // Load existing real messages from shared message registry
  const [messages, setMessages] = useState(() => {
    const all = getAllSharedConversations();
    const existing = all.find(c => 
      c.id === convId || 
      (c.storeId === storeId && (c.buyerIdentifier?.toLowerCase() === buyerId.toLowerCase() || c.buyerIdentifier === 'default'))
    );
    return existing?.messages || [];
  });

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      const all = getAllSharedConversations();
      const existing = all.find(c => 
        c.id === convId || 
        (c.storeId === storeId && (c.buyerIdentifier?.toLowerCase() === buyerId.toLowerCase() || c.buyerIdentifier === 'default'))
      );
      if (existing?.messages) {
        setMessages(existing.messages);
      }
      scrollToBottom();
    }
  }, [isOpen, storeId, buyerId]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputVal.trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      senderName: displayName,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setSentNotice(true);
    setTimeout(() => setSentNotice(false), 5000);

    // Save directly to shared cross-user & merchant registry (no fake bot replying)
    sendCustomerMessage({
      store: merchant || { id: storeId, name: merchantName, location: merchantLocation },
      buyer: user,
      text,
      product: product || null
    });
  };

  const quickPrompts = [
    'Is this available for in-store pickup today?',
    'What is your exact store address in Lagos?',
    'How fast is express delivery to my location?',
    'How does the digital warranty passport work?'
  ];

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0D1616',
          border: '1px solid rgba(132, 244, 59, 0.35)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          height: '620px',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(132, 244, 59, 0.15)',
          color: '#FFFFFF',
          fontFamily: "'Sora', sans-serif",
          margin: '0 auto'
        }}
      >
        
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: '#080F0F',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#121C1C',
              border: '1.5px solid var(--brand-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-green)'
            }}>
              <Store size={22} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 800 }}>{merchantName}</span>
                <CheckCircle2 size={13} color="var(--brand-green)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={11} color="var(--brand-green)" /> {merchantLocation}
                </span>
                <span style={{ color: '#84F43B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-green)' }} />
                  <span>Online</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Pinned Product Card Attachment if inquiring about a product */}
        {product && (
          <div style={{
            padding: '10px 18px',
            background: 'rgba(18, 28, 28, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#080F0F',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img 
                  src={product.imageUri || '/assets/air_max_95.jpg'} 
                  alt={product.name} 
                  style={{ width: '90%', height: '90%', objectFit: 'contain' }} 
                />
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{product.name}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--brand-green)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  ${product.priceUsd?.toFixed(2) || '250.00'}
                </div>
              </div>
            </div>

            {onQuickCheckout && (
              <button
                onClick={() => {
                  onClose();
                  onQuickCheckout(product);
                }}
                className="btn-pill-primary btn-pill-sm"
                style={{ padding: '6px 14px', fontSize: '0.74rem', fontWeight: 800 }}
              >
                Buy Now
              </button>
            )}
          </div>
        )}

        {/* Messages Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '24px', color: '#9CA3AF', fontSize: '0.8rem' }}>
              <Store size={32} color="var(--brand-green)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
              <div style={{ color: '#FFFFFF', fontWeight: 600, marginBottom: '4px' }}>Direct Store Inquiry</div>
              <div>Send a message to {merchantName}. Inquiries are delivered directly to the store manager's inbox.</div>
            </div>
          )}

          {messages.map((m) => {
            const isMe = m.sender === 'user';
            return (
              <div 
                key={m.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  fontSize: '0.66rem',
                  color: '#6B7280',
                  marginBottom: '4px',
                  paddingLeft: isMe ? 0 : '4px',
                  paddingRight: isMe ? '4px' : 0
                }}>
                  {m.senderName} • {m.timestamp || m.time || 'Just now'}
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe ? 'var(--brand-green)' : '#162424',
                  color: isMe ? '#080F0F' : '#FFFFFF',
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  fontWeight: isMe ? 600 : 400,
                  border: isMe ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isMe ? '0 4px 14px rgba(132, 244, 59, 0.25)' : 'none'
                }}>
                  {m.text}
                </div>
              </div>
            );
          })}

          {sentNotice && (
            <div style={{ alignSelf: 'flex-end', padding: '6px 12px', background: 'rgba(132, 244, 59, 0.12)', border: '1px solid var(--brand-green-border)', borderRadius: '12px', fontSize: '0.72rem', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} />
              <span>Delivered to merchant inbox • Store owner will reply directly</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div 
          className="hide-scrollbar"
          style={{
            padding: '8px 16px',
            background: '#080F0F',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}
        >
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              style={{
                background: '#121C1C',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '0.68rem',
                color: '#D1D5DB',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-green)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#D1D5DB';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            padding: '14px 18px',
            background: '#0D1616',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <input
            type="text"
            placeholder={`Message ${merchantName}...`}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            style={{
              flex: 1,
              background: '#121C1C',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '999px',
              padding: '11px 18px',
              color: '#FFFFFF',
              fontSize: '0.84rem',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />

          <button
            type="submit"
            disabled={!inputVal.trim()}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: inputVal.trim() ? 'var(--brand-green)' : '#162424',
              color: inputVal.trim() ? '#080F0F' : '#6B7280',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputVal.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            <Send size={16} />
          </button>
        </form>

      </div>
    </div>
    </ModalPortal>
  );
}
