import { ethers } from 'ethers';
import { releaseEscrowPayoutToStoreOwner } from './web3';

const ESCROW_ORDERS_KEY = 'hual_escrow_orders';
const PICKUP_ORDERS_KEY = 'hual_all_pickup_orders';

/**
 * Record a new order in all storage locations with pickup PIN and seller address
 */
export function recordNewOrder({
  orderId,
  buyerAddress,
  buyerId,
  sellerAddress,
  merchant,
  merchantId,
  merchantLocation,
  merchantAvatar,
  deliveryMethod,
  pickupPIN,
  items = [],
  txHash,
  totalAmount,
  tokenId,
  serialNumber
}) {
  const now = new Date().toISOString();
  const safePin = pickupPIN ? String(pickupPIN).trim() : null;

  // 1. Save to dedicated Pickup Orders registry if pickup order
  if (deliveryMethod === 'pickup' && safePin) {
    try {
      const existingPickups = JSON.parse(localStorage.getItem(PICKUP_ORDERS_KEY) || '[]');
      const pickupRecord = {
        orderId: String(orderId),
        pickupPIN: safePin,
        buyerAddress: buyerAddress ? buyerAddress.toLowerCase() : null,
        buyerId: buyerId || null,
        sellerAddress: sellerAddress ? sellerAddress.toLowerCase() : null,
        merchant: merchant || 'Verified Merchant Store',
        merchantId: merchantId || null,
        merchantLocation: merchantLocation || 'Victoria Island, Lagos',
        merchantAvatar: merchantAvatar || null,
        deliveryMethod: 'pickup',
        status: 'in_escrow',
        priceUsd: totalAmount || (items[0]?.priceUsd) || 0,
        totalAmount: totalAmount || (items[0]?.priceUsd) || 0,
        productName: items[0]?.name || 'Luxury Asset',
        productBrand: items[0]?.brand || 'Authentic Brand',
        imageUri: items[0]?.imageUri || null,
        tokenId: tokenId || items[0]?.tokenId || null,
        serialNumber: serialNumber || items[0]?.serialNumber || null,
        txHash: txHash || null,
        createdAt: now,
        items: items.map(it => ({
          ...it,
          pickupPIN: safePin,
          sellerAddress: sellerAddress || it.sellerAddress || null
        }))
      };

      const updatedPickups = [pickupRecord, ...existingPickups.filter(p => p.orderId !== String(orderId) && p.pickupPIN !== safePin)];
      localStorage.setItem(PICKUP_ORDERS_KEY, JSON.stringify(updatedPickups));
    } catch (e) {
      console.warn('Failed recording pickup order to registry:', e);
    }
  }

  // 2. Save / update in hual_escrow_orders
  try {
    const existingEscrow = JSON.parse(localStorage.getItem(ESCROW_ORDERS_KEY) || '[]');
    const escrowOrder = {
      orderId: String(orderId),
      totalAmount: totalAmount || (items.reduce((acc, it) => acc + (it.priceUsd * (it.quantity || 1)), 0)),
      itemCount: items.length,
      createdAt: now,
      buyerAddress: buyerAddress ? buyerAddress.toLowerCase() : null,
      buyerId: buyerId || null,
      sellerAddress: sellerAddress ? sellerAddress.toLowerCase() : null,
      merchant: merchant || 'Verified Merchant Store',
      merchantId: merchantId || null,
      merchantLocation: merchantLocation || 'Victoria Island, Lagos',
      merchantAvatar: merchantAvatar || null,
      deliveryMethod: deliveryMethod || 'pickup',
      pickupPIN: safePin,
      status: 'in_escrow',
      txHash: txHash || null,
      items: items.map((it, idx) => ({
        orderItemId: it.orderItemId || `item-${Date.now()}-${idx}`,
        productId: it.productId,
        name: it.name,
        priceUsd: it.priceUsd,
        quantity: it.quantity || 1,
        size: it.size || it.selectedSize || 'Standard',
        merchant: merchant || it.merchant || 'Verified Merchant Store',
        merchantId: merchantId || it.merchantId || null,
        sellerAddress: sellerAddress || it.sellerAddress || null,
        merchantLocation: merchantLocation || it.merchantLocation || 'Victoria Island, Lagos',
        merchantAvatar: merchantAvatar || it.merchantAvatar || null,
        imageUri: it.imageUri,
        brand: it.brand || 'Luxury Goods',
        status: 'in_escrow',
        escrowAmount: it.priceUsd * (it.quantity || 1),
        purchasedAt: now,
        deliveryMethod: deliveryMethod || 'pickup',
        pickupPIN: safePin,
        tokenId: tokenId || it.tokenId || null,
        serialNumber: serialNumber || it.serialNumber || null,
        txHash: txHash || null
      }))
    };

    const updatedEscrow = [escrowOrder, ...existingEscrow.filter(o => o.orderId !== String(orderId))];
    localStorage.setItem(ESCROW_ORDERS_KEY, JSON.stringify(updatedEscrow));
  } catch (e) {
    console.warn('Failed recording escrow order:', e);
  }

  // 3. Decrement stock for all purchased items immediately
  try {
    items.forEach(it => {
      decrementProductStock(it, it.quantity || 1);
    });
  } catch (e) {
    console.warn('Failed auto-decrementing item stock on order:', e);
  }
}

