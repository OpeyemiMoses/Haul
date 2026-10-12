import React, { useState, useEffect, useMemo } from 'react';
import LandingPage from './components/LandingPage';
import SignInPage from './components/SignInPage';
import LaunchSplitPage from './components/LaunchSplitPage';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Marketplace from './components/Marketplace';
import PassportCard from './components/PassportCard';
import ProfilePage from './components/ProfilePage';
import CartPage from './components/CartPage';
import InboxPage from './components/InboxPage';
import CategoriesExplorer from './components/CategoriesExplorer';
import WishlistPage from './components/WishlistPage';
import StoreReviewModal from './components/StoreReviewModal';
import OnboardingModal from './components/OnboardingModal';
import UserProfileModal from './components/UserProfileModal';
import SellProductModal from './components/SellProductModal';
import MerchantDashboard from './components/MerchantDashboard';
import CommerceChatModal from './components/CommerceChatModal';
import CreateStoreModal from './components/CreateStoreModal';
import StoresPage from './components/StoresPage';
import SettingsPage from './components/SettingsPage';
import AISupportModal from './components/AISupportModal';
import AIAssistantPage from './components/AIAssistantPage';
import AISupportFAB from './components/AISupportFAB';
import PrivyModal from './lib/auth/PrivyModal';
import AgeVerificationModal from './components/AgeVerificationModal';
import ModalPortal from './components/ModalPortal';
import { AuthProvider, useAuth } from './lib/auth/AuthContext';
import useScrollReveal from './lib/useScrollReveal';
import { 
  fetchOnchainProducts, 
  fetchOnchainPassports, 
  fetchAllOnchainPassports,
  CONSUMER_ADDR 
} from './lib/web3';
import { ShieldCheck, RefreshCw, AlertCircle, ShoppingBag, Store, PlusCircle, ArrowLeft, MessageSquare, Heart, Layers, CheckCircle2, X } from 'lucide-react';
import { CURATED_CATALOG, VERIFIED_MERCHANTS } from './lib/catalogData';
import { getConversationsForUser } from './lib/messageRegistry';

const INITIAL_DEMO_PASSPORTS = [
  {
    tokenId: 101,
    productId: 'demo-sony-fx3',
    productName: 'Sony FX3 Cinema Line Full-Frame Camera',
    productBrand: 'Sony Pro Imaging',
    serialNumber: 'SN-FX3-98214',
    originalMerchant: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    originalPriceUsd: 3899.00,
    purchaseTimestamp: '10/02/2026, 11:20:00 AM',
    warrantyExpiresAt: '10/02/2028',
    daysRemainingWarranty: 724,
    currentState: 'COLLECTED',
    currentStateIndex: 4,
    paymentTxRef: '0x8f2a11b93ef2d38e81c04910283f',
    transferCount: 0,
  },
  {
    tokenId: 102,
    productId: 'demo-teenage-op1',
    productName: 'Teenage Engineering OP-1 Field Synthesizer',
    productBrand: 'Teenage Engineering',
    serialNumber: 'SN-TE-41908',
    originalMerchant: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    originalPriceUsd: 1999.00,
    purchaseTimestamp: '10/05/2026, 04:15:30 PM',
    warrantyExpiresAt: '10/05/2027',
    daysRemainingWarranty: 362,
    currentState: 'READY_FOR_PICKUP',
    currentStateIndex: 2,
    paymentTxRef: '0x3c99a410d720eb9f140292837',
    transferCount: 0,
  }
];

