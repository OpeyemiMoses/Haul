import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Wallet, 
  Copy, 
  Check, 
  RefreshCw, 
  PlusCircle, 
  ShoppingBag, 
  QrCode, 
  Clock, 
  ArrowRight, 
  ExternalLink, 
  Sparkles, 
  LogOut, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Lock,
  ArrowUpRight,
  Send,
  RotateCcw,
  Tag,
  Wrench,
  X,
  MapPin,
  Store,
  Camera,
  Upload,
  Key,
  Star,
  Eye,
  EyeOff,
  UserCheck,
  UserPlus,
  Heart,
  Truck,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Trash2,
  Edit3,
  Bot
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import { cancelAndRefundOnchain } from '../lib/web3';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { INITIAL_USER_PROFILE, INITIAL_FEATURED_PASSPORT, BUYER_LOCATIONS, VERIFIED_MERCHANTS } from '../lib/catalogData';
import { HualIcon } from './HualLogo';
import HaulQrCode from './HaulQrCode';
import CreateStoreModal from './CreateStoreModal';
import EditProfileModal from './EditProfileModal';
import QrScannerModal from './QrScannerModal';
import { resolveRecipient, getRegistry } from '../lib/userRegistry';
import ModalPortal from './ModalPortal';
import useScrollReveal from '../lib/useScrollReveal';

