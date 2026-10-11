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
  
  const merchantName = merchant?.name || product?.merchant || 'Nike Lagos Pop-Up';
  const merchantLocation = merchant?.location || product?.merchantLocation || 'Victoria Island, Lagos';
  const merchantRep = merchant?.chatRep || 'Tade (Store Associate • Online)';

  // Initial messages based on product context
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'merchant',
      senderName: merchantName,
      text: `Hello ${displayName}! Welcome to ${merchantName}. We're located at ${merchantLocation}. How can we assist you with this item today?`,
      time: 'Just now'
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputVal.trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      senderName: displayName,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Simulated Intelligent Merchant Reply
    setTimeout(() => {
      let replyText = `Thanks for asking! Yes, this item is authentic, verified on Monad, and ready for pickup at our ${merchantLocation} location or same-day dispatch to ${buyerLocation}.`;

      const lower = text.toLowerCase();
      if (lower.includes('pickup') || lower.includes('pick up') || lower.includes('store')) {
        replyText = `Yes! We have this ready in our backroom right now. Once you check out with USDC, your QR Pickup Pass will be generated instantly for immediate in-store collection at ${merchantLocation}.`;
      } else if (lower.includes('size') || lower.includes('fit')) {
        replyText = `All listed sizes (including Size 10) are verified in physical inventory. Fits true to size, and you can try it on in our lounge during collection!`;
      } else if (lower.includes('delivery') || lower.includes('deliver') || lower.includes('lekki') || lower.includes('lagos')) {
        replyText = `We do express dispatch across Lagos within 2 to 4 hours. Since your location is ${buyerLocation}, courier transit will take around 35 minutes!`;
      } else if (lower.includes('passport') || lower.includes('warranty') || lower.includes('onchain')) {
        replyText = `Every purchase automatically mints a Living Product Passport to your Privy embedded Monad wallet. It contains factory warranty coverage and enables one-click resale or transfer.`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'merchant',
          senderName: merchantName,
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 1100);
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
                  {m.senderName} • {m.time}
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

          {isTyping && (
            <div style={{ alignSelf: 'flex-start', padding: '8px 14px', background: '#162424', borderRadius: '16px', fontSize: '0.74rem', color: '#9CA3AF' }}>
              <span className="animate-pulse">{merchantName} is typing...</span>
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