/**
 * Robust pickup code lookup that scans dedicated pickups registry, escrow orders, and all passports
 */
export function lookupPickupOrder(rawCode) {
  if (!rawCode) return null;

  let query = String(rawCode).trim().toUpperCase();

  // Try parsing JSON QR code payload
  if (query.startsWith('{') && query.endsWith('}')) {
    try {
      const parsed = JSON.parse(rawCode);
      if (parsed.pin) query = String(parsed.pin).trim().toUpperCase();
      else if (parsed.pickupPIN) query = String(parsed.pickupPIN).trim().toUpperCase();
      else if (parsed.orderId) query = String(parsed.orderId).trim().toUpperCase();
      else if (parsed.tokenId) query = String(parsed.tokenId).trim().toUpperCase();
    } catch {}
  }

  // Try extracting pin parameter from URL (e.g. haul://verify-pickup?...&pin=6939)
  if (rawCode.includes('pin=')) {
    const pinMatch = rawCode.match(/[?&]pin=([0-9a-zA-Z]+)/i);
    if (pinMatch && pinMatch[1]) {
      query = pinMatch[1].trim().toUpperCase();
    }
  }

  // Also strip prefixes like "PIN:", "CODE:", "HUAL-" if entered
  const cleanedPin = query.replace(/^(PIN:|CODE:|HUAL-PIN-|#)/i, '').trim();

  // 1. Search in dedicated hual_all_pickup_orders registry
  try {
    const pickups = JSON.parse(localStorage.getItem(PICKUP_ORDERS_KEY) || '[]');
    const match = pickups.find(p => {
      if (!p) return false;
      const pin = String(p.pickupPIN || '').trim().toUpperCase();
      const ordId = String(p.orderId || '').trim().toUpperCase();
      const tok = String(p.tokenId || '').trim().toUpperCase();
      const sn = String(p.serialNumber || '').trim().toUpperCase();
      return pin === query || pin === cleanedPin || ordId === query || tok === query || (sn && sn.includes(query));
    });

    if (match) {
      return {
        ...match,
        source: 'pickup_registry',
        originalPriceUsd: match.priceUsd || match.totalAmount
      };
    }
  } catch {}

  // 2. Search in hual_escrow_orders
  try {
    const escrowOrders = JSON.parse(localStorage.getItem(ESCROW_ORDERS_KEY) || '[]');
    for (const ord of escrowOrders) {
      if (!ord) continue;
      const ordPin = String(ord.pickupPIN || '').trim().toUpperCase();
      const ordId = String(ord.orderId || '').trim().toUpperCase();

      if (ordPin === query || ordPin === cleanedPin || ordId === query) {
        const primaryItem = ord.items?.[0] || {};
        return {
          orderId: ord.orderId,
          pickupPIN: ord.pickupPIN,
          buyerAddress: ord.buyerAddress,
          sellerAddress: ord.sellerAddress || primaryItem.sellerAddress,
          merchant: ord.merchant || primaryItem.merchant,
          merchantId: ord.merchantId || primaryItem.merchantId,
          merchantLocation: ord.merchantLocation || primaryItem.merchantLocation,
          productName: primaryItem.name || 'Luxury Goods',
          productBrand: primaryItem.brand || 'Authentic Asset',
          imageUri: primaryItem.imageUri,
          originalPriceUsd: ord.totalAmount || primaryItem.priceUsd,
          priceUsd: ord.totalAmount || primaryItem.priceUsd,
          status: ord.status || primaryItem.status,
          source: 'escrow_order',
          items: ord.items
        };
      }

      // Check items inside order
      for (const item of (ord.items || [])) {
        const itPin = String(item.pickupPIN || '').trim().toUpperCase();
        const itTok = String(item.tokenId || '').trim().toUpperCase();
        const itSn = String(item.serialNumber || '').trim().toUpperCase();
        const itId = String(item.orderItemId || '').trim().toUpperCase();

        if (itPin === query || itPin === cleanedPin || itTok === query || itId === query || (itSn && itSn.includes(query))) {
          return {
            orderId: ord.orderId,
            orderItemId: item.orderItemId,
            pickupPIN: item.pickupPIN || ord.pickupPIN,
            buyerAddress: ord.buyerAddress,
            sellerAddress: item.sellerAddress || ord.sellerAddress,
            merchant: item.merchant || ord.merchant,
            merchantId: item.merchantId || ord.merchantId,
            merchantLocation: item.merchantLocation || ord.merchantLocation,
            productName: item.name,
            productBrand: item.brand,
            imageUri: item.imageUri,
            originalPriceUsd: item.priceUsd,
            priceUsd: item.priceUsd,
            status: item.status || ord.status,
            source: 'escrow_item',
            items: [item]
          };
        }
      }
    }
  } catch {}

  // 3. Search in all passports across localStorage keys
  try {
    const passportKeys = ['hual_my_passports'];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('hual_my_passports_')) {
        passportKeys.push(k);
      }
    }

    for (const key of passportKeys) {
      try {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(list)) {
          const found = list.find(p => {
            if (!p) return false;
            const pPin = String(p.pickupPIN || '').trim().toUpperCase();
            const pTok = String(p.tokenId || '').trim().toUpperCase();
            const pSn = String(p.serialNumber || '').trim().toUpperCase();
            const pOrd = String(p.orderId || '').trim().toUpperCase();
            return pPin === query || pPin === cleanedPin || pTok === query || pOrd === query || (pSn && pSn.includes(query));
          });
          if (found) {
            return {
              ...found,
              orderId: found.orderId || `ORD-${found.tokenId}`,
              source: 'passport_storage',
              originalPriceUsd: found.originalPriceUsd || found.priceUsd
            };
          }
        }
      } catch {}
    }
  } catch {}

  return null;
}

