import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle, 
  ExternalLink, 
  Layers, 
  Clock, 
  ArrowRight,
  Search, 
  Filter, 
  Package, 
  Store, 
  Truck, 
  Zap, 
  Tag, 
  Star, 
  PlusCircle, 
  AlertCircle, 
  QrCode, 
  X, 
  Lock, 
  Check, 
  ChevronRight, 
  Heart, 
  RotateCcw, 
  CheckCircle2,
  MessageSquare,
  MapPin,
  Compass,
  ArrowLeft,
  Edit3,
  PackageCheck
} from 'lucide-react';
import EditStoreModal from './EditStoreModal';
import { buyWithUsdcEscrow, CONSUMER_ADDR } from '../lib/web3';
import { useAuth } from '../lib/auth/AuthContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { 
  CURATED_CATALOG, 
  VERIFIED_MERCHANTS, 
  BUYER_LOCATIONS
} from '../lib/catalogData';
import { HualIcon } from './HualLogo';
import HaulQrCode from './HaulQrCode';
import CommerceChatModal from './CommerceChatModal';
import ModalPortal from './ModalPortal';
import useScrollReveal from '../lib/useScrollReveal';
import ProductDetailPage from './ProductDetailPage';
import ProductReceiptModal from './ProductReceiptModal';
import { recordNewOrder, getSoldItemsForStore, getProductStockOverride } from '../lib/ordersRegistry';

