/**
 * Hual Universal Cross-User & Merchant Messaging Registry
 * Facilitates bidirectional messaging between consumers and store merchants.
 */

const STORAGE_KEY = 'hual_shared_conversations_v2';

export const DEFAULT_STORE_CONVERSATIONS = [
  {
    id: 'conv-nike-lagos',
    storeId: 'nike-lagos',
    storeName: 'Nike Lagos Pop-Up',
    storeHandle: '@nike.lagos',
    storeAvatar: '/assets/air_max_95.jpg',
    storeLocation: 'Victoria Island, Lagos',
    verified: true,
    chatRep: 'Tade (Nike Store Lead • Online)',
    buyerIdentifier: 'default',
    buyerName: 'You',
    unreadForBuyer: 1,
    unreadForStore: 0,
    lastMessageTime: 'Just now',
    messages: [
      { id: '1', sender: 'merchant', senderName: 'Tade (Nike Lead)', text: 'Hello! Welcome to the Nike Lagos Pop-Up vault on Hual. Are you looking to reserve the Air Max 95 or schedule an in-store private fitting?', timestamp: '10:14 AM' },
      { id: '2', sender: 'user', senderName: 'You', text: 'Hi! Is the Neon colorway in Size US 10 available for in-store pickup today in Victoria Island?', timestamp: '10:15 AM' },
      { id: '3', sender: 'merchant', senderName: 'Tade (Nike Lead)', text: 'Yes! We have 2 authenticated pairs remaining in our physical vault. Once you checkout with Monad Escrow, your living digital passport is minted and your pair will be bagged for collection in 25 minutes.', timestamp: '10:16 AM' }
    ],
    pinnedProduct: {
      productId: '1',
      name: 'Nike Air Max 95 OG "Neon"',
      priceUsd: 190,
      imageUri: '/assets/air_max_95.jpg',
      brand: 'Nike'
    }
  },
  {
    id: 'conv-sony-flagship',
    storeId: 'sony-flagship',
    storeName: 'Sony Flagship Lounge',
    storeHandle: '@sony.official',
    storeAvatar: '/assets/sony_passport.jpg',
    storeLocation: 'Ikoyi, Lagos',
    verified: true,
    chatRep: 'Kemi (Pro Audio Specialist • Online)',
    buyerIdentifier: 'default',
    buyerName: 'You',
    unreadForBuyer: 0,
    unreadForStore: 0,
    lastMessageTime: '24m ago',
    messages: [
      { id: '1', sender: 'merchant', senderName: 'Kemi (Sony Audio)', text: 'Greetings from the Sony Master Studio in Ikoyi. All WH-1000XM5 headphones come with 12 months verified onchain warranty.', timestamp: '09:30 AM' },
      { id: '2', sender: 'user', senderName: 'You', text: 'Does courier delivery support express same-day to Lekki?', timestamp: '09:42 AM' },
      { id: '3', sender: 'merchant', senderName: 'Kemi (Sony Audio)', text: 'Yes, our armored courier dispatches same-day across Lagos within 2 hours.', timestamp: '09:44 AM' }
    ],
    pinnedProduct: {
      productId: '2',
      name: 'Sony WH-1000XM5 Noise Canceling',
      priceUsd: 399,
      imageUri: '/assets/sony_passport.jpg',
      brand: 'Sony'
    }
  },
  {
    id: 'conv-apple-boutique',
    storeId: 'apple-boutique',
    storeName: 'Apple Verified Boutique',
    storeHandle: '@apple.lagos',
    storeAvatar: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&q=80',
    storeLocation: 'The Palms Mall, Lekki / VI Expressway',
    verified: true,
    chatRep: 'Chidi (Apple Genius • Online)',
    buyerIdentifier: 'default',
    buyerName: 'You',
    unreadForBuyer: 0,
    unreadForStore: 0,
    lastMessageTime: '2h ago',
    messages: [
      { id: '1', sender: 'merchant', senderName: 'Chidi (Apple Lead)', text: 'Welcome to Apple Authorized Lagos! All devices have live AppleCare sync with verifiable hardware passports.', timestamp: '08:15 AM' }
    ],
    pinnedProduct: {
      productId: '3',
      name: 'Apple Vision Pro Spatial Computer (512GB)',
      priceUsd: 3499,
      imageUri: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&q=80',
      brand: 'Apple'
    }
  },
  {
    id: 'conv-teenage-engineering',
    storeId: 'teenage-engineering',
    storeName: 'Teenage Engineering Lab',
    storeHandle: '@teenage.design',
    storeAvatar: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&q=80',
    storeLocation: 'Lekki Phase 1, Lagos',
    verified: true,
    chatRep: 'Jonas (Synthesizer Architect • Online)',
    buyerIdentifier: 'default',
    buyerName: 'You',
    unreadForBuyer: 0,
    unreadForStore: 0,
    lastMessageTime: 'Yesterday',
    messages: [
      { id: '1', sender: 'merchant', senderName: 'Jonas (Teenage Lab)', text: 'Boutique synthesizers in stock. Let us know if you want a live audio demo before picking up.', timestamp: 'Yesterday' }
    ],
    pinnedProduct: {
      productId: '4',
      name: 'Teenage Engineering OP-1 Field Synthesizer',
      priceUsd: 1999,
      imageUri: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=85',
      brand: 'Teenage Engineering'
    }
  }
];