/**
 * Confirm in-store pickup, execute onchain USDC release to store owner, and mark order collected
 */
export async function completePickupAndPayout({
  item,
  currentStore,
  currentUser,
  plainPIN
}) {
  if (!item) throw new Error('Order item not found');

  // Find candidate EVM addresses in prioritized order
  const candidateAddresses = [
    item.sellerAddress,
    item.seller,
    currentStore?.ownerAddress,
    currentUser?.address,
    currentUser?.wallet?.address
  ];

  let storeOwnerAddress = candidateAddresses.find(a => 
    a && typeof a === 'string' && a.startsWith('0x') && a.length === 42
  );

  // Fallback to verified merchant signer address if no 42-char address exists
  if (!storeOwnerAddress) {
    storeOwnerAddress = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
  }

  const orderAmount = parseFloat(item.originalPriceUsd || item.priceUsd || item.totalAmount || 1);
  const orderId = item.orderId || item.tokenId || Date.now();
  const orderName = item.productName || item.name || 'In-Store Pickup Handover';

  // 1. Release real USDC payout onchain to store owner
  const payoutResult = await releaseEscrowPayoutToStoreOwner({
    sellerAddress: storeOwnerAddress,
    amountUsdc: orderAmount,
    orderId,
    orderName
  });

  const liveTxHash = payoutResult.txHash;

  // 2. Mark item as collected in dedicated pickup orders
  try {
    const pickups = JSON.parse(localStorage.getItem(PICKUP_ORDERS_KEY) || '[]');
    const updatedPickups = pickups.map(p => {
      if (String(p.orderId) === String(item.orderId) || (p.pickupPIN && p.pickupPIN === item.pickupPIN)) {
        return {
          ...p,
          status: 'released',
          isCollected: true,
          collectedAt: new Date().toISOString(),
          payoutTxHash: liveTxHash
        };
      }
      return p;
    });
    localStorage.setItem(PICKUP_ORDERS_KEY, JSON.stringify(updatedPickups));
  } catch {}

  // 3. Mark in escrow orders
  try {
    const escrowOrders = JSON.parse(localStorage.getItem(ESCROW_ORDERS_KEY) || '[]');
    const updatedEscrow = escrowOrders.map(ord => {
      if (String(ord.orderId) === String(item.orderId) || (ord.pickupPIN && ord.pickupPIN === item.pickupPIN)) {
        return {
          ...ord,
          status: 'released',
          settledAt: new Date().toISOString(),
          payoutTxHash: liveTxHash,
          items: (ord.items || []).map(it => ({
            ...it,
            status: 'released',
            releasedAt: new Date().toISOString(),
            payoutTxHash: liveTxHash
          }))
        };
      }
      return ord;
    });
    localStorage.setItem(ESCROW_ORDERS_KEY, JSON.stringify(updatedEscrow));
  } catch {}

  // 4. Update passports across all keys and persistent collected map
  markItemCollectedInRegistry(item, liveTxHash);

  // 5. Update active currentUser balance keys directly
  try {
    const userKeys = [
      currentUser?.id ? `hual_usdc_balance_${currentUser.id}` : null,
      currentUser?.email ? `hual_usdc_balance_${currentUser.email.toLowerCase()}` : null,
      currentUser?.address ? `hual_usdc_balance_${currentUser.address.toLowerCase()}` : null,
      currentStore?.ownerAddress ? `hual_usdc_balance_${currentStore.ownerAddress.toLowerCase()}` : null,
      `hual_usdc_balance_${storeOwnerAddress.toLowerCase()}`,
      'hual_usdc_balance'
    ].filter(Boolean);

    for (const k of userKeys) {
      const cur = parseFloat(localStorage.getItem(k) || '1000');
      const updated = Number((cur + orderAmount).toFixed(2));
      localStorage.setItem(k, String(updated));
    }

    window.dispatchEvent(new CustomEvent('hual_balance_updated', {
      detail: { 
        address: storeOwnerAddress.toLowerCase(),
        amount: orderAmount,
        txHash: liveTxHash 
      }
    }));
  } catch (balErr) {
    console.warn('Balance sync error:', balErr);
  }

  return {
    success: true,
    txHash: liveTxHash,
    payoutAmount: orderAmount,
    sellerAddress: storeOwnerAddress
  };
}