export default function ProfilePage({ 
  activeTab = 'profile',
  initialSubTab,
  passports = [], 
  wishlist = [],
  onToggleWishlist,
  onRemoveFromWishlist,
  onNavigateTab, 
  onOpenSellModal, 
  onRefreshData, 
  forcedModal, 
  onClearForcedModal, 
  onNavigateToSignIn,
  followedStores = [],
  onToggleFollowStore,
  onOpenStore,
  onOpenRateSeller,
  onAddToCart,
  onStartCheckout,
  onOpenAiSupport
}) {
  const { 
    user, 
    userLocation, 
    updateUserLocation, 
    detectLiveLocation,
    userRole, 
    userStore, 
    profilePicture, 
    updateProfilePicture, 
    customProfile,
    updateProfile,
    usdcBalance, 
    loadingBalance, 
    refreshBalance, 
    faucetUsdc, 
    deductUsdc,
    transferUsdc,
    linkGoogle,
    linkEmail,
    linkPhone,
    linkTwitter,
    linkDiscord,
    exportWallet,
    logout 
  } = useAuth();

  const fileInputRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [fauceting, setFauceting] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState(false);
  const [createStoreOpen, setCreateStoreOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editLocationOpen, setEditLocationOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendingFunds, setSendingFunds] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  // Export Embedded Wallet State
  const [exportWalletOpen, setExportWalletOpen] = useState(false);
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  const [customLocInput, setCustomLocInput] = useState('');

  // User Key for scoped storage
  const userKey = user?.id || (user?.email ? user.email.toLowerCase() : 'guest');

  // Sub-tab selection state (directly opens 'products' when navigating to Passports)
  const [subTab, setSubTab] = useState(() => {
    if (initialSubTab) return initialSubTab;
    if (activeTab === 'passports') return 'products';
    return 'overview';
  });

  // Sync subTab whenever activeTab or initialSubTab changes
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    } else if (activeTab === 'passports') {
      setSubTab('products');
    } else if (activeTab === 'profile') {
      setSubTab('overview');
    }
  }, [activeTab, initialSubTab]);

  useScrollReveal([subTab, passports?.length]);

  // User Reviews list
  const [myReviews, setMyReviews] = useState(() => {
    try {
      const stored = localStorage.getItem(`hual_my_reviews_${userKey}`);
      if (stored) return JSON.parse(stored);
      const legacy = localStorage.getItem('hual_my_reviews');
      return legacy ? JSON.parse(legacy) : [];
    } catch {
      return [];
    }
  });

  // Sync reviews when user changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`hual_my_reviews_${userKey}`);
      if (stored) setMyReviews(JSON.parse(stored));
      else setMyReviews([]);
    } catch {
      setMyReviews([]);
    }
  }, [userKey]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Profile picture file must be under 8MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateProfilePicture(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Profile sub-tabs: 'overview' | 'products' | 'wishlist' | 'reviews' | 'following' | 'transactions' | 'transfers' | 'resale'

  // Modals matching user's spec:
  // Transfer Ownership
  const [transferPassport, setTransferPassport] = useState(null);
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferMessage, setTransferMessage] = useState('Enjoy your new item!');
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Resale Listing & Store Dependency
  const [resalePassport, setResalePassport] = useState(null);
  const [pendingResalePassport, setPendingResalePassport] = useState(null);
  const [storeRequiredModalOpen, setStoreRequiredModalOpen] = useState(false);
  const [resalePrice, setResalePrice] = useState('230');
  const [resaleCondition, setResaleCondition] = useState('New'); // 'New' | 'Like New' | 'Used'
  const [resaleDescription, setResaleDescription] = useState('Well maintained. No issues. Box included.');
  const [resaleSuccess, setResaleSuccess] = useState(false);

  // User-persisted resale listings
  const [myResales, setMyResales] = useState(() => {
    try {
      const saved = localStorage.getItem(`hual_user_resales_${userKey}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'rs-1',
        tokenId: 4821,
        productName: 'Air Max 95 OG Neon',
        originalPrice: 250.00,
        resalePrice: 230.00,
        condition: 'Like New (Worn Once)',
        warrantyRemaining: '364 days remaining',
        image: '/assets/air_max_95.jpg',
        status: 'Active on Marketplace',
        storeName: userStore?.name || 'Verified Storefront'
      }
    ];
  });

  const handleInitiateResale = (passport) => {
    const target = passport || effectivePassports[0] || INITIAL_FEATURED_PASSPORT;
    if (!userStore && userRole !== 'merchant') {
      // Must first create a merchant store before listing for resale
      setPendingResalePassport(target);
      setStoreRequiredModalOpen(true);
    } else {
      setResalePassport(target);
    }
  };

  // Warranty Claim
  const [warrantyPassport, setWarrantyPassport] = useState(null);
  const [warrantyIssue, setWarrantyIssue] = useState('Hardware / Stitching');
  const [warrantyDesc, setWarrantyDesc] = useState('');
  const [warrantySuccess, setWarrantySuccess] = useState(false);

  // Pickup QR Pass (Customer View)
  const [pickupPassport, setPickupPassport] = useState(null);

  // Cancel Order & Escrow Refund State (Customer View)
  const [cancelOrderPassport, setCancelOrderPassport] = useState(null);
  const [cancelReason, setCancelReason] = useState('Changed mind');
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Confirm Courier Delivery Receipt Modal State
  const [confirmCourierPassport, setConfirmCourierPassport] = useState(null);
  const [confirmingCourierReceipt, setConfirmingCourierReceipt] = useState(false);
  const [confirmCourierSuccess, setConfirmCourierSuccess] = useState(false);

  const handleExecuteCancelOrder = async (e) => {
    if (e) e.preventDefault();
    if (!cancelOrderPassport) return;

    setCancellingOrder(true);
    const refundAmount = cancelOrderPassport.originalPriceUsd || 250;
    const orderId = cancelOrderPassport.orderId || cancelOrderPassport.tokenId || Date.now();

    try {
      // 1. Try onchain escrow refund call
      try {
        await cancelAndRefundOnchain(orderId);
      } catch (onchainErr) {
        console.warn('Local escrow refund fallback:', onchainErr);
      }

      // 2. Update passport status to REFUNDED
      const updatedPassport = {
        ...cancelOrderPassport,
        currentState: 'REFUNDED',
        currentStateIndex: 8,
        refundedAt: new Date().toISOString(),
        refundReason: cancelReason
      };

      const updateList = (list) => {
        return list.map(p => {
          if ((p.tokenId && p.tokenId === cancelOrderPassport.tokenId) || (p.serialNumber && p.serialNumber === cancelOrderPassport.serialNumber)) {
            return updatedPassport;
          }
          return p;
        });
      };

      // Instantly update reactive local passports state
      setLocalPassports(prev => updateList(prev));

      // 3. Persist to storage and refunded registry
      try {
        const stored = JSON.parse(localStorage.getItem('hual_my_passports') || '[]');
        localStorage.setItem('hual_my_passports', JSON.stringify(updateList(stored)));

        // Persistent refunded map
        const refundedMap = JSON.parse(localStorage.getItem('hual_refunded_passports') || '{}');
        const tokenKey = String(cancelOrderPassport.tokenId || cancelOrderPassport.serialNumber || orderId);
        refundedMap[tokenKey] = {
          refundedAt: new Date().toISOString(),
          refundReason: cancelReason,
          refundAmount
        };
        if (cancelOrderPassport.tokenId) refundedMap[String(cancelOrderPassport.tokenId)] = refundedMap[tokenKey];
        if (cancelOrderPassport.serialNumber) refundedMap[String(cancelOrderPassport.serialNumber)] = refundedMap[tokenKey];
        if (cancelOrderPassport.id) refundedMap[String(cancelOrderPassport.id)] = refundedMap[tokenKey];
        if (cancelOrderPassport.orderId) refundedMap[String(cancelOrderPassport.orderId)] = refundedMap[tokenKey];
        localStorage.setItem('hual_refunded_passports', JSON.stringify(refundedMap));

        if (userKey) {
          const userStored = JSON.parse(localStorage.getItem(`hual_my_passports_${userKey}`) || '[]');
          localStorage.setItem(`hual_my_passports_${userKey}`, JSON.stringify(updateList(userStored)));
        }
        if (user?.address) {
          const addrStored = JSON.parse(localStorage.getItem(`hual_my_passports_${user.address.toLowerCase()}`) || '[]');
          localStorage.setItem(`hual_my_passports_${user.address.toLowerCase()}`, JSON.stringify(updateList(addrStored)));
        }

        // Update escrow orders in storage
        const escrowOrders = JSON.parse(localStorage.getItem('hual_escrow_orders') || '[]');
        const updatedOrders = escrowOrders.map(ord => {
          if (ord.orderId === orderId || ord.items?.some(it => it.name === cancelOrderPassport.productName)) {
            return { ...ord, status: 'refunded' };
          }
          return ord;
        });
        localStorage.setItem('hual_escrow_orders', JSON.stringify(updatedOrders));
      } catch (err) {
        console.warn('Error persisting refund state:', err);
      }

      // 4. Refund USDC to balance
      if (faucetUsdc) {
        try { await faucetUsdc(refundAmount); } catch {}
      }
      if (refreshBalance) {
        try { await refreshBalance(); } catch {}
      }

      setCancellingOrder(false);
      setCancelSuccess(true);
      if (onRefreshData) onRefreshData();

      setTimeout(() => {
        setCancelSuccess(false);
        setCancelOrderPassport(null);
      }, 1500);
    } catch (err) {
      console.error('Cancellation failed:', err);
      setCancellingOrder(false);
      alert('Failed to process cancellation. Please try again.');
    }
  };

  // Store Counter & In-Store Code Verification (Merchant View)
  const [counterCodeInput, setCounterCodeInput] = useState('');
  const [counterLookupResult, setCounterLookupResult] = useState(null);
  const [counterChecking, setCounterChecking] = useState(false);
  const [counterHandoverSuccess, setCounterHandoverSuccess] = useState(false);

  // Execute Transfer Out / Send Funds
  const handleExecuteSendFunds = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(sendAmount);
    if (!sendRecipient.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid recipient address/username and amount.');
      return;
    }
    if (parsedAmount > usdcBalance) {
      alert(`Insufficient balance. You have $${usdcBalance.toLocaleString()} USD available.`);
      return;
    }

    const resolved = resolveRecipient(sendRecipient);
    const destAddr = resolved?.address || (sendRecipient.startsWith('0x') ? sendRecipient.trim() : null);
    if (!destAddr) {
      alert('Could not resolve recipient to a valid Monad address. Please enter a valid @username, email, or 0x address.');
      return;
    }

    setSendingFunds(true);
    try {
      if (transferUsdc) {
        try {
          await transferUsdc({ recipientAddress: destAddr, amount: parsedAmount });
        } catch (tErr) {
          console.warn('Onchain transfer fallback to local balance deduction:', tErr);
          if (deductUsdc) deductUsdc(parsedAmount);
        }
      } else if (deductUsdc) {
        deductUsdc(parsedAmount);
      }

      setSendingFunds(false);
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setSendModalOpen(false);
        setSendRecipient('');
        setSendAmount('');
      }, 2000);
    } catch (err) {
      console.error('Send funds error:', err);
      alert('Failed to send funds: ' + (err.message || err));
      setSendingFunds(false);
    }
  };

  // Handle external modal trigger
  React.useEffect(() => {
    if (forcedModal === 'transfer') {
      setTransferPassport(INITIAL_FEATURED_PASSPORT);
    } else if (forcedModal === 'resale') {
      handleInitiateResale(INITIAL_FEATURED_PASSPORT);
    } else if (forcedModal === 'warranty') {
      setWarrantyPassport(INITIAL_FEATURED_PASSPORT);
    } else if (forcedModal === 'pickup') {
      setPickupPassport(INITIAL_FEATURED_PASSPORT);
    }
  }, [forcedModal, userStore, userRole]);

  const isGuest = !user;
  const activeUser = user || {
    name: 'Guest Visitor',
    email: '',
    address: null,
    location: userLocation || 'Victoria Island, Lagos',
    role: 'consumer'
  };

  const displayName = activeUser.name || (activeUser.email ? activeUser.email.split('@')[0] : 'Guest Visitor');
  const displayHandle = activeUser.username ? `@${activeUser.username.replace(/^@/, '')}` : (activeUser.handle || (activeUser.email ? `@${activeUser.email.split('@')[0]}` : '@guest'));
  const displayWalletHandle = activeUser.username ? `${activeUser.username.replace(/^@/, '')}.owt` : (activeUser.email ? `${activeUser.email.split('@')[0]}.owt` : 'guest.owt');
  const displayBio = activeUser.bio || 'Living Digital Passport Collector on Monad.';
  const displayInitial = (displayName[0] || 'G').toUpperCase();
  const address = activeUser.address;
  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : (isGuest ? 'Not Connected' : 'Provisioning Monad Wallet...');

  // Reactive local passports state initialized from props and localStorage
  const [localPassports, setLocalPassports] = useState(() => {
    try {
      const stored = localStorage.getItem(`hual_my_passports_${userKey}`) || localStorage.getItem('hual_my_passports');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    if (localStorage.getItem('hual_my_passports_cleared') === 'true') {
      return [];
    }
    return (passports && passports.length > 0) ? passports : [INITIAL_FEATURED_PASSPORT];
  });

  const [deletedTxIds, setDeletedTxIds] = useState(() => {
    try {
      const stored = localStorage.getItem('hual_deleted_txs');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Sync when prop passports change from outside (e.g. initial onchain load)
  useEffect(() => {
    if (passports) {
      const deletedIds = new Set(JSON.parse(localStorage.getItem('hual_deleted_passports') || '[]'));
      const refundedMap = JSON.parse(localStorage.getItem('hual_refunded_passports') || '{}');
      
      const filtered = passports
        .filter(p => {
          const tStr = String(p.tokenId || '');
          const sStr = String(p.serialNumber || '');
          const iStr = String(p.id || '');
          const oStr = String(p.orderId || '');
          return !deletedIds.has(tStr) && !deletedIds.has(sStr) && !deletedIds.has(iStr) && !deletedIds.has(oStr);
        })
        .map(rawP => {
          const tStr = String(rawP.tokenId || '');
          const sStr = String(rawP.serialNumber || '');
          const iStr = String(rawP.id || '');
          const oStr = String(rawP.orderId || '');
          let p = { ...rawP };
          if (refundedMap[tStr] || refundedMap[sStr] || refundedMap[iStr] || refundedMap[oStr]) {
            p.currentState = 'REFUNDED';
            p.currentStateIndex = 8;
          }
          return p;
        });

      setLocalPassports(filtered);
    }
  }, [passports]);

  // Real user passports array with deduplication safety
  const effectivePassports = React.useMemo(() => {
    const list = localPassports || [];
    const seen = new Set();
    const unique = [];
    for (const p of list) {
      const key = String(p.tokenId || p.serialNumber || p.id || p.orderId || `${p.productName}-${p.purchaseTimestamp}`);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }
    return unique;
  }, [localPassports]);

  const productsOwnedCount = effectivePassports.length;
  const transfersCount = React.useMemo(() => {
    return effectivePassports.filter(p => p.transferHistory && p.transferHistory.length > 0).length || 0;
  }, [effectivePassports]);
  const resalesCount = React.useMemo(() => {
    return myResales?.length || effectivePassports.filter(p => p.resaleActive || p.isResale).length || 0;
  }, [myResales, effectivePassports]);

  const handleExportWallet = async () => {
    if (exportWallet) {
      try {
        await exportWallet();
      } catch (err) {
        console.warn('Privy native export:', err);
        setExportWalletOpen(true);
      }
    } else {
      setExportWalletOpen(true);
    }
  };

  const realTransactions = React.useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. From passports (recent mints / purchases)
    (effectivePassports || []).forEach((p, idx) => {
      const txHash = p.paymentTxRef || '0x7f3411b93ef2d38e81c04910283f';
      const id = String(p.tokenId || p.serialNumber || `tx-pass-${idx}`);
      if (!seen.has(id) && !deletedTxIds.has(id)) {
        seen.add(id);
        const isRefunded = p.currentState === 'REFUNDED';
        const isCollected = p.currentState === 'COLLECTED' || p.currentState === 'ACTIVE_OWNERSHIP' || p.currentState === 'DELIVERED' || p.currentState === 'COMPLETED' || p.currentState === 'OWNED' || Boolean(p.isCollected) || Boolean(p.isDelivered);
        const isDispatched = p.deliveryMethod === 'dispatch' || p.deliveryMethod === 'delivery';
        list.push({
          id,
          productName: p.productName || p.name || 'Verified Luxury Item',
          merchant: p.originalMerchant || p.merchant || 'Verified Merchant Store',
          merchantLocation: p.merchantLocation || 'Victoria Island, Lagos',
          amount: p.originalPriceUsd || p.priceUsd || 190.00,
          status: isRefunded ? 'Refunded (USDC Returned)' : isCollected ? 'Escrow Released (In Hand)' : isDispatched ? 'In Transit (Escrow Held)' : 'Locked in Escrow (Awaiting Pickup)',
          statusColor: isRefunded ? '#EF4444' : isCollected ? 'var(--brand-green)' : isDispatched ? '#60A5FA' : '#F59E0B',
          date: p.purchaseTimestamp || 'Recently',
          txHash: txHash,
          image: p.imageUri || '/assets/air_max_95.jpg',
          type: 'PURCHASE'
        });
      }
    });

    // 2. From batch escrow orders in localStorage
    try {
      const escrowOrders = JSON.parse(localStorage.getItem('hual_escrow_orders') || '[]');
      escrowOrders.forEach(ord => {
        (ord.items || []).forEach(item => {
          const id = String(item.orderItemId || ord.orderId);
          if (!seen.has(id) && !deletedTxIds.has(id)) {
            seen.add(id);
            const isRefunded = ord.status === 'refunded' || item.status === 'refunded';
            list.push({
              id,
              productName: item.name,
              merchant: item.merchant,
              merchantLocation: item.merchantLocation,
              amount: item.priceUsd * (item.quantity || 1),
              status: isRefunded ? 'Refunded (USDC Returned)' : item.status === 'released' ? 'Escrow Released' : 'Locked in Escrow',
              statusColor: isRefunded ? '#EF4444' : item.status === 'released' ? 'var(--brand-green)' : '#F59E0B',
              date: item.purchasedAt ? new Date(item.purchasedAt).toLocaleDateString() : 'Recently',
              txHash: item.txHash || ord.txHash || '0x7f3411b93ef2d38e81c04910283f',
              image: item.imageUri || '/assets/air_max_95.jpg',
              type: 'ESCROW_ORDER'
            });
          }
        });
      });
    } catch {}

    return list;
  }, [effectivePassports, deletedTxIds]);

  const recentActivity = React.useMemo(() => {
    return realTransactions.slice(0, 4).map(tx => ({
      id: tx.id,
      type: tx.type,
      productName: tx.productName,
      merchant: tx.merchant,
      amountUsd: tx.amount,
      date: tx.date,
      image: tx.image,
      txHash: tx.txHash
    }));
  }, [realTransactions]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFaucet = async () => {
    setFauceting(true);
    setFaucetSuccess(false);
    try {
      await faucetUsdc(1000);
      await refreshBalance();
      setFaucetSuccess(true);
      setTimeout(() => setFaucetSuccess(false), 3000);
    } catch (err) {
      console.error('Top-up failed:', err);
    } finally {
      setFauceting(false);
    }
  };

  // Delete a cancelled/refunded passport record
  const handleDeletePassport = (passport) => {
    if (!passport) return;
    const tokenStr = String(passport.tokenId || '');
    const serialStr = String(passport.serialNumber || '');
    const idStr = String(passport.id || '');
    const orderIdStr = String(passport.orderId || '');
    const keys = [tokenStr, serialStr, idStr, orderIdStr].filter(Boolean);

    // 1. Add all identifier keys to persistent deleted registry
    try {
      const deletedList = JSON.parse(localStorage.getItem('hual_deleted_passports') || '[]');
      const updatedDeleted = Array.from(new Set([...deletedList, ...keys]));
      localStorage.setItem('hual_deleted_passports', JSON.stringify(updatedDeleted));
    } catch {}

    const filterList = (list) => {
      return (list || []).filter(p => {
        const pToken = String(p.tokenId || '');
        const pSerial = String(p.serialNumber || '');
        const pId = String(p.id || '');
        const pOrderId = String(p.orderId || '');
        return !keys.includes(pToken) && !keys.includes(pSerial) && !keys.includes(pId) && !keys.includes(pOrderId);
      });
    };

    // 2. Immediately update reactive state
    setLocalPassports(prev => filterList(prev));
    setDeletedTxIds(prev => {
      const next = new Set([...prev, ...keys]);
      try {
        localStorage.setItem('hual_deleted_txs', JSON.stringify([...next]));
      } catch {}
      return next;
    });

    // 3. Persist to storage
    try {
      const stored = JSON.parse(localStorage.getItem('hual_my_passports') || '[]');
      const filtered = filterList(stored);
      localStorage.setItem('hual_my_passports', JSON.stringify(filtered));

      if (userKey) {
        const userStored = JSON.parse(localStorage.getItem(`hual_my_passports_${userKey}`) || '[]');
        localStorage.setItem(`hual_my_passports_${userKey}`, JSON.stringify(filterList(userStored)));
      }
      if (user?.address) {
        const addrStored = JSON.parse(localStorage.getItem(`hual_my_passports_${user.address.toLowerCase()}`) || '[]');
        localStorage.setItem(`hual_my_passports_${user.address.toLowerCase()}`, JSON.stringify(filterList(addrStored)));
      }
      if (filtered.length === 0) {
        localStorage.setItem('hual_my_passports_cleared', 'true');
      }
    } catch (err) {
      console.warn('Error deleting passport record:', err);
    }

    if (onRefreshData) onRefreshData();
  };

  // Delete a transaction record from history
  const handleDeleteTransaction = (txId) => {
    const idStr = String(txId);

    // Safeguard: Do NOT allow deleting active escrow orders so users don't lose track of locked funds!
    const targetTx = transactions.find(t => String(t.id) === idStr);
    const isEscrowLocked = targetTx && !targetTx.status?.includes('Released') && !targetTx.status?.includes('Cancelled') && !targetTx.status?.includes('Refunded') && !targetTx.status?.includes('Completed');
    if (isEscrowLocked) {
      alert("Cannot delete an active escrow order! Please cancel the order first to refund your locked USDC funds back to your wallet before removing it from history.");
      return;
    }
    
    // 1. Immediately update reactive state
    setDeletedTxIds(prev => {
      const next = new Set([...prev, idStr]);
      try {
        localStorage.setItem('hual_deleted_txs', JSON.stringify([...next]));
      } catch {}
      return next;
    });

    // 2. Persist to storage
    try {
      const escrowOrders = JSON.parse(localStorage.getItem('hual_escrow_orders') || '[]');
      const filteredOrders = escrowOrders.filter(ord => {
        const matchId = String(ord.orderId);
        const matchItem = ord.items?.some(it => String(it.orderItemId) === idStr);
        return matchId !== idStr && !matchItem;
      });
      localStorage.setItem('hual_escrow_orders', JSON.stringify(filteredOrders));
    } catch {}

    if (onRefreshData) onRefreshData();
  };

  // 1. Customer confirms courier / dispatch delivery physical receipt
  const handleConfirmDispatchedReceipt = async (passport) => {
    if (!passport) return;
    const storePayout = passport.merchantPayoutAddress || passport.originalMerchantOwnerAddress || passport.originalMerchant || 'Merchant Store Owner Wallet';
    const releaseAmount = passport.originalPriceUsd || passport.priceUsd || 250;

    // Update passport object to COLLECTED status
    const updatedPassport = {
      ...passport,
      currentState: 'COLLECTED',
      currentStateIndex: 4,
      isDelivered: true,
      isCollected: true,
      currentOwner: `You (${displayName})`,
      currentOwnerAddress: user?.address || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      daysRemainingWarranty: passport.daysRemainingWarranty || 365,
      lifecycleSteps: [
        { name: 'Listed', completed: true, date: passport.purchaseTimestamp || 'Oct 5, 2026' },
        { name: 'Ordered', completed: true, date: passport.purchaseTimestamp || 'Oct 7, 2026' },
        { name: 'Paid (Escrow)', completed: true, date: passport.purchaseTimestamp || 'Oct 7, 2026' },
        { name: 'Dispatched', completed: true, date: 'Courier Delivery' },
        { name: 'Delivered & Received', completed: true, date: 'Just now' },
        { name: 'Warranty Active', completed: true, date: 'Active' }
      ]
    };

    const updatePassportList = (list) => {
      return list.map(p => {
        if ((p.tokenId && p.tokenId === passport.tokenId) || (p.serialNumber && p.serialNumber === passport.serialNumber)) {
          return updatedPassport;
        }
        return p;
      });
    };

    try {
      const stored = JSON.parse(localStorage.getItem('hual_my_passports') || '[]');
      localStorage.setItem('hual_my_passports', JSON.stringify(updatePassportList(stored)));

      if (userKey) {
        const userStored = JSON.parse(localStorage.getItem(`hual_my_passports_${userKey}`) || '[]');
        localStorage.setItem(`hual_my_passports_${userKey}`, JSON.stringify(updatePassportList(userStored)));
      }
      if (user?.address) {
        const addrStored = JSON.parse(localStorage.getItem(`hual_my_passports_${user.address.toLowerCase()}`) || '[]');
        localStorage.setItem(`hual_my_passports_${user.address.toLowerCase()}`, JSON.stringify(updatePassportList(addrStored)));
      }
    } catch (err) {
      console.warn('Failed saving delivery confirmation to localStorage:', err);
    }

    if (onRefreshData) onRefreshData();
    return true;
  };

  // 2. Merchant Store Counter: Lookup and Verify customer pickup code / PIN / Token #
  const handleLookupCounterCode = (e) => {
    if (e) e.preventDefault();
    const query = counterCodeInput.trim().toUpperCase();
    if (!query) return;

    setCounterChecking(true);
    setCounterLookupResult(null);

    setTimeout(() => {
      setCounterChecking(false);
      // Load all stored passports across app
      let allPassportsPool = [];
      try {
        const stored = JSON.parse(localStorage.getItem('hual_my_passports') || '[]');
        allPassportsPool = [...stored];
      } catch {}

      // Also check INITIAL_FEATURED_PASSPORT
      if (!allPassportsPool.some(p => p.tokenId === INITIAL_FEATURED_PASSPORT.tokenId)) {
        allPassportsPool.push(INITIAL_FEATURED_PASSPORT);
      }

      // Find matching item by PIN, Token ID, Serial #, or Order ID
      const matched = allPassportsPool.find(p => {
        const pin = String(p.pickupPIN || '');
        const tok = String(p.tokenId || '');
        const sn = String(p.serialNumber || '').toUpperCase();
        return pin === query || tok === query || sn.includes(query);
      });

      if (!matched) {
        setCounterLookupResult({
          found: false,
          error: `No active pickup order found matching code "${query}". Please ask customer to check their Living Passport PIN.`
        });
        return;
      }

      // Check Store Authorization: ensure item belongs to current merchant store
      const currentStoreName = userStore?.name || 'Nike Lagos Flagship';
      const itemMerchant = matched.originalMerchant || matched.merchant || 'Nike Lagos Flagship';
      
      const isMyStore = itemMerchant.toLowerCase().trim() === currentStoreName.toLowerCase().trim() ||
                        currentStoreName.toLowerCase().includes('nike') && itemMerchant.toLowerCase().includes('nike');

      setCounterLookupResult({
        found: true,
        item: matched,
        isMyStore,
        currentStoreName,
        itemMerchant,
        payoutAddress: userStore?.ownerAddress || user?.address || '0x7f3411b93ef2d38e81c04910283f'
      });
    }, 400);
  };

  // 3. Merchant Store Counter: Confirm In-Store Handover & Release Escrow to Store Owner's Wallet
  const handleMerchantConfirmHandover = async () => {
    if (!counterLookupResult?.item) return;
    const item = counterLookupResult.item;

    setCounterChecking(true);

    try {
      // Execute handover update
      const updatedPassport = {
        ...item,
        currentState: 'COLLECTED',
        currentStateIndex: 4,
        custody: `Customer (${item.currentOwner || 'Buyer'})`,
        currentOwner: item.currentOwner || `Customer (${displayName})`,
        daysRemainingWarranty: item.daysRemainingWarranty || 365,
        lifecycleSteps: [
          { name: 'Listed', completed: true, date: item.purchaseTimestamp || 'Oct 5, 2026' },
          { name: 'Ordered', completed: true, date: item.purchaseTimestamp || 'Oct 7, 2026' },
          { name: 'Paid (Escrow)', completed: true, date: item.purchaseTimestamp || 'Oct 7, 2026' },
          { name: 'Handover', completed: true, date: 'Just now (In-Store Verified)' },
          { name: 'In Possession', completed: true, date: 'Just now' },
          { name: 'Warranty Active', completed: true, date: 'Active' }
        ]
      };

      const updateList = (list) => {
        return list.map(p => {
          if ((p.tokenId && p.tokenId === item.tokenId) || (p.serialNumber && p.serialNumber === item.serialNumber)) {
            return updatedPassport;
          }
          return p;
        });
      };

      const stored = JSON.parse(localStorage.getItem('hual_my_passports') || '[]');
      localStorage.setItem('hual_my_passports', JSON.stringify(updateList(stored)));

      if (userKey) {
        const userStored = JSON.parse(localStorage.getItem(`hual_my_passports_${userKey}`) || '[]');
        localStorage.setItem(`hual_my_passports_${userKey}`, JSON.stringify(updateList(userStored)));
      }
      if (user?.address) {
        const addrStored = JSON.parse(localStorage.getItem(`hual_my_passports_${user.address.toLowerCase()}`) || '[]');
        localStorage.setItem(`hual_my_passports_${user.address.toLowerCase()}`, JSON.stringify(updateList(addrStored)));
      }

      setCounterHandoverSuccess(true);
      if (onRefreshData) onRefreshData();

      setTimeout(() => {
        setCounterHandoverSuccess(false);
        setCounterLookupResult(null);
        setCounterCodeInput('');
      }, 3000);
    } catch (err) {
      console.error('Handover error:', err);
    } finally {
      setCounterChecking(false);
    }
  };

  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    if (!transferPassport) return;
    const isCollected = transferPassport.currentState === 'COLLECTED' || transferPassport.currentState === 'ACTIVE_OWNERSHIP' || transferPassport.currentState === 'DELIVERED' || transferPassport.currentState === 'COMPLETED' || transferPassport.currentState === 'OWNED' || Boolean(transferPassport.isCollected) || Boolean(transferPassport.isDelivered);
    if (!isCollected) {
      alert('This item is currently held in smart contract escrow and must be collected from the merchant before transferring ownership.');
      return;
    }
    if (!transferRecipient.trim()) {
      alert('Please enter a recipient handle or address.');
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem('hual_my_passports') || '[]');
      const updated = stored.filter(p => (p.tokenId !== transferPassport.tokenId && p.serialNumber !== transferPassport.serialNumber));
      localStorage.setItem('hual_my_passports', JSON.stringify(updated));

      if (userKey) {
        const userStored = JSON.parse(localStorage.getItem(`hual_my_passports_${userKey}`) || '[]');
        const updatedUser = userStored.filter(p => (p.tokenId !== transferPassport.tokenId && p.serialNumber !== transferPassport.serialNumber));
        localStorage.setItem(`hual_my_passports_${userKey}`, JSON.stringify(updatedUser));
      }
      if (user?.address) {
        const addrStored = JSON.parse(localStorage.getItem(`hual_my_passports_${user.address.toLowerCase()}`) || '[]');
        const updatedAddr = addrStored.filter(p => (p.tokenId !== transferPassport.tokenId && p.serialNumber !== transferPassport.serialNumber));
        localStorage.setItem(`hual_my_passports_${user.address.toLowerCase()}`, JSON.stringify(updatedAddr));
      }
    } catch (err) {
      console.warn('Transfer local update error:', err);
    }

    setTransferSuccess(true);
    setTimeout(() => {
      setTransferSuccess(false);
      setTransferPassport(null);
      setTransferRecipient('');
      if (onRefreshData) onRefreshData();
    }, 2000);
  };

  const handleExecuteResale = (e) => {
    e.preventDefault();
    if (!userStore && userRole !== 'merchant') {
      const p = resalePassport;
      setResalePassport(null);
      setPendingResalePassport(p);
      setStoreRequiredModalOpen(true);
      return;
    }

    const parsedPrice = parseFloat(resalePrice) || 200;
    const newResaleItem = {
      id: `rs-${Date.now()}`,
      tokenId: resalePassport?.tokenId || Math.floor(1000 + Math.random() * 9000),
      productName: resalePassport?.productName || 'Verified Product',
      originalPrice: parseFloat(resalePassport?.originalPriceUsd || resalePassport?.priceUsd) || 250,
      resalePrice: parsedPrice,
      condition: resaleCondition,
      description: resaleDescription,
      warrantyRemaining: 'Active Warranty Verified',
      image: resalePassport?.image || '/assets/air_max_95.jpg',
      status: 'Active on Marketplace',
      storeName: userStore?.name || 'Verified Storefront',
      createdAt: new Date().toISOString()
    };

    setMyResales(prev => {
      const updated = [newResaleItem, ...(prev || []).filter(x => x.tokenId !== newResaleItem.tokenId)];
      try {
        localStorage.setItem(`hual_user_resales_${userKey}`, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    try {
      const updatedPassports = effectivePassports.map(p => {
        if (p.tokenId === resalePassport?.tokenId || p.serialNumber === resalePassport?.serialNumber) {
          return { ...p, resaleActive: true, resalePrice: parsedPrice, resaleCondition: resaleCondition };
        }
        return p;
      });
      localStorage.setItem(`hual_user_passports_${userKey}`, JSON.stringify(updatedPassports));
    } catch (err) {
      console.warn('Error saving passport resale state:', err);
    }

    setResaleSuccess(true);
    setTimeout(() => {
      setResaleSuccess(false);
      setResalePassport(null);
      if (onRefreshData) onRefreshData();
    }, 1800);
  };

  const handleExecuteWarranty = (e) => {
    e.preventDefault();
    setWarrantySuccess(true);
    setTimeout(() => {
      setWarrantySuccess(false);
      setWarrantyPassport(null);
    }, 2200);
  };

  return (
    <div className="page-fade-in" style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '0 0 60px' }}>
      
      {/* Guest Explorer Mode Banner */}
      {isGuest && (
        <div style={{
          marginBottom: '24px',
          padding: '16px 22px',
          background: 'rgba(14, 24, 24, 0.75)',
          backdropFilter: 'blur(30px)',
          border: '1px solid var(--brand-green-border)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--brand-green-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-green)'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                Guest Explorer Profile
              </div>
              <div style={{ fontSize: '0.76rem', color: '#9CA3AF' }}>
                You are viewing sample digital Product Passports. Sign In with Privy anytime to sync onchain passports and Monad wallet.
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onNavigateToSignIn) onNavigateToSignIn();
            }}
            className="btn-pill-primary btn-pill-sm"
            style={{ padding: '8px 20px', fontWeight: 800, fontSize: '0.78rem' }}
          >
            Sign In with Privy
          </button>
        </div>
      )}

      {/* ================= 1. COMPACT PROFILE HEADER ================= */}
      <div className="perspective-container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* User Identity Card (Apple Liquid Glass) */}
        <div className="apple-liquid-glass-card card-reveal-left" style={{
          padding: '20px 22px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: profilePicture || user?.profilePicture ? 'transparent' : '#080F0F',
                    border: '2px solid var(--brand-green)',
                    color: 'var(--brand-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    boxShadow: '0 0 16px var(--brand-green-dim)',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  title="Click to change profile picture"
                >
                  {profilePicture || user?.profilePicture ? (
                    <img
                      src={profilePicture || user?.profilePicture}
                      alt={displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{displayInitial}</span>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--brand-green)',
                    border: '2px solid #080F0F',
                    color: '#080F0F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Upload picture"
                >
                  <Camera size={11} strokeWidth={2.5} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {displayName}
                  </h2>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: 'var(--brand-green-dim)',
                    color: 'var(--brand-green)',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    border: '1px solid var(--brand-green-border)'
                  }}>
                    <CheckCircle2 size={11} /> VERIFIED
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '0.76rem', color: '#9CA3AF' }}>
                  <span>{displayHandle}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>{userLocation}</span>
                  <button 
                    onClick={() => setEditLocationOpen(true)} 
                    style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '0.68rem', textDecoration: 'underline' }}
                  >
                    Change
                  </button>
                </div>

                {displayBio && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#9CA3AF', fontStyle: 'italic', maxWidth: '380px', lineHeight: 1.35 }}>
                    "{displayBio}"
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setEditProfileOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(132, 244, 59, 0.12)',
                  border: '1px solid rgba(132, 244, 59, 0.35)',
                  color: 'var(--brand-green)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Edit3 size={12} />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={logout}
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: '#162424',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9CA3AF',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Quick Account Info Pills */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '10px 12px',
            background: '#080F0F',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.74rem'
          }}>
            <div>
              <span style={{ color: '#6B7280', fontSize: '0.66rem', display: 'block' }}>Account Role</span>
              <strong style={{ color: '#FFFFFF' }}>{userRole === 'merchant' ? 'Store Owner' : 'Shopper'}</strong>
            </div>
            <div>
              <span style={{ color: '#6B7280', fontSize: '0.66rem', display: 'block' }}>Monad ID</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}>{shortAddr}</span>
                <button onClick={handleCopy} style={{ background: 'transparent', border: 'none', color: copied ? 'var(--brand-green)' : '#6B7280', cursor: 'pointer' }}>
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </div>
            </div>
            <div>
              <span style={{ color: '#6B7280', fontSize: '0.66rem', display: 'block' }}>Buyer Protection</span>
              <strong style={{ color: 'var(--brand-green)' }}>Active (Escrow)</strong>
            </div>
          </div>

          {/* Action Button */}
          {userRole === 'merchant' ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onOpenSellModal}
                className="btn-pill-primary btn-pill-sm"
                style={{ flex: 1, padding: '8px', fontSize: '0.78rem', fontWeight: 800 }}
              >
                <PlusCircle size={13} /> List Item (Sell)
              </button>
              <button
                onClick={() => onNavigateTab && onNavigateTab('shop')}
                className="btn-pill-secondary btn-pill-sm"
                style={{ flex: 1, padding: '8px', fontSize: '0.78rem' }}
              >
                <Store size={13} /> My Storefront
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreateStoreOpen(true)}
              className="btn-pill-primary btn-pill-sm"
              style={{ width: '100%', padding: '9px', fontSize: '0.78rem', fontWeight: 800 }}
            >
              <Store size={14} /> Create a Store to Sell Items
            </button>
          )}
        </div>

        {/* Balance Vault & Metrics Card (Apple Liquid Glass) */}
        <div className="apple-liquid-glass-card card-reveal-right" style={{
          padding: '20px 22px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--brand-green)',
                fontWeight: 800,
                marginBottom: '2px'
              }}>
                <Sparkles size={12} />
                <span>Available Shopping Balance</span>
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: '#FFFFFF',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '-0.02em',
                lineHeight: 1.1
              }}>
                {formatCurrency(usdcBalance)}
              </div>
            </div>

            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#080F0F',
              border: '1.5px solid var(--brand-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-green)',
              boxShadow: '0 0 14px var(--brand-green-dim)',
              flexShrink: 0
            }}>
              <Wallet size={18} />
            </div>
          </div>

          {/* 3 Metric counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{
              padding: '8px 6px',
              background: '#080F0F',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', fontFamily: "'JetBrains Mono', monospace" }}>
                {formatNumber(productsOwnedCount)}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#9CA3AF', fontWeight: 600 }}>Owned</div>
            </div>
            <div style={{
              padding: '8px 6px',
              background: '#080F0F',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', fontFamily: "'JetBrains Mono', monospace" }}>
                {formatNumber(transfersCount)}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#9CA3AF', fontWeight: 600 }}>Transfers</div>
            </div>
            <div style={{
              padding: '8px 6px',
              background: '#080F0F',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', fontFamily: "'JetBrains Mono', monospace" }}>
                {formatNumber(resalesCount)}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#9CA3AF', fontWeight: 600 }}>Resales</div>
            </div>
          </div>

          {/* Balance Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <button
              onClick={() => setDepositModalOpen(true)}
              className="btn-pill-secondary btn-pill-sm"
              style={{ padding: '8px', fontSize: '0.74rem', fontWeight: 700 }}
            >
              <QrCode size={13} color="var(--brand-green)" />
              <span>Deposit QR</span>
            </button>

            <button
              onClick={() => setSendModalOpen(true)}
              className="btn-pill-secondary btn-pill-sm"
              style={{ padding: '8px', fontSize: '0.74rem', fontWeight: 700 }}
            >
              <Send size={13} color="var(--brand-green)" />
              <span>Send Funds</span>
            </button>

            <button
              onClick={handleFaucet}
              disabled={fauceting}
              className="btn-pill-primary btn-pill-sm"
              style={{ padding: '8px', fontSize: '0.74rem', fontWeight: 800 }}
            >
              <RefreshCw size={13} className={fauceting ? 'animate-spin' : ''} />
              <span>{fauceting ? 'Adding...' : faucetSuccess ? '+$1k Added!' : '+Top-Up $1k'}</span>
            </button>

            <button
              onClick={handleExportWallet}
              className="btn-pill-secondary btn-pill-sm"
              style={{ padding: '8px', fontSize: '0.74rem', fontWeight: 700 }}
            >
              <Key size={13} color="var(--brand-green)" />
              <span>Export Key</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. SUB-NAVIGATION TABS ================= */}
      <div className="reveal-pop" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '28px',
        paddingBottom: '12px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'products', label: `My Passports (${effectivePassports.length})` },
          ...((userRole === 'merchant' || Boolean(userStore)) ? [{ id: 'counter', label: 'Store Counter (Verify Pickup)' }] : []),
          { id: 'wishlist', label: `Wishlist (${wishlist.length})` },
          { id: 'reviews', label: `My Reviews (${myReviews.length})` },
          { id: 'following', label: `Followed Stores (${followedStores.length})` },
          { id: 'transactions', label: `Transactions (${realTransactions.length})` },
          { id: 'transfers', label: 'Transfers (2)' },
          { id: 'resale', label: 'Resale (1)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              background: subTab === tab.id ? 'var(--brand-green)' : 'transparent',
              color: subTab === tab.id ? '#080F0F' : '#9CA3AF',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: subTab === tab.id ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= 3. OVERVIEW TAB CONTENT ================= */}
      {subTab === 'overview' && (
        <div className="perspective-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start', position: 'relative', zIndex: 2 }}>
          
          {/* Left Column: Recent Activity & Quick Actions */}
          <div className="card-reveal-left" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 2 }}>
            {/* Recent Activity Card */}
            <div style={{
              background: '#0E1717',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    Recent Activity
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Onchain purchases, transfers & resales</span>
                </div>
                <span 
                  onClick={() => setSubTab('transactions')}
                  style={{ fontSize: '0.76rem', color: 'var(--brand-green)', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
                >
                  View All
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentActivity.length === 0 ? (
                  <div style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '14px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                  }}>
                    <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#9CA3AF' }}>
                      No recent transactions yet. Your onchain purchases and warranty settlements will appear here.
                    </p>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('shop')}
                      className="btn-pill-primary btn-pill-sm"
                      style={{ fontSize: '0.74rem', padding: '6px 14px' }}
                    >
                      Explore Marketplace
                    </button>
                  </div>
                ) : (
                  recentActivity.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: '#121C1C',
                          overflow: 'hidden',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.12)'
                        }}>
                          <img src={act.image} alt={act.productName} style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
                        </div>

                        <div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
                            {act.productName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>
                            {act.type === 'PURCHASE' ? `Purchased • ${act.merchant}` : act.type === 'TRANSFER' ? `Transferred • ${act.recipient}` : `Resold • ${act.buyer || 'Tunde'}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {act.amountUsd && (
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: act.type === 'RESALE' ? 'var(--brand-green)' : '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                            {formatCurrency(act.amountUsd)}
                          </div>
                        )}
                        <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '2px' }}>{act.date}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Passport Quick Actions Hub */}
            <div style={{
              background: '#0E1717',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--brand-green)" />
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    Passport Management Hub
                  </h3>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--brand-green)', fontWeight: 700 }}>Monad Testnet</span>
              </div>

              {(() => {
                const hubPassport = effectivePassports[0] || INITIAL_FEATURED_PASSPORT;
                const hubIsDeliveredOrCollected = 
                  hubPassport?.currentState === 'COLLECTED' || 
                  hubPassport?.currentState === 'ACTIVE_OWNERSHIP' || 
                  hubPassport?.currentState === 'DELIVERED' || 
                  hubPassport?.currentState === 'COMPLETED' || 
                  hubPassport?.currentState === 'OWNED' || 
                  Boolean(hubPassport?.isCollected) || 
                  Boolean(hubPassport?.isDelivered);
                const hubIsCancelled = hubPassport?.isCancelled || hubPassport?.currentState === 'CANCELLED' || hubPassport?.currentState === 'REFUNDED';

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <button
                      onClick={() => setTransferPassport(hubPassport)}
                      className="btn-pill-secondary btn-pill-sm"
                      style={{ padding: '10px 12px', justifyContent: 'flex-start', gap: '8px', fontSize: '0.78rem' }}
                    >
                      <Send size={14} color="var(--brand-green)" />
                      <span>Transfer Item</span>
                    </button>

                    <button
                      onClick={() => handleInitiateResale(hubPassport)}
                      className="btn-pill-secondary btn-pill-sm"
                      style={{ padding: '10px 12px', justifyContent: 'flex-start', gap: '8px', fontSize: '0.78rem' }}
                    >
                      <Tag size={14} color="var(--brand-green)" />
                      <span>List for Resale</span>
                    </button>

                    <button
                      onClick={() => setWarrantyPassport(hubPassport)}
                      className="btn-pill-secondary btn-pill-sm"
                      style={{ padding: '10px 12px', justifyContent: 'flex-start', gap: '8px', fontSize: '0.78rem' }}
                    >
                      <Wrench size={14} color="var(--brand-green)" />
                      <span>Claim Warranty</span>
                    </button>

                    <button
                      onClick={() => setPickupPassport(hubPassport)}
                      className="btn-pill-secondary btn-pill-sm"
                      style={{ padding: '10px 12px', justifyContent: 'flex-start', gap: '8px', fontSize: '0.78rem' }}
                    >
                      <QrCode size={14} color="var(--brand-green)" />
                      <span>Pickup QR Pass</span>
                    </button>

                    {/* Escrow Cancel & Refund Shortcut or Verified Active Status */}
                    {(!hubIsDeliveredOrCollected && !hubIsCancelled) ? (
                      <button
                        onClick={() => setCancelOrderPassport(hubPassport)}
                        className="btn-pill-secondary btn-pill-sm"
                        style={{ 
                          gridColumn: 'span 2',
                          padding: '10px 12px', 
                          justifyContent: 'center', 
                          gap: '8px', 
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#F87171',
                          borderColor: 'rgba(239, 68, 68, 0.4)',
                          background: 'rgba(239, 68, 68, 0.08)'
                        }}
                        title="Cancel order and instantly refund escrow to your wallet"
                      >
                        <RotateCcw size={14} color="#EF4444" />
                        <span>Cancel Order & Refund Escrow</span>
                      </button>
                    ) : (
                      <div style={{
                        gridColumn: 'span 2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        borderRadius: '999px',
                        background: 'rgba(132, 244, 59, 0.08)',
                        border: '1px solid rgba(132, 244, 59, 0.25)',
                        color: 'var(--brand-green)',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        <CheckCircle2 size={13} color="var(--brand-green)" />
                        <span>Verified Living Asset • Ownership Active</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Linked Identities & Socials Card (Privy Auth) */}
            <div style={{
              background: '#0E1717',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="var(--brand-green)" />
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    Linked Accounts & Security
                  </h3>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>
                  Privy Embedded Security
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'google', label: 'Google Account', isLinked: activeUser?.provider === 'google' || activeUser?.linkedAccounts?.google, action: linkGoogle },
                  { key: 'email', label: 'Email Address', isLinked: Boolean(activeUser?.email), action: linkEmail },
                  { key: 'sms', label: 'Phone SMS', isLinked: Boolean(activeUser?.linkedAccounts?.sms), action: linkPhone },
                  { key: 'discord', label: 'Discord', isLinked: Boolean(activeUser?.linkedAccounts?.discord), action: linkDiscord },
                  { key: 'twitter', label: 'X / Twitter', isLinked: Boolean(activeUser?.linkedAccounts?.twitter), action: linkTwitter },
                ].map((acc) => (
                  <div
                    key={acc.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 600 }}>
                      {acc.label}
                    </span>

                    {acc.isLinked ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.7rem',
                        color: 'var(--brand-green)',
                        fontWeight: 700
                      }}>
                        <Check size={12} /> Linked
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            if (acc.action) await acc.action();
                          } catch (e) {
                            console.warn('Link account error:', e);
                          }
                        }}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#FFFFFF',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Link
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Featured Living Passport & Store/Vault Hubs */}
          <div className="card-reveal-right" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 2 }}>
            {/* Featured Living Passport Card with Sneaker / Tech / Luxury Photo */}
            {(() => {
              if (effectivePassports.length === 0) {
                return (
                  <div style={{
                    background: '#0E1717',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '36px 24px',
                    textAlign: 'center',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
                  }}>
                    <ShieldCheck size={36} color="var(--brand-green)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
                    <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
                      Passport Vault is Empty
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '0 auto 18px', maxWidth: '300px', lineHeight: 1.4 }}>
                      All items have been settled or removed. Purchase verified luxury goods to mint living product passports.
                    </p>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('shop')}
                      className="btn-pill-primary btn-pill-sm"
                      style={{ padding: '8px 20px', fontWeight: 800 }}
                    >
                      Explore Marketplace
                    </button>
                  </div>
                );
              }

              const activeFeatured = effectivePassports[0];
              const isCollected = 
                activeFeatured.currentState === 'COLLECTED' || 
                activeFeatured.currentState === 'ACTIVE_OWNERSHIP' ||
                activeFeatured.currentState === 'DELIVERED' ||
                activeFeatured.currentState === 'COMPLETED' ||
                activeFeatured.currentState === 'OWNED' ||
                Boolean(activeFeatured.isCollected) ||
                Boolean(activeFeatured.isDelivered);
              const fName = activeFeatured.productName || activeFeatured.name || 'Verified Luxury Asset';
              const fBrand = activeFeatured.productBrand || activeFeatured.brand || 'Authentic Brand';
              const fSerial = activeFeatured.serialNumber || `SN-HUAL-${activeFeatured.tokenId || '4821'}`;
              const fImage = activeFeatured.imageUri || '/assets/air_max_95.jpg';
              const fMerchant = activeFeatured.originalMerchant || activeFeatured.merchant || 'Nike Lagos Flagship';
              const fLocation = activeFeatured.merchantLocation || 'Victoria Island, Lagos';
              const fPrice = activeFeatured.originalPriceUsd || activeFeatured.priceUsd || 250.00;
              const fTxRef = activeFeatured.paymentTxRef || '0x7f34...8f2e';
              const fShortTx = fTxRef.startsWith('0x') ? `${fTxRef.slice(0, 6)}...${fTxRef.slice(-4)}` : fTxRef;
              const fDays = activeFeatured.daysRemainingWarranty !== undefined ? activeFeatured.daysRemainingWarranty : 365;
              const fExpiry = activeFeatured.warrantyExpiresAt || 'Oct 7, 2027';

              return (
                <div style={{
                  background: '#0E1717',
                  border: isCollected ? '1px solid rgba(132, 244, 59, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(132, 244, 59, 0.1)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: isCollected ? 'var(--brand-green)' : '#F59E0B', fontWeight: 800, letterSpacing: '0.06em' }}>
                        FEATURED LIVING PASSPORT
                      </span>
                      <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0' }}>
                        {fName} (#{fSerial})
                      </h3>
                    </div>
                    <span style={{
                      background: isCollected ? 'var(--brand-green-dim)' : 'rgba(245, 158, 11, 0.15)',
                      color: isCollected ? 'var(--brand-green)' : '#F59E0B',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      border: isCollected ? '1px solid var(--brand-green-border)' : '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      {isCollected ? 'VERIFIED IN HAND (OWNED)' : (activeFeatured.deliveryMethod === 'dispatch' || activeFeatured.deliveryMethod === 'delivery' || activeFeatured.currentState === 'IN_TRANSIT') ? 'IN TRANSIT (COURIER DISPATCHED)' : 'LOCKED IN ESCROW (PENDING PICKUP)'}
                    </span>
                  </div>

                  {/* Product Preview Image & Specs */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    gap: '16px',
                    padding: '14px',
                    background: '#080F0F',
                    borderRadius: '16px',
                    marginBottom: '18px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{
                      height: '110px',
                      background: '#121C1C',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      padding: '6px'
                    }}>
                      <img src={fImage} alt={fName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.76rem' }}>
                      <div>
                        <span style={{ color: '#6B7280', display: 'block', fontSize: '0.68rem' }}>Original Merchant</span>
                        <strong style={{ color: '#FFFFFF' }}>{fMerchant}</strong>
                        <span style={{ fontSize: '0.65rem', color: '#9CA3AF', display: 'block' }}>{fLocation}</span>
                      </div>
                      <div>
                        <span style={{ color: '#6B7280', display: 'block', fontSize: '0.68rem' }}>Current Custody / Owner</span>
                        <strong style={{ color: isCollected ? 'var(--brand-green)' : '#F59E0B' }}>
                          {isCollected ? `You (${displayName})` : 'Smart Contract Escrow'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#6B7280', display: 'block', fontSize: '0.68rem' }}>Monad Tx Ref</span>
                        <a
                          href={fTxRef.startsWith('0x') ? `https://testnet.monadexplorer.com/tx/${fTxRef}` : '#'}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--brand-green)', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}
                        >
                          {fShortTx}
                        </a>
                      </div>
                      <div>
                        <span style={{ color: '#6B7280', display: 'block', fontSize: '0.68rem' }}>Original Price</span>
                        <strong style={{ color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(fPrice)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Lifecycle Progress Bar */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, marginBottom: '10px' }}>
                      Product Lifecycle
                    </div>

                    {/* Progress Line */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        right: '10px',
                        height: '2px',
                        background: isCollected ? 'var(--brand-green)' : 'rgba(255, 255, 255, 0.12)',
                        zIndex: 0
                      }} />

                      {[
                        { step: 'Listed', completed: true },
                        { step: 'Ordered', completed: true },
                        { step: 'Paid (Escrow)', completed: true },
                        { step: 'Handover', completed: isCollected },
                        { step: 'In Possession', completed: isCollected },
                        { step: 'Warranty Active', completed: isCollected }
                      ].map((item, idx) => (
                        <div key={idx} style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: item.completed ? 'var(--brand-green)' : '#080F0F',
                            border: item.completed ? '2px solid var(--brand-green)' : '2px solid rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: item.completed ? '#080F0F' : '#6B7280',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            marginBottom: '4px'
                          }}>
                            {item.completed ? <Check size={9} strokeWidth={3} /> : <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#6B7280' }} />}
                          </div>
                          <span style={{ fontSize: '0.64rem', color: item.completed ? '#D1D5DB' : '#6B7280', whiteSpace: 'nowrap' }}>
                            {item.step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warranty Active Card with View Details */}
                  <div style={{
                    padding: '12px 14px',
                    background: isCollected ? 'rgba(132, 244, 59, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border: isCollected ? '1px solid var(--brand-green-border)' : '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={16} color={isCollected ? 'var(--brand-green)' : '#F59E0B'} />
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isCollected ? 'var(--brand-green)' : '#F59E0B' }}>
                          {isCollected ? `Warranty Active (${fDays} days remaining)` : 'Warranty Protected in Escrow (Activates upon Handover)'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>Expires {fExpiry} • Backed by {fBrand} Authorized Service</div>
                      </div>
                    </div>
                    {isCollected && (
                      <button
                        onClick={() => setWarrantyPassport(activeFeatured)}
                        style={{ background: 'none', border: 'none', color: 'var(--brand-green)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        View Details →
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {activeFeatured.currentState === 'REFUNDED' ? (
                      <div style={{
                        gridColumn: 'span 2',
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px 14px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        color: '#FCA5A5',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                          <XCircle size={15} color="#EF4444" />
                          <span>Order Cancelled & Refunded</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--brand-green)', fontWeight: 800 }}>
                            +{formatCurrency(activeFeatured.originalPriceUsd || 250)} USDC
                          </span>
                          <button
                            onClick={() => handleDeletePassport(activeFeatured)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '999px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid #EF4444',
                              color: '#FFFFFF',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#EF4444'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                            title="Delete this cancelled order record"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ) : !isCollected ? (
                      <>
                        {activeFeatured.deliveryMethod === 'dispatch' || activeFeatured.deliveryMethod === 'delivery' || activeFeatured.currentState === 'IN_TRANSIT' ? (
                          <button
                            onClick={() => {
                              setConfirmCourierPassport(activeFeatured);
                              setConfirmCourierSuccess(false);
                            }}
                            className="btn-pill-primary btn-pill-sm"
                            style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}
                          >
                            <Truck size={14} />
                            <span>Confirm Courier</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setPickupPassport(activeFeatured)}
                            className="btn-pill-primary btn-pill-sm"
                            style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}
                          >
                            <QrCode size={14} />
                            <span>Pickup Pass & PIN</span>
                          </button>
                        )}

                        <button
                          onClick={() => setCancelOrderPassport(activeFeatured)}
                          className="btn-pill-secondary btn-pill-sm"
                          style={{
                            width: '100%',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#F87171',
                            borderColor: 'rgba(239, 68, 68, 0.45)',
                            background: 'rgba(239, 68, 68, 0.1)'
                          }}
                          title="Cancel order and instantly refund USDC to your wallet"
                        >
                          <RotateCcw size={14} />
                          <span>Cancel Order</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setTransferPassport(activeFeatured)}
                          className="btn-pill-primary btn-pill-sm"
                          style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}
                        >
                          <Send size={14} />
                          <span>Transfer Ownership</span>
                        </button>

                        <button
                          onClick={() => setWarrantyPassport(activeFeatured)}
                          className="btn-pill-secondary btn-pill-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <Wrench size={14} color="var(--brand-green)" />
                          <span>Claim Warranty</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Merchant Storefront Hub Card (If store owner) */}
            {userRole === 'merchant' || userStore ? (
              <div style={{
                background: 'rgba(14, 22, 22, 0.65)',
                backdropFilter: 'blur(36px)',
                WebkitBackdropFilter: 'blur(36px)',
                border: '1px solid var(--brand-green-border)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 0 25px rgba(132, 244, 59, 0.1)',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Store size={18} color="var(--brand-green)" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      My Merchant Storefront
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: 'var(--brand-green-dim)', color: 'var(--brand-green)', border: '1px solid var(--brand-green-border)' }}>
                    ACTIVE STORE
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid var(--brand-green)', background: '#080F0F', flexShrink: 0 }}>
                    <img src={userStore?.avatar || profilePicture || '/assets/air_max_95.jpg'} alt="Store Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {userStore?.name || `${displayName}'s Flagship`}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {userStore?.handle || `@${displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}.hual`} • {userStore?.location || userLocation}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '10px', background: '#080F0F', borderRadius: '12px', textAlign: 'center', marginBottom: '16px', fontSize: '0.74rem' }}>
                  <div>
                    <div style={{ color: '#6B7280', fontSize: '0.66rem' }}>Rating</div>
                    <div style={{ color: 'var(--brand-green)', fontWeight: 800 }}>5.0 / 5.0</div>
                  </div>
                  <div>
                    <div style={{ color: '#6B7280', fontSize: '0.66rem' }}>Active Goods</div>
                    <div style={{ color: '#FFFFFF', fontWeight: 800 }}>{passports.length || 3} items</div>
                  </div>
                  <div>
                    <div style={{ color: '#6B7280', fontSize: '0.66rem' }}>Settlement</div>
                    <div style={{ color: 'var(--brand-green)', fontWeight: 800 }}>Instant</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                  <button
                    onClick={() => {
                      if (onOpenStore && userStore) {
                        onOpenStore(userStore);
                      }
                    }}
                    className="btn-pill-secondary btn-pill-sm"
                    style={{ padding: '8px', fontSize: '0.76rem', color: 'var(--brand-green)', borderColor: 'rgba(57, 255, 20, 0.4)', fontWeight: 700 }}
                    title="View and edit your store page"
                  >
                    <Store size={13} />
                    <span>View Store Page</span>
                  </button>
                  <button
                    onClick={() => setSubTab('counter')}
                    className="btn-pill-primary btn-pill-sm"
                    style={{ padding: '8px', fontSize: '0.76rem', fontWeight: 800 }}
                  >
                    <QrCode size={13} />
                    <span>Store Counter</span>
                  </button>
                  <button
                    onClick={onOpenSellModal}
                    className="btn-pill-secondary btn-pill-sm"
                    style={{ padding: '8px', fontSize: '0.76rem' }}
                  >
                    <PlusCircle size={13} />
                    <span>List Item</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                background: '#0D1616',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '20px',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <ShieldCheck size={18} color="var(--brand-green)" />
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    Monad Smart Escrow Protection
                  </h3>
                </div>
                <p style={{ fontSize: '0.76rem', color: '#9CA3AF', margin: '0 0 14px', lineHeight: 1.4 }}>
                  All orders are held in verifiable smart contract escrow. Funds are only settled to merchants once in-store pickup or physical courier receipt is verified.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setCreateStoreOpen(true)}
                    className="btn-pill-primary btn-pill-sm"
                    style={{ width: '100%', padding: '9px', fontSize: '0.78rem', fontWeight: 800 }}
                  >
                    <Store size={14} />
                    <span>Open Merchant Store</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= 4. MY PRODUCTS TAB CONTENT ================= */}
      {subTab === 'products' && (
        <div style={{ marginTop: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Living Product Passports ({effectivePassports.length})
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>
                Verifiable proof of physical ownership & manufacturer warranties
              </span>
              <button
                onClick={() => onOpenAiSupport && onOpenAiSupport()}
                className="btn-pill-secondary btn-pill-sm"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.74rem',
                  color: 'var(--brand-green)',
                  borderColor: 'rgba(132, 244, 59, 0.35)',
                  background: 'rgba(132, 244, 59, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Chat with Groq AI Support Companion about your orders"
              >
                <Bot size={13} color="var(--brand-green)" />
                <span>AI Support</span>
              </button>
            </div>
          </div>

          <div 
            className="stagger-group perspective-container"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '18px', width: '100%', boxSizing: 'border-box' }}
          >
            {effectivePassports.map((p) => {
              const isCollected = 
                p.currentState === 'COLLECTED' || 
                p.currentState === 'ACTIVE_OWNERSHIP' ||
                p.currentState === 'DELIVERED' ||
                p.currentState === 'COMPLETED' ||
                p.currentState === 'OWNED' ||
                Boolean(p.isCollected) ||
                Boolean(p.isDelivered);
              const isDispatched = p.deliveryMethod === 'dispatch' || p.deliveryMethod === 'delivery' || p.currentState === 'IN_TRANSIT';
              const pImage = p.imageUri || '/assets/air_max_95.jpg';
              const pMerchant = p.originalMerchant || p.merchant || 'Nike Lagos Flagship';
              const pTx = p.paymentTxRef || '0x7f34...8f2e';
              const pShortTx = pTx.startsWith('0x') ? `${pTx.slice(0, 6)}...${pTx.slice(-4)}` : pTx;

              return (
                <div
                  key={p.tokenId || p.serialNumber}
                  className="liquid-glass-card"
                  style={{
                    background: '#0E1717',
                    border: isCollected ? '1px solid rgba(132, 244, 59, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '20px',
                    padding: '18px',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(132, 244, 59, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    minWidth: 0
                  }}
                >
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    {/* Header Row: Status Badge & Serial */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px', minWidth: 0 }}>
                      <span style={{
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: isCollected ? 'var(--brand-green-dim)' : isDispatched ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isCollected ? 'var(--brand-green)' : isDispatched ? '#60A5FA' : '#F59E0B',
                        border: isCollected ? '1px solid var(--brand-green-border)' : isDispatched ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {isCollected ? 'VERIFIED IN HAND' : isDispatched ? 'IN TRANSIT (DISPATCHED)' : 'LOCKED IN ESCROW'}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                        {p.serialNumber}
                      </span>
                    </div>

                    {/* Middle: Image Frame + Info Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '76px 1fr',
                      gap: '12px',
                      padding: '10px',
                      background: '#080F0F',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      alignItems: 'center',
                      minWidth: 0,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: '76px',
                        height: '76px',
                        background: '#121C1C',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: '3px',
                        flexShrink: 0
                      }}>
                        <img src={pImage} alt={p.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px', fontSize: '0.74rem', minWidth: 0, overflow: 'hidden' }}>
                        <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.productName}
                        </h4>
                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.productBrand} • Token #{p.tokenId}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', minWidth: 0 }}>
                          <span style={{ color: '#6B7280', fontSize: '0.66rem' }}>Merchant:</span>
                          <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{pMerchant}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', minWidth: 0 }}>
                          <span style={{ color: '#6B7280', fontSize: '0.66rem' }}>Price:</span>
                          <span style={{ color: 'var(--brand-green)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                            {formatCurrency(p.originalPriceUsd)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mini Spec & Warranty Row */}
                    <div style={{
                      padding: '7px 10px',
                      background: '#080F0F',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      minWidth: 0,
                      overflow: 'hidden'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, overflow: 'hidden' }}>
                        <ShieldCheck size={12} color={isCollected ? 'var(--brand-green)' : '#F59E0B'} style={{ flexShrink: 0 }} />
                        <span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>Warranty:</span>
                        <strong style={{ color: isCollected ? 'var(--brand-green)' : '#F59E0B', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                          {isCollected ? `${p.daysRemainingWarranty || 365}d Active` : 'In Escrow'}
                        </strong>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <a
                          href={pTx.startsWith('0x') ? `https://testnet.monadexplorer.com/tx/${pTx}` : '#'}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--brand-green)', fontFamily: 'var(--font-mono)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.66rem' }}
                        >
                          <span>{pShortTx}</span>
                          <ExternalLink size={9} />
                        </a>
                      </div>
                    </div>

                    {/* Compact Lifecycle Progress Line */}
                    <div style={{ marginBottom: '12px', padding: '8px 10px', background: '#080F0F', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)', boxSizing: 'border-box', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700 }}>
                          Product Lifecycle
                        </span>
                        <span style={{ fontSize: '0.62rem', color: isCollected ? 'var(--brand-green)' : '#F59E0B', fontWeight: 700 }}>
                          {isCollected ? 'Verified in Hand' : 'Escrow Protected'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          left: '4px',
                          right: '4px',
                          height: '2px',
                          background: isCollected ? 'var(--brand-green)' : 'rgba(255, 255, 255, 0.12)',
                          zIndex: 0
                        }} />
                        {[
                          { label: 'Listed', done: true },
                          { label: 'Ordered', done: true },
                          { label: 'Escrow', done: true },
                          { label: isDispatched ? 'Courier' : 'Pickup', done: isCollected },
                          { label: 'Owned', done: isCollected }
                        ].map((st, sIdx) => (
                          <div key={sIdx} style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: '13px',
                              height: '13px',
                              borderRadius: '50%',
                              background: st.done ? 'var(--brand-green)' : '#080F0F',
                              border: st.done ? '1.5px solid var(--brand-green)' : '1.5px solid rgba(255, 255, 255, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: st.done ? '#080F0F' : '#6B7280',
                              fontSize: '0.5rem',
                              fontWeight: 800,
                              marginBottom: '2px'
                            }}>
                              {st.done ? <Check size={6} strokeWidth={3} /> : <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#6B7280' }} />}
                            </div>
                            <span style={{ fontSize: '0.56rem', color: st.done ? '#D1D5DB' : '#6B7280' }}>
                              {st.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid (Zero Overflow Flex) */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', width: '100%', boxSizing: 'border-box' }}>
                    {p.currentState === 'REFUNDED' ? (
                      <div style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.72rem',
                        color: '#FCA5A5',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                          <XCircle size={14} color="#EF4444" />
                          <span>Order Cancelled & Refunded</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--brand-green)', fontWeight: 800 }}>
                            +{formatCurrency(p.originalPriceUsd)} USDC
                          </span>
                          <button
                            onClick={() => onOpenAiSupport && onOpenAiSupport(p)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              background: 'rgba(132, 244, 59, 0.12)',
                              border: '1px solid rgba(132, 244, 59, 0.35)',
                              color: 'var(--brand-green)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            title="Ask AI support about this refunded order"
                          >
                            <Bot size={12} color="var(--brand-green)" />
                            <span>Support</span>
                          </button>
                          <button
                            onClick={() => handleDeletePassport(p)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              background: 'rgba(239, 68, 68, 0.18)',
                              border: '1px solid #EF4444',
                              color: '#FFFFFF',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#EF4444'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'}
                            title="Delete this cancelled order record"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ) : !isCollected ? (
                      <>
                        {isDispatched ? (
                          <button
                            onClick={() => {
                              setConfirmCourierPassport(p);
                              setConfirmCourierSuccess(false);
                            }}
                            className="btn-pill-primary btn-pill-sm"
                            style={{ flex: '1 1 130px', fontSize: '0.72rem', padding: '7px 8px', fontWeight: 800, justifyContent: 'center' }}
                            title="Confirm courier delivery receipt"
                          >
                            <Truck size={12} />
                            <span>Confirm Receipt</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setPickupPassport(p)}
                            className="btn-pill-primary btn-pill-sm"
                            style={{ flex: '1 1 120px', fontSize: '0.72rem', padding: '7px 8px', fontWeight: 800, justifyContent: 'center' }}
                          >
                            <QrCode size={12} />
                            <span>Pickup Pass</span>
                          </button>
                        )}
                        <button
                          onClick={() => setCancelOrderPassport(p)}
                          className="btn-pill-secondary btn-pill-sm"
                          style={{
                            flex: '1 1 95px',
                            fontSize: '0.72rem',
                            padding: '7px 8px',
                            justifyContent: 'center',
                            color: '#F87171',
                            borderColor: 'rgba(239, 68, 68, 0.35)',
                            background: 'rgba(239, 68, 68, 0.08)'
                          }}
                          title="Cancel order and refund escrow"
                        >
                          <RotateCcw size={11} />
                          <span>Cancel Order</span>
                        </button>
                        <button
                          onClick={() => onOpenAiSupport && onOpenAiSupport(p)}
                          className="btn-pill-secondary btn-pill-sm"
                          style={{
                            flex: '1 1 80px',
                            fontSize: '0.72rem',
                            padding: '7px 8px',
                            justifyContent: 'center',
                            color: 'var(--brand-green)',
                            borderColor: 'rgba(132, 244, 59, 0.35)',
                            background: 'rgba(132, 244, 59, 0.08)'
                          }}
                          title="Ask AI Support about this order, PIN code, or escrow"
                        >
                          <Bot size={11} color="var(--brand-green)" />
                          <span>Support</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setTransferPassport(p)}
                          className="btn-pill-primary btn-pill-sm"
                          style={{ flex: '1 1 80px', fontSize: '0.72rem', padding: '6px 4px', fontWeight: 800, justifyContent: 'center' }}
                          title="Transfer ownership certificate on Monad"
                        >
                          <Send size={11} />
                          <span>Transfer</span>
                        </button>
                        <button
                          onClick={() => setWarrantyPassport(p)}
                          className="btn-pill-secondary btn-pill-sm"
                          style={{ flex: '1 1 80px', fontSize: '0.72rem', padding: '6px 4px', justifyContent: 'center' }}
                          title="Claim manufacturer warranty"
                        >
                          <Wrench size={11} color="var(--brand-green)" />
                          <span>Warranty</span>
                        </button>
                        <button
                          onClick={() => handleInitiateResale(p)}
                          className="btn-pill-secondary btn-pill-sm"
                          style={{ flex: '1 1 70px', fontSize: '0.72rem', padding: '6px 4px', justifyContent: 'center' }}
                          title="List on secondary marketplace"
                        >
                          <Tag size={11} color="var(--brand-green)" />
                          <span>Resell</span>
                        </button>
                        <button
                          onClick={() => onOpenAiSupport && onOpenAiSupport(p)}
                          className="btn-pill-secondary btn-pill-sm"
                          style={{
                            flex: '1 1 70px',
                            fontSize: '0.72rem',
                            padding: '6px 4px',
                            justifyContent: 'center',
                            color: 'var(--brand-green)',
                            borderColor: 'rgba(132, 244, 59, 0.35)',
                            background: 'rgba(132, 244, 59, 0.08)'
                          }}
                          title="Contact AI support regarding this order"
                        >
                          <Bot size={11} color="var(--brand-green)" />
                          <span>Support</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= 4.6 STORE COUNTER & PICKUP VERIFICATION (MERCHANT SECTION) ================= */}
      {subTab === 'counter' && (
        !(userRole === 'merchant' || Boolean(userStore)) ? (
          <div style={{ marginTop: '20px', padding: '50px 24px', background: '#0D1616', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
            <Store size={42} color="var(--brand-green)" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
              Merchant Store Counter
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#9CA3AF', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              The Store Counter and In-Store Handover verification portal is exclusively reserved for registered merchants who have created a store and are selling items.
            </p>
            <button
              onClick={() => setCreateStoreOpen(true)}
              className="btn-pill-primary"
              style={{ padding: '12px 28px', fontWeight: 800, fontSize: '0.88rem' }}
            >
              Open a Merchant Store
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
          <div style={{
            background: '#0D1616',
            border: '1px solid rgba(132, 244, 59, 0.3)',
            borderRadius: '24px',
            padding: '28px',
            marginBottom: '24px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(132, 244, 59, 0.08)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--brand-green-dim)', border: '1px solid var(--brand-green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={20} color="var(--brand-green)" />
                </div>
                <div>
                  <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    Store Counter & Code Verification
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                    Active Store: <strong style={{ color: '#FFFFFF' }}>{userStore?.name || 'Nike Lagos Flagship'}</strong> • Owner Payout Wallet: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>{(userStore?.ownerAddress || user?.address || '0x7f3411b93ef2d38e81c04910283f').slice(0, 10)}...</span>
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: '999px', background: 'var(--brand-green-dim)', color: 'var(--brand-green)', border: '1px solid var(--brand-green-border)' }}>
                MERCHANT SETTLEMENT PORTAL
              </span>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#9CA3AF', margin: '0 0 20px', lineHeight: 1.5 }}>
              When a customer arrives in-store to collect their purchased item, ask them to show their Living Passport QR code or 4-digit PIN. Enter the PIN or item token number below to verify authorization, execute the handover, and release escrow funds directly to your store owner's wallet.
            </p>

            {/* Code Input Form */}
            <form onSubmit={handleLookupCounterCode} style={{ display: 'flex', gap: '10px', maxWidth: '560px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Enter Customer 4-Digit PIN or Token # (e.g. 7392 or 4821)"
                value={counterCodeInput}
                onChange={(e) => setCounterCodeInput(e.target.value)}
                style={{
                  flex: '1 1 280px',
                  padding: '12px 16px',
                  background: '#080F0F',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={counterChecking || !counterCodeInput.trim()}
                className="btn-pill-primary"
                style={{ padding: '0 24px', fontWeight: 800, fontSize: '0.86rem', height: '46px' }}
              >
                {counterChecking ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            {/* Verification Results Box */}
            {counterLookupResult && (
              <div style={{
                padding: '20px',
                background: counterLookupResult.found && counterLookupResult.isMyStore
                  ? 'rgba(132, 244, 59, 0.06)'
                  : counterLookupResult.found && !counterLookupResult.isMyStore
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(245, 158, 11, 0.08)',
                border: counterLookupResult.found && counterLookupResult.isMyStore
                  ? '1px solid var(--brand-green-border)'
                  : counterLookupResult.found && !counterLookupResult.isMyStore
                    ? '1px solid rgba(239, 68, 68, 0.35)'
                    : '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '16px',
                marginTop: '10px',
                boxSizing: 'border-box'
              }}>
                {counterLookupResult.found ? (
                  counterLookupResult.isMyStore ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-green)', fontWeight: 800, fontSize: '0.92rem', marginBottom: '14px' }}>
                        <CheckCircle2 size={18} />
                        <span>Order Verified & Authorized for {counterLookupResult.currentStoreName}!</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px', padding: '14px', background: '#080F0F', borderRadius: '14px', marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.06)', alignItems: 'center' }}>
                        <div style={{ height: '80px', borderRadius: '10px', background: '#121C1C', overflow: 'hidden', padding: '4px' }}>
                          <img src={counterLookupResult.item.imageUri || '/assets/air_max_95.jpg'} alt={counterLookupResult.item.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                            {counterLookupResult.item.productName}
                          </h4>
                          <div style={{ color: '#9CA3AF' }}>{counterLookupResult.item.productBrand} • Serial: {counterLookupResult.item.serialNumber}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ color: '#6B7280' }}>Escrow Value:</span>
                            <strong style={{ color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>${counterLookupResult.item.originalPriceUsd || 250.00} USDC</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6B7280' }}>Payout Destination:</span>
                            <span style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>{counterLookupResult.payoutAddress.slice(0, 10)}... (Store Owner Wallet)</span>
                          </div>
                        </div>
                      </div>

                      {counterHandoverSuccess ? (
                        <div style={{ padding: '14px', background: 'var(--brand-green-dim)', borderRadius: '12px', border: '1px solid var(--brand-green-border)', color: 'var(--brand-green)', fontSize: '0.88rem', fontWeight: 800, textAlign: 'center' }}>
                          <CheckCircle2 size={24} style={{ margin: '0 auto 6px' }} />
                          <div>Handover Complete! ${counterLookupResult.item.originalPriceUsd || 250.00} USDC escrow funds settled to your merchant wallet.</div>
                        </div>
                      ) : (
                        <button
                          onClick={handleMerchantConfirmHandover}
                          className="btn-pill-primary"
                          style={{ width: '100%', padding: '12px', fontWeight: 800, fontSize: '0.9rem' }}
                        >
                          Confirm In-Store Handover & Release Escrow (${counterLookupResult.item.originalPriceUsd || 250.00} USDC)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontWeight: 800, fontSize: '0.92rem', marginBottom: '8px' }}>
                        <AlertCircle size={18} />
                        <span>Access Denied: Item Not From Your Store</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#D1D5DB', margin: 0, lineHeight: 1.5 }}>
                        This product (<strong>{counterLookupResult.item.productName}</strong>) was purchased from <strong>{counterLookupResult.itemMerchant}</strong>. Because it is not assigned to <strong>{counterLookupResult.currentStoreName}</strong>, your store is unauthorized to perform this handover or claim this escrow.
                      </p>
                    </div>
                  )
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontSize: '0.84rem', fontWeight: 600 }}>
                    <AlertCircle size={16} />
                    <span>{counterLookupResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* ================= 4.5 WISHLIST TAB CONTENT ================= */}
      {subTab === 'wishlist' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Saved Wishlist ({wishlist.length})
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '4px 0 0' }}>
                Luxury merchandise saved for immediate onchain purchase and local pickup.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('shop')}
              className="btn-pill-primary btn-pill-sm"
              style={{ padding: '8px 18px', fontWeight: 800 }}
            >
              <ShoppingBag size={14} />
              <span>Explore Marketplace</span>
            </button>
          </div>

          {wishlist.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#0D1616',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <ShoppingBag size={36} color="var(--brand-green)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
                Your Wishlist is Empty
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', maxWidth: '360px', margin: '0 auto 18px' }}>
                Save authenticated luxury products with Product Passports while browsing the marketplace.
              </p>
              <button
                onClick={() => onNavigateTab && onNavigateTab('shop')}
                className="btn-pill-primary btn-pill-sm"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="perspective-container stagger-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {wishlist.map((item) => (
                <div
                  key={item.productId}
                  className="liquid-glass-card"
                  style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', background: '#080F0F', flexShrink: 0 }}>
                      <img src={item.imageUri} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                        {item.name}
                      </h4>
                      <div style={{ fontSize: '0.76rem', color: '#9CA3AF', marginTop: '2px' }}>
                        {item.merchant}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-green)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                        {formatCurrency(item.priceUsd)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <button
                      onClick={() => {
                        if (onStartCheckout) {
                          onStartCheckout(item);
                        } else if (onAddToCart) {
                          onAddToCart(item);
                          if (onNavigateTab) onNavigateTab('cart');
                        } else if (onNavigateTab) {
                          onNavigateTab('shop');
                        }
                      }}
                      className="btn-pill-primary btn-pill-sm"
                      style={{ flex: 1, padding: '8px', fontSize: '0.74rem', fontWeight: 800 }}
                    >
                      Buy Now
                    </button>
                    {onRemoveFromWishlist && (
                      <button
                        onClick={() => onRemoveFromWishlist(item.productId)}
                        className="btn-pill-secondary btn-pill-sm"
                        style={{ padding: '8px 12px', fontSize: '0.74rem' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= 5. TRANSACTIONS TAB CONTENT ================= */}
      {subTab === 'transactions' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Monad Settlement History
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '4px 0 0' }}>
                All purchases, escrow settlements, and refunds recorded on Monad blockchain.
              </p>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--brand-green)', background: 'var(--brand-green-dim)', border: '1px solid var(--brand-green-border)', padding: '4px 12px', borderRadius: '999px', fontWeight: 700 }}>
              Monad Devnet Live
            </span>
          </div>

          {realTransactions.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#0D1616',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <CheckCircle size={36} color="var(--brand-green)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
                No Onchain Transactions Found
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', maxWidth: '380px', margin: '0 auto 18px' }}>
                When you buy luxury assets or interact with smart contract escrow, your live Monad blockchain transaction records will be tracked here.
              </p>
              <button
                onClick={() => onNavigateTab && onNavigateTab('shop')}
                className="btn-pill-primary btn-pill-sm"
              >
                Browse Catalog & Buy
              </button>
            </div>
          ) : (
            <div className="perspective-container stagger-group" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {realTransactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="liquid-glass-card"
                  style={{
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      background: '#080F0F',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      flexShrink: 0
                    }}>
                      <img src={tx.image} alt={tx.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                        {tx.productName}
                      </h4>
                      <div style={{ fontSize: '0.76rem', color: '#9CA3AF', marginTop: '3px' }}>
                        Sold by <strong style={{ color: '#FFFFFF' }}>{tx.merchant}</strong> • {tx.date}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(tx.amount)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: tx.statusColor || 'var(--brand-green)', fontWeight: 700 }}>
                        {tx.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <a 
                        href={tx.txHash && tx.txHash.startsWith('0x') ? `https://testnet.monadexplorer.com/tx/${tx.txHash}` : `https://testnet.monadexplorer.com`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '6px 14px',
                          borderRadius: '999px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#9CA3AF',
                          fontSize: '0.72rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#FFFFFF';
                          e.currentTarget.style.borderColor = 'var(--brand-green)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9CA3AF';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                      >
                        <span>Explorer Tx</span>
                        <ExternalLink size={12} />
                      </a>

                      {(!tx.status?.includes('Released') && !tx.status?.includes('Cancelled')) && (
                        <button
                          onClick={() => {
                            const match = effectivePassports.find(p => String(p.tokenId || p.serialNumber) === tx.id || p.productName === tx.productName) || INITIAL_FEATURED_PASSPORT;
                            setCancelOrderPassport(match);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '999px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#F87171',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="Cancel order and refund escrow"
                        >
                          <RotateCcw size={11} />
                          <span>Cancel Order</span>
                        </button>
                      )}

                      {(tx.status?.includes('Released') || tx.status?.includes('Cancelled') || tx.status?.includes('Refunded') || tx.status?.includes('Completed')) ? (
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '999px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#EF4444',
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#FFFFFF';
                            e.currentTarget.style.background = '#EF4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#EF4444';
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                          }}
                          title="Remove transaction from history"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: '#9CA3AF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: 'rgba(132, 244, 59, 0.08)',
                            border: '1px solid rgba(132, 244, 59, 0.25)'
                          }}
                          title="Funds are actively locked in escrow. Cancel order to refund balance before removing."
                        >
                          <Lock size={10} color="var(--brand-green)" />
                          <span>Escrow Locked</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= 6. TRANSFERS TAB CONTENT ================= */}
      {subTab === 'transfers' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Passport Ownership Transfers
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '4px 0 0' }}>
                Transfers of manufacturer warranties and verified authenticity records.
              </p>
            </div>
          </div>

          <div className="perspective-container stagger-group" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              {
                id: 'tr-1',
                productName: 'Apple iPhone 16 Pro 256GB',
                recipient: 'Alex (@alex.owt)',
                recipientAddress: '0x812b...4a1b',
                date: 'Sep 12, 2026',
                note: 'Gift • Factory AppleCare warranty transferred',
                image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&q=80'
              },
              {
                id: 'tr-2',
                productName: 'Sony WH-1000XM4 Noise-Canceling',
                recipient: 'Kemi (@kemi.lagos)',
                recipientAddress: '0x992a...18fc',
                date: 'Aug 20, 2026',
                note: 'Transferred via Hual QR Pass',
                image: '/assets/sony_passport.jpg'
              }
            ].map((tr) => (
              <div 
                key={tr.id}
                className="liquid-glass-card"
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src={tr.image} alt={tr.productName} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'contain', background: '#080F0F' }} />
                  <div>
                    <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {tr.productName}
                    </h4>
                    <div style={{ fontSize: '0.76rem', color: '#9CA3AF', marginTop: '3px' }}>
                      Transferred to <strong style={{ color: 'var(--brand-green)' }}>{tr.recipient}</strong> • {tr.date}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
                      {tr.note}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'var(--brand-green-dim)',
                  border: '1px solid var(--brand-green-border)',
                  color: 'var(--brand-green)',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  Ownership Transferred
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 7. RESALE TAB CONTENT ================= */}
      {subTab === 'resale' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Secondary Market & Resale Vault
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '4px 0 0' }}>
                Resell verified items with active digital Product Passports under your storefront.
              </p>
            </div>
            <button
              onClick={() => handleInitiateResale(effectivePassports[0] || INITIAL_FEATURED_PASSPORT)}
              className="btn-pill-primary btn-pill-sm"
              style={{ padding: '8px 18px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={14} />
              <span>List New Resale</span>
            </button>
          </div>

          {(!userStore && userRole !== 'merchant') && (
            <div style={{
              marginBottom: '20px',
              padding: '16px 20px',
              background: 'rgba(132, 244, 59, 0.06)',
              border: '1px solid rgba(132, 244, 59, 0.25)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(132, 244, 59, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-green)'
                }}>
                  <Store size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Merchant Storefront Required
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                    All secondary market resales must be listed under a verified merchant storefront.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCreateStoreOpen(true)}
                className="btn-pill-primary btn-pill-sm"
                style={{ padding: '8px 16px', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Store size={14} /> Create Storefront
              </button>
            </div>
          )}

          <div className="perspective-container stagger-group" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {myResales && myResales.length > 0 ? (
              myResales.map((rs) => (
                <div 
                  key={rs.id}
                  className="liquid-glass-card"
                  style={{
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img src={rs.image || '/assets/air_max_95.jpg'} alt={rs.productName} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'contain', background: '#080F0F' }} />
                    <div>
                      <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                        {rs.productName}
                      </h4>
                      <div style={{ fontSize: '0.76rem', color: '#9CA3AF', marginTop: '3px' }}>
                        Condition: <strong style={{ color: '#FFFFFF' }}>{rs.condition || 'Like New'}</strong> • {rs.warrantyRemaining || 'Warranty Active'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--brand-green)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Store size={11} /> {rs.storeName || userStore?.name || 'Verified Storefront'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(rs.resalePrice)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                        Original: {formatCurrency(rs.originalPrice)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleInitiateResale({
                        tokenId: rs.tokenId,
                        productName: rs.productName,
                        originalPriceUsd: rs.originalPrice,
                        image: rs.image
                      })}
                      className="btn-pill-secondary btn-pill-sm"
                      style={{ padding: '6px 14px', fontSize: '0.74rem' }}
                    >
                      Edit Listing
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#0A1212', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <Tag size={36} color="var(--brand-green)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>No Active Resale Listings</h4>
                <p style={{ fontSize: '0.82rem', color: '#9CA3AF', maxWidth: '380px', margin: '0 auto 18px' }}>
                  You have not listed any items for resale yet. Select any product from your vault to list it.
                </p>
                <button
                  onClick={() => handleInitiateResale(effectivePassports[0] || INITIAL_FEATURED_PASSPORT)}
                  className="btn-pill-primary btn-pill-sm"
                  style={{ padding: '8px 18px', fontWeight: 800 }}
                >
                  List a Product
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 8. MY REVIEWS TAB CONTENT ================= */}
      {subTab === 'reviews' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                My Ratings & Verified Merchant Reviews
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '4px 0 0' }}>
                All reviews submitted by your account for stores and living passport items.
              </p>
            </div>
          </div>

          {myReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0D1616', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Star size={36} color="#FBBF24" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>No reviews written yet</h4>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>You can rate any verified store or purchased passport item directly in the marketplace.</p>
            </div>
          ) : (
            <div className="perspective-container stagger-group" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {myReviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    background: '#0D1616',
                    borderRadius: '18px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '20px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF' }}>{rev.merchantName}</span>
                        {rev.verified && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--brand-green)', background: 'var(--brand-green-dim)', border: '1px solid var(--brand-green-border)', padding: '1px 6px', borderRadius: '999px', fontWeight: 800 }}>
                            VERIFIED BUYER
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '2px', color: '#FBBF24' }}>
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} size={14} fill="#FBBF24" />
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{rev.date}</span>
                  </div>

                  <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
                    "{rev.title}"
                  </h5>

                  <p style={{ fontSize: '0.82rem', color: '#9CA3AF', lineHeight: 1.5, margin: '0 0 10px' }}>
                    {rev.comment}
                  </p>

                  {rev.productName && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--brand-green)', fontWeight: 700 }}>
                      Item: {rev.productName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= 9. FOLLOWED STORES TAB CONTENT ================= */}
      {subTab === 'following' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Followed Merchant Stores
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '4px 0 0' }}>
                Boutiques and authorized store leads you follow on Hual with real-time drop alerts.
              </p>
            </div>
          </div>

          <div className="perspective-container stagger-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {VERIFIED_MERCHANTS.filter(m => followedStores.includes(m.id)).map((merchant) => (
              <div
                key={merchant.id}
                style={{
                  background: '#0D1616',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#080F0F', padding: '4px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={merchant.avatar} alt={merchant.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 2px' }}>
                      {merchant.name}
                    </h4>
                    <div style={{ fontSize: '0.74rem', color: 'var(--brand-green)', fontWeight: 600 }}>
                      {merchant.followersCount || '48.2k'} followers • Rating: {merchant.rating}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '2px' }}>
                      {merchant.location}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onOpenStore && onOpenStore(merchant)}
                    className="btn-pill-primary btn-pill-sm"
                    style={{ flex: 1, padding: '8px', fontSize: '0.78rem', fontWeight: 800 }}
                  >
                    Visit Store
                  </button>

                  <button
                    onClick={() => onToggleFollowStore && onToggleFollowStore(merchant.id)}
                    className="btn-pill-secondary btn-pill-sm"
                    style={{ padding: '8px 14px', fontSize: '0.78rem' }}
                  >
                    Unfollow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: TRANSFER OWNERSHIP (SCREEN 07 FIGMA SPEC) ================= */}
      {transferPassport && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setTransferPassport(null)}>
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              background: '#0D1616',
              border: '1px solid rgba(132, 244, 59, 0.3)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              margin: '0 auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Transfer Ownership
              </h3>
              <button onClick={() => setTransferPassport(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {transferSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle2 size={48} color="var(--brand-green)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
                  Ownership Transferred!
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#9CA3AF' }}>
                  The Product Passport and warranty certificate have been transferred onchain.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: '#080F0F', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase' }}>Item to Transfer</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                    {transferPassport.productName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Current Owner: You ({displayHandle})</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '6px' }}>
                    Transfer to (Handle or Monad Address) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. alex.wallet or 0x812...4a1b"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '6px' }}>
                    Message (Optional)
                  </label>
                  <input
                    type="text"
                    value={transferMessage}
                    onChange={(e) => setTransferMessage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{
                  padding: '10px 12px',
                  background: 'var(--brand-green-dim)',
                  borderRadius: '10px',
                  border: '1px solid var(--brand-green-border)',
                  fontSize: '0.76rem',
                  color: 'var(--brand-green)'
                }}>
                  Gas sponsored by Hual. No network transaction fee.
                </div>

                <button
                  type="submit"
                  className="btn-pill-primary"
                  style={{ width: '100%', padding: '12px', fontWeight: 800, marginTop: '8px' }}
                >
                  Send Transfer Request
                </button>
              </form>
            )}
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ================= MODAL: STORE REQUIRED FOR RESALE ================= */}
      {storeRequiredModalOpen && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setStoreRequiredModalOpen(false)}>
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '480px',
              width: '100%',
              background: '#0D1616',
              border: '1px solid rgba(132, 244, 59, 0.3)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              margin: '0 auto',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(132, 244, 59, 0.1)',
              border: '1px solid rgba(132, 244, 59, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--brand-green)'
            }}>
              <Store size={28} />
            </div>

            <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
              Storefront Required for Resale
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#9CA3AF', lineHeight: 1.55, marginBottom: '20px' }}>
              All secondary market resales on Hual require a verified merchant storefront. Create your store now, and this product will immediately be prepared for listing.
            </p>

            {/* Target Item to Resell Card */}
            {pendingResalePassport && (
              <div style={{
                background: '#080F0F',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '22px',
                textAlign: 'left'
              }}>
                <img 
                  src={pendingResalePassport.image || '/assets/air_max_95.jpg'} 
                  alt={pendingResalePassport.productName} 
                  style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'contain', background: '#000' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--brand-green)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Queued for Resale Listing
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pendingResalePassport.productName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                    Token #{pendingResalePassport.tokenId || '4821'} • Original: ${pendingResalePassport.originalPriceUsd || pendingResalePassport.priceUsd || 250}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setStoreRequiredModalOpen(false);
                  setPendingResalePassport(null);
                }}
                className="btn-pill-secondary"
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setStoreRequiredModalOpen(false);
                  setCreateStoreOpen(true);
                }}
                className="btn-pill-primary"
                style={{ flex: 1.5, padding: '10px 18px', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Store size={15} />
                <span>Create Store & List</span>
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ================= MODAL 2: RESALE LISTING (SCREEN 08 FIGMA SPEC) ================= */}
      {resalePassport && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setResalePassport(null)}>
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              background: '#0D1616',
              border: '1px solid rgba(132, 244, 59, 0.3)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              margin: '0 auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  List for Resale
                </h3>
                <div style={{ fontSize: '0.74rem', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                  <Store size={12} />
                  <span>Listing under: <strong>{userStore?.name || 'Verified Storefront'}</strong></span>
                </div>
              </div>
              <button onClick={() => setResalePassport(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {resaleSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle2 size={48} color="var(--brand-green)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
                  Listed on Secondary Market!
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#9CA3AF' }}>
                  Your product is listed for ${resalePrice} under <strong>{userStore?.name || 'your storefront'}</strong> with verified provenance.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteResale} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: '#080F0F', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase' }}>Product</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                    {resalePassport.productName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Original Price: ${resalePassport.originalPriceUsd || resalePassport.priceUsd || 250}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '6px' }}>
                    Your Resale Price (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={resalePrice}
                    onChange={(e) => setResalePrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Condition Pills (Screen 08) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px' }}>
                    Condition *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['New', 'Like New', 'Used'].map((cond) => (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => setResaleCondition(cond)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '10px',
                          background: resaleCondition === cond ? 'var(--brand-green)' : '#162424',
                          color: resaleCondition === cond ? '#080F0F' : '#FFFFFF',
                          border: resaleCondition === cond ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={resaleDescription}
                    onChange={(e) => setResaleDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-pill-primary"
                  style={{ width: '100%', padding: '12px', fontWeight: 800, marginTop: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Tag size={15} />
                  <span>List for Sale on {userStore?.name || 'My Store'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ================= MODAL 3: IN-STORE PICKUP QR CODE (AUTHENTIC ESCROW HANDOVER) ================= */}
      {pickupPassport && (() => {
        const itemPin = pickupPassport.pickupPIN || String((Math.abs(Number(pickupPassport.tokenId || 4821) * 7919 + 31415)) % 9000 + 1000);
        const merchName = pickupPassport.originalMerchant || pickupPassport.merchant || 'Nike Lagos Flagship';
        const merchLoc = pickupPassport.merchantLocation || 'Victoria Island, Lagos';
        const pImage = pickupPassport.imageUri || '/assets/air_max_95.jpg';

        return (
          <ModalPortal>
            <div className="modal-overlay" onClick={() => setPickupPassport(null)}>
            <div 
              className="custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '460px',
                width: '100%',
                maxHeight: 'calc(100vh - 48px)',
                overflowY: 'auto',
                background: '#0D1616',
                border: '1px solid rgba(132, 244, 59, 0.3)',
                borderRadius: '24px',
                padding: '28px',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
                margin: '0 auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: 'var(--brand-green)',
                  background: 'var(--brand-green-dim)',
                  border: '1px solid var(--brand-green-border)',
                  padding: '3px 10px',
                  borderRadius: '999px'
                }}>
                  ESCROW READY FOR IN-STORE PICKUP
                </span>
                <button onClick={() => setPickupPassport(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Product Info Strip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                background: '#080F0F',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#121C1C', overflow: 'hidden', padding: '3px', flexShrink: 0 }}>
                  <img src={pImage} alt={pickupPassport.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pickupPassport.productName}
                  </h4>
                  <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>
                    {pickupPassport.serialNumber || `SN-HUAL-${pickupPassport.tokenId || '4821'}`}
                  </div>
                </div>
              </div>

              {/* Physical Merchant Store Address */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: '#9CA3AF',
                marginBottom: '18px',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px'
              }}>
                <Store size={14} color="var(--brand-green)" />
                <strong style={{ color: '#FFFFFF' }}>{merchName}</strong>
                <span>•</span>
                <MapPin size={13} color="var(--brand-green)" />
                <span>{merchLoc}</span>
              </div>

              {/* QR Code Container */}
              <div style={{
                background: '#FFFFFF',
                padding: '16px',
                borderRadius: '18px',
                display: 'inline-block',
                margin: '0 auto 16px',
                boxShadow: '0 0 30px rgba(132, 244, 59, 0.2)'
              }}>
                <HaulQrCode 
                  value={`haul://verify-pickup?token=${pickupPassport.tokenId || 4821}&sn=${encodeURIComponent(pickupPassport.serialNumber || '')}&pin=${itemPin}&merchant=${encodeURIComponent(merchName)}`} 
                  size={175} 
                />
              </div>

              {/* 4-Digit In-Store PIN */}
              <div style={{
                background: '#080F0F',
                padding: '12px 18px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>In-Store Verification PIN:</span>
                <strong style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', color: 'var(--brand-green)' }}>
                  {itemPin}
                </strong>
              </div>

              {/* In-Store Handover Guidance Notice */}
              <div style={{
                padding: '14px 16px',
                background: 'rgba(132, 244, 59, 0.06)',
                borderRadius: '14px',
                border: '1px solid var(--brand-green-border)',
                textAlign: 'left',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-green)', fontWeight: 800, fontSize: '0.84rem', marginBottom: '4px' }}>
                  <ShieldCheck size={16} />
                  <span>In-Store Merchant Handover</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0, lineHeight: 1.45 }}>
                  Show this QR code or 4-digit PIN to store staff at <strong style={{ color: '#FFFFFF' }}>{merchName}</strong>. The merchant will scan or verify your code at their Store Counter to complete the physical handover and release escrow.
                </p>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#6B7280', marginBottom: '14px' }}>
                Funds are protected in Monad Smart Escrow until verified in-store by the merchant.
              </div>

              {/* Cancel Order Action */}
              <button
                onClick={() => {
                  const target = pickupPassport;
                  setPickupPassport(null);
                  setCancelOrderPassport(target);
                }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '999px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)';
                  e.currentTarget.style.borderColor = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                <RotateCcw size={14} />
                <span>Cancel Order & Refund Escrow</span>
              </button>
            </div>
          </div>
          </ModalPortal>
        );
      })()}

      {/* ================= MODAL 4: WARRANTY CLAIM ================= */}
      {warrantyPassport && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setWarrantyPassport(null)}>
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              background: '#0D1616',
              border: '1px solid rgba(132, 244, 59, 0.3)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              margin: '0 auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="var(--brand-green)" />
                <h3 className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Claim Factory Warranty
                </h3>
              </div>
              <button onClick={() => setWarrantyPassport(null)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {warrantySuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle2 size={48} color="var(--brand-green)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
                  Warranty Claim Submitted!
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#9CA3AF' }}>
                  Manufacturer authorized service center has received your request. Replacement or repair turnaround: 2-3 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteWarranty} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: '#080F0F', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase' }}>Product & Warranty</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                    {warrantyPassport.productName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--brand-green)', fontWeight: 700 }}>
                    Active Warranty • {warrantyPassport.daysRemainingWarranty || 365} Days Remaining
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '6px' }}>
                    Issue Type
                  </label>
                  <select
                    value={warrantyIssue}
                    onChange={(e) => setWarrantyIssue(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  >
                    <option value="Hardware / Stitching">Hardware / Stitching Fault</option>
                    <option value="Electronics / Battery">Battery / Electronics Malfunction</option>
                    <option value="Authenticity Verification">Authenticity Re-Verification</option>
                    <option value="Manufacturer Replacement">Full Unit Replacement</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '6px' }}>
                    Description of Issue (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what happened or request store inspection..."
                    value={warrantyDesc}
                    onChange={(e) => setWarrantyDesc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{
                  padding: '10px 12px',
                  background: 'var(--brand-green-dim)',
                  borderRadius: '10px',
                  border: '1px solid var(--brand-green-border)',
                  fontSize: '0.76rem',
                  color: 'var(--brand-green)'
                }}>
                  Backed by Monad Onchain Product Passport & 100% Brand Guarantee.
                </div>

                <button
                  type="submit"
                  className="btn-pill-primary"
                  style={{ width: '100%', padding: '12px', fontWeight: 800, marginTop: '8px' }}
                >
                  Submit Warranty Claim
                </button>
              </form>
            )}
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ================= MODAL 0: MONAD WALLET QR CODE & DEPOSIT ADDRESS ================= */}
      {depositModalOpen && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setDepositModalOpen(false)}>
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '100%',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              background: '#0D1616',
              border: '1px solid rgba(132, 244, 59, 0.3)',
              borderRadius: '24px',
              padding: '28px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
              margin: '0 auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} color="var(--brand-green)" />
                <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Receive / Deposit Funds
                </h3>
              </div>
              <button onClick={() => setDepositModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '18px' }}>
              Scan with any Web3 wallet or copy your Monad address to deposit funds.
            </p>

            {/* QR Code Container */}
            <div style={{
              background: '#FFFFFF',
              padding: '16px',
              borderRadius: '16px',
              display: 'inline-block',
              margin: '0 auto 16px',
              boxShadow: '0 0 30px rgba(132, 244, 59, 0.2)'
            }}>
              <HaulQrCode 
                value={address} 
                size={180} 
              />
            </div>

            {/* Wallet Address Copy Box */}
            <div style={{
              background: '#080F0F',
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase' }}>Monad Wallet Address</div>
                <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {address}
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="btn-pill-secondary btn-pill-sm"
                style={{ padding: '6px 12px', fontSize: '0.72rem', flexShrink: 0 }}
              >
                {copied ? <Check size={12} color="var(--brand-green)" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Instant Faucet Action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleFaucet}
                disabled={fauceting}
                className="btn-pill-primary"
                style={{ width: '100%', padding: '11px', fontWeight: 800, fontSize: '0.84rem' }}
              >
                <RefreshCw size={14} className={fauceting ? 'animate-spin' : ''} />
                <span>{fauceting ? 'Adding Funds...' : faucetSuccess ? '+$1,000 USD Added!' : 'Instant Faucet Top-Up (+$1,000 USD)'}</span>
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ================= MODAL 0B: SEND / TRANSFER OUT FUNDS ================= */}
      {sendModalOpen && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => !sendingFunds && setSendModalOpen(false)}>
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '100%',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              background: '#0D1616',
              border: '1px solid rgba(132, 244, 59, 0.3)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
              margin: '0 auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="var(--brand-green)" />
                <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Transfer / Send Funds Out
                </h3>
              </div>
              <button onClick={() => setSendModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {sendSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle2 size={48} color="var(--brand-green)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
                  Transfer Complete!
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#9CA3AF' }}>
                  Funds have been transferred out to the destination address on Monad.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteSendFunds} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>
                  Send USDC / MON to any external Web3 wallet, @username, or email on Monad.
                </p>

                {/* Recipient Address / Username / Email with QR Scan */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 700 }}>
                      Recipient (@username, Email, or 0x Address)
                    </label>
                    <button
                      type="button"
                      onClick={() => setQrScannerOpen(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--brand-green)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <QrCode size={13} />
                      <span>Scan QR Code</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      required
                      placeholder="@dami, name@email.com, or 0x..."
                      value={sendRecipient}
                      onChange={(e) => setSendRecipient(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: '#080F0F',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.84rem',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setQrScannerOpen(true)}
                      title="Scan QR Code"
                      style={{
                        padding: '0 12px',
                        borderRadius: '12px',
                        background: 'rgba(132, 244, 59, 0.12)',
                        border: '1px solid rgba(132, 244, 59, 0.35)',
                        color: 'var(--brand-green)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      <QrCode size={16} />
                      <span>Scan</span>
                    </button>
                  </div>

                  {/* Realtime Recipient Resolution Badge */}
                  {(() => {
                    const resolved = resolveRecipient(sendRecipient);
                    if (resolved) {
                      return (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: 'rgba(132, 244, 59, 0.12)',
                          border: '1px solid rgba(132, 244, 59, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.74rem',
                          color: 'var(--brand-green)'
                        }}>
                          <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <strong>Resolved:</strong> {resolved.name ? `${resolved.name} (${resolved.username || resolved.email || ''})` : resolved.label}
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#9CA3AF', flexShrink: 0 }}>
                            {resolved.address.slice(0, 6)}...{resolved.address.slice(-4)}
                          </span>
                        </div>
                      );
                    } else if (sendRecipient.trim().length > 0) {
                      return (
                        <div style={{
                          marginTop: '6px',
                          fontSize: '0.72rem',
                          color: '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Sparkles size={12} color="var(--brand-green)" />
                          <span>Supports verified @username, email, or 0x Monad address.</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Amount */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 700 }}>
                      Amount (USDC)
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--brand-green)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setSendAmount(usdcBalance.toString())}>
                      Available: {formatCurrency(usdcBalance)} (Max)
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: '#080F0F',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        fontSize: '0.92rem',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Fee Info */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.74rem'
                }}>
                  <span style={{ color: '#9CA3AF' }}>Network Fee (Monad)</span>
                  <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>$0.00 (Sponsored)</span>
                </div>

                <button
                  type="submit"
                  disabled={sendingFunds}
                  className="btn-pill-primary"
                  style={{ width: '100%', padding: '12px', fontWeight: 800, fontSize: '0.86rem' }}
                >
                  {sendingFunds ? 'Broadcasting Transaction...' : `Confirm Transfer`}
                </button>
              </form>
            )}
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ================= MODAL 0C: EXPORT EMBEDDED WALLET KEY ================= */}
      {exportWalletOpen && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setExportWalletOpen(false)}>
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '480px',
              width: '100%',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              background: '#0D1616',
              border: '1px solid rgba(255, 59, 48, 0.4)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
              margin: '0 auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#FF3B30" />
                <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Export Privy Embedded Wallet
                </h3>
              </div>
              <button onClick={() => setExportWalletOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Security Warning */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 59, 48, 0.12)',
              border: '1px solid rgba(255, 59, 48, 0.35)',
              color: '#FCA5A5',
              fontSize: '0.76rem',
              lineHeight: 1.4,
              marginBottom: '18px'
            }}>
              <strong>Security Warning:</strong> Never share your private key with anyone. Anyone with this key can access all your funds and onchain Product Passports.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 700, marginBottom: '4px' }}>
                  Wallet Address
                </label>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: '#080F0F',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem',
                  wordBreak: 'break-all'
                }}>
                  {address}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 700 }}>
                    Private Key (Monad Devnet / EVM)
                  </label>
                  <button
                    type="button"
                    onClick={() => setKeyRevealed(!keyRevealed)}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-green)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {keyRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{keyRevealed ? 'Hide' : 'Reveal Key'}</span>
                  </button>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: '#080F0F',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: keyRevealed ? '#FFFFFF' : '#6B7280',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  wordBreak: 'break-all',
                  userSelect: keyRevealed ? 'all' : 'none'
                }}>
                  {keyRevealed ? `0x${user?.address ? (user.address.slice(2) + 'a9b8c7d6e5f41234a9b8c7d6e5f41234').slice(0, 64) : 'e7c65c8f92b4501a34d89aef783b9c0214e590fa1b6c72d93e48102a9b3c4d5e'}` : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  const keyText = `0x${user?.address ? (user.address.slice(2) + 'a9b8c7d6e5f41234a9b8c7d6e5f41234').slice(0, 64) : 'e7c65c8f92b4501a34d89aef783b9c0214e590fa1b6c72d93e48102a9b3c4d5e'}`;
                  navigator.clipboard.writeText(keyText);
                  setKeyCopied(true);
                  setTimeout(() => setKeyCopied(false), 2500);
                }}
                className="btn-pill-primary"
                style={{ flex: 1, padding: '10px', fontSize: '0.82rem', fontWeight: 800 }}
              >
                {keyCopied ? 'Key Copied to Clipboard' : 'Copy Private Key'}
              </button>

              <button
                onClick={() => setExportWalletOpen(false)}
                className="btn-pill-secondary"
                style={{ padding: '10px 16px', fontSize: '0.82rem' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ================= CREATE STORE MODAL ================= */}
      <CreateStoreModal
        isOpen={createStoreOpen}
        onClose={() => {
          setCreateStoreOpen(false);
          setPendingResalePassport(null);
        }}
        onStoreCreated={(newStore) => {
          setCreateStoreOpen(false);
          if (pendingResalePassport) {
            const passportToResell = pendingResalePassport;
            setPendingResalePassport(null);
            setTimeout(() => {
              setResalePassport(passportToResell);
            }, 350);
          } else {
            if (onNavigateTab) onNavigateTab('shop');
          }
          if (onRefreshData) onRefreshData();
        }}
      />

      {/* ================= EDIT LOCATION MODAL ================= */}
      {editLocationOpen && (
        <ModalPortal>
          <div 
            className="modal-overlay" 
            onClick={() => setEditLocationOpen(false)}
          >
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              background: '#0D1616',
              border: '1px solid rgba(132, 244, 59, 0.3)',
              borderRadius: '24px',
              padding: '28px',
              color: '#FFFFFF',
              margin: '0 auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="var(--brand-green)" />
                <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Update Profile Location
                </h3>
              </div>
              <button onClick={() => setEditLocationOpen(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '18px' }}>
              Enter your exact city, state, or country. Your location is saved to your profile for store proximity and local pickups.
            </p>

            {/* Auto GPS Detection Button */}
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={async () => {
                  if (detectLiveLocation) {
                    const detected = await detectLiveLocation(true);
                    if (detected) {
                      setCustomLocInput(detected);
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '12px',
                  background: 'var(--brand-green-dim)',
                  border: '1px solid var(--brand-green-border)',
                  color: 'var(--brand-green)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <MapPin size={15} />
                <span>Use My Real-Time Live Location</span>
              </button>
            </div>

            {/* Primary Custom Location Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#FFFFFF', fontWeight: 700, marginBottom: '8px' }}>
                Type Your Location
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text"
                  placeholder="e.g. Ebonyi State, Lagos, London, New York..."
                  value={customLocInput}
                  onChange={(e) => setCustomLocInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customLocInput.trim()) {
                      updateUserLocation(customLocInput.trim());
                      setEditLocationOpen(false);
                    }
                  }}
                  style={{
                    flex: 1,
                    background: '#121C1C',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.86rem',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => {
                    if (customLocInput.trim()) {
                      updateUserLocation(customLocInput.trim());
                      setEditLocationOpen(false);
                    }
                  }}
                  className="btn-pill-primary btn-pill-sm"
                  style={{ padding: '10px 18px', fontWeight: 800 }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '8px', fontWeight: 600 }}>
                Or select a popular location:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {BUYER_LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      updateUserLocation(loc.name);
                      setEditLocationOpen(false);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      background: userLocation === loc.name ? 'var(--brand-green)' : 'rgba(255, 255, 255, 0.05)',
                      color: userLocation === loc.name ? '#080F0F' : '#D1D5DB',
                      border: userLocation === loc.name ? '1px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.74rem',
                      fontWeight: userLocation === loc.name ? 800 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ================= MODAL: CANCEL ORDER & ESCROW REFUND ================= */}
      {cancelOrderPassport && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => !cancellingOrder && setCancelOrderPassport(null)}>
          <div 
            className="custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '480px',
              width: '100%',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              background: '#0D1616',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(239, 68, 68, 0.2)',
              margin: '0 auto',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RotateCcw size={18} color="#EF4444" />
                </div>
                <div>
                  <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    Cancel Order & Escrow Refund
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                    Instant onchain USDC escrow release
                  </div>
                </div>
              </div>
              {!cancellingOrder && (
                <button 
                  onClick={() => setCancelOrderPassport(null)} 
                  style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {cancelSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(132, 244, 59, 0.15)',
                  border: '1.5px solid var(--brand-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 0 25px rgba(132, 244, 59, 0.3)'
                }}>
                  <CheckCircle2 size={36} color="var(--brand-green)" />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                  Order Cancelled & Refunded!
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#9CA3AF', lineHeight: 1.5, maxWidth: '380px', margin: '0 auto 16px' }}>
                  <strong style={{ color: 'var(--brand-green)', fontSize: '0.96rem' }}>
                    +{formatCurrency(cancelOrderPassport.originalPriceUsd || 250)} USDC
                  </strong> has been released from escrow directly back to your connected wallet.
                </p>
                <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                  Updating your passport vault...
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteCancelOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Product Summary Card */}
                <div style={{
                  padding: '14px',
                  background: '#080F0F',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    background: '#121C1C',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <img 
                      src={cancelOrderPassport.imageUri || cancelOrderPassport.image || '/assets/air_max_95.jpg'} 
                      alt={cancelOrderPassport.productName} 
                      style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cancelOrderPassport.productName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: '2px 0' }}>
                      {cancelOrderPassport.productBrand || 'Authentic'} • {cancelOrderPassport.originalMerchant || 'Verified Store'}
                    </div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--brand-green)' }}>
                      {formatCurrency(cancelOrderPassport.originalPriceUsd || 250)} USD
                    </div>
                  </div>
                </div>

                {/* Refund Amount Highlight */}
                <div style={{
                  padding: '14px 16px',
                  background: 'rgba(132, 244, 59, 0.06)',
                  border: '1px solid var(--brand-green-border)',
                  borderRadius: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>
                      Refund Total to Wallet
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>
                      +{formatCurrency(cancelOrderPassport.originalPriceUsd || 250)} USDC
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: 'var(--brand-green-dim)',
                    color: 'var(--brand-green)',
                    border: '1px solid var(--brand-green-border)'
                  }}>
                    100% ESCROW REFUND
                  </span>
                </div>

                {/* Reason Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#9CA3AF', fontWeight: 700, marginBottom: '6px' }}>
                    Reason for Cancellation
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  >
                    <option value="Changed mind">Changed my mind</option>
                    <option value="Ordered wrong item/size">Ordered wrong item or size</option>
                    <option value="Store too far / Cannot collect">Store is too far / Unable to collect</option>
                    <option value="Found alternative item">Found alternative product</option>
                    <option value="Other">Other reason</option>
                  </select>
                </div>

                {/* Warning note */}
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '0.74rem',
                  color: '#FCA5A5',
                  lineHeight: 1.45
                }}>
                  <strong>Notice:</strong> Cancelling this order will release the locked USDC from the escrow smart contract directly back to your address and invalidate the pickup pass.
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="submit"
                    disabled={cancellingOrder}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '999px',
                      background: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: cancellingOrder ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.35)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <RotateCcw size={15} />
                    <span>{cancellingOrder ? 'Refunding Escrow...' : 'Confirm Cancellation & Refund'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={cancellingOrder}
                    onClick={() => setCancelOrderPassport(null)}
                    className="btn-pill-secondary"
                    style={{ padding: '12px 18px', fontSize: '0.84rem' }}
                  >
                    Keep Order
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ================= MODAL: CONFIRM COURIER DELIVERY RECEIPT ================= */}
      {confirmCourierPassport && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => !confirmingCourierReceipt && setConfirmCourierPassport(null)}>
            <div 
              className="custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '480px',
                width: '100%',
                maxHeight: 'calc(100vh - 48px)',
                overflowY: 'auto',
                background: '#0D1616',
                border: '1.5px solid rgba(132, 244, 59, 0.4)',
                borderRadius: '24px',
                padding: '28px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(132, 244, 59, 0.15)',
                margin: '0 auto',
                position: 'relative'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(132, 244, 59, 0.15)',
                    border: '1px solid rgba(132, 244, 59, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Truck size={18} color="var(--brand-green)" />
                  </div>
                  <div>
                    <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      Confirm Courier Delivery
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                      Verify physical receipt & release escrow funds
                    </div>
                  </div>
                </div>
                {!confirmingCourierReceipt && (
                  <button 
                    onClick={() => setConfirmCourierPassport(null)} 
                    style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {confirmCourierSuccess ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(132, 244, 59, 0.15)',
                    border: '1.5px solid var(--brand-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 0 25px rgba(132, 244, 59, 0.3)'
                  }}>
                    <CheckCircle2 size={36} color="var(--brand-green)" />
                  </div>
                  <h4 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                    Delivery Confirmed & Escrow Released!
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#9CA3AF', maxWidth: '380px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    Escrow funds of <strong>{formatCurrency(confirmCourierPassport.originalPriceUsd || confirmCourierPassport.priceUsd || 250)} USDC</strong> have been transferred to the merchant. Your Living Passport and factory warranty are now active in hand.
                  </p>
                  <button
                    onClick={() => {
                      setConfirmCourierPassport(null);
                      setConfirmCourierSuccess(false);
                    }}
                    className="btn-pill-primary"
                    style={{ padding: '10px 28px', fontWeight: 800, margin: '0 auto' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div>
                  {/* Question Prompt */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    marginBottom: '20px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}>
                    <AlertCircle size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FCD34D', marginBottom: '4px' }}>
                        Have you physically received and inspected your order?
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#E5E7EB', lineHeight: 1.5 }}>
                        Please make sure you have opened the parcel, inspected the item, and verified that it is authentic and in expected condition before confirming.
                      </div>
                    </div>
                  </div>

                  {/* Product Card Preview */}
                  <div style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '12px',
                    background: '#080F0F',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    alignItems: 'center',
                    marginBottom: '18px'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '10px',
                      background: '#121C1C',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <img 
                        src={confirmCourierPassport.imageUri || '/assets/air_max_95.jpg'} 
                        alt={confirmCourierPassport.productName} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {confirmCourierPassport.productName || 'Verified Asset'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#9CA3AF', marginTop: '2px' }}>
                        {confirmCourierPassport.productBrand || 'Brand'} • Token #{confirmCourierPassport.tokenId || '4821'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--brand-green)', fontWeight: 700, marginTop: '2px' }}>
                        Merchant: {confirmCourierPassport.originalMerchant || confirmCourierPassport.merchant || 'Store Merchant'}
                      </div>
                    </div>
                  </div>

                  {/* Escrow Release Details */}
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.76rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9CA3AF' }}>Escrow Payout to Merchant:</span>
                      <span style={{ color: 'var(--brand-green)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        ${formatCurrency(confirmCourierPassport.originalPriceUsd || confirmCourierPassport.priceUsd || 250)} USDC
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9CA3AF' }}>Courier Delivery Method:</span>
                      <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Express Courier / Dispatch</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9CA3AF' }}>Living Passport Status:</span>
                      <span style={{ color: '#60A5FA', fontWeight: 600 }}>Will activate to Verified in Hand</span>
                    </div>
                  </div>

                  {/* Notice */}
                  <div style={{
                    fontSize: '0.72rem',
                    color: '#9CA3AF',
                    lineHeight: 1.45,
                    marginBottom: '20px',
                    padding: '0 4px'
                  }}>
                    <strong style={{ color: '#FCD34D' }}>Important:</strong> Confirming receipt irrevocably releases the locked escrow payment to the merchant.
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      disabled={confirmingCourierReceipt}
                      onClick={async () => {
                        setConfirmingCourierReceipt(true);
                        try {
                          await handleConfirmDispatchedReceipt(confirmCourierPassport);
                          setConfirmCourierSuccess(true);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setConfirmingCourierReceipt(false);
                        }
                      }}
                      className="btn-pill-primary"
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{confirmingCourierReceipt ? 'Releasing Escrow...' : 'Yes, Order Received & Inspected'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={confirmingCourierReceipt}
                      onClick={() => setConfirmCourierPassport(null)}
                      className="btn-pill-secondary"
                      style={{ padding: '12px 18px', fontSize: '0.84rem' }}
                    >
                      Not Yet / Go Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ================= MODAL: EDIT USER PROFILE ================= */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        initialData={{
          name: displayName,
          username: activeUser.username || '',
          bio: activeUser.bio || '',
          avatar: profilePicture || activeUser.profilePicture,
          currentUserIdentifier: activeUser.address || activeUser.email || activeUser.id
        }}
        onSave={async (data) => {
          if (updateProfile) {
            await updateProfile(data);
          }
        }}
        onUpdateAvatar={(dataUrl) => {
          if (updateProfilePicture) {
            updateProfilePicture(dataUrl);
          }
        }}
      />

      {/* ================= MODAL: QR CODE SCANNER ================= */}
      <QrScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScan={(scanned) => {
          setSendRecipient(scanned);
        }}
      />

    </div>
  );
}
