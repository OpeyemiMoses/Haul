import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  ShieldCheck, 
  Store, 
  Package, 
  Key, 
  Copy, 
  Check, 
  MessageSquare, 
  QrCode,
  RotateCcw,
  Info,
  ChevronRight
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import { 
  sendGroqChatMessage, 
  getOrderPin 
} from '../lib/groqClient';
import { formatCurrency } from '../lib/formatters';

export default function AISupportModal({
  isOpen,
  onClose,
  user,
  authenticated = false,
  onLogin,
  onNavigateToSignIn,
  userStore = null,
  userRole = 'consumer',
  usdcBalance = 0,
  passports = [],
  activeOrderContext = null,
  onOpenInbox
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedPin, setCopiedPin] = useState(null);
  const [currentActiveOrder, setCurrentActiveOrder] = useState(null);

  const messagesEndRef = useRef(null);

  // Extract all user orders comprehensively from props and localStorage
  const userKey = user?.address || user?.email || user?.id || 'guest';
  const allUserOrders = React.useMemo(() => {
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
  }, [passports, user, isOpen]);

  // Reset and start a fresh chat session whenever modal opens or activeOrderContext changes
  useEffect(() => {
    if (!isOpen) {
      // Clear messages when closed so reopening starts fresh as requested
      setMessages([]);
      setInputText('');
      setCurrentActiveOrder(null);
      return;
    }

    const orderToFocus = activeOrderContext || null;
    setCurrentActiveOrder(orderToFocus);

    const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Member');
    let intro = '';

    if (orderToFocus) {
      const pin = getOrderPin(orderToFocus);
      intro = `Order Support: ${orderToFocus.productName || orderToFocus.name}

I have loaded your verified order details from your account:

• Order ID: \`#${orderToFocus.tokenId || orderToFocus.id || '101'}\`
• Escrow Status: ${orderToFocus.currentState || 'ESCROWED'}
• Pickup Pass PIN: \`${pin}\`
• Merchant: ${orderToFocus.originalMerchant || orderToFocus.merchant || 'Flagship Store'}

How can I assist you? Ask me for your pickup instructions, escrow guarantees, or how to claim your physical item.`;
    } else if (userStore || userRole === 'merchant') {
      intro = `Store Manager Companion

Welcome, ${displayName}! I'm your account and store operations assistant for ${userStore?.name || 'Your Flagship Store'}.

• Location: ${userStore?.fullAddress || userStore?.location || 'Storefront'}
• Operating Hours: ${userStore?.operatingHours || 'Mon - Sat: 9:00 AM - 7:00 PM'}
• Store Counter: You can verify customer pickup passes using their 4-digit PIN in your Counter tab.

How can I help you manage your store or account today?`;
    } else {
      const orderCount = allUserOrders.length;
      intro = `Hello ${displayName}

I'm your AI Support Companion with direct access to your verified orders and smart contract escrow on Monad.

• You currently have ${orderCount} active ${orderCount === 1 ? 'order' : 'orders'} in your Living Passport hub.
• Ask me: "What is my pickup PIN code?" to retrieve your verification pass.
• Ask me: "What is the status of my orders?" or "How does escrow work?"

How can I help you today?`;
    }

    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: intro,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderAttached: orderToFocus
      }
    ]);
  }, [isOpen, activeOrderContext, user, userStore, userRole]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (!isOpen) return null;

  // Handle Send Message
  const handleSendMessage = async (textToSend = null, overrideOrder = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setInputText('');

    const targetOrder = overrideOrder || currentActiveOrder;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const response = await sendGroqChatMessage({
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        context: {
          user,
          userRole,
          userStore,
          usdcBalance,
          passports: allUserOrders,
          activeOrder: targetOrder
        }
      });

      const assistantMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderAttached: targetOrder
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `I encountered a temporary connection issue. Your escrowed orders on Monad are completely safe. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // User explicitly clicks an order option card to pick which order they need
  const handlePickOrder = (chosenOrder) => {
    setCurrentActiveOrder(chosenOrder);
    const pin = getOrderPin(chosenOrder);
    const orderName = chosenOrder.productName || chosenOrder.name || 'Order';
    const orderId = chosenOrder.tokenId || chosenOrder.id || '101';
    handleSendMessage(`What is my pickup PIN verification code for ${orderName} (#${orderId})?`, chosenOrder);
  };

  const handleCopyPin = (pin) => {
    if (!pin) return;
    navigator.clipboard?.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2500);
  };

  const handleResetChat = () => {
    setMessages([]);
    setCurrentActiveOrder(null);
    setInputText('');
    const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Member');
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        role: 'assistant',
        content: `### Fresh Session Started\n\nHello **${displayName}**, I'm ready for any questions about your orders, pickup PIN codes, or smart escrow!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Helper to render rich cards and structured elements rather than raw plain text
  const renderFormattedContent = (content, orderAttached) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements = [];
    let bulletList = [];

    const flushBulletList = (keyPrefix) => {
      if (bulletList.length > 0) {
        elements.push(
          <div key={`list-${keyPrefix}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0' }}>
            {bulletList.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.84rem' }}>
                <span style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: 'var(--brand-green)', 
                  marginTop: '7px', 
                  flexShrink: 0,
                  boxShadow: '0 0 6px var(--brand-green)'
                }} />
                <span style={{ color: '#E5E7EB', lineHeight: 1.5 }}>
                  {formatInlineText(item)}
                </span>
              </div>
            ))}
          </div>
        );
        bulletList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Heading 3: ### Header
      if (trimmed.startsWith('### ')) {
        flushBulletList(index);
        elements.push(
          <div 
            key={`h3-${index}`} 
            style={{ 
              fontSize: '0.96rem', 
              fontWeight: 800, 
              color: '#FFFFFF', 
              margin: '10px 0 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} color="var(--brand-green)" />
            <span>{trimmed.replace('### ', '')}</span>
          </div>
        );
      }
      // Blockquote: > Alert / Tip
      else if (trimmed.startsWith('> ')) {
        flushBulletList(index);
        elements.push(
          <div 
            key={`quote-${index}`}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(132, 244, 59, 0.08)',
              borderLeft: '3px solid var(--brand-green)',
              margin: '10px 0',
              fontSize: '0.8rem',
              color: '#D1D5DB',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}
          >
            <Info size={15} color="var(--brand-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{formatInlineText(trimmed.replace('> ', ''))}</div>
          </div>
        );
      }
      // Bullet list item: * or -
      else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        bulletList.push(trimmed.substring(2));
      }
      // Blank line
      else if (!trimmed) {
        flushBulletList(index);
      }
      // Standard Paragraph
      else {
        flushBulletList(index);
        elements.push(
          <p key={`p-${index}`} style={{ margin: '6px 0', color: '#E5E7EB', fontSize: '0.84rem', lineHeight: 1.6 }}>
            {formatInlineText(trimmed)}
          </p>
        );
      }
    });

    flushBulletList('final');
    return elements;
  };

  // Format bold (**...**) and code (`...`) within lines
  const formatInlineText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#FFFFFF', fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const codeVal = part.slice(1, -1);
        const isPin = /^\d{4}$/.test(codeVal.trim());
        return (
          <code 
            key={i} 
            style={{ 
              background: isPin ? 'rgba(132, 244, 59, 0.15)' : 'rgba(255, 255, 255, 0.08)', 
              color: isPin ? 'var(--brand-green)' : '#93C5FD', 
              padding: '2px 7px', 
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              border: isPin ? '1px solid rgba(132, 244, 59, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
              letterSpacing: isPin ? '0.05em' : 'normal'
            }}
          >
            {codeVal}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <ModalPortal>
      <div className="modal-overlay ai-support-modal-overlay" onClick={onClose} style={{ zIndex: 100010 }}>
        <div
          className="custom-scrollbar ai-chat-modal-window"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '660px',
            width: '100%',
            height: '84vh',
            maxHeight: '760px',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(11, 17, 17, 0.94)',
            backdropFilter: 'blur(45px) saturate(210%)',
            WebkitBackdropFilter: 'blur(45px) saturate(210%)',
            border: '1px solid rgba(132, 244, 59, 0.28)',
            borderRadius: '26px',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 35px 90px rgba(0, 0, 0, 0.9), 0 0 50px rgba(132, 244, 59, 0.12)',
            color: '#FFFFFF',
            position: 'relative',
            margin: '0 auto',
            overflow: 'hidden'
          }}
        >
          {/* HEADER BAR */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0) 100%)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(132, 244, 59, 0.2) 0%, rgba(132, 244, 59, 0.05) 100%)',
                border: '1.5px solid var(--brand-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 0 15px rgba(132, 244, 59, 0.25)'
              }}>
                <Bot size={20} color="var(--brand-green)" />
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--brand-green)',
                  boxShadow: '0 0 8px var(--brand-green)'
                }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    Hual AI Support
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(132, 244, 59, 0.15)',
                    border: '1px solid rgba(132, 244, 59, 0.35)',
                    color: 'var(--brand-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--brand-green)' }} />
                    <span>Online Companion</span>
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                  {allUserOrders.length} Verified {allUserOrders.length === 1 ? 'Order' : 'Orders'} on Account
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleResetChat}
                style={{
                  height: '32px',
                  padding: '0 10px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                title="Start a fresh chat session"
              >
                <RotateCcw size={12} />
                <span>New Chat</span>
              </button>
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* AUTHENTICATION GATE CHECK */}
          {!authenticated ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(132, 244, 59, 0.12)',
                border: '1.5px solid var(--brand-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
                boxShadow: '0 0 25px rgba(132, 244, 59, 0.2)'
              }}>
                <Key size={30} color="var(--brand-green)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF' }}>
                Account Authentication Required
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#9CA3AF', maxWidth: '420px', margin: '0 0 24px', lineHeight: 1.5 }}>
                AI Support is personalized for your account. Please sign in or connect your wallet so the companion can retrieve your pending orders, PIN codes, and escrow details.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    onClose();
                    if (onLogin) onLogin();
                    else if (onNavigateToSignIn) onNavigateToSignIn();
                  }}
                  className="btn-pill-primary"
                  style={{ padding: '12px 28px', fontSize: '0.88rem', fontWeight: 800 }}
                >
                  Sign In / Connect Wallet
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* CLEAN ORDER FOCUS BANNER IF AN ORDER IS ACTIVE */}
              {currentActiveOrder && (
                <div style={{
                  padding: '12px 18px',
                  background: 'linear-gradient(90deg, rgba(132, 244, 59, 0.08) 0%, rgba(8, 14, 14, 0.95) 100%)',
                  borderBottom: '1px solid rgba(132, 244, 59, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      flexShrink: 0
                    }}>
                      <img 
                        src={currentActiveOrder.imageUri || '/assets/air_max_95.jpg'} 
                        alt="Product" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentActiveOrder.productName || currentActiveOrder.name}
                        </span>
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '1px 8px',
                          borderRadius: '999px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#F59E0B',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          {currentActiveOrder.currentState || 'ESCROWED'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                        Order #{currentActiveOrder.tokenId || currentActiveOrder.id || '101'} • {currentActiveOrder.originalMerchant || currentActiveOrder.merchant || 'Flagship'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* PIN Quick Pill */}
                    {getOrderPin(currentActiveOrder) && (
                      <div 
                        onClick={() => handleCopyPin(getOrderPin(currentActiveOrder))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          background: '#080F0F',
                          border: '1px solid var(--brand-green)',
                          color: 'var(--brand-green)',
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 0 10px rgba(132, 244, 59, 0.15)'
                        }}
                        title="Click to copy pickup verification PIN"
                      >
                        <Key size={12} />
                        <span>PIN: {getOrderPin(currentActiveOrder)}</span>
                        {copiedPin === getOrderPin(currentActiveOrder) ? <Check size={12} /> : <Copy size={12} />}
                      </div>
                    )}

                    {/* Clear Focus Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentActiveOrder(null)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        color: '#9CA3AF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Clear focused order"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* MESSAGES DISPLAY CONTAINER (RICH CARD FORMATTING) */}
              <div 
                className="custom-scrollbar"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  const lower = m.content.toLowerCase();
                  const mentionsStore = lower.includes('message the store') || lower.includes('message store') || lower.includes('direct chat with the store');
                  const asksWhichOrder = 
                    lower.includes('which order do you need') || 
                    lower.includes('which one would you like') ||
                    lower.includes('tap any order card') ||
                    lower.includes('need assistance with a specific order') ||
                    lower.includes('account orders & escrow summary');
                  const targetStoreName = currentActiveOrder?.originalMerchant || currentActiveOrder?.merchant || 'the store';
                  const isOwnStoreOrder = Boolean(
                    userStore && targetStoreName && (
                      (userStore.name && targetStoreName.toLowerCase() === userStore.name.toLowerCase()) ||
                      (userStore.id && currentActiveOrder?.merchantId && String(userStore.id) === String(currentActiveOrder.merchantId)) ||
                      (user?.address && currentActiveOrder?.seller && user.address.toLowerCase() === currentActiveOrder.seller.toLowerCase())
                    )
                  );

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: isUser ? '80%' : '92%',
                        alignSelf: isUser ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {/* Sender row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '5px',
                        fontSize: '0.68rem',
                        color: isUser ? '#9CA3AF' : 'var(--brand-green)'
                      }}>
                        {isUser ? (
                          <span>You</span>
                        ) : (
                          <>
                            <Sparkles size={11} color="var(--brand-green)" />
                            <span style={{ fontWeight: 800 }}>Hual AI Concierge</span>
                          </>
                        )}
                        <span style={{ color: '#4B5563' }}>• {m.timestamp}</span>
                      </div>

                      {/* Card Bubble */}
                      <div style={{
                        padding: '16px 20px',
                        borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: isUser 
                          ? 'linear-gradient(135deg, rgba(132, 244, 59, 0.22) 0%, rgba(132, 244, 59, 0.1) 100%)' 
                          : 'rgba(16, 24, 24, 0.88)',
                        border: isUser 
                          ? '1px solid rgba(132, 244, 59, 0.35)' 
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#FFFFFF',
                        fontSize: '0.84rem',
                        lineHeight: 1.6,
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        {isUser ? (
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {m.content}
                          </div>
                        ) : (
                          renderFormattedContent(m.content, m.orderAttached)
                        )}

                        {/* INTERACTIVE ORDER PICKER BUTTONS (WHEN AI ASKS WHICH ORDER) */}
                        {!isUser && asksWhichOrder && allUserOrders && allUserOrders.length > 0 && (
                          <div style={{
                            marginTop: '14px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>
                              Tap to select your order:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                              {allUserOrders.map((ord, oIdx) => {
                                const isSelected = Boolean(
                                  (currentActiveOrder?.tokenId && String(currentActiveOrder.tokenId) === String(ord.tokenId)) ||
                                  (currentActiveOrder?.id && String(currentActiveOrder.id) === String(ord.id)) ||
                                  (currentActiveOrder?.productName && currentActiveOrder.productName === ord.productName) ||
                                  (currentActiveOrder?.name && currentActiveOrder.name === ord.name)
                                );
                                return (
                                  <button
                                    key={ord.tokenId || ord.id || oIdx}
                                    onClick={() => handlePickOrder(ord)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '8px 12px',
                                      borderRadius: '12px',
                                      background: isSelected ? 'rgba(132, 244, 59, 0.14)' : 'rgba(255, 255, 255, 0.05)',
                                      border: isSelected ? '1.5px solid var(--brand-green)' : '1px solid rgba(132, 244, 59, 0.3)',
                                      color: '#FFFFFF',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      transition: 'all 0.2s',
                                      boxShadow: isSelected ? '0 0 12px rgba(132, 244, 59, 0.2)' : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = 'rgba(132, 244, 59, 0.12)';
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    }}
                                  >
                                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden', background: '#080F0F', flexShrink: 0 }}>
                                      <img src={ord.imageUri || '/assets/air_max_95.jpg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {ord.productName || ord.name}
                                        </span>
                                        {isSelected && (
                                          <span style={{
                                            fontSize: '0.58rem',
                                            fontWeight: 800,
                                            color: 'var(--brand-green)',
                                            background: 'rgba(132, 244, 59, 0.2)',
                                            border: '1px solid rgba(132, 244, 59, 0.4)',
                                            padding: '1px 4px',
                                            borderRadius: '4px'
                                          }}>
                                            FOCUSED
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: '0.66rem', color: 'var(--brand-green)' }}>
                                        #{ord.tokenId || ord.id} • {ord.currentState || 'ESCROWED'}
                                      </div>
                                    </div>
                                    <ChevronRight size={13} color="var(--brand-green)" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Direct Action: Message Store Button */}
                        {!isUser && mentionsStore && !isOwnStoreOrder && (
                          <div style={{
                            marginTop: '14px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <button
                              onClick={() => {
                                onClose();
                                if (onOpenInbox) {
                                  onOpenInbox({ name: targetStoreName }, currentActiveOrder);
                                }
                              }}
                              className="btn-pill-primary btn-pill-sm"
                              style={{ padding: '8px 16px', fontSize: '0.78rem', fontWeight: 800, gap: '6px' }}
                            >
                              <MessageSquare size={13} />
                              <span>Message {targetStoreName} Directly</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
                    <div style={{
                      padding: '10px 18px',
                      borderRadius: '16px',
                      background: 'rgba(16, 24, 24, 0.85)',
                      border: '1px solid rgba(132, 244, 59, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--brand-green)',
                      fontSize: '0.8rem'
                    }}>
                      <Sparkles size={14} className="animate-pulse" />
                      <span>AI Concierge is answering...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK PROMPT CHIPS */}
              <div style={{
                padding: '8px 16px',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(0, 0, 0, 0.2)',
                flexShrink: 0
              }}>
                <button
                  onClick={() => handleSendMessage("What is my pickup PIN verification code?")}
                  className="quick-chip"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#E5E7EB',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Key size={11} color="var(--brand-green)" />
                  <span>My Pickup PIN</span>
                </button>

                <button
                  onClick={() => handleSendMessage("What is the status of my orders?")}
                  className="quick-chip"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#E5E7EB',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Package size={11} color="#60A5FA" />
                  <span>Order Statuses</span>
                </button>

                <button
                  onClick={() => handleSendMessage("How does smart contract escrow protect my payment?")}
                  className="quick-chip"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#E5E7EB',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <ShieldCheck size={11} color="var(--brand-green)" />
                  <span>Escrow & Safety</span>
                </button>

                <button
                  onClick={() => handleSendMessage("How do I cancel an order and get a 100% refund?")}
                  className="quick-chip"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#E5E7EB',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <RotateCcw size={11} color="#F87171" />
                  <span>Refund Policy</span>
                </button>

                {(userStore || userRole === 'merchant') && (
                  <button
                    onClick={() => handleSendMessage("Store manager summary: overview of my store operations and pickups")}
                    className="quick-chip"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      background: 'rgba(132, 244, 59, 0.12)',
                      border: '1px solid rgba(132, 244, 59, 0.35)',
                      color: 'var(--brand-green)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Store size={11} />
                    <span>Store Manager Mode</span>
                  </button>
                )}

                <button
                  onClick={() => handleSendMessage("Do you have size 10 in stock?")}
                  className="quick-chip"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#E5E7EB',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <MessageSquare size={11} color="#FBBF24" />
                  <span>Ask Store for Sizing</span>
                </button>
              </div>

              {/* INPUT BAR */}
              <div 
                className="ai-chat-input-bar"
                style={{
                  padding: '12px 16px',
                  paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(7, 12, 12, 0.98)',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  flexShrink: 0
                }}
              >
                <input
                  type="text"
                  placeholder={currentActiveOrder ? `Ask about ${currentActiveOrder.productName || 'this order'}, PIN, or escrow...` : "Ask about your orders, PIN code, escrow, shipping..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  disabled={isTyping}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '0.86rem',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--brand-green)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isTyping}
                  className="btn-pill-primary"
                  style={{
                    padding: '12px 20px',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    opacity: (!inputText.trim() || isTyping) ? 0.5 : 1,
                    cursor: (!inputText.trim() || isTyping) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Send size={15} />
                  <span>Send</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