export default function Marketplace({ 
  products = [], 
  onPurchaseSuccess,
  onPassportMinted,
  onOpenSellModal,
  searchQuery = '',
  setSearchQuery,
  selectedCategory = 'All',
  setSelectedCategory,
  forcedModal,
  onClearForcedModal,
  selectedMerchant: controlledMerchant,
  onSelectMerchant: controlledOnSelectMerchant,
  initialMerchant = null,
  wishlist = [],
  onToggleWishlist,
  onOpenRateSeller,
  cart = [],
  onAddToCart,
  followedStores = [],
  onToggleFollowStore,
  onOpenInbox,
  passports = [],
  onNavigateToSignIn,
  onDeleteProduct
}) {
  const { user, authenticated, usdcBalance, refreshBalance, deductUsdc, faucetUsdc, userLocation, updateUserLocation, userRole, userStore, updateStore } = useAuth();
  const userKey = user?.id || (user?.email ? user.email.toLowerCase() : 'guest');
  const [verifiedReviewNotice, setVerifiedReviewNotice] = useState(null);
  const [editStoreModalOpen, setEditStoreModalOpen] = useState(false);

  // Selected Merchant: null = General Storefront (Browse All) | Merchant Object = Merchant Storefront
  const [internalMerchant, setInternalMerchant] = useState(initialMerchant);
  const selectedMerchant = controlledMerchant !== undefined ? controlledMerchant : internalMerchant;
  const setSelectedMerchant = (m) => {
    if (controlledOnSelectMerchant) controlledOnSelectMerchant(m);
    setInternalMerchant(m);
  };

  const isMyStore = Boolean(
    selectedMerchant && (
      (userStore && selectedMerchant.id === userStore.id) ||
      (userStore && selectedMerchant.name && userStore.name && selectedMerchant.name.toLowerCase() === userStore.name.toLowerCase()) ||
      (selectedMerchant.ownerAddress && user?.address && selectedMerchant.ownerAddress.toLowerCase() === user.address.toLowerCase()) ||
      (selectedMerchant.owner && user?.address && selectedMerchant.owner.toLowerCase() === user.address.toLowerCase())
    )
  );

  const isMerchantMyStore = (merchant) => {
    if (!merchant) return false;
    const userAddr = user?.address?.toLowerCase();
    const merchantAddr = (merchant.ownerAddress || merchant.owner || merchant.seller)?.toLowerCase();
    if (userAddr && merchantAddr && userAddr === merchantAddr) return true;
    if (userStore && merchant.id && userStore.id && String(merchant.id) === String(userStore.id)) return true;
    if (userStore && merchant.name && userStore.name && merchant.name.toLowerCase() === userStore.name.toLowerCase()) return true;
    return false;
  };

  // Buyer Location State - initialized from user profile
  const [buyerLocation, setBuyerLocation] = useState(userLocation || BUYER_LOCATIONS[0].name);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    if (userLocation) {
      setBuyerLocation(userLocation);
    }
  }, [userLocation]);

  const handleSelectBuyerLocation = (newLoc) => {
    setBuyerLocation(newLoc);
    if (updateUserLocation) {
      updateUserLocation(newLoc);
    }
    setShowLocationPicker(false);
  };

  // Dynamic Distance & Pickup Time Calculator between Buyer and Merchant
  const calculateProximity = (buyerLoc, merchantLoc) => {
    const b = (buyerLoc || '').toLowerCase();
    const m = (merchantLoc || '').toLowerCase();
    
    if (b.includes('victoria island') || b.includes('vi')) {
      if (m.includes('victoria island')) return { distance: '0.9 km', transit: '10 mins walk • 3 mins drive', pickupReady: 'Ready in 25 mins' };
      if (m.includes('ikoyi')) return { distance: '3.4 km', transit: '12 mins drive', pickupReady: 'Ready in 35 mins' };
      if (m.includes('lekki')) return { distance: '5.1 km', transit: '18 mins drive', pickupReady: 'Ready in 45 mins' };
      if (m.includes('ikeja')) return { distance: '18.2 km', transit: '45 mins drive', pickupReady: 'Ready in 1 hour' };
      return { distance: '4.2 km', transit: '15 mins drive', pickupReady: 'Ready in 30 mins' };
    } else if (b.includes('lekki')) {
      if (m.includes('lekki')) return { distance: '0.8 km', transit: '8 mins walk • 2 mins drive', pickupReady: 'Ready in 20 mins' };
      if (m.includes('victoria island')) return { distance: '4.9 km', transit: '18 mins drive', pickupReady: 'Ready in 40 mins' };
      if (m.includes('ikoyi')) return { distance: '6.8 km', transit: '22 mins drive', pickupReady: 'Ready in 50 mins' };
      if (m.includes('ikeja')) return { distance: '24.0 km', transit: '55 mins drive', pickupReady: 'Ready in 1.5 hours' };
      return { distance: '5.0 km', transit: '20 mins drive', pickupReady: 'Ready in 40 mins' };
    } else if (b.includes('ikoyi')) {
      if (m.includes('ikoyi')) return { distance: '0.6 km', transit: '6 mins walk • 2 mins drive', pickupReady: 'Ready in 20 mins' };
      if (m.includes('victoria island')) return { distance: '3.1 km', transit: '10 mins drive', pickupReady: 'Ready in 30 mins' };
      if (m.includes('lekki')) return { distance: '6.5 km', transit: '20 mins drive', pickupReady: 'Ready in 45 mins' };
      if (m.includes('ikeja')) return { distance: '16.5 km', transit: '40 mins drive', pickupReady: 'Ready in 1 hour' };
      return { distance: '3.5 km', transit: '12 mins drive', pickupReady: 'Ready in 30 mins' };
    } else if (b.includes('ikeja')) {
      if (m.includes('ikeja')) return { distance: '1.2 km', transit: '12 mins drive', pickupReady: 'Ready in 25 mins' };
      if (m.includes('victoria island')) return { distance: '18.5 km', transit: '45 mins drive', pickupReady: 'Ready in 1 hour' };
      if (m.includes('ikoyi')) return { distance: '16.8 km', transit: '42 mins drive', pickupReady: 'Ready in 1 hour' };
      if (m.includes('lekki')) return { distance: '24.2 km', transit: '55 mins drive', pickupReady: 'Ready in 1.5 hours' };
      return { distance: '18.0 km', transit: '45 mins drive', pickupReady: 'Ready in 1 hour' };
    } else {
      return { distance: 'Air Dispatch', transit: 'Express 24-48h courier', pickupReady: 'Store pickup in Lagos' };
    }
  };

  // Storefront Tab for individual merchant: 'Products' | 'About' | 'Location' | 'Reviews' | 'Sold Items' (store owner only)
  const [storeTab, setStoreTab] = useState('Products');
  const [activeCategory, setActiveCategory] = useState(selectedCategory || 'All');
  const [isFollowing, setIsFollowing] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [priceFilter, setPriceFilter] = useState('all'); // 'all' | 'under-200' | '200-1000' | 'over-1000'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [pickupOnly, setPickupOnly] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [stockTick, setStockTick] = useState(0);

  // Strictly enforce: Only the store owner can view sold items
  useEffect(() => {
    if (!isMyStore && storeTab === 'Sold Items') {
      setStoreTab('Products');
    }
  }, [isMyStore, storeTab]);

  useEffect(() => {
    const handleStockUpdate = () => setStockTick(t => t + 1);
    window.addEventListener('hual_stock_updated', handleStockUpdate);
    return () => window.removeEventListener('hual_stock_updated', handleStockUpdate);
  }, []);

  // Sync internal category when external selectedCategory changes (e.g. from CategoriesExplorer or Navbar)
  useEffect(() => {
    if (selectedCategory !== undefined && selectedCategory !== null) {
      setActiveCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    if (setSelectedCategory) {
      setSelectedCategory(cat);
    }
  };

  const handleResetAllFilters = () => {
    handleCategoryChange('All');
    setSortBy('featured');
    setPriceFilter('all');
    setInStockOnly(false);
    setPickupOnly(false);
    setLocalSearch('');
    if (setSearchQuery) setSearchQuery('');
  };

  // Chat Modal State
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatContext, setChatContext] = useState({ merchant: null, product: null });

  // Merge user-created store and all created stores from storage into verified merchants list
  const allMerchants = useMemo(() => {
    let list = [...VERIFIED_MERCHANTS];
    try {
      const stored = localStorage.getItem('hual_all_created_stores');
      if (stored) {
        const parsed = JSON.parse(stored);
        list = [...parsed, ...list.filter(m => !parsed.some(p => p.id === m.id))];
      }
    } catch {}
    if (userStore) {
      list = [userStore, ...list.filter(m => m.id !== userStore.id)];
    }
    return list;
  }, [userStore]);

  // Helper to resolve merchant object for any product
  const resolveMerchantForProduct = (prod) => {
    if (!prod) return allMerchants?.[0] || VERIFIED_MERCHANTS[0];
    const list = (allMerchants && allMerchants.length > 0) ? allMerchants : VERIFIED_MERCHANTS;
    const pMerchantId = prod.merchantId || prod.sellerId;
    const pMerchantName = (prod.merchant || prod.store || '').toLowerCase().trim();
    const pBrand = (prod.brand || '').toLowerCase().trim();
    const pName = (prod.name || '').toLowerCase().trim();
    const pCat = (prod.category || '').toLowerCase().trim();
    
    // 1. Exact ID match
    if (pMerchantId) {
      const byId = list.find(m => String(m.id) === String(pMerchantId));
      if (byId) return byId;
    }

    // 2. Exact or partial store name match
    if (pMerchantName) {
      const byName = list.find(m => {
        const mName = (m.name || '').toLowerCase().trim();
        return mName === pMerchantName || mName.includes(pMerchantName) || pMerchantName.includes(mName);
      });
      if (byName) return byName;
    }

    // 3. Construct dynamic store object for custom listings so it preserves real store details and avatar
    if (prod.merchant) {
      return {
        id: prod.merchantId || `store-${prod.merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: prod.merchant,
        handle: `@${prod.merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}.hual`,
        verified: true,
        category: prod.category || 'Curated Goods',
        location: prod.merchantLocation || 'Victoria Island, Lagos',
        rating: 5.0,
        reviewsCount: 0,
        followersCount: '1.2k',
        avatar: prod.merchantAvatar || prod.storeAvatar || prod.storeImage || prod.imageUri || null,
        banner: prod.storeBanner || null,
        pickupTime: 'Ready in 30 mins',
        deliveryTime: 'Same-day courier',
        operatingHours: 'Mon - Sat: 9:00 AM - 7:00 PM',
        phone: '+234 1 800 4825',
        description: `Official storefront for ${prod.merchant} on Hual. All products backed by verifiable digital Product Passports.`,
        ownerAddress: prod.seller || prod.ownerAddress
      };
    }

    return list[0] || {
      id: 'store-general',
      name: prod?.brand || 'Verified Store',
      handle: '@store.hual',
      verified: true,
      category: prod?.category || 'Curated Goods',
      location: 'Victoria Island, Lagos',
      reviewsCount: 1,
      followersCount: '1',
      avatar: prod?.imageUri || '/assets/hual_pwa_icon.png',
      banner: '',
      description: 'Official storefront on Hual.',
      ownerAddress: prod?.seller || prod?.ownerAddress
    };
  };

  // Verify that an item is ACTUALLY in the buyer's physical possession (In Hand)
  // Orders that are cancelled, refunded, or still in escrow awaiting collection CANNOT be reviewed.
  const isPassportInHand = (p) => {
    if (!p) return false;
    const tokenIdStr = String(p.tokenId || '');
    const serialStr = String(p.serialNumber || '');
    const idStr = String(p.id || '');
    const orderIdStr = String(p.orderId || '');
    const prodIdStr = String(p.productId || '');

    // Check persistent refunded map
    let refundedMap = {};
    try {
      refundedMap = JSON.parse(localStorage.getItem('hual_refunded_passports') || '{}');
    } catch {}

    if (
      (tokenIdStr && refundedMap[tokenIdStr]) ||
      (serialStr && refundedMap[serialStr]) ||
      (idStr && refundedMap[idStr]) ||
      (orderIdStr && refundedMap[orderIdStr]) ||
      (prodIdStr && refundedMap[prodIdStr])
    ) {
      return false;
    }

    // Check cancelled escrow orders
    try {
      const escrowOrders = JSON.parse(localStorage.getItem('hual_escrow_orders') || '[]');
      const isCancelledOrder = escrowOrders.some(ord => 
        ((ord.orderId && (String(ord.orderId) === orderIdStr || String(ord.orderId) === tokenIdStr)) ||
         (ord.items && ord.items.some(it => String(it.id) === prodIdStr || (p.productName && it.name === p.productName)))) &&
        (ord.status === 'cancelled' || ord.status === 'refunded')
      );
      if (isCancelledOrder) return false;
    } catch {}

    const isCancelled = Boolean(
      p.isCancelled || 
      p.currentState === 'CANCELLED' || 
      p.currentState === 'CANCELED' || 
      p.status === 'cancelled' || 
      p.status === 'canceled'
    );
    const isRefunded = Boolean(
      p.isRefunded || 
      p.currentState === 'REFUNDED' || 
      p.status === 'refunded'
    );
    if (isCancelled || isRefunded) return false;

    // Must be collected/delivered into the buyer's physical possession
    return Boolean(
      p.currentState === 'COLLECTED' || 
      p.currentState === 'ACTIVE_OWNERSHIP' || 
      p.currentState === 'DELIVERED' || 
      p.currentState === 'COMPLETED' || 
      p.currentState === 'OWNED' || 
      p.isCollected || 
      p.isDelivered
    );
  };

  // Check if current user has an item in hand for this EXACT product (never other store items)
  const hasPurchasedProduct = (prod) => {
    if (!passports || !passports.length || !prod) return false;
    const targetProdId = String(prod.productId || prod.id || '').trim();
    const targetProdName = (prod.name || prod.productName || '').trim().toLowerCase();
    if (!targetProdId && !targetProdName) return false;

    return passports.some(p => {
      if (!isPassportInHand(p)) return false; // Must strictly have collected item in hand!
      const pProdId = String(p.productId || '').trim();
      const pName = (p.productName || p.name || '').trim().toLowerCase();

      // 1. Strict Product ID match
      if (targetProdId && pProdId && targetProdId === pProdId) return true;

      // 2. Exact full normalized product name match (never partial word matching!)
      if (targetProdName && pName && targetProdName.length >= 4 && pName.length >= 4 && targetProdName === pName) {
        return true;
      }

      return false;
    });
  };

  // Check if current user has at least one item in hand from a specific merchant
  const hasPurchasedFromMerchant = (merchant) => {
    if (!passports || !passports.length || !merchant) return false;
    const mName = (merchant.name || '').toLowerCase().trim();
    const mId = merchant.id ? String(merchant.id) : null;
    return passports.some(p => {
      if (!isPassportInHand(p)) return false; // Must strictly have item in hand!
      if (mId && p.merchantId && String(p.merchantId) === mId) return true;
      const pMerchant = (p.originalMerchant || p.merchant || '').toLowerCase().trim();
      if (mName && pMerchant && (mName.includes(pMerchant) || pMerchant.includes(mName))) return true;
      return false;
    });
  };

  // Product Detail Modal state (Screen 03)
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(10);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Always reset scroll to top on product or store view navigation
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [selectedProduct, selectedMerchant, storeTab]);

  // Instant Button Feedback States
  const [addedModalCart, setAddedModalCart] = useState(false);
  const [addedCardId, setAddedCardId] = useState(null);

  // Checkout Modal state (Screen 04)
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup'); // 'pickup' | 'delivery'
  const [purchasing, setPurchasing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Catalog list of genuine user and onchain products (filtered of any deleted products)
  const catalogList = useMemo(() => {
    let deletedSet = new Set();
    try {
      const storedDeleted = JSON.parse(localStorage.getItem('hual_deleted_product_ids') || '[]');
      if (Array.isArray(storedDeleted)) {
        deletedSet = new Set(storedDeleted.map(x => String(x).toLowerCase().trim()));
      }
    } catch {}

    const list = products || [];
    return list.filter(p => {
      if (!p) return false;
      const idKey = String(p.id || p.productId || '').toLowerCase().trim();
      const onchainKey = `onchain-${idKey}`;
      const nameKey = (p.name || '').toLowerCase().trim();
      return !deletedSet.has(idKey) && !deletedSet.has(onchainKey) && !deletedSet.has(nameKey);
    });
  }, [products]);

  // Handle external modal trigger
  React.useEffect(() => {
    if (forcedModal === 'product') {
      setSelectedProduct(catalogList[0] || null);
    } else if (forcedModal === 'checkout') {
      setCheckoutProduct(catalogList[0] || null);
    }
  }, [forcedModal, catalogList]);

  // Filter products by category, search query, selected merchant, price, and availability
  const filteredProducts = useMemo(() => {
    let list = (catalogList || []).filter((p) => {
      if (!p) return false;

      // Merchant filter if inside merchant store
      if (selectedMerchant) {
        const sName = (selectedMerchant.name || '').toLowerCase();
        const matchesMerchant = 
          (p.merchant && p.merchant.toLowerCase().includes(sName)) ||
          (p.brand && sName.includes(p.brand.toLowerCase())) ||
          (p.merchantId && String(p.merchantId) === String(selectedMerchant.id));
        if (!matchesMerchant) return false;
      }

      // Category filter matching (strictly by product category, NOT brand or product name keywords)
      const currentCat = (activeCategory || selectedCategory || 'All').trim().toLowerCase();
      let matchesCat = currentCat === 'all' || currentCat === 'all curations' || currentCat === '';
      if (!matchesCat) {
        const prodCat = (p.category || '').toLowerCase().trim();

        if (currentCat === 'footwear' || currentCat.includes('shoe')) {
          matchesCat = prodCat === 'footwear' || prodCat === 'shoes' || prodCat === 'sneakers' || prodCat.includes('shoe') || prodCat.includes('footwear');
        } else if (currentCat === 'apparel' || currentCat.includes('clothing')) {
          matchesCat = prodCat === 'apparel' || prodCat === 'clothing' || prodCat.includes('apparel');
        } else if (currentCat === 'accessories' || currentCat.includes('bag')) {
          matchesCat = prodCat === 'accessories' || prodCat === 'bags' || prodCat.includes('accessory') || prodCat.includes('bag');
        } else if (currentCat === 'audio' || currentCat.includes('sound')) {
          matchesCat = prodCat === 'audio' || prodCat.includes('audio') || prodCat.includes('sound') || prodCat.includes('headphone');
        } else if (currentCat === 'tech' || currentCat.includes('device')) {
          matchesCat = prodCat === 'tech' || prodCat === 'technology' || prodCat === 'smart devices' || prodCat === 'optics' || prodCat.includes('camera') || prodCat.includes('phone') || prodCat.includes('laptop');
        } else if (currentCat === 'synthesizers' || currentCat.includes('synth')) {
          matchesCat = prodCat === 'synthesizers' || prodCat === 'synthesizer' || prodCat.includes('synth');
        } else if (currentCat === 'watches' || currentCat.includes('watch')) {
          matchesCat = prodCat === 'watches' || prodCat === 'watch' || prodCat.includes('watch') || prodCat.includes('timepiece');
        } else if (currentCat === 'eyewear' || currentCat.includes('glass')) {
          matchesCat = prodCat === 'eyewear' || prodCat.includes('eyewear') || prodCat.includes('glass') || prodCat.includes('frame');
        } else {
          matchesCat = prodCat === currentCat || prodCat.includes(currentCat) || currentCat.includes(prodCat);
        }
      }

      if (!matchesCat) return false;

      // Price filter
      const price = p.priceUsd || 0;
      if (priceFilter === 'under-200' && price >= 200) return false;
      if (priceFilter === '200-1000' && (price < 200 || price > 1000)) return false;
      if (priceFilter === 'over-1000' && price <= 1000) return false;

      // In stock filter
      if (inStockOnly && (!p.stock || p.stock <= 0)) return false;

      // Pickup filter
      if (pickupOnly && !p.allowsPickup) return false;

      // Search query filter (combines local catalog search and top navbar search)
      const q = (localSearch || searchQuery || '').trim().toLowerCase();
      if (q) {
        const matchesName = (p.name && p.name.toLowerCase().includes(q));
        const matchesBrand = (p.brand && p.brand.toLowerCase().includes(q));
        const matchesCategory = (p.category && p.category.toLowerCase().includes(q));
        const matchesMerchant = (p.merchant && p.merchant.toLowerCase().includes(q));
        const matchesDesc = (p.description && p.description.toLowerCase().includes(q));
        if (!matchesName && !matchesBrand && !matchesCategory && !matchesMerchant && !matchesDesc) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => (a.priceUsd || 0) - (b.priceUsd || 0));
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => (b.priceUsd || 0) - (a.priceUsd || 0));
    } else if (sortBy === 'stock') {
      list = [...list].sort((a, b) => (b.stock || 0) - (a.stock || 0));
    }

    return list;
  }, [catalogList, activeCategory, selectedCategory, searchQuery, localSearch, selectedMerchant, priceFilter, inStockOnly, pickupOnly, sortBy]);

  useScrollReveal([
    filteredProducts?.length, 
    activeCategory, 
    selectedCategory, 
    searchQuery, 
    localSearch, 
    sortBy, 
    priceFilter, 
    inStockOnly, 
    pickupOnly, 
    selectedMerchant?.id,
    storeTab
  ]);

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes?.[2] || product.sizes?.[0] || 10);
    setSelectedImageIndex(0);
  };

  const isMyProduct = (prod) => {
    if (!prod) return false;
    const userAddr = user?.address?.toLowerCase();
    const sellerAddr = (prod.seller || prod.ownerAddress || prod.merchantAddress)?.toLowerCase();
    if (userAddr && sellerAddr && userAddr === sellerAddr) return true;
    if (userStore && prod.merchantId && String(prod.merchantId) === String(userStore.id)) return true;
    if (userStore && prod.merchant && prod.merchant.toLowerCase() === userStore.name?.toLowerCase()) return true;
    return false;
  };

  const handleStartCheckout = (product) => {
    if (!authenticated || !user) {
      if (onNavigateToSignIn) onNavigateToSignIn();
      return;
    }
    if (isMyProduct(product)) {
      alert("You cannot purchase items listed by your own store.");
      return;
    }
    setSelectedProduct(null);
    setCheckoutProduct(product);
    setDeliveryMethod(product.allowsPickup ? 'pickup' : 'delivery');
    setOrderSuccess(null);
  };

  const handleOpenChat = (merchant, product = null) => {
    if (!authenticated || !user) {
      if (onNavigateToSignIn) onNavigateToSignIn();
      return;
    }
    if (isMerchantMyStore(merchant) || (product && isMyProduct(product))) {
      alert("You cannot message your own store.");
      return;
    }
    setSelectedProduct(null);
    if (onOpenInbox) {
      onOpenInbox(merchant, product);
    } else {
      setChatContext({ merchant, product });
      setChatModalOpen(true);
    }
  };

  const handleConfirmPayment = async () => {
    if (!checkoutProduct) return;
    const currentBal = Number(usdcBalance) || 0;
    const reqPrice = Number(checkoutProduct.priceUsd) || 0;
    if (currentBal < reqPrice) {
      alert(`Insufficient funds! Your USDC balance is $${currentBal.toLocaleString()}, but this order costs $${reqPrice.toLocaleString()}. Please tap "+ Faucet $1,000 USDC" in checkout to top up.`);
      return;
    }
    setPurchasing(true);
    try {
      const buyerAddr = user?.address || CONSUMER_ADDR;
      const uniquePin = String(Math.floor(1000 + Math.random() * 9000));
      const res = await buyWithUsdcEscrow({
        productId: checkoutProduct.productId || 1,
        name: checkoutProduct.name,
        brand: checkoutProduct.brand,
        category: checkoutProduct.category,
        imageUri: checkoutProduct.imageUri,
        description: checkoutProduct.description,
        priceUsd: checkoutProduct.priceUsd,
        buyerAddress: buyerAddr,
        isPickup: deliveryMethod === 'pickup',
        pickupPIN: uniquePin
      });

      const txHash = res?.txHash || res?.hash;
      const tokenId = res?.tokenId || Math.floor(Math.random() * 9000) + 1000;
      const orderId = res?.orderId || Math.floor(Math.random() * 9000) + 1000;

      // Immediately deduct balance in UI & sync
      if (deductUsdc && checkoutProduct.priceUsd) {
        deductUsdc(checkoutProduct.priceUsd);
      }

      const newPassport = {
        tokenId,
        productId: checkoutProduct.productId || checkoutProduct.id || ('prod-' + (checkoutProduct.name ? checkoutProduct.name.toLowerCase().replace(/[^a-z0-9]/g, '') : tokenId)),
        productName: checkoutProduct.name,
        productBrand: checkoutProduct.brand,
        imageUri: checkoutProduct.imageUri || '/assets/air_max_95.jpg',
        category: checkoutProduct.category || 'Curated',
        description: checkoutProduct.description || '',
        serialNumber: checkoutProduct.serialNumber || `SN-${checkoutProduct.name.replace(/\s+/g, '-').slice(0, 4).toUpperCase()}-${String(tokenId).padStart(4, '0')}`,
        originalMerchant: checkoutProduct.merchant || selectedMerchant?.name || 'Verified Merchant',
        merchantLocation: checkoutProduct.merchantLocation || selectedMerchant?.location || 'Victoria Island, Lagos',
        originalPriceUsd: checkoutProduct.priceUsd,
        purchaseTimestamp: new Date().toLocaleString(),
        warrantyExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        daysRemainingWarranty: 365,
        deliveryMethod: deliveryMethod,
        currentState: deliveryMethod === 'pickup' ? 'READY_FOR_PICKUP' : 'IN_TRANSIT',
        currentStateIndex: deliveryMethod === 'pickup' ? 3 : 2,
        pickupPIN: uniquePin,
        paymentTxRef: txHash,
        transferCount: 0,
        specs: checkoutProduct.specs || []
      };

      // Save to global & user-scoped storage
      const existing = JSON.parse(localStorage.getItem('hual_my_passports') || '[]');
      localStorage.setItem('hual_my_passports', JSON.stringify([newPassport, ...existing]));

      if (userKey) {
        const userScoped = JSON.parse(localStorage.getItem(`hual_my_passports_${userKey}`) || '[]');
        localStorage.setItem(`hual_my_passports_${userKey}`, JSON.stringify([newPassport, ...userScoped]));
      }
      if (user?.address) {
        const addrScoped = JSON.parse(localStorage.getItem(`hual_my_passports_${user.address.toLowerCase()}`) || '[]');
        localStorage.setItem(`hual_my_passports_${user.address.toLowerCase()}`, JSON.stringify([newPassport, ...addrScoped]));
      }

      // Record order into unified registries (escrow orders & dedicated pickup registry)
      const sellerAddr = checkoutProduct.seller || checkoutProduct.ownerAddress || selectedMerchant?.ownerAddress || null;
      recordNewOrder({
        orderId: String(orderId),
        buyerAddress: buyerAddr,
        buyerId: userKey,
        sellerAddress: sellerAddr,
        merchant: checkoutProduct.merchant || selectedMerchant?.name || 'Verified Merchant Store',
        merchantId: checkoutProduct.merchantId || selectedMerchant?.id,
        merchantLocation: checkoutProduct.merchantLocation || selectedMerchant?.location,
        merchantAvatar: checkoutProduct.merchantAvatar || checkoutProduct.storeAvatar || selectedMerchant?.avatar,
        deliveryMethod,
        pickupPIN: uniquePin,
        items: [{
          productId: checkoutProduct.productId || checkoutProduct.id,
          name: checkoutProduct.name,
          priceUsd: checkoutProduct.priceUsd,
          quantity: 1,
          size: checkoutProduct.selectedSize || 'Standard',
          merchant: checkoutProduct.merchant || selectedMerchant?.name,
          merchantId: checkoutProduct.merchantId || selectedMerchant?.id,
          sellerAddress: sellerAddr,
          merchantLocation: checkoutProduct.merchantLocation || selectedMerchant?.location,
          merchantAvatar: checkoutProduct.merchantAvatar || selectedMerchant?.avatar,
          imageUri: checkoutProduct.imageUri,
          brand: checkoutProduct.brand,
          pickupPIN: uniquePin,
          tokenId,
          serialNumber: newPassport.serialNumber
        }],
        txHash,
        totalAmount: checkoutProduct.priceUsd,
        tokenId,
        serialNumber: newPassport.serialNumber
      });

      if (onPassportMinted) {
        onPassportMinted(newPassport);
      }

      setOrderSuccess({
        orderNumber: `#HUL-${orderId}-MON`,
        txHash,
        blockNumber: res?.blockNumber,
        passport: newPassport,
        explorerUrl: res?.explorerUrl || `https://testnet.monadexplorer.com/tx/${txHash}`
      });
    } catch (err) {
      console.error('Onchain checkout error:', err);
      alert('Transaction error: ' + (err.reason || err.message || err));
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '0 0 60px' }}>
      
      {/* VIEW C: FULL DEDICATED PRODUCT DETAIL PAGE (NO MODAL) */}
      {selectedProduct ? (
        <ProductDetailPage
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          onAddToCart={(prod, sz) => onAddToCart && onAddToCart(prod, sz)}
          onStartCheckout={(prod) => handleStartCheckout(prod)}
          onOpenStore={(prod) => {
            const mObj = resolveMerchantForProduct(prod);
            setSelectedMerchant(mObj);
            setSelectedProduct(null);
          }}
          onOpenChat={(prod) => {
            const mObj = resolveMerchantForProduct(prod);
            handleOpenChat(mObj, prod);
          }}
          onOpenRateItem={(prod) => {
            const mObj = resolveMerchantForProduct(prod);
            if (onOpenRateSeller) onOpenRateSeller(mObj, prod);
          }}
          hasItemInHand={hasPurchasedProduct(selectedProduct)}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          buyerLocation={buyerLocation}
          onNavigateToSignIn={onNavigateToSignIn}
          onEditProduct={(prod) => {
            if (onOpenSellModal) onOpenSellModal(prod);
          }}
          onDeleteProduct={(prod) => {
            if (onDeleteProduct) onDeleteProduct(prod);
            setSelectedProduct(null);
          }}
        />
      ) : (
        <>
          {/* If viewing a specific Merchant store, provide clear back button */}
          {selectedMerchant && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: '#0D1616',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setSelectedMerchant(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '999px',
              background: '#162424',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
            <span>← Back to General Marketplace</span>
          </button>
        </div>
      )}

      {/* ========================================================
          VIEW A: GENERAL STOREFRONT (BROWSE ALL MERCHANTS & GOODS)
          ======================================================== */}
      {!selectedMerchant ? (
        <div>
          {/* General Marketplace Header */}
          <div className="apple-liquid-glass" style={{
            padding: '28px 28px',
            marginBottom: '28px',
            position: 'relative',
            borderRadius: '24px'
          }}>
            <div style={{ maxWidth: '640px', position: 'relative', zIndex: 1 }}>
              <div className="eyebrow" style={{ marginBottom: '8px', fontSize: '0.68rem' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--brand-green)' }} />
                <span>Verified Merchandise</span>
              </div>
              <h1 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                General Marketplace
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', lineHeight: 1.5, margin: 0 }}>
                Physical luxury merchandise with verifiable Product Passports. Fast in-store collection and verified local delivery.
              </p>
            </div>

            {/* Glowing Accent */}
            <div style={{
              position: 'absolute',
              right: '-50px',
              top: '-50px',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(132, 244, 59, 0.12) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
          </div>
          {/* Section Divider: General Catalog */}
          <div className="reveal-on-scroll" style={{ marginBottom: '24px' }}>
            {/* Top row: Title + In-Catalog Live Search & Sorting */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>All Listed Merchandise</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'var(--brand-green-dim)',
                    color: 'var(--brand-green)',
                    border: '1px solid var(--brand-green-border)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {filteredProducts.length} Passports
                  </span>
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                  Verifiable luxury assets on Monad with instant in-store collection or insured dispatch
                </div>
              </div>

              {/* In-Catalog Live Search & Sort */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  position: 'relative',
                  width: '260px'
                }}>
                  <Search size={14} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search this catalog..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 30px 8px 34px',
                      borderRadius: '999px',
                      background: '#121C1C',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      outline: 'none'
                    }}
                  />
                  {localSearch && (
                    <button
                      onClick={() => setLocalSearch('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: '2px'
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Sort By Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '999px',
                    background: '#121C1C',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#D1D5DB',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stock">Most Stock</option>
                </select>
              </div>
            </div>

            {/* Middle Row: Category Filter Pills & Quick Availability Chips */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 14px',
              background: '#0D1616',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 700, marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Category:
                </span>
                {['All', 'Footwear', 'Apparel', 'Accessories', 'Audio', 'Tech', 'Synthesizers', 'Watches', 'Eyewear'].map((cat) => {
                  const isSelected = cat === 'All' 
                    ? (!activeCategory || activeCategory === 'All' || activeCategory === 'All Curations' || activeCategory === '')
                    : activeCategory?.toLowerCase() === cat.toLowerCase();

                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: isSelected ? 'var(--brand-green)' : '#162424',
                        color: isSelected ? '#080F0F' : '#9CA3AF',
                        border: isSelected ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '0.74rem',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Quick Filter Chips (In Stock, Pickup) & Clear All */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={() => setInStockOnly(!inStockOnly)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    background: inStockOnly ? 'rgba(132, 244, 59, 0.18)' : '#121C1C',
                    color: inStockOnly ? 'var(--brand-green)' : '#9CA3AF',
                    border: inStockOnly ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Package size={12} />
                  <span>In Stock</span>
                </button>

                <button
                  onClick={() => setPickupOnly(!pickupOnly)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    background: pickupOnly ? 'rgba(132, 244, 59, 0.18)' : '#121C1C',
                    color: pickupOnly ? 'var(--brand-green)' : '#9CA3AF',
                    border: pickupOnly ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Store size={12} />
                  <span>Pickup Ready</span>
                </button>

                {/* Clear Filters Button if any active */}
                {((activeCategory !== 'All' && activeCategory !== 'All Curations' && activeCategory) ||
                  sortBy !== 'featured' ||
                  priceFilter !== 'all' ||
                  inStockOnly ||
                  pickupOnly ||
                  localSearch ||
                  searchQuery) && (
                  <button
                    onClick={handleResetAllFilters}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '999px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#F87171',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================
            VIEW B: INDIVIDUAL MERCHANT STOREFRONT (SCREEN 02 FIGMA SPEC)
            ======================================================== */
        <div>
          {/* Back button */}
          <button
            onClick={() => setSelectedMerchant(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#121C1C',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              padding: '6px 14px',
              color: '#9CA3AF',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '18px'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to All Stores & Marketplace</span>
          </button>

          {/* Store Banner & Info Box (Apple Liquid Glass) */}
          <div style={{
            background: 'rgba(14, 20, 20, 0.65)',
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '26px',
            overflow: 'hidden',
            marginBottom: '32px',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Banner graphic */}
            <div style={{
              height: '210px',
              background: '#080F0F',
              position: 'relative',
              overflow: 'hidden',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <img 
                src={selectedMerchant.banner || selectedMerchant.storeImage || '/assets/nike_store_banner.jpg'} 
                alt={selectedMerchant.name}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.75,
                  transition: 'opacity 0.3s ease'
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(8, 15, 15, 0.94) 25%, rgba(8, 15, 15, 0.55) 65%, rgba(8, 15, 15, 0.88) 100%)'
              }} />
            </div>

            {/* Store Info Row */}
            <div style={{
              padding: '0 32px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '20px',
              marginTop: '-44px',
              position: 'relative',
              zIndex: 2
            }}>
              {/* Avatar & Title */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
                <div style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '22px',
                  background: '#080F0F',
                  border: '3px solid #121C1C',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)'
                }}>
                  <img src={selectedMerchant.avatar} alt={selectedMerchant.name} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h1 className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {selectedMerchant.name}
                    </h1>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'var(--brand-green-dim)',
                      color: 'var(--brand-green)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      border: '1px solid var(--brand-green-border)'
                    }}>
                      <CheckCircle2 size={13} /> VERIFIED STORE
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.84rem', color: '#9CA3AF', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span>{selectedMerchant.category}</span>
                    <span>•</span>
                    <span>{selectedMerchant.location}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--brand-green)', marginTop: '6px', fontWeight: 600, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(132, 244, 59, 0.08)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(132, 244, 59, 0.2)' }}>
                      <Clock size={12} />
                      <span>Hours: {selectedMerchant.openingTime || '09:00 AM'} - {selectedMerchant.closingTime || '07:00 PM'}</span>
                    </div>
                    {selectedMerchant.operatingHours && (
                      <span style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>({selectedMerchant.operatingHours})</span>
                    )}
                    <span>•</span>
                    <span>In-Store Pickup: {selectedMerchant.pickupTime || 'Ready in 30 mins'}</span>
                    <span>•</span>
                    <span>Dispatch: {selectedMerchant.deliveryTime || 'Same-day courier'}</span>
                  </div>
                </div>
              </div>

              {/* Actions: Edit Store (for owner) / Rate / Message / Follow */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {isMyStore && (
                  <button
                    onClick={() => setEditStoreModalOpen(true)}
                    className="btn-pill-primary"
                    style={{
                      padding: '8px 18px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 0 16px rgba(132, 244, 59, 0.3)'
                    }}
                    title="Edit store location, operating hours, schedule & details"
                  >
                    <Edit3 size={14} />
                    <span>Edit Store Details</span>
                  </button>
                )}
                {hasPurchasedFromMerchant(selectedMerchant) && (
                  <button
                    onClick={() => {
                      if (onOpenRateSeller) onOpenRateSeller(selectedMerchant);
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '999px',
                      background: 'rgba(251, 191, 36, 0.12)',
                      color: '#FBBF24',
                      border: '1px solid rgba(251, 191, 36, 0.35)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <MessageSquare size={14} />
                    <span>Review Store</span>
                  </button>
                )}

                {!isMyStore && (
                  <button
                    onClick={() => handleOpenChat(selectedMerchant)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '999px',
                      background: 'var(--brand-green-dim)',
                      color: 'var(--brand-green)',
                      border: '1px solid var(--brand-green-border)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageSquare size={14} />
                    <span>Message Store</span>
                  </button>
                )}

                {!isMyStore && (
                  <button
                    onClick={() => {
                      if (!authenticated || !user) {
                        if (onNavigateToSignIn) onNavigateToSignIn();
                        return;
                      }
                      if (onToggleFollowStore) onToggleFollowStore(selectedMerchant.id);
                    }}
                    style={{
                      padding: '8px 22px',
                      borderRadius: '999px',
                      background: followedStores.includes(selectedMerchant?.id) ? 'var(--brand-green)' : '#162424',
                      color: followedStores.includes(selectedMerchant?.id) ? '#080F0F' : '#FFFFFF',
                      border: followedStores.includes(selectedMerchant?.id) ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.15)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {followedStores.includes(selectedMerchant?.id) ? 'Following' : 'Follow Store'}
                  </button>
                )}
              </div>
            </div>

            {/* Store Tabs: Products | About | Location | Reviews | (Sold Items for store owners only) */}
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '0 32px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              {['Products', 'About', 'Location', 'Reviews', ...(isMyStore ? ['Sold Items'] : [])].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStoreTab(tab)}
                  style={{
                    padding: '14px 18px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: storeTab === tab ? '2px solid var(--brand-green)' : '2px solid transparent',
                    color: storeTab === tab ? '#FFFFFF' : '#9CA3AF',
                    fontSize: '0.86rem',
                    fontWeight: storeTab === tab ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content: Location & Pickup Information */}
          {storeTab === 'Location' && (
            <div style={{
              background: '#0D1616',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '32px'
            }}>
              <div style={{ maxWidth: '720px' }}>
                <div className="eyebrow" style={{ marginBottom: '12px' }}>
                  <MapPin size={14} color="var(--brand-green)" />
                  <span>Physical Storefront & Collection Desk</span>
                </div>
                <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px' }}>
                  {selectedMerchant.name} — Store Location
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                  <div style={{ background: '#080F0F', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Physical Street Address</div>
                    <div style={{ fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 700, marginTop: '4px' }}>
                      {selectedMerchant.fullAddress || selectedMerchant.location}
                    </div>
                  </div>

                  <div style={{ background: '#080F0F', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>Distance from Your Delivery Location</div>
                    {(() => {
                      const prox = calculateProximity(buyerLocation, selectedMerchant.location);
                      return (
                        <div>
                          <div style={{ fontSize: '0.92rem', color: 'var(--brand-green)', fontWeight: 800, marginTop: '4px' }}>
                            {prox.distance} ({prox.transit})
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#9CA3AF', marginTop: '2px' }}>
                            Relative to: {buyerLocation}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div style={{ background: '#080F0F', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="var(--brand-green)" />
                      <span>Operating Hours & Office Schedule</span>
                    </h4>
                    {isMyStore && (
                      <button
                        onClick={() => setEditStoreModalOpen(true)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--brand-green)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit3 size={12} />
                        <span>Edit Hours</span>
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#D1D5DB', lineHeight: 1.6 }}>
                    • <strong>Opening & Closing:</strong> {selectedMerchant.openingTime || '09:00 AM'} – {selectedMerchant.closingTime || '07:00 PM'}<br />
                    • <strong>Office Hours / Schedule:</strong> {selectedMerchant.operatingHours || 'Monday – Saturday: 9:00 AM – 7:00 PM'}<br />
                    • <strong>Phone / Desk:</strong> {selectedMerchant.phone || '+234 1 800 4825'} ({selectedMerchant.chatRep || 'Store Lead'})<br />
                    • <strong>In-Store Pickup:</strong> {selectedMerchant.pickupTime || 'Ready in 30 mins'}. Show your onchain QR code for immediate release.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {!isMyStore && (
                    <button
                      onClick={() => handleOpenChat(selectedMerchant)}
                      className="btn-pill-primary"
                      style={{ padding: '10px 22px', fontSize: '0.84rem', fontWeight: 800 }}
                    >
                      <MessageSquare size={14} style={{ marginRight: '6px' }} />
                      Message Store for Directions
                    </button>
                  )}
                  {isMyStore && (
                    <button
                      onClick={() => setEditStoreModalOpen(true)}
                      className="btn-pill-secondary"
                      style={{ padding: '10px 20px', fontSize: '0.84rem', fontWeight: 700 }}
                    >
                      <Edit3 size={14} style={{ marginRight: '6px' }} color="var(--brand-green)" />
                      Edit Storefront
                    </button>
                  )}
                  <button
                    onClick={() => setStoreTab('Products')}
                    className="btn-pill-secondary"
                    style={{ padding: '10px 20px', fontSize: '0.84rem' }}
                  >
                    View Store Products
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: About Store */}
          {storeTab === 'About' && (
            <div style={{
              background: '#0D1616',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '32px'
            }}>
              <div style={{ maxWidth: '720px' }}>
                <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 14px' }}>
                  About {selectedMerchant.name}
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#D1D5DB', lineHeight: 1.7, marginBottom: '20px' }}>
                  {selectedMerchant.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#080F0F', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Verified Status</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--brand-green)', fontWeight: 800, marginTop: '2px' }}>Monad Smart Contract Active</div>
                  </div>
                  <div style={{ background: '#080F0F', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Escrow Settlement</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--brand-green)', fontWeight: 800, marginTop: '2px' }}>Instant Release on In-Hand Verification</div>
                  </div>
                  <div style={{ background: '#080F0F', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Digital Warranty</div>
                    <div style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 800, marginTop: '2px' }}>100% Digital Passports Minted</div>
                  </div>
                </div>

                {!isMyStore && (
                  <button
                    onClick={() => handleOpenChat(selectedMerchant)}
                    className="btn-pill-primary"
                    style={{ padding: '10px 22px', fontSize: '0.84rem', fontWeight: 800 }}
                  >
                    <MessageSquare size={14} style={{ marginRight: '6px' }} />
                    Speak to Store Representative
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Store Reviews */}
          {storeTab === 'Reviews' && (() => {
            let customReviews = [];
            try {
              const saved = localStorage.getItem(`hual_store_reviews_${selectedMerchant.id}`);
              if (saved) customReviews = JSON.parse(saved);
            } catch (e) {}

            const allMerchantReviews = customReviews;

            return (
              <div style={{
                background: '#0D1616',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '32px',
                marginBottom: '32px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
                  <div>
                    <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      Customer Reviews for {selectedMerchant.name}
                    </h2>
                    <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginTop: '4px' }}>
                      Verified ratings and reviews from authenticated shoppers on Hual.
                    </div>
                  </div>

                  {hasPurchasedFromMerchant(selectedMerchant) && (
                    <button
                      onClick={() => {
                        if (onOpenRateSeller) onOpenRateSeller(selectedMerchant);
                      }}
                      className="btn-pill-primary btn-pill-sm"
                      style={{ padding: '8px 20px', fontWeight: 800 }}
                    >
                      <MessageSquare size={14} />
                      <span>Write a Review</span>
                    </button>
                  )}
                </div>

                {allMerchantReviews.length === 0 ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: '#080F0F',
                    borderRadius: '16px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                  }}>
                    <MessageSquare size={24} color="var(--brand-green)" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
                    <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
                      No Customer Reviews Yet
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.8rem', maxWidth: '380px', margin: '0 auto', lineHeight: 1.5 }}>
                      Verified reviews are written exclusively by customers who complete an in-store pickup handover or courier delivery.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {allMerchantReviews.map((rev, i) => (
                      <div key={rev.id || i} style={{ background: '#080F0F', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ color: '#FFFFFF', fontSize: '0.88rem' }}>{rev.reviewerName || rev.name}</strong>
                            <span style={{ fontSize: '0.68rem', color: 'var(--brand-green)', background: 'var(--brand-green-dim)', padding: '2px 6px', borderRadius: '999px' }}>Verified Buyer</span>
                            {rev.productName && (
                              <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>• {rev.productName}</span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.74rem', color: '#6B7280' }}>{rev.date}</span>
                        </div>
                        {rev.tags && rev.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {rev.tags.map((t, ti) => (
                              <span key={ti} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--brand-green)' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#D1D5DB', lineHeight: 1.5 }}>{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Tab Content: Store Sold Items (Only visible to the store owner) */}
          {storeTab === 'Sold Items' && isMyStore && (() => {
            const soldItems = getSoldItemsForStore(selectedMerchant);
            const totalRevenue = soldItems.reduce((acc, item) => acc + (Number(item.priceUsd || 0) * (Number(item.quantity) || 1)), 0);

            return (
              <div style={{
                background: '#0D1616',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '32px',
                marginBottom: '32px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                        Items Sold by {selectedMerchant.name}
                      </h2>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: 'var(--brand-green-dim)', color: 'var(--brand-green)', border: '1px solid var(--brand-green-border)' }}>
                        STORE OWNER ONLY
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginTop: '4px' }}>
                      Private merchant ledger of completed and in-escrow sales backed by the Monad settlement layer.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                      padding: '8px 16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      textAlign: 'right'
                    }}>
                      <div style={{ fontSize: '0.66rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Total Sold</div>
                      <div style={{ fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {soldItems.length} {soldItems.length === 1 ? 'Item' : 'Items'}
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      background: 'rgba(132, 244, 59, 0.05)',
                      border: '1px solid rgba(132, 244, 59, 0.2)',
                      borderRadius: '12px',
                      textAlign: 'right'
                    }}>
                      <div style={{ fontSize: '0.66rem', color: 'var(--brand-green)', textTransform: 'uppercase', fontWeight: 700 }}>Sales Volume</div>
                      <div style={{ fontSize: '1.1rem', color: 'var(--brand-green)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        ${totalRevenue.toLocaleString()} USDC
                      </div>
                    </div>
                  </div>
                </div>

                {soldItems.length === 0 ? (
                  <div style={{
                    padding: '44px 20px',
                    textAlign: 'center',
                    background: '#080F0F',
                    borderRadius: '16px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                  }}>
                    <PackageCheck size={28} color="#6B7280" style={{ margin: '0 auto 10px' }} />
                    <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.98rem', marginBottom: '6px' }}>
                      No Sold Items Yet
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
                      When shoppers purchase luxury products or physical merchandise from this storefront, settled transactions and escrow handovers will appear here.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {soldItems.map((sold, idx) => (
                      <div 
                        key={sold.orderItemId || idx}
                        style={{
                          background: '#080F0F',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '16px',
                          padding: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          transition: 'border-color 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <img 
                            src={sold.imageUri || '/assets/hual_pwa_icon.png'} 
                            alt={sold.name}
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '12px',
                              objectFit: 'contain',
                              background: '#121C1C',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              padding: '4px'
                            }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>
                              {sold.brand || 'Authentic Asset'}
                            </div>
                            <h4 style={{
                              fontSize: '0.92rem',
                              fontWeight: 800,
                              color: '#FFFFFF',
                              margin: '2px 0 4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {sold.name}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.88rem', color: 'var(--brand-green)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                ${Number(sold.priceUsd).toLocaleString()} USDC
                              </span>
                              {sold.quantity > 1 && (
                                <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                                  × {sold.quantity} units
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          fontSize: '0.72rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#9CA3AF' }}>Fulfillment:</span>
                            <span style={{ color: '#FFFFFF', fontWeight: 700, textTransform: 'capitalize' }}>
                              {sold.deliveryMethod === 'pickup' ? 'In-Store Pickup' : 'Express Courier'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#9CA3AF' }}>Order ID:</span>
                            <span style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                              #{String(sold.orderId).slice(-6)}
                            </span>
                          </div>
                          {sold.buyerAddress && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#9CA3AF' }}>Buyer:</span>
                              <span style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                                {sold.buyerAddress.slice(0, 6)}...{sold.buyerAddress.slice(-4)}
                              </span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#9CA3AF' }}>Sold On:</span>
                            <span style={{ color: '#9CA3AF' }}>
                              {new Date(sold.purchasedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            background: sold.status === 'collected' || sold.status === 'completed'
                              ? 'rgba(132, 244, 59, 0.15)' 
                              : 'rgba(56, 189, 248, 0.15)',
                            color: sold.status === 'collected' || sold.status === 'completed'
                              ? 'var(--brand-green)'
                              : '#38BDF8',
                            border: `1px solid ${sold.status === 'collected' || sold.status === 'completed' ? 'rgba(132, 244, 59, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                          }}>
                            {sold.status === 'collected' || sold.status === 'completed'
                              ? 'Handover Completed • Escrow Released'
                              : 'Secured in Escrow'}
                          </span>

                          {sold.txHash && (
                            <a
                              href={`https://testnet.monadexplorer.com/tx/${sold.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: '#9CA3AF',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                textDecoration: 'none'
                              }}
                            >
                              <span>TX Proof</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================
          PRODUCTS GRID (RENDERED FOR GENERAL STORE OR WHEN PRODUCTS TAB SELECTED)
          ======================================================== */}
      {(!selectedMerchant || storeTab === 'Products') && (
        <>
          {selectedMerchant && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '14px 20px',
              background: '#0D1616',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {selectedMerchant.name} Inventory
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'var(--brand-green-dim)',
                  color: 'var(--brand-green)',
                  border: '1px solid var(--brand-green-border)'
                }}>
                  {filteredProducts.length} Items Available
                </span>
              </div>

              {((activeCategory !== 'All' && activeCategory !== 'All Curations' && activeCategory) || localSearch || searchQuery) && (
                <button
                  onClick={handleResetAllFilters}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#F87171',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={11} />
                  <span>Show All Store Goods</span>
                </button>
              )}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div style={{
              padding: '60px 24px',
              textAlign: 'center',
              background: '#0D1616',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              margin: '20px 0 40px'
            }}>
              {selectedMerchant && isMyStore ? (
                <>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'var(--brand-green-dim)',
                    border: '1.5px solid var(--brand-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px',
                    boxShadow: '0 0 25px rgba(132, 244, 59, 0.25)'
                  }}>
                    <PlusCircle size={32} color="var(--brand-green)" />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
                    Your Store Catalog Is Empty
                  </h3>
                  <p style={{ color: '#9CA3AF', fontSize: '0.86rem', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.5 }}>
                    You haven't listed any items in your store yet. List your first product backed by a living Monad Product Passport to activate your storefront and start selling!
                  </p>
                  <button
                    onClick={() => onOpenSellModal && onOpenSellModal()}
                    className="btn-pill-primary"
                    style={{ padding: '10px 26px', fontSize: '0.86rem', fontWeight: 800 }}
                  >
                    <PlusCircle size={15} style={{ marginRight: '6px' }} />
                    <span>List Your First Item</span>
                  </button>
                </>
              ) : selectedMerchant ? (
                <>
                  <Store size={44} color="#6B7280" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
                    No Products In This Store Yet
                  </h3>
                  <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '20px' }}>
                    {selectedMerchant.name} currently has no active items listed. Check back soon for new authenticated drops!
                  </p>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="btn-pill-primary"
                  >
                    Browse All Marketplace Stores
                  </button>
                </>
              ) : (
                <>
                  <ShoppingBag size={44} color="var(--brand-green)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
                    No items match this filter
                  </h3>
                  <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '20px' }}>
                    Try selecting "All" or clear your search query to see all verified merchandise.
                  </p>
                  <button
                    onClick={handleResetAllFilters}
                    className="btn-pill-primary"
                  >
                    Reset Filters
                  </button>
                </>
              )}
            </div>
          ) : (
          <div 
            key={`catalog-grid-${activeCategory || 'all'}-${selectedMerchant?.id || 'all'}-${sortBy}`}
            className="stagger-group perspective-container"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
          {filteredProducts.map((product) => {
            const merchantObj = resolveMerchantForProduct(product);

            const merchantLoc = product.merchantLocation || merchantObj?.location || 'Victoria Island, Lagos';
            const prox = calculateProximity(buyerLocation, merchantLoc);

            const stockOverride = getProductStockOverride(product);
            const currentStock = stockOverride !== null ? stockOverride : (product.stock !== undefined ? Number(product.stock) : 5);
            const isSoldOut = currentStock <= 0;

            const isWishlisted = wishlist.some(w => String(w.productId) === String(product.productId) && w.name === product.name);
            const cardKey = product.id || (product.onchain ? `onchain-${product.productId}` : `curated-${product.productId}-${product.name}`);

            return (
              <div
                key={cardKey}
                className="liquid-glass-card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => handleOpenProduct(product)}
            >
              {/* Product Image Frame */}
              <div>
                <div style={{
                  width: '100%',
                  height: '240px',
                  borderRadius: '14px',
                  background: '#0D1616',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}>
                  <img 
                    src={product.imageUri} 
                    alt={product.name} 
                    style={{ width: '90%', height: '90%', objectFit: 'contain', transition: 'transform 0.3s' }}
                  />

                  {/* Sold out overlay tag */}
                  {isSoldOut && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: 'rgba(239, 68, 68, 0.95)',
                      color: '#FFFFFF',
                      fontSize: '0.66rem',
                      fontWeight: 900,
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
                      zIndex: 5
                    }}>
                      SOLD OUT
                    </div>
                  )}

                  {/* Wishlist Heart Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!authenticated || !user) {
                        if (onNavigateToSignIn) onNavigateToSignIn();
                        return;
                      }
                      if (onToggleWishlist) onToggleWishlist(product);
                    }}
                    title={isWishlisted ? "Saved in Wishlist" : "Save to Wishlist"}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isWishlisted ? 'rgba(255, 59, 48, 0.25)' : 'rgba(0, 0, 0, 0.55)',
                      border: isWishlisted ? '1px solid rgba(255, 59, 48, 0.7)' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: isWishlisted ? '#FF3B30' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      transition: 'all 0.2s ease',
                      zIndex: 5,
                      boxShadow: isWishlisted ? '0 0 12px rgba(255, 59, 48, 0.4)' : 'none'
                    }}
                  >
                    <Heart size={15} fill={isWishlisted ? '#FF3B30' : 'transparent'} />
                  </button>
                </div>

                {/* Title & Brand */}
                <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px', lineHeight: 1.3 }}>
                  {product.name}
                </h3>
                
                {/* Merchant & Location Tag */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMerchant(merchantObj);
                    }}
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--brand-green)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                    title="Click to visit merchant storefront"
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#080F0F',
                      border: '1px solid rgba(132, 244, 59, 0.4)',
                      overflow: 'hidden',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {(product.merchantAvatar || product.storeAvatar || merchantObj?.avatar) ? (
                        <img 
                          src={product.merchantAvatar || product.storeAvatar || merchantObj?.avatar} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <Store size={10} color="var(--brand-green)" />
                      )}
                    </div>
                    <span>Sold by {product.merchant || merchantObj.name}</span>
                    <CheckCircle2 size={10} />
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {(isMerchantMyStore(merchantObj) || (user?.address && product.seller && user.address.toLowerCase() === product.seller.toLowerCase())) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenSellModal) onOpenSellModal(product);
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '999px',
                            color: '#FFFFFF',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                      )}
                      <span style={{ fontSize: '0.66rem', color: '#9CA3AF', textDecoration: 'underline' }}>Storefront →</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} color="var(--brand-green)" />
                    <span>{product.merchantLocation || merchantObj.location}</span>
                    <span style={{ color: '#D1D5DB', fontWeight: 600 }}>• {prox.distance}</span>
                  </div>

                  <div style={{ fontSize: '0.66rem', color: 'var(--brand-green)', fontWeight: 600 }}>
                    {prox.pickupReady} ({prox.transit})
                  </div>

                  {/* Merchant & Rate Seller Action */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-green)', fontWeight: 700 }}>
                      <CheckCircle2 size={11} />
                      <span>Authentic Storefront</span>
                    </div>

                    {hasPurchasedProduct(product) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenRateSeller) onOpenRateSeller(merchantObj, product);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--brand-green)',
                          fontSize: '0.68rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontWeight: 600
                        }}
                      >
                        Review Item
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Action Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(product.priceUsd)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {isSoldOut ? (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#EF4444',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      Sold Out
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!authenticated || !user) {
                          if (onNavigateToSignIn) onNavigateToSignIn();
                          return;
                        }
                        if (onAddToCart) onAddToCart({ ...product, stock: currentStock });
                        const pId = product.productId || product.id;
                        setAddedCardId(pId);
                        setTimeout(() => setAddedCardId(null), 1800);
                      }}
                      title={addedCardId === (product.productId || product.id) ? "Added to Cart!" : "Add to Cart"}
                      style={{
                        background: addedCardId === (product.productId || product.id) ? 'var(--brand-green)' : '#121C1C',
                        border: addedCardId === (product.productId || product.id) ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '999px',
                        padding: '5px 8px',
                        color: addedCardId === (product.productId || product.id) ? '#080F0F' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: addedCardId === (product.productId || product.id) ? '0 0 12px var(--brand-green-glow)' : 'none'
                      }}
                    >
                      {addedCardId === (product.productId || product.id) ? (
                        <CheckCircle2 size={13} color="#080F0F" />
                      ) : (
                        <ShoppingBag size={13} color="var(--brand-green)" />
                      )}
                    </button>
                  )}

                  {!isMyProduct(product) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenChat(merchantObj, product);
                      }}
                      title="Chat with merchant about this product"
                      style={{
                        background: '#121C1C',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '999px',
                        padding: '5px 8px',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <MessageSquare size={13} color="var(--brand-green)" />
                    </button>
                  )}

                  {isMyProduct(product) ? (
                    <button
                      disabled
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#9CA3AF',
                        borderRadius: '999px',
                        cursor: 'not-allowed'
                      }}
                      title="You own this store listing"
                    >
                      Your Listing
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartCheckout(product);
                      }}
                      className="btn-pill-primary btn-pill-sm"
                      style={{ padding: '6px 12px', fontSize: '0.74rem', fontWeight: 800 }}
                    >
                      Buy Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </>
)}
        </>
      )}

      {/* ========================================================
          CHECKOUT MODAL (SCREEN 04 FIGMA SPEC WITH LOCATIONS)
          ======================================================== */}
      {checkoutProduct && !orderSuccess && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => !purchasing && setCheckoutProduct(null)}>
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '880px',
              width: '100%',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
              background: '#0D1616',
              border: '1px solid rgba(132, 244, 59, 0.3)',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(132, 244, 59, 0.15)',
              margin: '0 auto'
            }}
          >
            {/* Two-Column Checkout View (Exact Screen 04 of Figma spec) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Checkout
                </h2>
                <button onClick={() => setCheckoutProduct(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px' }}>
                  {/* Left Column: Form & Summary */}
                  <div>
                    {/* Delivery Method Segment (Figma Screen 04) */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Delivery Method
                      </label>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '6px',
                        background: '#080F0F',
                        padding: '4px',
                        borderRadius: '999px',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod('pickup')}
                          style={{
                            padding: '10px',
                            borderRadius: '999px',
                            background: deliveryMethod === 'pickup' ? 'var(--brand-green)' : 'transparent',
                            color: deliveryMethod === 'pickup' ? '#080F0F' : '#9CA3AF',
                            border: 'none',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Store size={14} />
                          <span>In-Store Pickup</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod('delivery')}
                          style={{
                            padding: '10px',
                            borderRadius: '999px',
                            background: deliveryMethod === 'delivery' ? 'var(--brand-green)' : 'transparent',
                            color: deliveryMethod === 'delivery' ? '#080F0F' : '#9CA3AF',
                            border: 'none',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Truck size={14} />
                          <span>Express Courier</span>
                        </button>
                      </div>
                    </div>

                    {/* Merchant & Buyer Locations (Detailed) */}
                    <div style={{
                      padding: '14px',
                      background: '#080F0F',
                      borderRadius: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      marginBottom: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase' }}>Merchant Store Location</div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                          {checkoutProduct.merchant || selectedMerchant?.name || 'Verified Merchant Store'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#9CA3AF' }}>
                          {checkoutProduct.merchantLocation || selectedMerchant?.fullAddress || 'Plot 14B Adetokunbo Ademola St, VI, Lagos'}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 700 }}>
                            Buyer Delivery Destination
                          </span>
                          <select
                            value={buyerLocation}
                            onChange={(e) => handleSelectBuyerLocation(e.target.value)}
                            style={{
                              background: '#080F0F',
                              border: '1px solid rgba(132, 244, 59, 0.3)',
                              borderRadius: '8px',
                              color: 'var(--brand-green)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {BUYER_LOCATIONS.map((loc) => (
                              <option key={loc.id} value={loc.name} style={{ background: '#0D1616', color: '#FFFFFF' }}>
                                {loc.name} ({loc.region})
                              </option>
                            ))}
                          </select>
                        </div>
                        {(() => {
                          const prox = calculateProximity(buyerLocation, checkoutProduct.merchantLocation || selectedMerchant?.location || 'Victoria Island, Lagos');
                          return (
                            <div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={13} color="var(--brand-green)" />
                                <span>{buyerLocation}</span>
                                <span style={{ color: 'var(--brand-green)', fontSize: '0.76rem' }}>({prox.distance})</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>
                                {deliveryMethod === 'pickup' ? `Ready for in-store collection: ${prox.pickupReady}` : `Estimated courier transit: ${prox.transit}`}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Available Balance & Insufficient Funds Detector */}
                    {(() => {
                      const currentBal = Number(usdcBalance) || 0;
                      const cost = Number(checkoutProduct.priceUsd) || 0;
                      const isInsufficient = currentBal < cost;
                      const deficit = Math.max(0, cost - currentBal);

                      return (
                        <>
                          <div style={{
                            padding: '14px 16px',
                            background: isInsufficient ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '14px',
                            border: isInsufficient ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                            marginBottom: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}>
                            <div>
                              <div style={{ fontSize: '0.72rem', color: isInsufficient ? '#F87171' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                                Your Available USDC Balance
                              </div>
                              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isInsufficient ? '#FCA5A5' : '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                                {formatCurrency(currentBal)}
                              </div>
                            </div>

                            {isInsufficient && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (faucetUsdc) await faucetUsdc(1000);
                                  if (refreshBalance) await refreshBalance();
                                }}
                                className="btn-pill-primary btn-pill-sm"
                                style={{
                                  background: 'linear-gradient(135deg, #10B981, #059669)',
                                  color: '#FFFFFF',
                                  border: '1px solid rgba(255, 255, 255, 0.3)',
                                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                                  fontWeight: 800,
                                  gap: '6px'
                                }}
                              >
                                <Zap size={13} />
                                <span>+ Faucet $1,000 USDC</span>
                              </button>
                            )}
                          </div>

                          {isInsufficient && (
                            <div style={{
                              padding: '12px 14px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: '12px',
                              marginBottom: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0 }} />
                              <div style={{ fontSize: '0.78rem', color: '#FCA5A5', lineHeight: 1.35 }}>
                                <strong>Insufficient Funds:</strong> You have {formatCurrency(currentBal)}, but this order requires {formatCurrency(cost)} (short by {formatCurrency(deficit)}). Please tap the green faucet button above to fund your balance.
                              </div>
                            </div>
                          )}

                          {/* Order Summary breakdown */}
                          <div style={{
                            padding: '16px',
                            background: '#080F0F',
                            borderRadius: '14px',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            marginBottom: '20px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
                              <span style={{ color: '#D1D5DB' }}>{checkoutProduct.name}</span>
                              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{formatCurrency(checkoutProduct.priceUsd)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
                              <span style={{ color: '#D1D5DB' }}>Network & Protocol Fee</span>
                              <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>$0.00 (Sponsored)</span>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                              paddingTop: '10px',
                              marginTop: '10px'
                            }}>
                              <strong style={{ color: '#FFFFFF' }}>Total Settlement</strong>
                              <strong style={{ color: 'var(--brand-green)', fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>
                                {formatCurrency(checkoutProduct.priceUsd)}
                              </strong>
                            </div>
                          </div>

                          <button
                            onClick={handleConfirmPayment}
                            disabled={purchasing || isInsufficient}
                            className={isInsufficient ? "btn-pill-secondary" : "btn-pill-primary"}
                            style={{
                              width: '100%',
                              padding: '14px',
                              fontSize: '0.96rem',
                              fontWeight: 800,
                              opacity: (purchasing || isInsufficient) ? 0.6 : 1,
                              cursor: isInsufficient ? 'not-allowed' : 'pointer',
                              background: isInsufficient ? 'rgba(239, 68, 68, 0.15)' : undefined,
                              borderColor: isInsufficient ? 'rgba(239, 68, 68, 0.4)' : undefined,
                              color: isInsufficient ? '#FCA5A5' : undefined
                            }}
                          >
                            {purchasing
                              ? 'Settling on Monad...'
                              : isInsufficient
                              ? `Insufficient Funds (Short ${formatCurrency(deficit)})`
                              : `Confirm & Pay ${formatCurrency(checkoutProduct.priceUsd)}`
                            }
                          </button>
                        </>
                      );
                    })()}
                  </div>

                  {/* Right Column: Sponsored Gas Field & Monad Branding (Screen 04) */}
                  <div style={{
                    background: 'radial-gradient(circle at 50% 40%, rgba(132, 244, 59, 0.18) 0%, #080F0F 80%)',
                    borderRadius: '20px',
                    border: '1px solid rgba(132, 244, 59, 0.35)',
                    padding: '32px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    boxShadow: '0 0 35px rgba(132, 244, 59, 0.15)'
                  }}>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--brand-green)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '6px'
                    }}>
                      Gas Sponsored by Hual
                    </span>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 20px' }}>
                      No gas fees. We've got you covered.
                    </h3>

                    {/* 3D Glowing Monad H Icon */}
                    <div style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '26px',
                      background: 'var(--brand-green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#080F0F',
                      boxShadow: '0 0 50px rgba(132, 244, 59, 0.65)',
                      marginBottom: '20px'
                    }}>
                      <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 3h4v7h8V3h4v18h-4v-7H8v7H4V3z" />
                      </svg>
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                      Powered by Monad
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#9CA3AF', maxWidth: '280px', lineHeight: 1.5 }}>
                      Your payment is processed on Monad using your non-custodial Hual embedded wallet.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================
          PRODUCT RECEIPT MODAL (EXACT FIGMA SPEC)
          ======================================================== */}
      <ProductReceiptModal
        isOpen={Boolean(orderSuccess)}
        onClose={() => {
          setOrderSuccess(null);
          setCheckoutProduct(null);
        }}
        order={orderSuccess}
        product={checkoutProduct}
        merchant={resolveMerchantForProduct(checkoutProduct)}
        onViewPassport={() => {
          setOrderSuccess(null);
          setCheckoutProduct(null);
          if (onPurchaseSuccess) onPurchaseSuccess();
        }}
        onChatStore={() => {
          const store = resolveMerchantForProduct(checkoutProduct);
          setOrderSuccess(null);
          setCheckoutProduct(null);
          handleOpenChat(store, checkoutProduct);
        }}
      />

      {/* ========================================================
          COMMERCE CHAT MODAL (IN-APP BUYER-MERCHANT CONVERSATION)
          ======================================================== */}
      <CommerceChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        merchant={chatContext.merchant}
        product={chatContext.product}
        buyerLocation={buyerLocation}
        onQuickCheckout={(p) => {
          setChatModalOpen(false);
          handleStartCheckout(p);
        }}
      />

      {/* ========================================================
          EDIT STOREFRONT MODAL (LOCATION, HOURS, SCHEDULE, ETC.)
          ======================================================== */}
      {selectedMerchant && (
        <EditStoreModal
          isOpen={editStoreModalOpen}
          onClose={() => setEditStoreModalOpen(false)}
          store={selectedMerchant}
          onSave={(updatedStore) => {
            setSelectedMerchant(updatedStore);
            if (updateStore) updateStore(updatedStore);
          }}
        />
      )}
    </div>
  );
}
