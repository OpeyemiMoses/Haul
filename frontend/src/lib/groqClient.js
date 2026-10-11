/**
 * Groq AI Client & Context Engine for Hual Marketplace
 * Model: llama-3.3-70b-versatile / llama-3.1-8b-instant
 */

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
 * order inventory, escrow balances, and store manager context.
 */
export function buildSystemPrompt(context) {
  const {
    user,
    userRole,
    userStore,
    usdcBalance = 0,
    passports = [],
    activeOrder = null
  } = context;

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Valued Member');
  const userAddr = user?.address || '0x...';

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
      if (isRefunded) statusStr = 'CANCELLED & 100% REFUNDED';
      else if (isCollected) statusStr = 'COLLECTED & VERIFIED IN HAND (Completed)';
      else if (isDispatched) statusStr = 'DISPATCHED TO COURIER (In Transit)';

      return `[Order #${index + 1}]
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

  return `You are Hual AI Concierge, the official intelligent assistant and account companion for the Hual Luxury & Authentic Goods Web3 Marketplace.

USER PROFILE:
- Name: ${displayName}
- Wallet Address: ${userAddr}
- USDC Wallet Balance: $${Number(usdcBalance || 0).toLocaleString()} USDC
- Account Role: ${userRole === 'merchant' || Boolean(userStore) ? 'Merchant / Store Owner' : 'Verified Consumer'}

REGISTERED USER ORDERS & LIVING PASSPORTS:
${ordersSummary}
${activeOrderSection}
${storeManagerSection}

CORE KNOWLEDGE & OPERATING RULES:
1. ORDER CODES & PICKUP PINS (DISAMBIGUATION RULE):
   - If the user asks for their PIN code, pickup pass, or verification code without specifying which order:
     - If the user has multiple orders on their account and NO specific order is currently focused:
       DO NOT arbitrarily pick an order by yourself!
       Instead, explicitly ask: "You have multiple orders on your account. Which order do you need the PIN verification code for?"
       List each of their orders by name and Order ID.
     - If the user names/specifies an order (or if there is only 1 order, or if an order is already focused in CURRENTLY FOCUSED ORDER):
       Directly output the exact 4-digit PIN code and escrow status for that specific order in a bold card format.
2. ESCROW & SETTLEMENT ARCHITECTURE:
   All orders on Hual are non-custodial and protected by Monad Smart Contract Escrow.
   - When a buyer pays, USDC is locked in the contract, NOT sent directly to the seller yet.
   - In-Store Pickup: The customer visits the store and presents their 4-digit PIN / QR pass. The merchant enters the PIN into the Store Counter, releasing escrow immediately.
   - Courier Delivery: Funds are held until the buyer taps "Confirm Receipt" in the app after physical delivery.
   - Cancellations: Buyers can cancel any order that is still in Escrow anytime for a 100% instant USDC refund to their wallet.
3. CRITICAL ROUTING GUARDRAIL (STORE-SPECIFIC INQUIRIES):
   If the user asks questions that require store-level decisions or physical store inventory check (such as: "Do you have size 10 in red in stock?", "Can the store open 1 hour earlier for me?", "Can I negotiate a bulk discount?", "Does the store have other colors?"):
   - You MUST politely instruct them to message the store in question directly.
   - Explicitly tell them: "For store inventory inquiries, custom sizing, or special merchant requests, please message [Store Name] directly using the 'Message Store' button on their storefront or in your Messages tab."
   - Do NOT invent store inventory or offer unauthorized store policies.
4. PERSONALITY & TONE:
   Concierge luxury standard: warm, crisp, authoritative, clear, and concise. Format important details (like Order PIN, Token ID, status) using bold markdown and bullet points.`;
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
      return `### Order Verification Code & Pickup PIN

Here is your verification code for **${name}**:

* **Pickup Pass PIN:** \`${pin}\`
* **Token ID / Order ID:** \`#${activeOrder.tokenId || activeOrder.id || '101'}\`
* **Status:** **${status}** (Monad Smart Escrow Protected)
* **Merchant:** ${activeOrder.originalMerchant || activeOrder.merchant || 'Verified Flagship'}

> **How to use:** Present this 4-digit PIN (\`${pin}\`) to the store counter representative when collecting your item. Once entered, the merchant will confirm physical handover and release escrow.`;
    }

    // Check if user specifically named or referenced an order by ID or keyword
    const matched = (passports || []).find(p => {
      const idStr = String(p.tokenId || p.id || '');
      const nameStr = (p.productName || p.name || '').toLowerCase();
      return (idStr && query.includes(idStr)) || (nameStr && query.includes(nameStr.slice(0, 7)));
    });

    if (matched) {
      const pin = getOrderPin(matched);
      return `### Verification PIN for ${matched.productName || matched.name}

* **Pickup Pass PIN:** \`${pin}\`
* **Order ID:** \`#${matched.tokenId || matched.id}\`
* **Status:** **${matched.currentState || 'ESCROWED'}**
* **Merchant:** ${matched.originalMerchant || matched.merchant || 'Verified Store'}

> Present this 4-digit PIN (\`${pin}\`) at the store counter to confirm collection and release escrow.`;
    }

    // If user has MULTIPLE orders and none was specified, ASK WHICH ONE!
    if (passports && passports.length > 1) {
      const list = passports.map((p, idx) => {
        return `* **Option ${idx + 1}:** **${p.productName || p.name}** (\`#${p.tokenId || p.id}\`) • Status: ${p.currentState || 'ESCROWED'}`;
      }).join('\n');

      return `### Which order do you need the PIN for?

You have **${passports.length} orders** on your account. Which one would you like the verification code for?

${list}

> **Tap one of the order buttons below** or type the order name/number, and I will instantly reveal your 4-digit pickup PIN!`;
    }

    // If single order
    if (passports && passports.length === 1) {
      const single = passports[0];
      const pin = getOrderPin(single);
      return `### Order Verification Code & Pickup PIN

Here is your pickup pass for **${single.productName || single.name}**:

* **Pickup Pass PIN:** \`${pin}\`
* **Order ID:** \`#${single.tokenId || single.id}\`
* **Status:** **${single.currentState || 'ESCROWED'}**
* **Merchant:** ${single.originalMerchant || single.merchant || 'Flagship Store'}

> Present this 4-digit PIN (\`${pin}\`) to the merchant when collecting your item.`;
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
      return `**${idx + 1}. ${p.productName || p.name}**\n- Status: ${statusLabel}\n- PIN: \`${pin}\` • Order ID: #${p.tokenId || p.id}\n- Merchant: ${p.originalMerchant || p.merchant || 'Flagship'}`;
    }).join('\n\n');

    return `### Your Account Orders & Escrow Summary\n\n${orderLines}\n\n*Need assistance with a specific order? You can tap **"Contact Support"** on any order card in your Passports tab to focus our conversation on it.*`;
  }

  // 3. Store-specific inquiry guardrail
  if (
    query.includes('size') || 
    query.includes('stock') || 
    query.includes('discount') || 
    query.includes('inventory') || 
    query.includes('color') || 
    query.includes('custom') ||
    query.includes('bargain') ||
    query.includes('negotiate') ||
    query.includes('return in person')
  ) {
    const storeName = activeOrder?.originalMerchant || activeOrder?.merchant || 'the store';
    return `### Merchant Store Inquiry Notice

For item sizing availability, specific inventory stock levels, custom color requests, or merchant negotiations, **please message ${storeName} directly**.

Stores manage their own physical shelves, so they can check their backroom immediately and reply to you in real time!

**What to do:** Tap the **"Message Store"** button on ${storeName}'s storefront or open the **Messages** tab in your navigation bar to start a direct chat with the store staff.`;
  }

  // 4. Store Manager mode inquiry
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

  // 5. Escrow & Payments
  if (query.includes('escrow') || query.includes('payment') || query.includes('usdc') || query.includes('monad') || query.includes('safety') || query.includes('guarantee')) {
    return `### How Monad Smart Contract Escrow Works

1. **Non-Custodial Locking:** When you purchase an item, your USDC payment is locked securely in a smart contract on Monad.
2. **Zero Risk:** The seller does not receive your payment upfront.
3. **Physical Verification:**
   - **In-Store Pickup:** Payment is released only when the merchant inputs your private 4-digit PIN into their Store Counter.
   - **Courier Delivery:** Payment is released only when you inspect the package and confirm receipt in your app.
4. **Instant Cancellation:** If you change your mind before collecting the item, you can cancel the order for a 100% instant USDC refund back to your wallet.`;
  }

  // 6. Cancellation & Refunds
  if (query.includes('cancel') || query.includes('refund') || query.includes('return')) {
    return `### Cancellation & Refund Policy

* **Before Collection (In Escrow):** You can cancel any escrowed order at any time before in-store handover or courier dispatch. Your USDC will be refunded instantly back to your wallet.
* **After Collection:** Once you provide your 4-digit PIN and take possession of the goods, the item is transferred to your Living Passport with active warranty protection.
* To cancel a pending order, navigate to your **Living Passports** tab and tap **"Cancel Order"** on the item card.`;
  }

  // 7. General greeting / assistant capabilities
  return `### Hello, I'm your Hual AI Account Companion

I have live access to your account and verified orders on the Monad network. Here is how I can assist you:

1. **Order Codes & Pickup PINs:** Ask *"What is my pickup PIN?"* to retrieve your verification pass.
2. **Order Lifecycle & Tracking:** Ask *"What is the status of my order?"* to check escrow, courier transit, or completed collections.
3. **Escrow & Payments:** Ask *"How does escrow work?"* or *"How do I get a refund?"*.
4. **Store Manager Companion:** If you run a store, I can help you monitor operating hours, counter pickups, and store stats.
5. **Store Inquiries:** For product sizing, stock, or custom requests, I will guide you to chat directly with the store via **Message Store**.

How can I help you today?`;
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
