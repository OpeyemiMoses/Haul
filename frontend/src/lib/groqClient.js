import { CURATED_CATALOG, VERIFIED_MERCHANTS } from './catalogData';

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Recommended)', provider: 'Groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra-Fast)', provider: 'Groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k Context)', provider: 'Groq' }
];

export function getGroqApiKey() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hual_groq_api_key');
    if (saved && saved.trim()) return saved.trim();
  }
  return import.meta.env.VITE_GROQ_API_KEY || '';
}

export function saveGroqApiKey(key) {
  if (typeof window !== 'undefined') {
    if (!key || !key.trim()) {
      localStorage.removeItem('hual_groq_api_key');
    } else {
      localStorage.setItem('hual_groq_api_key', key.trim());
    }
  }
}

/**
 * Format order PIN consistently
 */
export function getOrderPin(passport) {
  if (!passport) return null;
  if (passport.pickupPIN) return String(passport.pickupPIN);
  const tokenNum = Number(passport.tokenId || passport.id || 4821);
  return String((Math.abs(tokenNum * 7919 + 31415)) % 9000 + 1000);
}

/**
 * Construct comprehensive system prompt incorporating live account state,
 * order inventory, entire site catalog, store directory, escrow balances, and site policies.
 */
export function buildSystemPrompt(context) {
  const {
    user,
    userRole,
    userStore,
    usdcBalance = 0,
    passports = [],
    activeOrder = null,
    catalog = CURATED_CATALOG,
    merchants = VERIFIED_MERCHANTS
  } = context;

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Valued Member');
  const userAddr = user?.address || '0x...';

  // Format entire site catalog
  const catalogList = (catalog && catalog.length > 0 ? catalog : CURATED_CATALOG);
  const catalogSummary = catalogList.map((item, idx) => {
    const sizes = Array.isArray(item.sizes) ? item.sizes.join(', ') : (item.sizes || 'Standard');
    return `[Product #${idx + 1}]
- Name: ${item.name}
- Brand: ${item.brand || 'Luxury'}
- Category: ${item.category || 'General'}
- Price: $${Number(item.priceUsd || 0).toLocaleString()} USDC
- Sizes: ${sizes}
- Color: ${item.color || 'Standard'}
- Stock Available: ${item.stock ?? 5} units
- Merchant Store: ${item.merchant || 'Verified Flagship'} (${item.merchantLocation || 'Lagos, Nigeria'})
- Serial: ${item.serialNumber || 'SN-HUAL'}
- Pickup: ${item.allowsPickup !== false ? 'Yes (Ready in 30 mins)' : 'No'} | Delivery: ${item.allowsDelivery !== false ? 'Yes (2-4 hrs courier)' : 'No'}
- Description: ${item.description || ''}`;
  }).join('\n\n');

  // Format verified merchants directory
  const merchantsList = (merchants && merchants.length > 0 ? merchants : VERIFIED_MERCHANTS);
  const storesSummary = merchantsList.map((m, idx) => {
    return `[Store #${idx + 1}: ${m.name}]
- Handle: ${m.handle}
- Category: ${m.category}
- Physical Address: ${m.fullAddress || m.location || 'Victoria Island, Lagos'}
- Operating Hours: ${m.operatingHours || 'Mon - Sat: 9:00 AM - 7:00 PM'} (Open: ${m.openingTime || '09:00 AM'}, Close: ${m.closingTime || '07:00 PM'})
- Contact Phone: ${m.phone || '+234 1 800 4825'}
- Pickup Window: ${m.pickupTime || 'Ready in 30 mins'}
- Courier Dispatch: ${m.deliveryTime || '2-4 hrs express courier'}
- Description: ${m.description || ''}`;
  }).join('\n\n');

  // Summarize orders
  let ordersSummary = 'No active orders registered on account yet.';
  if (passports && passports.length > 0) {
    ordersSummary = passports.map((p, index) => {
      const pin = getOrderPin(p);
      const isCollected = 
        p.currentState === 'COLLECTED' || 
        p.currentState === 'ACTIVE_OWNERSHIP' ||
        p.currentState === 'DELIVERED' ||
        p.currentState === 'COMPLETED';
      const isDispatched = p.deliveryMethod === 'dispatch' || p.deliveryMethod === 'delivery' || p.currentState === 'IN_TRANSIT';
      const isRefunded = p.currentState === 'REFUNDED';
      
      let statusStr = 'ESCROWED (Pending In-Store Pickup)';
      if (isRefunded) statusStr = 'CANCELLED & 100% REFUNDED (Cannot be reviewed)';
      else if (isCollected) statusStr = 'COLLECTED & VERIFIED IN HAND (Completed)';
      else if (isDispatched) statusStr = 'DISPATCHED TO COURIER (In Transit)';

      return `[User Order #${index + 1}]
- Product: ${p.productName || p.name || 'Luxury Item'} (${p.productBrand || p.brand || 'Verified'})
- Token ID / Order ID: ${p.tokenId || p.id || 'N/A'}
- Serial Number: ${p.serialNumber || 'N/A'}
- Merchant / Store: ${p.originalMerchant || p.merchant || 'Flagship Store'}
- Escrow Status: ${statusStr}
- Physical Pickup PIN / Order Verification Code: ${pin}
- Original Value: $${Number(p.originalPriceUsd || p.priceUsd || 0).toLocaleString()} USDC
- Monad Tx Hash: ${p.paymentTxRef || '0x...'}
- Warranty: ${p.daysRemainingWarranty || 365} days`;
    }).join('\n\n');
  }

  // Active focused order details
  let activeOrderSection = '';
  if (activeOrder) {
    const activePin = getOrderPin(activeOrder);
    activeOrderSection = `
CURRENTLY FOCUSED ORDER QUERY:
The user specifically opened support about this order:
- Product: ${activeOrder.productName || activeOrder.name}
- Token ID / Order ID: ${activeOrder.tokenId || activeOrder.id}
- Serial: ${activeOrder.serialNumber || 'N/A'}
- Merchant: ${activeOrder.originalMerchant || activeOrder.merchant}
- Current Escrow Status: ${activeOrder.currentState || 'ESCROWED'}
- Physical Pickup PIN: ${activePin}
- Monad Tx Reference: ${activeOrder.paymentTxRef || '0x...'}
Focus primarily on answering inquiries about this order when relevant.`;
  }

  // Store Manager context (if user owns a store)
  let storeManagerSection = '';
  if (userStore || userRole === 'merchant') {
    storeManagerSection = `
STORE MANAGER COMPANION MODE ACTIVE:
The user is a verified merchant / store owner!
Store Profile:
- Store Name: ${userStore?.name || 'Verified Flagship'}
- Handle: ${userStore?.handle || '@flagship.hual'}
- Location & Address: ${userStore?.fullAddress || userStore?.location || 'Storefront'}
- Operating Hours: ${userStore?.operatingHours || 'Mon - Sat: 9:00 AM - 7:00 PM'} (Open: ${userStore?.openingTime || '09:00 AM'}, Close: ${userStore?.closingTime || '07:00 PM'})
- Store Contact Phone: ${userStore?.phone || '+234 1 800 4825'}
- Pickup Window: ${userStore?.pickupTime || 'Ready in 30 mins'}
You can assist this user as a Store Operations Manager (advise on customer pickup validation, handling store counter QR scans, adjusting operating hours, and customer relations).`;
  }

  return `You are Hual AI Companion (Concierge), the official intelligent companion for the Hual Luxury & Authentic Goods Web3 Marketplace.

USER PROFILE:
- Name: ${displayName}
- Wallet Address: ${userAddr}
- USDC Wallet Balance: $${Number(usdcBalance || 0).toLocaleString()} USDC
- Account Role: ${userRole === 'merchant' || Boolean(userStore) ? 'Merchant / Store Owner' : 'Verified Consumer'}

REGISTERED USER ORDERS & LIVING PASSPORTS:
${ordersSummary}
${activeOrderSection}
${storeManagerSection}

COMPLETE HAUL SITE CATALOG (AVAILABLE PRODUCTS):
${catalogSummary}

VERIFIED HAUL STORES DIRECTORY:
${storesSummary}

HAUL PLATFORM RULES, POLICIES & CAPABILITIES:
1. DEEP REASONING & CONTEXTUAL RESPONSES:
   - Your reasoning is NOT limited. You must NEVER give generic, evasive, or repetitive robotic blurbs.
   - You have full access to everything concerning the whole Haul site, its products, stores, orders, escrow, passports, and policies.
   - Always analyze what is specifically asked and give exact, contextual answers with real product names, prices, store addresses, opening hours, specifications, order IDs, or PIN codes.
   - If a user asks what shoes are available, list the exact footwear models in the catalog with prices and sizes. If they ask about audio, tell them about Sony headphones or Teenage Engineering synthesizers. If they ask where a store is, provide the physical address and opening hours.

2. STRICT BOUNDARY (HAUL SCOPE):
   - You are exclusively dedicated to everything concerning Haul: Haul products, orders, escrow payments, stores, merchants, returns/cancellations, living passports, and verified commerce on Monad.
   - If a user asks a question completely unrelated to Haul (such as world politics, non-Haul trivia, or unrelated general coding), politely and elegantly clarify that your expertise is dedicated to the Haul platform and guide them back to Haul products, orders, or services.

3. MONAD ESCROW & ORDER LIFECYCLE:
   - All purchases on Haul are non-custodial and protected by Monad Smart Contract Escrow.
   - In-Store Pickup: Customer presents their 4-digit PIN / QR pass at the store counter. The merchant enters the PIN into their till to release escrow.
   - Courier Delivery: Funds are held until courier delivery and confirmed handover.
   - Cancellations: Buyers can cancel any pending escrow order anytime for a 100% instant USDC refund to their wallet.
   - Review Policy: Orders that were cancelled CANNOT be reviewed. Only fulfilled orders where the buyer took possession can be rated or reviewed.

4. ORDER PIN & VERIFICATION CODES (DISAMBIGUATION RULE):
   - If the user asks for their PIN or verification code without specifying which order:
     - If the user has multiple orders and none is currently focused, ask: "You have multiple orders on your account. Which order do you need the PIN verification code for?" and list their orders.
     - If the user specifies an order (or has only 1 order, or an order is focused), output the exact 4-digit PIN code in a bold card format.

5. TONE & CLEAN FORMATTING (STRICT REQUIREMENT):
   - Tone: Premium luxury concierge, crisp, authoritative, friendly, and helpful.
   - Clean Formatting: Never output raw hashtags (like #, ##, ###) for headers or asterisks (like * or **) for bullet points.
   - Write headers on their own line with clean capitalization without any hash characters.
   - Use clean bullets with the bullet character • (not *).
   - Use natural phrasing and bold formatting without raw asterisks.`;
}