/**
 * Check if a passport or order item has already been collected/picked up
 */
export function isItemCollectedInRegistry(item) {
  if (!item) return false;
  if (
    item.currentState === 'COLLECTED' || 
    item.currentState === 'ACTIVE_OWNERSHIP' || 
    item.currentState === 'DELIVERED' || 
    item.currentState === 'COMPLETED' || 
    item.currentState === 'OWNED' || 
    item.status === 'released' ||
    item.status === 'Completed' ||
    item.status === 'Handover Complete' ||
    Boolean(item.isCollected) || 
    Boolean(item.isDelivered) ||
    Boolean(item.payoutTxHash)
  ) {
    return true;
  }
  try {
    const colMap = JSON.parse(localStorage.getItem('hual_collected_passports') || '{}');
    const keysToCheck = [
      item.orderId,
      item.pickupPIN,
      item.tokenId,
      item.serialNumber,
      item.id,
      item.orderItemId,
      item.productName ? item.productName.trim().toLowerCase() : null,
      item.name ? item.name.trim().toLowerCase() : null
    ];
    for (const k of keysToCheck) {
      if (k && colMap[String(k).trim()]) return true;
    }
  } catch {}
  return false;
}

/**
 * Retrieve saved handover / collection metadata for an item
 */
export function getCollectedItemInfo(item) {
  if (!item) return null;
  try {
    const colMap = JSON.parse(localStorage.getItem('hual_collected_passports') || '{}');
    const keysToCheck = [
      item.orderId,
      item.pickupPIN,
      item.tokenId,
      item.serialNumber,
      item.id,
      item.orderItemId,
      item.productName ? item.productName.trim().toLowerCase() : null,
      item.name ? item.name.trim().toLowerCase() : null
    ];
    for (const k of keysToCheck) {
      if (k && colMap[String(k).trim()]) return colMap[String(k).trim()];
    }
  } catch {}
  if (item.payoutTxHash) {
    return { collected: true, txHash: item.payoutTxHash };
  }
  return null;
}