function MainApp() {
  const { 
    user, 
    authenticated, 
    usdcBalance, 
    userLocation, 
    updateUserLocation, 
    userRole, 
    userStore,
    isAgeVerified,
    ageVerificationOpen,
    setAgeVerificationOpen,
    verifyUserAge
  } = useAuth();
  
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlView = searchParams.get('view');
      if (urlView) return urlView;
      const savedView = localStorage.getItem('hual_current_view');
      if (savedView) return savedView;
    }
    return 'storefront';
  });

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlTab = searchParams.get('tab');
      if (urlTab) return urlTab;
      const savedTab = localStorage.getItem('hual_active_tab');
      if (savedTab) return savedTab;
    }
    return 'shop';
  });

  // Sync with browser back / forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlView = searchParams.get('view') || localStorage.getItem('hual_current_view') || 'storefront';
        const urlTab = searchParams.get('tab') || localStorage.getItem('hual_active_tab') || 'shop';
        setCurrentView(urlView);
        setActiveTab(urlTab);
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Persist currentView to localStorage and URL search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hual_current_view', currentView);
      const url = new URL(window.location.href);
      url.searchParams.set('view', currentView);
      window.history.replaceState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentView]);

  // Persist activeTab to localStorage and URL search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hual_active_tab', activeTab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTab]);

  const [selectedStore, setSelectedStore] = useState(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [privyModalOpen, setPrivyModalOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('modal') === 'sell';
    }
    return false;
  });
  const [createStoreOpen, setCreateStoreOpen] = useState(false);
  const [forcedModal, setForcedModal] = useState(null);
  const [aiSupportOpen, setAiSupportOpen] = useState(false);
  const [aiSupportOrderContext, setAiSupportOrderContext] = useState(null);

  // All pages, tabs, and views always start strictly from the top
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [activeTab, currentView, selectedStore]);

  const handleOpenAiSupport = (orderContext = null) => {
    setAiSupportOrderContext(orderContext);
    setCurrentView('storefront');
    setActiveTab('assistant');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  useScrollReveal([currentView, activeTab, selectedStore]);

  // User Scoping Key (Each Privy User ID / Address gets isolated storage)
  const userKey = user?.id || (user?.email ? user.email.toLowerCase() : 'guest');

  // Cart State (persisted per user)
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(`hual_cart_${userKey}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Followed Merchant Stores State (persisted per user)
  const [followedStores, setFollowedStores] = useState(() => {
    try {
      const stored = localStorage.getItem(`hual_followed_stores_${userKey}`);
      return stored ? JSON.parse(stored) : ['nike-lagos'];
    } catch {
      return ['nike-lagos'];
    }
  });

  // Wishlist State (persisted per user)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem(`hual_wishlist_${userKey}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Reactive message update ticker for inbox badge
  const [messagesTicker, setMessagesTicker] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setMessagesTicker(t => t + 1);
    window.addEventListener('hual_messages_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('hual_messages_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Dynamic Inbox Unread Badge Count (across both buyer chats & store inquiries)
  const inboxUnreadCount = useMemo(() => {
    try {
      const { buyerConvs, storeConvs } = getConversationsForUser(userKey, userStore);
      const buyerUnread = (buyerConvs || []).reduce((acc, c) => acc + (c.unreadByBuyer || 0), 0);
      const storeUnread = (storeConvs || []).reduce((acc, c) => acc + (c.unreadByStore || 0), 0);
      return buyerUnread + storeUnread;
    } catch {
      return 0;
    }
  }, [userKey, userStore, messagesTicker]);

  // Sync isolated user state when switching accounts or logging in/out
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(`hual_cart_${userKey}`);
      setCart(storedCart ? JSON.parse(storedCart) : []);

      const storedWish = localStorage.getItem(`hual_wishlist_${userKey}`);
      setWishlist(storedWish ? JSON.parse(storedWish) : []);

      const storedFollow = localStorage.getItem(`hual_followed_stores_${userKey}`);
      setFollowedStores(storedFollow ? JSON.parse(storedFollow) : ['nike-lagos']);

      const storedPassports = localStorage.getItem(`hual_my_passports_${userKey}`);
      setMyPassports(storedPassports ? JSON.parse(storedPassports) : []);

      const storedConvs = localStorage.getItem(`hual_inbox_conversations_${userKey}`);
      if (storedConvs) {
        setConversations(JSON.parse(storedConvs));
      }
    } catch (e) {
      console.warn('Account state sync error:', e);
    }
  }, [userKey]);

  // Cart Toast notification state
  const [cartToast, setCartToast] = useState(null);

  const addToCart = (product, selectedSize = 'Standard', quantity = 1) => {
    if (!product) return;
    const userAddr = user?.address?.toLowerCase();
    const sellerAddr = (product.seller || product.ownerAddress || product.merchantAddress)?.toLowerCase();
    const isOwner = Boolean(
      (userAddr && sellerAddr && userAddr === sellerAddr) ||
      (userStore && product.merchantId && String(product.merchantId) === String(userStore.id)) ||
      (userStore && product.merchant && product.merchant.toLowerCase() === userStore.name?.toLowerCase())
    );
    if (isOwner) {
      alert("You cannot add items listed by your own store to your cart.");
      return;
    }

    let finalCount = 0;
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.productId && item.selectedSize === selectedSize);
      let updated;
      if (existingIndex > -1) {
        updated = [...prev];
        updated[existingIndex].quantity = (updated[existingIndex].quantity || 1) + quantity;
      } else {
        updated = [...prev, { ...product, selectedSize, quantity: quantity || 1 }];
      }
      finalCount = updated.length;
      localStorage.setItem(`hual_cart_${userKey}`, JSON.stringify(updated));
      return updated;
    });

    // Trigger rich visual indicator toast
    setCartToast({
      product,
      selectedSize,
      quantity,
      count: finalCount || (cart.length + 1),
      timestamp: Date.now()
    });
  };

  // Auto-dismiss cart toast after 4s
  useEffect(() => {
    if (cartToast) {
      const timer = setTimeout(() => {
        setCartToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [cartToast]);

  const removeFromCart = (productId) => {
    setCart(prev => {
      const updated = prev.filter(item => item.productId !== productId);
      localStorage.setItem(`hual_cart_${userKey}`, JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(`hual_cart_${userKey}`);
  };

  const toggleFollowStore = (merchantId) => {
    if (!merchantId) return;
    if (userStore && (userStore.id === merchantId || userStore.name === merchantId)) {
      return; // Store owners cannot follow their own store
    }
    setFollowedStores(prev => {
      const exists = prev.includes(merchantId);
      const updated = exists ? prev.filter(id => id !== merchantId) : [...prev, merchantId];
      localStorage.setItem(`hual_followed_stores_${userKey}`, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.productId === product.productId);
      const updated = exists 
        ? prev.filter(item => item.productId !== product.productId)
        : [...prev, product];
      localStorage.setItem(`hual_wishlist_${userKey}`, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => {
      const updated = prev.filter(item => item.productId !== productId);
      localStorage.setItem(`hual_wishlist_${userKey}`, JSON.stringify(updated));
      return updated;
    });
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.removeItem(`hual_wishlist_${userKey}`);
  };

  // Seller Rating & Review Modal State
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState({ merchant: null, product: null, passport: null });
  const [verifiedReviewNotice, setVerifiedReviewNotice] = useState(null);

  const handleOpenRateSeller = (merchant, product = null, passport = null) => {
    if (!merchant) return;

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

    // Check if user has an item in hand from this merchant/product
    let attachedPassport = passport && isPassportInHand(passport) ? passport : null;
    if (!attachedPassport && myPassports && myPassports.length > 0) {
      if (product) {
        // When reviewing a specific product, MUST strictly match THAT exact product!
        const prodId = String(product.productId || product.id || '').trim();
        const prodName = (product.name || product.productName || '').toLowerCase().trim();
        attachedPassport = myPassports.find(p => {
          if (!isPassportInHand(p)) return false;
          const pId = String(p.productId || p.id || '').trim();
          const pName = (p.productName || p.name || '').toLowerCase().trim();
          if (prodId && pId && prodId === pId) return true;
          if (prodName && pName && prodName.length >= 4 && pName.length >= 4 && prodName === pName) return true;
          return false;
        });
      } else {
        // General merchant review: find any in-hand item from this merchant
        attachedPassport = myPassports.find(p => {
          if (!isPassportInHand(p)) return false;
          const pMerchant = (p.originalMerchant || p.merchant || '').toLowerCase();
          const targetMerchant = (merchant.name || '').toLowerCase();
          const matchesMerchant = targetMerchant && (pMerchant.includes(targetMerchant) || targetMerchant.includes(pMerchant));
          const matchesId = merchant.id && p.merchantId === merchant.id;
          return matchesMerchant || matchesId;
        });
      }
    }

    // If no verified item in hand found, block rating and show notice modal!
    if (!attachedPassport) {
      setVerifiedReviewNotice({
        isOpen: true,
        merchantName: merchant.name,
        merchantObj: merchant,
        productName: product?.name || null
      });
      return;
    }

    // If verified purchase exists, attach it to rating target
    setRatingTarget({
      merchant,
      product: product ? {
        name: product.name || product.productName,
        imageUri: product.imageUri || product.images?.[0] || attachedPassport?.imageUri,
        productId: product.productId || product.id
      } : null,
      passport: attachedPassport
    });
    setRatingModalOpen(true);
  };

  const handleReviewSubmitted = (merchantId, newReview, allReviews) => {
    // Update products rating locally
    setProducts(prev => prev.map(p => {
      if (p.merchantId === merchantId || (p.merchant && ratingTarget.merchant && p.merchant.toLowerCase().includes(ratingTarget.merchant.name.toLowerCase()))) {
        return {
          ...p,
          reviewsCount: (p.reviewsCount || 100) + 1
        };
      }
      return p;
    }));
  };

  // Chat State & Targeted Inbox Navigation
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState({ merchant: null, product: null });
  const [inboxChatTarget, setInboxChatTarget] = useState(null);

  const handleOpenInbox = (merchant, product = null) => {
    if (merchant && (userStore || user?.address)) {
      const userAddr = user?.address?.toLowerCase();
      const mOwnerAddr = (merchant.ownerAddress || merchant.owner || merchant.seller)?.toLowerCase();
      const isSameOwnerAddr = Boolean(userAddr && mOwnerAddr && userAddr === mOwnerAddr);
      const isSameStoreId = Boolean(userStore?.id && merchant.id && String(userStore.id) === String(merchant.id));
      const isSameStoreName = Boolean(userStore?.name && merchant.name && userStore.name.toLowerCase() === merchant.name.toLowerCase());

      if (isSameOwnerAddr || isSameStoreId || isSameStoreName) {
        alert("You cannot message your own store.");
        return;
      }
    }
    setInboxChatTarget({ merchant, product, ts: Date.now() });
    setSelectedStore(null);
    setCurrentView('storefront');
    setActiveTab('inbox');
  };

  // Auto-redirect to storefront when authenticated (no landing page once signed in)
  useEffect(() => {
    setOnboardingOpen(false);
    if (authenticated) {
      if (currentView === 'landing' || currentView === 'signin' || currentView === 'launch') {
        setCurrentView('storefront');
        if (activeTab === 'landing') {
          setActiveTab('shop');
        }
      }
    }
  }, [authenticated]);

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [products, setProducts] = useState(CURATED_CATALOG);
  const [myPassports, setMyPassports] = useState(() => {
    try {
      const stored = localStorage.getItem('hual_my_passports');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [allPassports, setAllPassports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setError(null);
      const [prods, myPass, allPass] = await Promise.all([
        fetchOnchainProducts(),
        user?.address ? fetchOnchainPassports(user.address) : Promise.resolve([]),
        fetchAllOnchainPassports(),
      ]);

      const customListed = JSON.parse(localStorage.getItem('hual_custom_listed_products') || '[]');
      const combinedProds = [...customListed, ...(prods || [])];
      const seenProdIds = new Set();
      const uniqueProds = [];
      for (const p of combinedProds) {
        if (!p) continue;
        const normName = (p.name || '').trim().toLowerCase();
        const pKey = p.id ? String(p.id) : (p.onchain ? `onchain-${p.productId}` : (normName || `prod-${p.productId}`));
        if (!seenProdIds.has(pKey) && (!normName || !seenProdIds.has(`name-${normName}`))) {
          seenProdIds.add(pKey);
          if (normName) seenProdIds.add(`name-${normName}`);
          uniqueProds.push(p);
        }
      }
      setProducts(uniqueProds);

      // Passports for authenticated user and local guest sessions
      const addrKey = user?.address ? user.address.toLowerCase() : 'guest';
      const localStored = JSON.parse(
        localStorage.getItem(`hual_my_passports_${addrKey}`) || 
        localStorage.getItem('hual_my_passports') || 
        '[]'
      );
      
      const deletedIds = new Set(JSON.parse(localStorage.getItem('hual_deleted_passports') || '[]'));
      const refundedMap = JSON.parse(localStorage.getItem('hual_refunded_passports') || '{}');
      const isCleared = localStorage.getItem('hual_my_passports_cleared') === 'true';

      const combined = (localStored.length > 0 || (myPass && myPass.length > 0))
        ? [...localStored, ...(myPass || [])]
        : (isCleared ? [] : [INITIAL_FEATURED_PASSPORT]);

      const seen = new Set();
      const unique = [];
      for (const rawP of combined) {
        const tokenIdStr = String(rawP.tokenId || '');
        const serialStr = String(rawP.serialNumber || '');
        const idStr = String(rawP.id || '');
        const orderIdStr = String(rawP.orderId || '');

        // If this item was deleted by user, NEVER add it back
        if (deletedIds.has(tokenIdStr) || deletedIds.has(serialStr) || deletedIds.has(idStr) || deletedIds.has(orderIdStr)) {
          continue;
        }

        const key = tokenIdStr || serialStr || idStr || orderIdStr || `${rawP.productName}-${rawP.purchaseTimestamp}`;
        if (!seen.has(key)) {
          seen.add(key);

          // Apply persistent refund status if cancelled
          let p = { ...rawP };
          if (refundedMap[tokenIdStr] || refundedMap[serialStr] || refundedMap[idStr] || refundedMap[orderIdStr]) {
            p.currentState = 'REFUNDED';
            p.currentStateIndex = 8;
            p.refundedAt = p.refundedAt || new Date().toISOString();
          }

          unique.push(p);
        }
      }
      setMyPassports(unique);
      setAllPassports(allPass || []);
    } catch (err) {
      console.warn('Failed to load onchain data, using local catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.address]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent', color: '#FFFFFF', position: 'relative' }}>
      {/* Liquid Ambient Fluid Backdrop for Apple Glass Refraction */}
      <div className="liquid-ambient-backdrop">
        <div className="ambient-orb orb-green" />
        <div className="ambient-orb orb-teal" />
        <div className="ambient-orb orb-blue" />
        <div className="ambient-orb orb-indigo" />
      </div>
      
      {/* Dynamic View Rendering */}
      {currentView === 'landing' ? (
        <LandingPage 
          onLaunchApp={(targetTab = 'shop') => {
            const validTab = (typeof targetTab === 'string' && targetTab) ? targetTab : 'shop';
            setSelectedStore(null);
            setSearchQuery('');
            setSelectedCategory('All');
            setCurrentView('storefront');
            setActiveTab(validTab);
          }} 
          onNavigateToSignIn={() => setCurrentView('signin')}
          onOpenProfileModal={() => {
            setSelectedStore(null);
            setCurrentView('storefront');
            setActiveTab('profile');
          }}
        />
      ) : currentView === 'signin' ? (
        <SignInPage
          onSignInSuccess={() => {
            setSelectedStore(null);
            setSearchQuery('');
            setSelectedCategory('All');
            setCurrentView('storefront');
            setActiveTab('shop');
          }}
          onBackToLanding={() => setCurrentView('landing')}
        />
      ) : currentView === 'launch' ? (
        <LaunchSplitPage
          onBackToLanding={() => setCurrentView('landing')}
          onEnterStorefront={() => {
            setSelectedStore(null);
            setSearchQuery('');
            setSelectedCategory('All');
            setCurrentView('storefront');
            setActiveTab('shop');
          }}
        />
      ) : currentView === 'merchant' ? (
        <div>
          <Navbar 
            activeTab="merchant"
            setActiveTab={(tab) => {
              setCurrentView('storefront');
              setActiveTab(tab);
            }}
            onBackToLanding={() => setCurrentView('landing')}
            passportCount={myPassports.length} 
            wishlistCount={wishlist.length}
            onOpenProfileModal={() => setUserProfileOpen(true)}
            onOpenSellModal={() => setSellModalOpen(true)}
            onOpenMyStore={(store) => {
              setSelectedStore(store || userStore);
              setCurrentView('storefront');
              setActiveTab('shop');
            }}
            onOpenAiSupport={handleOpenAiSupport}
            onNavigateToSignIn={() => setCurrentView('signin')}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <main style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '28px 24px 80px', flex: 1 }}>
            <MerchantDashboard 
              onBackToStore={() => {
                setCurrentView('storefront');
                setActiveTab('shop');
              }}
              onOpenSellModal={() => setSellModalOpen(true)}
            />
          </main>
        </div>
      ) : (
        /* Storefront, Passports, Wishlist, Cart, Inbox, Categories, and Profile View */
        <div>
          <Navbar 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'shop') {
                setSelectedStore(null); // Return to General Storefront
              }
            }} 
            onBackToLanding={() => setCurrentView('landing')}
            passportCount={myPassports.length} 
            wishlistCount={wishlist.length}
            cartCount={cart.length}
            inboxCount={inboxUnreadCount}
            onOpenPrivyModal={() => setPrivyModalOpen(true)}
            onOpenProfileModal={() => setUserProfileOpen(true)}
            onOpenSellModal={() => setSellModalOpen(true)}
            onOpenCreateStore={() => setCreateStoreOpen(true)}
            onOpenMyStore={(store) => {
              setSelectedStore(store || userStore);
              setCurrentView('storefront');
              setActiveTab('shop');
            }}
            onOpenAiSupport={handleOpenAiSupport}
            onNavigateToSignIn={() => setCurrentView('signin')}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          <main style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '28px 24px 80px', flex: 1 }}>
            {error && (
              <div style={{
                padding: '16px 20px',
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '12px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#991B1B'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
                <button onClick={loadData} className="btn-pill-secondary btn-pill-sm">
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            )}

            {loading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 0',
                gap: '16px'
              }}>
                <RefreshCw size={28} color="var(--brand-green)" className="animate-spin" />
                <div style={{ fontSize: '0.9rem', color: '#9CA3AF', fontWeight: 600 }}>
                  Loading Hual catalog...
                </div>
              </div>
            ) : (
              <div key={activeTab} className="page-fade-in">
                {/* 1. SHOP / GENERAL MARKETPLACE */}
                {activeTab === 'shop' && (
                  <Marketplace 
                    products={products} 
                    selectedMerchant={selectedStore}
                    onSelectMerchant={setSelectedStore}
                    wishlist={wishlist}
                    onToggleWishlist={toggleWishlist}
                    cart={cart}
                    onAddToCart={addToCart}
                    followedStores={followedStores}
                    onToggleFollowStore={toggleFollowStore}
                    passports={myPassports}
                    onOpenRateSeller={handleOpenRateSeller}
                    onPassportMinted={(newPassport) => {
                      setMyPassports(prev => {
                        const newKey = String(newPassport.tokenId || newPassport.serialNumber || newPassport.id);
                        if (prev.some(p => String(p.tokenId || p.serialNumber || p.id) === newKey)) {
                          return prev;
                        }
                        return [newPassport, ...prev];
                      });
                    }}
                    onPurchaseSuccess={() => {
                      loadData();
                      setActiveTab('passports');
                    }}
                    onOpenSellModal={() => setSellModalOpen(true)}
                    onOpenCreateStore={() => setCreateStoreOpen(true)}
                    onOpenInbox={handleOpenInbox}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    forcedModal={forcedModal}
                    onClearForcedModal={() => setForcedModal(null)}
                  />
                )}

                {/* 2. DEDICATED STORES PAGE */}
                {activeTab === 'stores' && (
                  <StoresPage
                    products={products}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onSelectStore={(store) => {
                      setSelectedStore(store);
                      setActiveTab('shop');
                    }}
                    onOpenCreateStore={() => setCreateStoreOpen(true)}
                    onOpenSellModal={() => setSellModalOpen(true)}
                    onOpenInbox={handleOpenInbox}
                    followedStores={followedStores}
                    onToggleFollowStore={toggleFollowStore}
                  />
                )}

                {/* 3. CATEGORIES EXPLORER */}
                {activeTab === 'categories' && (
                  <CategoriesExplorer
                    onSelectCategory={(catName) => {
                      setSelectedCategory(catName);
                      setActiveTab('shop');
                      setSelectedStore(null);
                    }}
                  />
                )}

                {/* 3. CART & ESCROW BATCH CHECKOUT WITH MARK RECEIVED */}
                {activeTab === 'cart' && (
                  <CartPage
                    cart={cart}
                    onRemoveFromCart={removeFromCart}
                    onClearCart={clearCart}
                    onNavigateToShop={() => {
                      setActiveTab('shop');
                      setSelectedStore(null);
                    }}
                    onPassportMinted={(passportData) => {
                      const newPass = {
                        tokenId: Date.now(),
                        productId: passportData.productId,
                        productName: passportData.name,
                        productBrand: passportData.brand,
                        serialNumber: `SN-HUAL-${Date.now().toString().slice(-5)}`,
                        originalMerchant: passportData.merchant,
                        originalPriceUsd: passportData.priceUsd,
                        purchaseTimestamp: new Date().toLocaleString(),
                        warrantyExpiresAt: passportData.warrantyExpiry || '10/09/2027',
                        daysRemainingWarranty: 365,
                        deliveryMethod: passportData.deliveryMethod || 'delivery',
                        currentState: 'COLLECTED',
                        currentStateIndex: 4,
                        imageUri: passportData.imageUri,
                        paymentTxRef: `0x${Math.random().toString(16).substring(2, 28)}`,
                        transferCount: 0
                      };
                      setMyPassports(prev => [newPass, ...prev]);
                      if (userKey) {
                        try {
                          const existing = JSON.parse(localStorage.getItem(`hual_my_passports_${userKey}`) || '[]');
                          localStorage.setItem(`hual_my_passports_${userKey}`, JSON.stringify([newPass, ...existing]));
                        } catch {}
                      }
                    }}
                  />
                )}

                {/* 4. INBOX (FULL PAGE MESSENGER) */}
                {activeTab === 'inbox' && (
                  <InboxPage
                    followedStores={followedStores}
                    onToggleFollowStore={toggleFollowStore}
                    targetContext={inboxChatTarget}
                    onOpenStore={(merchantObj) => {
                      setSelectedStore(merchantObj);
                      setActiveTab('shop');
                    }}
                    onStartCheckout={(product) => {
                      addToCart(product);
                      setActiveTab('cart');
                    }}
                  />
                )}

                {/* 5. WISHLIST */}
                {activeTab === 'wishlist' && (
                  <WishlistPage
                    wishlist={wishlist}
                    onRemoveFromWishlist={removeFromWishlist}
                    onClearWishlist={clearWishlist}
                    onNavigateToShop={() => {
                      setActiveTab('shop');
                      setSelectedStore(null);
                    }}
                    onStartCheckout={(product) => {
                      addToCart(product);
                      setActiveTab('cart');
                    }}
                    onOpenChat={(item) => {
                      setActiveTab('inbox');
                    }}
                    onOpenStore={(item) => {
                      const merchantObj = VERIFIED_MERCHANTS.find(m => m.id === item.merchantId) || VERIFIED_MERCHANTS[0];
                      setSelectedStore(merchantObj);
                      setActiveTab('shop');
                    }}
                    onOpenRateSeller={(item) => {
                      const merchantObj = VERIFIED_MERCHANTS.find(m => m.id === item.merchantId) || VERIFIED_MERCHANTS[0];
                      handleOpenRateSeller(merchantObj, item);
                    }}
                  />
                )}

                {/* 6. AI COMPANION FULL PAGE */}
                {activeTab === 'assistant' && (
                  <AIAssistantPage
                    user={user}
                    authenticated={authenticated}
                    onLogin={() => setPrivyModalOpen(true)}
                    onNavigateTab={(tab) => {
                      if (tab === 'shop') setSelectedStore(null);
                      setActiveTab(tab);
                    }}
                    onOpenStore={(merchantObj) => {
                      setSelectedStore(merchantObj);
                      setActiveTab('shop');
                    }}
                    onStartCheckout={(product) => {
                      addToCart(product);
                      setActiveTab('cart');
                    }}
                    userStore={userStore}
                    userRole={userRole}
                    usdcBalance={usdcBalance}
                    passports={myPassports}
                    activeOrderContext={aiSupportOrderContext}
                    catalog={products}
                    merchants={VERIFIED_MERCHANTS}
                  />
                )}

                {/* 6. PASSPORTS & PROFILE */}
                {(activeTab === 'passports' || activeTab === 'profile') && (
                  <ProfilePage
                    activeTab={activeTab}
                    passports={myPassports}
                    wishlist={wishlist}
                    onToggleWishlist={toggleWishlist}
                    onRemoveFromWishlist={removeFromWishlist}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenSellModal={() => setSellModalOpen(true)}
                    onRefreshData={loadData}
                    forcedModal={forcedModal}
                    onClearForcedModal={() => setForcedModal(null)}
                    onNavigateToSignIn={() => setCurrentView('signin')}
                    followedStores={followedStores}
                    onToggleFollowStore={toggleFollowStore}
                    onOpenRateSeller={handleOpenRateSeller}
                    onOpenStore={(merchantObj) => {
                      setSelectedStore(merchantObj);
                      setActiveTab('shop');
                    }}
                    onAddToCart={addToCart}
                    onStartCheckout={(product) => {
                      addToCart(product);
                      setActiveTab('cart');
                    }}
                    onOpenAiSupport={handleOpenAiSupport}
                  />
                )}

                {/* 7. SETTINGS PAGE */}
                {activeTab === 'settings' && (
                  <SettingsPage 
                    onNavigateTab={(tab) => {
                      if (tab === 'shop') setSelectedStore(null);
                      setActiveTab(tab);
                    }}
                  />
                )}
              </div>
            )}
          </main>

          {/* Footer */}
          <footer style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px 20px',
            fontSize: '0.78rem',
            color: '#9CA3AF',
            background: 'rgba(10, 16, 16, 0.65)',
            backdropFilter: 'blur(30px) saturate(200%)',
            WebkitBackdropFilter: 'blur(30px) saturate(200%)'
          }}>
            <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <strong style={{ color: '#FFFFFF', fontSize: '1rem' }}>Hual</strong>
                  <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'var(--brand-green-dim)', color: 'var(--brand-green)', border: '1px solid var(--brand-green-border)' }}>VERIFIED COMMERCE</span>
                </div>
                <div style={{ fontSize: '0.74rem' }}>Buy it. Own it. Prove it.</div>
              </div>
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.74rem' }}>
                <span style={{ color: '#9CA3AF' }}>• Protected Checkout</span>
                <span style={{ color: '#9CA3AF' }}>• 100% Verified Authenticity</span>
                <span style={{ color: '#9CA3AF' }}>• Digital Warranty Passports</span>
              </div>
            </div>
          </footer>

          {/* Mobile Bottom Navigation Bar */}
          <BottomNav 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'shop') {
                setSelectedStore(null);
              }
            }} 
            passportCount={myPassports.length} 
            wishlistCount={wishlist.length}
            cartCount={cart.length}
            inboxCount={inboxUnreadCount}
            onOpenSellModal={() => setSellModalOpen(true)}
            onOpenCreateStore={() => setCreateStoreOpen(true)}
          />
        </div>
      )}

      {/* Global In-App Commerce Chat Modal (triggered only from store or listed items) */}
      <CommerceChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        merchant={chatTarget.merchant}
        product={chatTarget.product}
        buyerLocation={userLocation || "Victoria Island, Lagos"}
        onQuickCheckout={(p) => {
          setChatOpen(false);
          setCurrentView('storefront');
          setActiveTab('shop');
          setTimeout(() => setForcedModal('checkout'), 50);
        }}
      />

      {/* Create Store Modal */}
      <CreateStoreModal
        isOpen={createStoreOpen}
        onClose={() => setCreateStoreOpen(false)}
        onStoreCreated={(newStore) => {
          setSelectedStore(newStore);
          setCurrentView('storefront');
          setActiveTab('shop');
        }}
      />

      {/* User Profile Section Modal */}
      <UserProfileModal
        isOpen={userProfileOpen}
        onClose={() => setUserProfileOpen(false)}
        onOpenSellModal={() => setSellModalOpen(true)}
        onOpenMyStore={(store) => {
          setSelectedStore(store || userStore);
          setCurrentView('storefront');
          setActiveTab('shop');
          setUserProfileOpen(false);
        }}
        onNavigateTab={(tab) => {
          setCurrentView('storefront');
          setActiveTab(tab);
          setUserProfileOpen(false);
        }}
        passports={myPassports}
      />

      {/* Universal Sell / List Product Modal */}
      <SellProductModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        onOpenCreateStore={() => setCreateStoreOpen(true)}
        onProductListed={(newProd) => {
          if (newProd) {
            setProducts(prev => [newProd, ...prev.filter(p => String(p.id || p.productId) !== String(newProd.id || newProd.productId))]);
          }
          loadData();
          setCurrentView('storefront');
          setActiveTab('stores');
        }}
      />

      {/* 18+ Legal Age Verification Modal */}
      <AgeVerificationModal
        isOpen={ageVerificationOpen}
        onClose={() => setAgeVerificationOpen(false)}
        onVerified={({ dob, age }) => {
          verifyUserAge(dob, age);
          setAgeVerificationOpen(false);
          setCurrentView('storefront');
          setActiveTab('shop');
        }}
        onRejected={() => {
          // Keep blocked
        }}
      />

      {/* Groq AI Support Companion Modal */}
      <AISupportModal
        isOpen={aiSupportOpen}
        onClose={() => {
          setAiSupportOpen(false);
          setAiSupportOrderContext(null);
        }}
        user={user}
        authenticated={authenticated}
        onLogin={() => setPrivyModalOpen(true)}
        onNavigateToSignIn={() => setCurrentView('signin')}
        userStore={userStore}
        userRole={userRole}
        usdcBalance={usdcBalance}
        passports={myPassports}
        activeOrderContext={aiSupportOrderContext}
        onOpenInbox={handleOpenInbox}
      />

      {/* Floating Action Button (FAB) for AI Support */}
      <AISupportFAB
        onClick={() => handleOpenAiSupport(null)}
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={() => {
          setOnboardingOpen(false);
          setCurrentView('storefront');
          setActiveTab('shop');
        }}
      />

      {/* Privy / Embedded Wallet Dialog */}
      <PrivyModal
        isOpen={privyModalOpen}
        onClose={() => setPrivyModalOpen(false)}
      />

      {/* Store & Seller Rating / Review Modal */}
      <StoreReviewModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        merchant={ratingTarget.merchant}
        product={ratingTarget.product}
        passport={ratingTarget.passport}
        currentUser={user}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Verified Purchase Requirement Dialog */}
      {verifiedReviewNotice?.isOpen && (
        <ModalPortal>
          <div 
            className="modal-overlay" 
            onClick={() => setVerifiedReviewNotice(null)}
            style={{ zIndex: 999999 }}
          >
          <div 
            className="liquid-glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '28px',
              borderRadius: '24px',
              background: 'rgba(14, 22, 22, 0.95)',
              border: '1.5px solid rgba(251, 191, 36, 0.4)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(251, 191, 36, 0.15)',
              position: 'relative',
              textAlign: 'center'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setVerifiedReviewNotice(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            {/* Title Header */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 8px' }}>
              Verified Item In Hand Required
            </h3>

            <p style={{ fontSize: '0.86rem', color: '#D1D5DB', lineHeight: 1.5, margin: '0 0 18px' }}>
              To ensure 100% authentic ratings on Hual, you can only review an item or merchant once you have collected the item and have it in hand. Orders that were cancelled, refunded, or are still in escrow cannot be reviewed.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '20px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9CA3AF' }}>Store / Merchant:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{verifiedReviewNotice.merchantName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9CA3AF' }}>Item Status:</span>
                <span style={{ color: '#FBBF24', fontWeight: 700 }}>No Collected Items in Hand</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  setVerifiedReviewNotice(null);
                  if (verifiedReviewNotice.merchantObj) {
                    setSelectedStore(verifiedReviewNotice.merchantObj);
                  }
                  setActiveTab('shop');
                  setCurrentView('storefront');
                }}
                className="btn-pill-primary"
                style={{
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ShoppingBag size={16} />
                <span>Shop {verifiedReviewNotice.merchantName}</span>
              </button>

              <button
                onClick={() => {
                  setVerifiedReviewNotice(null);
                  setActiveTab('passports');
                  setCurrentView('storefront');
                }}
                style={{
                  padding: '10px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9CA3AF',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                View My Passports Vault
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* Floating Add to Cart Feedback Toast */}
      {cartToast && (
        <div 
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 9999999,
            background: 'rgba(13, 22, 22, 0.95)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1.5px solid var(--brand-green)',
            borderRadius: '18px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(132, 244, 59, 0.25)',
            maxWidth: '420px',
            width: 'calc(100vw - 40px)',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Product Thumbnail */}
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: '#080F0F',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}>
            <img 
              src={cartToast.product.imageUri || cartToast.product.images?.[0]} 
              alt={cartToast.product.name}
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <CheckCircle2 size={14} color="var(--brand-green)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Added to Cart
              </span>
            </div>
            <div style={{ 
              fontSize: '0.84rem', 
              fontWeight: 700, 
              color: '#FFFFFF', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}>
              {cartToast.product.name}
            </div>
            {cartToast.selectedSize && cartToast.selectedSize !== 'Standard' && (
              <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                Size: {cartToast.selectedSize}
              </div>
            )}
          </div>

          {/* Action: View Cart */}
          <button
            onClick={() => {
              setCurrentView('storefront');
              setActiveTab('cart');
              setCartToast(null);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'var(--brand-green)',
              color: '#080F0F',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 0 14px var(--brand-green-glow)'
            }}
          >
            <ShoppingBag size={13} />
            <span>View Cart</span>
          </button>

          {/* Dismiss button */}
          <button
            onClick={() => setCartToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
