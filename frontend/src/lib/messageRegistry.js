/**
 * Hual Universal Cross-User & Merchant Messaging Registry
 * Facilitates bidirectional messaging between consumers and store merchants.
 */

const STORAGE_KEY = 'hual_shared_conversations_v2';

export const DEFAULT_STORE_CONVERSATIONS = [];

export function getAllSharedConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Purge any legacy mock store conversations and demo placeholders
    const MOCK_STORE_IDS = new Set([
      'nike-lagos', 
      'sony-flagship', 
      'apple-boutique', 
      'teenage-engineering',
      'puma-lekki',
      'adidas-vi',
      'store-nike-lagos',
      'store-sony-flagship',
      'store-apple-boutique'
    ]);

    const filtered = parsed.filter(c => {
      if (!c) return false;
      if (MOCK_STORE_IDS.has(c.storeId)) return false;
      const sName = (c.storeName || '').toLowerCase();
      if (
        sName.includes('nike') || 
        sName.includes('sony') || 
        sName.includes('apple') || 
        sName.includes('teenage engineering') || 
        sName.includes('adidas') ||
        sName.includes('puma')
      ) return false;
      if (c.buyerIdentifier === 'default' || c.buyerIdentifier === 'consumer') return false;
      return true;
    });

    if (filtered.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch (err) {
    console.warn('Error reading shared conversations:', err);
    return [];
  }
}

export function saveSharedConversations(conversations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hual_messages_updated', { detail: { conversations } }));
    }
  } catch (err) {
    console.warn('Error saving shared conversations:', err);
  }
}

/**
 * Get buyer conversations and store inquiries for a user.
 */
export function getConversationsForUser(userIdentifier, userStore = null) {
  const all = getAllSharedConversations();
  if (!userIdentifier || userIdentifier === 'default' || userIdentifier === 'guest' || userIdentifier === 'consumer') {
    return { buyerConvs: [], storeConvs: [], all: [] };
  }
  const buyerId = userIdentifier.toLowerCase();
  const storeId = userStore?.id || null;

  // 1. Conversations where this user is buying/asking questions
  const buyerConvs = all.filter(c => {
    const cBuyer = (c.buyerIdentifier || '').toLowerCase();
    return cBuyer === buyerId;
  });

  // 2. Inquiries sent by customers to this user's store
  const storeConvs = storeId ? all.filter(c => c.storeId === storeId) : [];

  return { buyerConvs, storeConvs, all };
}

/**
 * Customer sends a message to a store with explicit item listing metadata if inquiry is from a product.
 */
export function sendCustomerMessage({ store, buyer, text, product = null }) {
  if (!store || !text.trim()) return null;

  // Prevent store owner from messaging their own store
  const storeOwner = store.ownerAddress || store.owner;
  const buyerAddr = buyer?.address;
  if (storeOwner && buyerAddr && storeOwner.toLowerCase() === buyerAddr.toLowerCase()) {
    console.warn("Store owners cannot message their own store.");
    return null;
  }

  const all = getAllSharedConversations();
  const storeId = store.id || `store-${(store.name || 'custom').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const buyerId = buyer?.address || buyer?.email || buyer?.id || 'guest';
  const buyerName = buyer?.name || (buyer?.email ? buyer.email.split('@')[0] : 'Customer');
  const convId = `conv-${storeId}-${buyerId.toLowerCase()}`;

  const isItemListing = Boolean(product);
  const formattedProduct = isItemListing ? {
    id: product.id,
    productId: product.productId,
    name: product.name,
    brand: product.brand || 'Authentic Brand',
    imageUri: product.imageUri || product.image || '/assets/hual_pwa_icon.png',
    priceUsd: product.priceUsd,
    stock: product.stock
  } : null;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newMsg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender: 'user',
    senderName: buyerName,
    text: text.trim(),
    timestamp,
    createdAt: Date.now(),
    isListingInquiry: isItemListing,
    inquiryType: isItemListing ? 'listing' : 'general',
    product: formattedProduct
  };

  let existingIndex = all.findIndex(c => 
    c.id === convId || 
    (c.storeId === storeId && (c.buyerIdentifier?.toLowerCase() === buyerId.toLowerCase() || c.buyerIdentifier === 'default'))
  );

  let updatedConv;

  if (existingIndex >= 0) {
    const target = all[existingIndex];
    updatedConv = {
      ...target,
      id: convId,
      buyerIdentifier: buyerId,
      buyerName,
      unreadForStore: (target.unreadForStore || 0) + 1,
      lastMessageTime: 'Just now',
      inquiryType: isItemListing ? 'listing' : (target.inquiryType || 'general'),
      pinnedProduct: formattedProduct || target.pinnedProduct || null,
      messages: [...target.messages, newMsg]
    };
    all[existingIndex] = updatedConv;
  } else {
    updatedConv = {
      id: convId,
      storeId,
      storeName: store.name || 'Merchant Store',
      storeHandle: store.handle || `@${storeId}`,
      storeAvatar: store.avatar || '/assets/hual_pwa_icon.png',
      storeLocation: store.location || store.fullAddress || 'Victoria Island, Lagos',
      verified: Boolean(store.verified),
      chatRep: store.chatRep || `${store.name ? store.name.split(' ')[0] : 'Lead'} (Store Representative)`,
      buyerIdentifier: buyerId,
      buyerName,
      unreadForBuyer: 0,
      unreadForStore: 1,
      lastMessageTime: 'Just now',
      inquiryType: isItemListing ? 'listing' : 'general',
      pinnedProduct: formattedProduct,
      messages: [newMsg]
    };
    all.unshift(updatedConv);
  }

  saveSharedConversations(all);
  return updatedConv;
}

/**
 * Merchant / Store Owner replies to a customer inquiry.
 */
export function sendMerchantReply({ convId, merchantName, text }) {
  if (!convId || !text.trim()) return null;

  const all = getAllSharedConversations();
  const idx = all.findIndex(c => c.id === convId);
  if (idx < 0) return null;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const replyMsg = {
    id: `merch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender: 'merchant',
    senderName: merchantName || 'Store Owner',
    text: text.trim(),
    timestamp,
    createdAt: Date.now()
  };

  const updatedConv = {
    ...all[idx],
    messages: [...all[idx].messages, replyMsg],
    unreadForBuyer: (all[idx].unreadForBuyer || 0) + 1,
    unreadForStore: 0,
    lastMessageTime: 'Just now'
  };

  all[idx] = updatedConv;
  saveSharedConversations(all);
  return updatedConv;
}

/**
 * Mark conversation as read for buyer or merchant.
 */
export function markConversationRead(convId, role = 'buyer') {
  const all = getAllSharedConversations();
  const idx = all.findIndex(c => c.id === convId);
  if (idx < 0) return;

  if (role === 'buyer') {
    all[idx].unreadForBuyer = 0;
  } else {
    all[idx].unreadForStore = 0;
  }
  saveSharedConversations(all);
}