/**
 * Mark item collected across all storage buckets and trigger sync events
 */
export function markItemCollectedInRegistry(item, liveTxHash = null) {
  if (!item) return;

  // 1. Save to persistent collected passports map
  try {
    const COLLECTED_MAP_KEY = 'hual_collected_passports';
    const colMap = JSON.parse(localStorage.getItem(COLLECTED_MAP_KEY) || '{}');
    const markKey = (val) => {
      if (val !== undefined && val !== null && String(val).trim()) {
        colMap[String(val).trim()] = {
          collected: true,
          collectedAt: new Date().toISOString(),
          txHash: liveTxHash || null
        };
      }
    };

    markKey(item.orderId);
    markKey(item.pickupPIN);
    markKey(item.tokenId);
    markKey(item.serialNumber);
    markKey(item.id);
    markKey(item.orderItemId);
    if (item.productName) markKey(item.productName.trim().toLowerCase());
    if (item.name) markKey(item.name.trim().toLowerCase());

    localStorage.setItem(COLLECTED_MAP_KEY, JSON.stringify(colMap));
  } catch {}

  // 2. Update all passports across all keys
  try {
    const updatePassport = (p) => {
      if (!p) return p;
      const match = 
        (p.orderId && item.orderId && String(p.orderId) === String(item.orderId)) ||
        (p.pickupPIN && item.pickupPIN && String(p.pickupPIN) === String(item.pickupPIN)) ||
        (p.tokenId && item.tokenId && String(p.tokenId) === String(item.tokenId)) ||
        (p.serialNumber && item.serialNumber && p.serialNumber === item.serialNumber) ||
        (p.id && item.id && String(p.id) === String(item.id)) ||
        (p.productName && item.productName && p.productName.trim().toLowerCase() === item.productName.trim().toLowerCase()) ||
        (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase());

      if (match) {
        return {
          ...p,
          currentState: 'COLLECTED',
          currentStateIndex: 4,
          isCollected: true,
          isDelivered: true,
          payoutTxHash: liveTxHash || p.payoutTxHash || null,
          lifecycleSteps: [
            { name: 'Listed', completed: true, date: p.purchaseTimestamp || 'Oct 5, 2026' },
            { name: 'Ordered', completed: true, date: p.purchaseTimestamp || 'Oct 7, 2026' },
            { name: 'Paid (Escrow)', completed: true, date: p.purchaseTimestamp || 'Oct 7, 2026' },
            { name: 'Handover', completed: true, date: 'In-Store Verified & Handed Over' },
            { name: 'In Possession', completed: true, date: 'Verified In Hand' },
            { name: 'Warranty Active', completed: true, date: 'Active' }
          ]
        };
      }
      return p;
    };

    const passportKeys = ['hual_my_passports'];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('hual_my_passports_')) {
        passportKeys.push(k);
      }
    }

    for (const key of passportKeys) {
      try {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(list)) {
          localStorage.setItem(key, JSON.stringify(list.map(updatePassport)));
        }
      } catch {}
    }
  } catch {}

  // 3. Dispatch event so active components update live without reload
  try {
    window.dispatchEvent(new CustomEvent('hual_order_collected', {
      detail: { item, txHash: liveTxHash }
    }));
  } catch {}
}

/**
 * Decrement stock for a purchased product and persist across storage & overrides
 */