export function getAllSharedConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STORE_CONVERSATIONS));
      return DEFAULT_STORE_CONVERSATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STORE_CONVERSATIONS;
  } catch (err) {
    console.warn('Error reading shared conversations:', err);
    return DEFAULT_STORE_CONVERSATIONS;
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
  const buyerId = (userIdentifier || 'default').toLowerCase();
  const storeId = userStore?.id || null;

  // 1. Conversations where this user is buying/asking questions
  const buyerConvs = all.filter(c => {
    const cBuyer = (c.buyerIdentifier || 'default').toLowerCase();
    // Default system stores are accessible to everyone
    return cBuyer === buyerId || cBuyer === 'default';
  });

  // 2. Inquiries sent by customers to this user's store
  const storeConvs = storeId ? all.filter(c => c.storeId === storeId) : [];

  return { buyerConvs, storeConvs, all };
}

/**
 * Customer sends a message to a store.
 */
export function sendCustomerMessage({ store, buyer, text, product = null }) {
  if (!store || !text.trim()) return null;

  const all = getAllSharedConversations();
  const storeId = store.id || `store-${store.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const buyerId = buyer?.address || buyer?.email || buyer?.id || 'guest';
  const buyerName = buyer?.name || (buyer?.email ? buyer.email.split('@')[0] : 'Customer');
  const convId = `conv-${storeId}-${buyerId.toLowerCase()}`;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newMsg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender: 'user',
    senderName: buyerName,
    text: text.trim(),
    timestamp,
    createdAt: Date.now()
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
      id: convId, // anchor to explicit buyer id
      buyerIdentifier: buyerId,
      buyerName,
      unreadForStore: (target.unreadForStore || 0) + 1,
      lastMessageTime: 'Just now',
      pinnedProduct: product || target.pinnedProduct,
      messages: [...target.messages, newMsg]
    };
    all[existingIndex] = updatedConv;
  } else {
    updatedConv = {
      id: convId,
      storeId,
      storeName: store.name || 'Merchant Store',
      storeHandle: store.handle || `@${storeId}`,
      storeAvatar: store.avatar || '/assets/air_max_95.jpg',
      storeLocation: store.location || store.fullAddress || 'Victoria Island, Lagos',
      verified: Boolean(store.verified),
      chatRep: store.chatRep || `${store.name ? store.name.split(' ')[0] : 'Lead'} (Store Representative)`,
      buyerIdentifier: buyerId,
      buyerName,
      unreadForBuyer: 0,
      unreadForStore: 1,
      lastMessageTime: 'Just now',
      pinnedProduct: product,
      messages: [
        newMsg
      ]
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