/**
 * Intelligent local fallback responder if Groq API key is not present or offline.
 * Covers 100% of user inquiry types with precise context matching.
 */
export function generateLocalFallbackResponse(userPrompt, context) {
  const query = (userPrompt || '').toLowerCase();
  const { passports = [], activeOrder = null, userStore, userRole } = context;

  // 1. Order Code / PIN inquiry
  if (query.includes('pin') || query.includes('code') || query.includes('pickup code') || query.includes('order code') || query.includes('pass')) {
    // If an order is already focused
    if (activeOrder) {
      const pin = getOrderPin(activeOrder);
      const name = activeOrder.productName || activeOrder.name || 'Purchased Item';
      const status = activeOrder.currentState || 'ESCROWED';
      return `Order Verification Code & Pickup PIN

Here is your verification code for ${name}:

• Pickup Pass PIN: \`${pin}\`
• Token ID / Order ID: \`#${activeOrder.tokenId || activeOrder.id || '101'}\`
• Status: ${status} (Monad Smart Escrow Protected)
• Merchant: ${activeOrder.originalMerchant || activeOrder.merchant || 'Verified Flagship'}

Present this 4-digit PIN (\`${pin}\`) to the store counter representative when collecting your item. Once entered, the merchant will confirm physical handover and release escrow.`;
    }

    // Check if user specifically named or referenced an order by ID or keyword
    const matched = (passports || []).find(p => {
      const idStr = String(p.tokenId || p.id || '');
      const nameStr = (p.productName || p.name || '').toLowerCase();
      return (idStr && query.includes(idStr)) || (nameStr && query.includes(nameStr.slice(0, 7)));
    });

    if (matched) {
      const pin = getOrderPin(matched);
      return `Verification PIN for ${matched.productName || matched.name}

• Pickup Pass PIN: \`${pin}\`
• Order ID: \`#${matched.tokenId || matched.id}\`
• Status: ${matched.currentState || 'ESCROWED'}
• Merchant: ${matched.originalMerchant || matched.merchant || 'Verified Store'}

Present this 4-digit PIN (\`${pin}\`) at the store counter to confirm collection and release escrow.`;
    }

    // If user has MULTIPLE orders and none was specified, ASK WHICH ONE!
    if (passports && passports.length > 1) {
      const list = passports.map((p, idx) => {
        return `• Option ${idx + 1}: ${p.productName || p.name} (\`#${p.tokenId || p.id}\`) • Status: ${p.currentState || 'ESCROWED'}`;
      }).join('\n');

      return `Which order do you need the PIN for?

You have ${passports.length} orders on your account. Which one would you like the verification code for?

${list}

Tap one of the order buttons on the right or type the item name, and I will instantly reveal your 4-digit pickup PIN!`;
    }

    // If single order
    if (passports && passports.length === 1) {
      const single = passports[0];
      const pin = getOrderPin(single);
      return `Order Verification Code & Pickup PIN

Here is your pickup pass for ${single.productName || single.name}:

• Pickup Pass PIN: \`${pin}\`
• Order ID: \`#${single.tokenId || single.id}\`
• Status: ${single.currentState || 'ESCROWED'}
• Merchant: ${single.originalMerchant || single.merchant || 'Flagship Store'}

Present this 4-digit PIN (\`${pin}\`) to the merchant when collecting your item.`;
    }

    return `You currently have no active pending pickup orders registered. Once you place an order, your secure 4-digit verification PIN and QR Pickup Pass will appear here automatically.`;
  }

  // 2. Orders list / status inquiry
  if (query.includes('my order') || query.includes('status') || query.includes('pending') || query.includes('escrowed') || query.includes('tracking') || query.includes('orders')) {
    if (!passports || passports.length === 0) {
      return `You have no active orders in your Living Passport hub right now. Browse our verified luxury storefronts to place an order protected by Monad smart contract escrow!`;
    }

    const orderLines = passports.map((p, idx) => {
      const pin = getOrderPin(p);
      const isCollected = p.currentState === 'COLLECTED' || p.currentState === 'ACTIVE_OWNERSHIP';
      const isDispatched = p.deliveryMethod === 'dispatch' || p.deliveryMethod === 'delivery';
      const isRefunded = p.currentState === 'REFUNDED';
      const statusLabel = isRefunded ? 'Cancelled & Refunded' : isCollected ? 'Collected & In Hand' : isDispatched ? 'Dispatched (Courier)' : 'Escrowed (Ready for Pickup)';
      return `${idx + 1}. ${p.productName || p.name}\n• Status: ${statusLabel}\n• PIN: \`${pin}\` • Order ID: #${p.tokenId || p.id}\n• Merchant: ${p.originalMerchant || p.merchant || 'Flagship'}`;
    }).join('\n\n');

    return `Your Account Orders & Escrow Summary\n\n${orderLines}\n\nNeed assistance with a specific order? You can tap any order card on the right to focus our conversation on it.`;
  }

  // 3. Product Catalog & Inventory inquiry (shoes, phones, headphones, sizes, colors, prices)
  const isProductQuery = 
    query.includes('shoe') || query.includes('footwear') || query.includes('cloth') || 
    query.includes('apparel') || query.includes('sneaker') || query.includes('air max') || 
    query.includes('sony') || query.includes('headphone') || query.includes('apple') || 
    query.includes('vision pro') || query.includes('synthesizer') || query.includes('op-1') || 
    query.includes('price') || query.includes('cost') || query.includes('stock') || 
    query.includes('size') || query.includes('color') || query.includes('what do you sell') ||
    query.includes('products') || query.includes('catalog') || query.includes('items') ||
    query.includes('backpack');

  if (isProductQuery) {
    const catalogList = context.catalog || CURATED_CATALOG;
    // Find matched products
    const matches = catalogList.filter(p => {
      const pName = (p.name || '').toLowerCase();
      const pBrand = (p.brand || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      return query.split(' ').some(w => w.length > 3 && (pName.includes(w) || pBrand.includes(w) || pCat.includes(w) || pDesc.includes(w)));
    });

    const displayItems = matches.length > 0 ? matches.slice(0, 4) : catalogList.slice(0, 4);
    const itemCards = displayItems.map((item, idx) => {
      const sizes = Array.isArray(item.sizes) ? item.sizes.join(', ') : (item.sizes || 'Standard');
      return `### ${idx + 1}. ${item.name} (${item.brand})
* **Price:** $${Number(item.priceUsd || 0).toLocaleString()} USDC
* **Category:** ${item.category} • **Color:** ${item.color || 'Standard'}
* **Available Sizes:** ${sizes}
* **Stock In Vault:** ${item.stock ?? 5} units available
* **Store:** **${item.merchant}** (${item.merchantLocation})
* **Fulfillment:** ${item.allowsPickup !== false ? 'In-Store Pickup (Ready in 30m)' : ''} | ${item.allowsDelivery !== false ? 'Same-Day Courier' : ''}
> *${item.description}*`;
    }).join('\n\n');

    return `### Haul Verified Products
Here is what we currently have in our verified physical vaults on Haul:

${itemCards}

*All purchases are protected by Monad Smart Contract Escrow and mint a Living Digital Passport with verified warranty!*`;
  }

  // 4. Store Directory & Locations inquiry
  if (query.includes('store') || query.includes('shop') || query.includes('location') || query.includes('address') || query.includes('lagos') || query.includes('hours') || query.includes('opening')) {
    const merchantsList = context.merchants || VERIFIED_MERCHANTS;
    const matchedStore = merchantsList.find(m => {
      const mName = m.name.toLowerCase();
      return query.includes(mName.slice(0, 4)) || (m.handle && query.includes(m.handle.slice(1, 5)));
    });

    if (matchedStore) {
      return `### ${matchedStore.name} Store Profile
* **Handle:** ${matchedStore.handle} (Verified Partner)
* **Physical Address:** ${matchedStore.fullAddress || matchedStore.location}
* **Operating Hours:** ${matchedStore.operatingHours || 'Mon - Sat: 9:00 AM - 7:00 PM'}
* **Contact Phone:** ${matchedStore.phone || '+234 1 800 4825'}
* **Pickup Window:** ${matchedStore.pickupTime || 'Ready in 30 mins'}
* **Courier Dispatch:** ${matchedStore.deliveryTime || '2-4 hrs courier'}

> **Description:** ${matchedStore.description}

*You can visit in person for pickup or order online for insured express delivery!*`;
    }

    const storeCards = merchantsList.map((m, idx) => {
      return `* **${m.name}** (${m.category})
  - **Location:** ${m.location} (${m.fullAddress})
  - **Hours:** ${m.operatingHours || 'Mon - Sat 9:00 AM - 7:00 PM'}`;
    }).join('\n\n');

    return `### Verified Stores on Haul
We feature authenticated flagship boutiques across Lagos with instant in-store collection and living digital passports:

${storeCards}

*Which store would you like more details about?*`;
  }

  // 5. Store Manager mode inquiry
  if ((userStore || userRole === 'merchant') && (query.includes('store') || query.includes('manager') || query.includes('sales') || query.includes('counter') || query.includes('pickup verification'))) {
    return `### Store Manager Companion Overview

Welcome, store owner of **${userStore?.name || 'Your Flagship Store'}**!

Here is your current storefront status:
* **Operating Schedule:** ${userStore?.operatingHours || 'Mon - Sat: 9:00 AM - 7:00 PM'}
* **Opening / Closing:** ${userStore?.openingTime || '09:00 AM'} to ${userStore?.closingTime || '07:00 PM'}
* **Physical Location:** ${userStore?.fullAddress || userStore?.location || 'Storefront'}
* **Counter Verification:** In-store customer handovers can be verified in your **Store Counter** tab using the customer's 4-digit PIN.
* **Customer Messages:** Inbound shopper inquiries are accessible via your **Store Inbox** tab in Messages.

*Tip: You can edit your location, operating hours, and banner anytime by clicking "Edit Store Details" on your store page!*`;
  }

  // 6. Escrow & Payments
  if (query.includes('escrow') || query.includes('payment') || query.includes('usdc') || query.includes('monad') || query.includes('safety') || query.includes('guarantee')) {
    return `### How Monad Smart Contract Escrow Works

1. **Non-Custodial Locking:** When you purchase an item, your USDC payment is locked securely in a smart contract on Monad.
2. **Zero Risk:** The seller does not receive your payment upfront.
3. **Physical Verification:**
   - **In-Store Pickup:** Payment is released only when the merchant inputs your private 4-digit PIN into their Store Counter.
   - **Courier Delivery:** Payment is released only when you inspect the package and confirm receipt in your app.
4. **Instant Cancellation:** If you change your mind before collecting the item, you can cancel the order for a 100% instant USDC refund back to your wallet.`;
  }

  // 7. Cancellation, Refunds & Verified Reviews Policy
  if (query.includes('cancel') || query.includes('refund') || query.includes('return') || query.includes('review')) {
    return `### Cancellation, Refund & Review Policy on Haul

* **Instant Escrow Cancellation:** You can cancel any escrowed order at any time before in-store handover or courier dispatch. Your USDC is refunded 100% instantly back to your wallet.
* **Verified Reviews Protection:** On Haul, **orders that were cancelled cannot be reviewed**. Reviews are strictly reserved for verified purchases where the buyer actually collected or received the physical item. This prevents fake reviews and ensures 100% genuine buyer ratings.
* **Living Digital Passports:** Once an order is completed, your living digital passport activates with full factory warranty and authentic ownership history on Monad.`;
  }

  // 8. General greeting or inquiry
  return `### Hello! I am your Hual AI Companion

I have complete live access to the entire Haul marketplace, verified stores, product catalog, and your account orders on Monad.

Here is what I can assist you with:
1. **Catalog & Inventory:** Inquire about our shoes, tech, synthesizers, sizes, colors, and prices.
2. **Order Verification & PINs:** Ask *"What is my pickup PIN?"* to view your 4-digit code.
3. **Store Directory & Addresses:** Ask for the address or hours of Nike, Sony, Apple, or Teenage Engineering.
4. **Smart Escrow & Refunds:** Learn how Monad smart escrow protects your funds and enables instant cancellations.
5. **Living Passports:** Track warranty status and onchain proof of ownership.

What would you like to know about Haul today?`;
}

/**
 * Execute Groq Chat Completion with fallback to intelligent local engine.
 */
export async function sendGroqChatMessage({
  messages = [],
  context = {},
  model = 'llama-3.3-70b-versatile',
  onPartial = null
}) {
  const apiKey = getGroqApiKey();
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

  // If no API key is provided, seamlessly use the context-rich local fallback
  if (!apiKey) {
    // Simulate slight natural latency for realistic typing feel (300ms)
    await new Promise(r => setTimeout(r, 350));
    const responseText = generateLocalFallbackResponse(lastUserMessage, context);
    return {
      text: responseText,
      modelUsed: 'Hual Local Knowledge Engine (Configure Groq Key for Llama 3.3)',
      isLiveGroq: false
    };
  }

  // Prepare messages array with dynamic system prompt
  const systemPrompt = buildSystemPrompt(context);
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-10) // keep last 10 messages for context window efficiency
  ];

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature: 0.6,
        max_tokens: 1024,
        top_p: 0.95
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `Groq API responded with status ${res.status}`;
      console.warn('Groq API error, switching to local knowledge engine:', errMsg);
      
      const fallbackText = generateLocalFallbackResponse(lastUserMessage, context);
      return {
        text: fallbackText,
        modelUsed: `Local Engine (Groq fallback: ${errMsg.slice(0, 40)}...)`,
        isLiveGroq: false,
        error: errMsg
      };
    }

    const data = await res.json();
    const replyText = data?.choices?.[0]?.message?.content || generateLocalFallbackResponse(lastUserMessage, context);

    return {
      text: replyText,
      modelUsed: `Groq (${model})`,
      isLiveGroq: true
    };
  } catch (err) {
    console.warn('Network error reaching Groq, using local engine:', err);
    const fallbackText = generateLocalFallbackResponse(lastUserMessage, context);
    return {
      text: fallbackText,
      modelUsed: 'Local Engine (Groq Network Timeout Fallback)',
      isLiveGroq: false,
      error: err.message
    };
  }
}