export function decrementProductStock(productIdentifier, quantity = 1) {
  if (!productIdentifier) return null;
  const qty = Math.max(1, Number(quantity) || 1);

  // 1. Update in hual_custom_listed_products
  try {
    const rawCustom = localStorage.getItem('hual_custom_listed_products');
    if (rawCustom) {
      const customList = JSON.parse(rawCustom);
      if (Array.isArray(customList)) {
        let matched = false;
        const updatedList = customList.map(item => {
          if (!item) return item;
          const match = 
            (item.id && String(item.id) === String(productIdentifier)) ||
            (item.productId !== undefined && String(item.productId) === String(productIdentifier)) ||
            (item.name && typeof productIdentifier === 'string' && item.name.toLowerCase().trim() === productIdentifier.toLowerCase().trim()) ||
            (typeof productIdentifier === 'object' && productIdentifier !== null && (
              (item.id && productIdentifier.id && String(item.id) === String(productIdentifier.id)) ||
              (item.productId !== undefined && productIdentifier.productId !== undefined && String(item.productId) === String(productIdentifier.productId)) ||
              (item.name && productIdentifier.name && item.name.toLowerCase().trim() === productIdentifier.name.toLowerCase().trim())
            ));

          if (match) {
            matched = true;
            const currentStock = Number(item.stock) || 1;
            const newStock = Math.max(0, currentStock - qty);
            return { ...item, stock: newStock };
          }
          return item;
        });

        if (matched) {
          localStorage.setItem('hual_custom_listed_products', JSON.stringify(updatedList));
        }
      }
    }
  } catch (err) {
    console.warn('Error decrementing custom product stock:', err);
  }

  // 2. Persist in universal stock overrides (hual_product_stock_overrides)
  try {
    const rawOverrides = localStorage.getItem('hual_product_stock_overrides') || '{}';
    const overrides = JSON.parse(rawOverrides);
    
    let targetKey = typeof productIdentifier === 'object' && productIdentifier !== null
      ? (productIdentifier.id || (productIdentifier.productId !== undefined ? `prod-${productIdentifier.productId}` : productIdentifier.name))
      : String(productIdentifier);

    const prevOverridden = overrides[targetKey];
    let initialStock = 5;
    if (typeof productIdentifier === 'object' && productIdentifier?.stock !== undefined) {
      initialStock = Number(productIdentifier.stock);
    }
    const currentStock = prevOverridden !== undefined ? Number(prevOverridden) : initialStock;
    const nextStock = Math.max(0, currentStock - qty);
    overrides[targetKey] = nextStock;
    
    if (typeof productIdentifier === 'object' && productIdentifier?.name) {
      overrides[`name-${productIdentifier.name.toLowerCase().trim()}`] = nextStock;
    }
    if (typeof productIdentifier === 'object' && productIdentifier?.productId !== undefined) {
      overrides[`id-${productIdentifier.productId}`] = nextStock;
      overrides[`prod-${productIdentifier.productId}`] = nextStock;
    }

    localStorage.setItem('hual_product_stock_overrides', JSON.stringify(overrides));

    // Dispatch global event so UI updates instantly
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hual_stock_updated', { 
        detail: { targetKey, nextStock, product: productIdentifier } 
      }));
    }

    return nextStock;
  } catch (err) {
    console.warn('Error saving stock override:', err);
    return null;
  }
}

/**
 * Get any stock override saved for a product
 */
export function getProductStockOverride(product) {
  if (!product) return null;
  try {
    const rawOverrides = localStorage.getItem('hual_product_stock_overrides');
    if (!rawOverrides) return null;
    const overrides = JSON.parse(rawOverrides);
    
    if (product.id && overrides[String(product.id)] !== undefined) return Number(overrides[String(product.id)]);
    if (product.productId !== undefined && overrides[`id-${product.productId}`] !== undefined) return Number(overrides[`id-${product.productId}`]);
    if (product.productId !== undefined && overrides[`prod-${product.productId}`] !== undefined) return Number(overrides[`prod-${product.productId}`]);
    if (product.name && overrides[`name-${product.name.toLowerCase().trim()}`] !== undefined) return Number(overrides[`name-${product.name.toLowerCase().trim()}`]);
    return null;
  } catch {
    return null;
  }
}

/**
 * Query all items sold by a specific store/merchant
 */
