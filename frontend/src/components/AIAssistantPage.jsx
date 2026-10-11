import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  ShieldCheck, 
  Store, 
  Package, 
  Key, 
  Copy, 
  Check, 
  MessageSquare, 
  RotateCcw, 
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  Zap,
  HelpCircle,
  Tag,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  sendGroqChatMessage, 
  getOrderPin,
  GROQ_MODELS,
  getGroqApiKey,
  saveGroqApiKey
} from '../lib/groqClient';
import { CURATED_CATALOG, VERIFIED_MERCHANTS } from '../lib/catalogData';
import { formatCurrency } from '../lib/formatters';
import useScrollReveal from '../lib/useScrollReveal';
import FormattedMessage from './FormattedMessage';

export default function AIAssistantPage({
  user,
  authenticated = false,
  onLogin,
  onNavigateTab,
  onOpenStore,
  onStartCheckout,
  userStore = null,
  userRole = 'consumer',
  usdcBalance = 0,
  passports = [],
  activeOrderContext = null,
  catalog = CURATED_CATALOG,
  merchants = VERIFIED_MERCHANTS
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedPin, setCopiedPin] = useState(null);
  const [currentActiveOrder, setCurrentActiveOrder] = useState(activeOrderContext || null);
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [showConfig, setShowConfig] = useState(false);
  const [customKey, setCustomKey] = useState(() => getGroqApiKey());

  const chatScrollContainerRef = useRef(null);
  const isInitialMount = useRef(true);
  const inputRef = useRef(null);

  // Extract all user orders comprehensively from props and localStorage
  const userKey = user?.address || user?.email || user?.id || 'guest';
  const allUserOrders = useMemo(() => {
    try {
      const addrKey = user?.address ? user.address.toLowerCase() : 'guest';
      const localStored = JSON.parse(
        localStorage.getItem(`hual_my_passports_${addrKey}`) || 
        localStorage.getItem(`hual_my_passports_${userKey}`) || 
        localStorage.getItem('hual_my_passports') || 
        '[]'
      );
      const deletedIds = new Set(JSON.parse(localStorage.getItem('hual_deleted_passports') || '[]'));
      const combined = [...(passports || []), ...localStored];
      const seen = new Set();
      const unique = [];
      for (const p of combined) {
        const tStr = String(p.tokenId || '');
        const sStr = String(p.serialNumber || '');
        const iStr = String(p.id || '');
        const oStr = String(p.orderId || '');
        if (deletedIds.has(tStr) || deletedIds.has(sStr) || deletedIds.has(iStr) || deletedIds.has(oStr)) {
          continue;
        }
        const key = tStr || sStr || iStr || oStr || `${p.productName}-${p.purchaseTimestamp}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(p);
        }
      }
      return unique.length > 0 ? unique : (passports || []);
    } catch {
      return passports || [];
    }
  }, [passports, user]);

  // Initial welcome message
  useEffect(() => {
    const orderToFocus = activeOrderContext || null;
    setCurrentActiveOrder(orderToFocus);

    const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Member');
    let intro = '';

    if (orderToFocus) {
      const pin = getOrderPin(orderToFocus);
      intro = `Focused Order Inquiry: ${orderToFocus.productName || orderToFocus.name}

I have loaded your verified order details into memory:
• Order ID: \`#${orderToFocus.tokenId || orderToFocus.id || '101'}\`
• Escrow Status: ${orderToFocus.currentState || 'ESCROWED'}
• Pickup Pass PIN: \`${pin}\`
• Merchant: ${orderToFocus.originalMerchant || orderToFocus.merchant || 'Flagship Store'}

Ask me anything about pickup instructions, physical vault collection, or Monad escrow guarantees!`;
    } else if (userStore || userRole === 'merchant') {
      intro = `Store Operations Manager Companion

Welcome, ${displayName}! I have real-time access to your store profile and the entire Haul marketplace.
• Store Name: ${userStore?.name || 'Verified Flagship'}
• Operating Hours: ${userStore?.operatingHours || 'Mon - Sat: 9:00 AM - 7:00 PM'}
• Location: ${userStore?.fullAddress || userStore?.location || 'Victoria Island, Lagos'}

You can ask me about catalog listings, customer pickup PIN verification, counter operations, or platform policies!`;
    } else {
      const orderCount = allUserOrders.length;
      intro = `Welcome to Haul AI Companion

I'm your intelligent concierge with unconstrained access to the entire Haul site:
• Site Catalog & Stock: Inquire about sneakers, headphones, phones, prices, sizes, and colors.
• Verified Storefronts: Inquire about store locations, addresses, and operating hours across Lagos.
• Your Orders & PINs: You currently have ${orderCount} active ${orderCount === 1 ? 'order' : 'orders'} on your account. Ask "What is my pickup PIN?" to view your pass.
• Escrow & Policies: Ask about Monad smart contract protection, cancellations, and why cancelled items cannot be reviewed.

What would you like to explore today?`;
    }

    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        content: intro,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderAttached: orderToFocus
      }
    ]);
  }, [activeOrderContext, user, userStore, userRole]);

  // Always start AI Concierge page strictly from the top of the window
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Auto-scroll internal chat container only, never hijack window scroll
  useEffect(() => {
    if (!chatScrollContainerRef.current) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
      return;
    }
    chatScrollContainerRef.current.scrollTo({
      top: chatScrollContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages.length, isTyping]);

  useScrollReveal([messages.length, currentActiveOrder]);

  const handleSendMessage = async (textToSend = null, overrideOrder = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setInputText('');
    const targetOrder = overrideOrder !== undefined ? overrideOrder : currentActiveOrder;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsTyping(true);

    try {
      const response = await sendGroqChatMessage({
        messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
        context: {
          user,
          userRole,
          userStore,
          usdcBalance,
          passports: allUserOrders,
          activeOrder: targetOrder,
          catalog,
          merchants
        },
        model: selectedModel
      });

      const assistantMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderAttached: targetOrder,
        modelUsed: response.modelUsed
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error communicating with AI Companion:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: 'I experienced a brief connection hiccup. Your Monad escrow orders and wallet funds remain 100% secure. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyPin = (pin, id) => {
    navigator.clipboard?.writeText(String(pin));
    setCopiedPin(id);
    setTimeout(() => setCopiedPin(null), 2500);
  };

  const handleResetSession = () => {
    setMessages([]);
    setCurrentActiveOrder(null);
    setInputText('');
    setTimeout(() => {
      setMessages([
        {
          id: `init-${Date.now()}`,
          role: 'assistant',
          content: `### New Session Started\n\nI'm ready! Ask me anything regarding products, stores, your orders, pickup PIN codes, or escrow rules on Haul.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 100);
  };

  const quickPrompts = [
    'What footwear and shoes do you have in stock?',
    'What is my pickup PIN verification code?',
    'Where is the Nike Lagos Pop-Up located?',
    'How much is the Sony WH-1000XM5 headphones?',
    'Can I review an order that I cancelled?',
    'How does Monad Smart Contract Escrow work?',
    'Where is the Apple Verified Boutique in Lagos?'
  ];

  return (
    <div className="page-fade-in" style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 0 80px' }}>
      
      {/* Top Header Card */}
      <div 
        className="apple-liquid-glass reveal-pop"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '24px 28px',
          background: '#0D1616',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(132, 244, 59, 0.18) 0%, rgba(18, 28, 28, 0.9) 100%)',
            border: '1.5px solid var(--brand-green-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-green)',
            boxShadow: '0 0 25px rgba(132, 244, 59, 0.2)'
          }}>
            <Sparkles size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Haul AI Companion
              </h1>
            </div>
            <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '0.82rem' }}>
              Specialized concierge with unconstrained reasoning across the entire Haul catalog, verified stores, and Monad escrow orders.
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: '#121C1C',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.74rem',
            color: '#D1D5DB'
          }}>
            <ShieldCheck size={14} color="var(--brand-green)" />
            <span>Escrow Protected</span>
          </div>

          <button
            onClick={handleResetSession}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: '#121C1C',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              color: '#9CA3AF',
              fontSize: '0.74rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Start a fresh chat conversation"
          >
            <RotateCcw size={13} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: '24px',
        alignItems: 'start'
      }} className="ai-companion-grid">

        {/* Left Column: Chat Conversation Stream */}
        <div 
          className="apple-liquid-glass card-reveal-left"
          style={{
            background: '#0D1616',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            height: '750px',
            maxHeight: 'calc(100vh - 220px)',
            overflow: 'hidden'
          }}
        >
          {/* Messages Scroll Area */}
          <div 
            ref={chatScrollContainerRef}
            className="hide-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? '80%' : '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  {/* Sender Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.7rem',
                    color: '#9CA3AF',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    padding: '0 4px'
                  }}>
                    {isUser ? (
                      <span>You • {m.timestamp}</span>
                    ) : (
                      <>
                        <Sparkles size={12} color="var(--brand-green)" />
                        <span style={{ color: 'var(--brand-green)', fontWeight: 600 }}>Haul AI Companion</span>
                        <span>• {m.timestamp}</span>
                      </>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: isUser ? 'var(--brand-green)' : '#142020',
                    color: isUser ? '#080F0F' : '#FFFFFF',
                    border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isUser ? '0 4px 16px rgba(132, 244, 59, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.3)',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    fontWeight: isUser ? 600 : 400
                  }}>
                    <FormattedMessage text={m.content} isUser={isUser} />
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '12px 18px',
                borderRadius: '18px',
                background: '#142020',
                border: '1px solid var(--brand-green-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                color: 'var(--brand-green)'
              }}>
                <Sparkles size={15} className="animate-spin" />
                <span>Haul AI is analyzing catalog and order context...</span>
              </div>
            )}

          </div>

          {/* Quick Suggestion Chips */}
          <div 
            className="hide-scrollbar"
            style={{
              padding: '10px 20px',
              background: '#091111',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
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
                disabled={isTyping}
                style={{
                  background: '#121D1D',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '0.72rem',
                  color: '#D1D5DB',
                  cursor: isTyping ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (!isTyping) {
                    e.currentTarget.style.borderColor = 'var(--brand-green)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
                  e.currentTarget.style.color = '#D1D5DB';
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Input Dock */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '16px 20px',
              background: '#080E0E',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about Haul, products, stores, orders, or escrow..."
              disabled={isTyping}
              style={{
                flex: 1,
                background: '#121C1C',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '13px 18px',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--brand-green)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: inputText.trim() && !isTyping ? 'var(--brand-green)' : '#182424',
                border: 'none',
                color: inputText.trim() && !isTyping ? '#080F0F' : '#6B7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputText.trim() && !isTyping ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>

        {/* Right Column: Account Orders & Live Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* User Orders Inspector Widget */}
          <div 
            className="apple-liquid-glass card-reveal-right"
            style={{
              background: '#0D1616',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '20px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="var(--brand-green)" />
                <h2 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Your Active Orders
                </h2>
              </div>

              <span style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#D1D5DB',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.68rem',
                fontWeight: 700
              }}>
                {allUserOrders.length}
              </span>
            </div>

            {allUserOrders.length === 0 ? (
              <div style={{
                padding: '18px',
                textAlign: 'center',
                background: '#121C1C',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#9CA3AF',
                fontSize: '0.78rem'
              }}>
                No active orders yet. Browse our stores and checkout with Monad escrow to generate living passports and pickup PIN codes!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '310px', overflowY: 'auto' }}>
                {allUserOrders.map((ord, idx) => {
                  const pin = getOrderPin(ord);
                  const isSelected = currentActiveOrder?.tokenId === ord.tokenId;
                  const isCancelled = ord.currentState === 'REFUNDED';
                  return (
                    <div
                      key={ord.tokenId || ord.id || idx}
                      onClick={() => {
                        setCurrentActiveOrder(ord);
                        handleSendMessage(`What is my verification PIN code and escrow status for ${ord.productName || ord.name}?`, ord);
                      }}
                      style={{
                        padding: '12px 14px',
                        background: isSelected ? 'rgba(132, 244, 59, 0.08)' : '#121C1C',
                        border: isSelected ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.8rem', color: '#FFFFFF' }}>
                          {ord.productName || ord.name}
                        </strong>
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          color: isCancelled ? '#EF4444' : 'var(--brand-green)',
                          background: isCancelled ? 'rgba(239, 68, 68, 0.12)' : 'var(--brand-green-dim)',
                          padding: '1px 6px',
                          borderRadius: '6px'
                        }}>
                          {isCancelled ? 'CANCELLED' : (ord.currentState || 'ESCROWED')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#9CA3AF' }}>
                        <span>PIN: <strong style={{ color: '#FFFFFF', letterSpacing: '0.05em' }}>{pin}</strong></span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPin(pin, ord.tokenId || idx);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copiedPin === (ord.tokenId || idx) ? 'var(--brand-green)' : '#9CA3AF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.68rem'
                          }}
                        >
                          {copiedPin === (ord.tokenId || idx) ? <Check size={11} /> : <Copy size={11} />}
                          <span>{copiedPin === (ord.tokenId || idx) ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Verified Stores Directory Quick Peek */}
          <div 
            className="apple-liquid-glass card-reveal-right"
            style={{
              background: '#0D1616',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Store size={18} color="var(--brand-green)" />
              <h2 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>
                Featured Lagos Stores
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {merchants.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    if (onOpenStore) onOpenStore(m);
                    else handleSendMessage(`Tell me about the ${m.name} in ${m.location}. What items do they sell and what are their hours?`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#121C1C',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF' }}>{m.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>{m.location}</div>
                  </div>
                  <ChevronRight size={14} color="#6B7280" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
