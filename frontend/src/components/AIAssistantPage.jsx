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
  ArrowRight,
  X
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
  catalog = [],
  merchants = []
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

  const handleFocusOrder = (ord, queryText = null) => {
    setCurrentActiveOrder(ord);
    const orderTitle = ord.productName || ord.name || 'Order';
    const orderId = ord.tokenId || ord.id || '101';
    const text = queryText || `What is my verification PIN code and escrow status for ${orderTitle} (#${orderId})?`;
    handleSendMessage(text, ord);
  };

  const handleClearFocus = () => {
    setCurrentActiveOrder(null);
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
              const lower = (m.content || '').toLowerCase();
              const mentionsOrderCards = !isUser && (
                lower.includes('tap any order card') ||
                lower.includes('need assistance with a specific order') ||
                lower.includes('which order do you need') ||
                lower.includes('which one would you like') ||
                lower.includes('account orders & escrow summary') ||
                lower.includes('which order do you need assistance with')
              );

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

                    {/* Inline Interactive Order Cards when assistant mentions orders */}
                    {mentionsOrderCards && allUserOrders && allUserOrders.length > 0 && (
                      <div style={{
                        marginTop: '16px',
                        paddingTop: '14px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.72rem',
                          color: '#9CA3AF',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          <span>Tap an order card to focus conversation:</span>
                          <span style={{ color: 'var(--brand-green)' }}>{allUserOrders.length} available</span>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                          gap: '10px'
                        }}>
                          {allUserOrders.map((ord, oIdx) => {
                            const pin = getOrderPin(ord);
                            const isSelected = Boolean(
                              (currentActiveOrder?.tokenId && String(currentActiveOrder.tokenId) === String(ord.tokenId)) ||
                              (currentActiveOrder?.id && String(currentActiveOrder.id) === String(ord.id)) ||
                              (currentActiveOrder?.productName && currentActiveOrder.productName === ord.productName) ||
                              (currentActiveOrder?.name && currentActiveOrder.name === ord.name)
                            );
                            const isCancelled = ord.currentState === 'REFUNDED';
                            const orderTitle = ord.productName || ord.name || 'Order';
                            const orderId = ord.tokenId || ord.id || '101';

                            return (
                              <div
                                key={ord.tokenId || ord.id || oIdx}
                                onClick={() => handleFocusOrder(ord)}
                                role="button"
                                tabIndex={0}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px 14px',
                                  borderRadius: '14px',
                                  background: isSelected 
                                    ? 'linear-gradient(135deg, rgba(132, 244, 59, 0.16) 0%, rgba(18, 28, 28, 0.95) 100%)' 
                                    : '#0C1414',
                                  border: isSelected 
                                    ? '1.5px solid var(--brand-green)' 
                                    : '1px solid rgba(255, 255, 255, 0.08)',
                                  color: '#FFFFFF',
                                  cursor: 'pointer',
                                  transition: 'all 0.18s ease',
                                  boxShadow: isSelected ? '0 0 16px rgba(132, 244, 59, 0.2)' : 'none',
                                  position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'rgba(132, 244, 59, 0.4)';
                                    e.currentTarget.style.background = '#111D1D';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.background = '#0C1414';
                                  }
                                }}
                              >
                                <div style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '10px',
                                  overflow: 'hidden',
                                  background: '#080F0F',
                                  flexShrink: 0,
                                  border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}>
                                  <img 
                                    src={ord.imageUri || '/assets/air_max_95.jpg'} 
                                    alt={orderTitle} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  />
                                </div>

                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                    <span style={{
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      {orderTitle}
                                    </span>
                                    {isSelected && (
                                      <span style={{
                                        fontSize: '0.6rem',
                                        fontWeight: 800,
                                        color: 'var(--brand-green)',
                                        background: 'rgba(132, 244, 59, 0.18)',
                                        border: '1px solid rgba(132, 244, 59, 0.4)',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        flexShrink: 0
                                      }}>
                                        FOCUSED
                                      </span>
                                    )}
                                  </div>

                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.68rem',
                                    color: '#9CA3AF',
                                    marginTop: '2px'
                                  }}>
                                    <span>#{orderId}</span>
                                    <span>•</span>
                                    <span style={{
                                      color: isCancelled ? '#EF4444' : 'var(--brand-green)',
                                      fontWeight: 600
                                    }}>
                                      {isCancelled ? 'CANCELLED' : (ord.currentState || 'ESCROWED')}
                                    </span>
                                    {pin && (
                                      <>
                                        <span>•</span>
                                        <span style={{ fontFamily: 'var(--font-mono, monospace)', color: '#FFFFFF' }}>
                                          PIN {pin}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <ChevronRight 
                                  size={14} 
                                  color={isSelected ? 'var(--brand-green)' : '#6B7280'} 
                                  style={{ flexShrink: 0 }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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

          {/* Active Focused Order Context Bar */}
          {currentActiveOrder && (
            <div 
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(90deg, rgba(132, 244, 59, 0.09) 0%, rgba(13, 22, 22, 0.98) 100%)',
                borderTop: '1px solid rgba(132, 244, 59, 0.25)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#080F0F',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  flexShrink: 0
                }}>
                  <img 
                    src={currentActiveOrder.imageUri || '/assets/air_max_95.jpg'} 
                    alt="Active Order" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--brand-green)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Focused:
                    </span>
                    <strong style={{ fontSize: '0.8rem', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentActiveOrder.productName || currentActiveOrder.name}
                    </strong>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: currentActiveOrder.currentState === 'REFUNDED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(132, 244, 59, 0.15)',
                      color: currentActiveOrder.currentState === 'REFUNDED' ? '#EF4444' : 'var(--brand-green)'
                    }}>
                      {currentActiveOrder.currentState || 'ESCROWED'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>
                    #{currentActiveOrder.tokenId || currentActiveOrder.id || '101'} • {currentActiveOrder.originalMerchant || currentActiveOrder.merchant || 'Flagship'}
                  </div>
                </div>
              </div>

              {/* Quick focused action chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {getOrderPin(currentActiveOrder) && (
                  <button
                    type="button"
                    onClick={() => handleCopyPin(getOrderPin(currentActiveOrder), currentActiveOrder.tokenId || 'focused')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: '#121E1E',
                      border: '1px solid rgba(132, 244, 59, 0.3)',
                      color: 'var(--brand-green)',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Copy pickup PIN"
                  >
                    <Key size={11} />
                    <span>PIN: {getOrderPin(currentActiveOrder)}</span>
                    {copiedPin === (currentActiveOrder.tokenId || 'focused') ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSendMessage(`Where is the pickup store for ${currentActiveOrder.productName || currentActiveOrder.name} and what are their operating hours?`, currentActiveOrder)}
                  disabled={isTyping}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: '#121C1C',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#D1D5DB',
                    fontSize: '0.7rem',
                    cursor: isTyping ? 'not-allowed' : 'pointer'
                  }}
                >
                  Store Info
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage(`Can I refund or cancel my order for ${currentActiveOrder.productName || currentActiveOrder.name} and how does escrow protection work?`, currentActiveOrder)}
                  disabled={isTyping}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: '#121C1C',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#D1D5DB',
                    fontSize: '0.7rem',
                    cursor: isTyping ? 'not-allowed' : 'pointer'
                  }}
                >
                  Refund / Escrow Rules
                </button>

                <button
                  type="button"
                  onClick={handleClearFocus}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#9CA3AF',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Clear focused order"
                >
                  <X size={12} />
                  <span>Clear Focus</span>
                </button>
              </div>
            </div>
          )}

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
                  const isSelected = Boolean(
                    (currentActiveOrder?.tokenId && String(currentActiveOrder.tokenId) === String(ord.tokenId)) ||
                    (currentActiveOrder?.id && String(currentActiveOrder.id) === String(ord.id)) ||
                    (currentActiveOrder?.productName && currentActiveOrder.productName === ord.productName) ||
                    (currentActiveOrder?.name && currentActiveOrder.name === ord.name)
                  );
                  const isCancelled = ord.currentState === 'REFUNDED';
                  return (
                    <div
                      key={ord.tokenId || ord.id || idx}
                      onClick={() => handleFocusOrder(ord)}
                      role="button"
                      tabIndex={0}
                      style={{
                        padding: '12px 14px',
                        background: isSelected ? 'rgba(132, 244, 59, 0.1)' : '#121C1C',
                        border: isSelected ? '1.5px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 16px rgba(132, 244, 59, 0.18)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <strong style={{ fontSize: '0.8rem', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ord.productName || ord.name}
                          </strong>
                          {isSelected && (
                            <span style={{
                              fontSize: '0.58rem',
                              fontWeight: 800,
                              color: 'var(--brand-green)',
                              background: 'rgba(132, 244, 59, 0.18)',
                              border: '1px solid rgba(132, 244, 59, 0.4)',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              flexShrink: 0
                            }}>
                              FOCUSED
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          color: isCancelled ? '#EF4444' : 'var(--brand-green)',
                          background: isCancelled ? 'rgba(239, 68, 68, 0.12)' : 'var(--brand-green-dim)',
                          padding: '1px 6px',
                          borderRadius: '6px',
                          flexShrink: 0
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