export function getSoldItemsForStore(storeOrMerchant) {
  if (!storeOrMerchant) return [];
  const sId = storeOrMerchant.id ? String(storeOrMerchant.id).toLowerCase() : '';
  const sName = (storeOrMerchant.name || storeOrMerchant.merchant || '').toLowerCase().trim();
  const sOwner = (storeOrMerchant.ownerAddress || storeOrMerchant.owner || '').toLowerCase();

  const soldItems = [];
  const seenKeys = new Set();

  // 1. Check escrow orders
  try {
    const escrowOrders = JSON.parse(localStorage.getItem('hual_escrow_orders') || '[]');
    for (const ord of escrowOrders) {
      if (!ord) continue;
      const oMerchant = (ord.merchant || '').toLowerCase().trim();
      const oMerchantId = ord.merchantId ? String(ord.merchantId).toLowerCase() : '';
      const oSeller = (ord.sellerAddress || '').toLowerCase();

      const isStoreOrder = 
        (sId && oMerchantId && sId === oMerchantId) ||
        (sName && oMerchant && (oMerchant === sName || oMerchant.includes(sName) || sName.includes(oMerchant))) ||
        (sOwner && oSeller && sOwner === oSeller);

      if (isStoreOrder && Array.isArray(ord.items)) {
        for (const item of ord.items) {
          const itemKey = `${ord.orderId}-${item.orderItemId || item.productId || item.name}`;
          if (!seenKeys.has(itemKey)) {
            seenKeys.add(itemKey);
            soldItems.push({
              orderId: ord.orderId,
              orderItemId: item.orderItemId || itemKey,
              productId: item.productId,
              name: item.name,
              brand: item.brand,
              priceUsd: item.priceUsd,
              quantity: item.quantity || 1,
              size: item.size || 'Standard',
              imageUri: item.imageUri,
              buyerAddress: ord.buyerAddress,
              deliveryMethod: ord.deliveryMethod || item.deliveryMethod || 'pickup',
              status: item.status || ord.status || 'in_escrow',
              purchasedAt: ord.createdAt || item.purchasedAt || new Date().toISOString(),
              txHash: ord.txHash || item.txHash,
              payoutTxHash: ord.payoutTxHash || item.payoutTxHash || null,
              pickupPIN: ord.pickupPIN || item.pickupPIN
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error reading escrow orders for sold items:', e);
  }

  // 2. Check pickup orders
  try {
    const pickupOrders = JSON.parse(localStorage.getItem('hual_all_pickup_orders') || '[]');
    for (const ord of pickupOrders) {
      if (!ord) continue;
      const oMerchant = (ord.merchant || '').toLowerCase().trim();
      const oMerchantId = ord.merchantId ? String(ord.merchantId).toLowerCase() : '';
      const oSeller = (ord.sellerAddress || '').toLowerCase();

      const isStoreOrder = 
        (sId && oMerchantId && sId === oMerchantId) ||
        (sName && oMerchant && (oMerchant === sName || oMerchant.includes(sName) || sName.includes(oMerchant))) ||
        (sOwner && oSeller && sOwner === oSeller);

      if (isStoreOrder) {
        const itemKey = `${ord.orderId}-${ord.tokenId || ord.productName}`;
        if (!seenKeys.has(itemKey)) {
          seenKeys.add(itemKey);
          soldItems.push({
            orderId: ord.orderId,
            orderItemId: itemKey,
            productId: ord.productId,
            name: ord.productName || 'Verified Asset',
            brand: ord.productBrand || 'Authentic Brand',
            priceUsd: ord.priceUsd || ord.totalAmount,
            quantity: 1,
            size: ord.size || 'Standard',
            imageUri: ord.imageUri,
            buyerAddress: ord.buyerAddress,
            deliveryMethod: 'pickup',
            status: ord.status || 'in_escrow',
            purchasedAt: ord.createdAt || new Date().toISOString(),
            txHash: ord.txHash,
            payoutTxHash: ord.payoutTxHash || null,
            pickupPIN: ord.pickupPIN
          });
        }
      }
    }
  } catch (e) {
    console.warn('Error reading pickup orders for sold items:', e);
  }

  // Sort newest first
  return soldItems.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
}
