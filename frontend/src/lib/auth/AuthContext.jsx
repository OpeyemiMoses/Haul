import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { PrivyService } from './PrivyService';
import PrivyLoginModal from './PrivyLoginModal';
import { registerUser, isUsernameAvailable } from '../userRegistry';

const AuthContext = createContext(null);
const privyLoginEmpty = () => {};

export function AuthProvider({ children }) {
  // Official Privy SDK Hook
  let privyReady = true;
  let privyAuth = false;
  let privyUser = null;
  let privyLogin = privyLoginEmpty;
  let privyLogout = () => {};
  let privyExportWallet = null;
  let privyLinkEmail, privyLinkGoogle, privyLinkPhone, privyLinkTwitter, privyLinkDiscord;

  try {
    const privy = usePrivy();
    privyReady = privy.ready;
    privyAuth = privy.authenticated;
    privyUser = privy.user;
    privyLogin = privy.login;
    privyLogout = privy.logout;
    privyExportWallet = privy.exportWallet;
    privyLinkEmail = privy.linkEmail;
    privyLinkGoogle = privy.linkGoogle;
    privyLinkPhone = privy.linkPhone;
    privyLinkTwitter = privy.linkTwitter;
    privyLinkDiscord = privy.linkDiscord;
  } catch (err) {
    console.warn('Privy SDK not mounted in tree or initializing:', err);
  }

  const [localSession, setLocalSession] = useState(() => PrivyService.getStoredSession());
  const isAuthenticated = Boolean((privyAuth && privyUser) || localSession);
  const activeUserKey = privyUser?.id || localSession?.userId || (privyUser?.wallet?.address ? privyUser.wallet.address.toLowerCase() : null);

  const [usdcBalance, setUsdcBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [isNewUserTrigger, setIsNewUserTrigger] = useState(false);

  // Profile Picture (Device uploaded base64 data URL)
  const [profilePicture, setProfilePicture] = useState(null);

  const updateProfilePicture = (dataUrl) => {
    setProfilePicture(dataUrl);
    if (activeUserKey) {
      if (dataUrl) {
        localStorage.setItem(`hual_profile_picture_${activeUserKey}`, dataUrl);
      } else {
        localStorage.removeItem(`hual_profile_picture_${activeUserKey}`);
      }
    }
  };

  // Custom User Profile (Name, Username, Bio)
  const [customProfile, setCustomProfile] = useState({});

  const updateProfile = (data = {}) => {
    const cleanUser = data.username ? data.username.replace(/^@/, '').trim().toLowerCase() : null;
    const currentIdent = localSession?.wallet?.address || privyUser?.wallet?.address || localSession?.email || (privyUser?.email?.address || privyUser?.google?.email);

    if (cleanUser && cleanUser.length >= 3) {
      if (!isUsernameAvailable(cleanUser, currentIdent)) {
        throw new Error(`Username @${cleanUser} is already taken by another user. Please choose another username.`);
      }
    }

    setCustomProfile(prev => {
      const updated = { ...prev, ...data };
      if (cleanUser) updated.username = cleanUser;

      if (activeUserKey) {
        try {
          localStorage.setItem(`hual_user_custom_profile_${activeUserKey}`, JSON.stringify(updated));
        } catch (err) {}
      }

      // Register in public user registry for @username and email resolution
      registerUser({
        username: updated.username,
        name: updated.name,
        email: localSession?.email || (privyUser?.email?.address || privyUser?.google?.email),
        address: localSession?.wallet?.address || privyUser?.wallet?.address,
        avatar: profilePicture
      });

      return updated;
    });

    if (localSession) {
      const updatedSession = {
        ...localSession,
        name: data.name !== undefined ? data.name : localSession.name,
        username: cleanUser !== null ? cleanUser : localSession.username
      };
      setLocalSession(updatedSession);
      try {
        localStorage.setItem('hual_privy_session', JSON.stringify(updatedSession));
      } catch (err) {}
    }
  };

  // 18+ Age Verification Enforcement
  const [isAgeVerified, setIsAgeVerified] = useState(() => {
    return localStorage.getItem('hual_age_verified') === 'true';
  });
  const [ageVerificationOpen, setAgeVerificationOpen] = useState(false);

  const verifyUserAge = (dobString, calculatedAge) => {
    setIsAgeVerified(true);
    localStorage.setItem('hual_age_verified', 'true');
    if (dobString) localStorage.setItem('hual_user_dob', dobString);
    if (calculatedAge) localStorage.setItem('hual_user_age', calculatedAge.toString());
  };

  const resetAgeVerification = () => {
    setIsAgeVerified(false);
    localStorage.removeItem('hual_age_verified');
    localStorage.removeItem('hual_user_dob');
    localStorage.removeItem('hual_user_age');
  };

  // User Profile Location (Worldwide with live detection)
  const [userLocation, setUserLocation] = useState(() => {
    return localStorage.getItem('hual_user_location') || '';
  });

  // Dynamic Live Geolocation Detector
  const detectLiveLocation = async (force = false) => {
    const existing = localStorage.getItem('hual_user_location');
    if (existing && !force) {
      if (!userLocation) setUserLocation(existing);
      return existing;
    }

    try {
      // 1. Try browser HTML5 Geolocation API
      if (typeof window !== 'undefined' && navigator.geolocation) {
        const coords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            (err) => reject(err),
            { timeout: 6000, maximumAge: 60000 }
          );
        });

        if (coords && coords.latitude && coords.longitude) {
          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10`,
              { headers: { 'Accept-Language': 'en' } }
            );
            if (resp.ok) {
              const data = await resp.json();
              const addr = data.address || {};
              const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || addr.state || 'Local';
              const country = addr.country || '';
              const detected = country ? `${city}, ${country}` : city;
              if (detected) {
                setUserLocation(detected);
                localStorage.setItem('hual_user_location', detected);
                return detected;
              }
            }
          } catch (geoErr) {
            console.warn('Reverse geocoding error:', geoErr);
          }
        }
      }
    } catch (err) {
      console.warn('HTML5 Geolocation unavailable or denied:', err);
    }

    // 2. Timezone / Locale-based intelligent fallback
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        const parts = tz.split('/');
        const city = parts[parts.length - 1].replace(/_/g, ' ');
        const country = parts[0] === 'Africa' ? 'Nigeria' : parts[0] === 'Europe' ? 'UK' : parts[0] === 'America' ? 'USA' : parts[0];
        const detected = `${city}, ${country}`;
        setUserLocation(detected);
        localStorage.setItem('hual_user_location', detected);
        return detected;
      }
    } catch (tzErr) {
      console.warn('Timezone detection error:', tzErr);
    }

    const fallbackLoc = 'Victoria Island, Lagos';
    setUserLocation(fallbackLoc);
    localStorage.setItem('hual_user_location', fallbackLoc);
    return fallbackLoc;
  };

  // Run live location detection on mount if not set yet
  useEffect(() => {
    const stored = localStorage.getItem('hual_user_location');
    if (!stored) {
      detectLiveLocation(true);
    }
  }, []);

  // User Role: Always starts as 'consumer' until they create a store!
  const [userRole, setUserRole] = useState('consumer');

  // User Store (if created)
  const [userStore, setUserStore] = useState(null);

  // Synchronize user profile, store, and balance whenever active user changes
  useEffect(() => {
    if (!isAuthenticated || !activeUserKey) {
      setCustomProfile({});
      setUserStore(null);
      setUserRole('consumer');
      setProfilePicture(null);
      setUsdcBalance(0);
      return;
    }

    // 1. Scoped Profile
    try {
      const scoped = localStorage.getItem(`hual_user_custom_profile_${activeUserKey}`);
      setCustomProfile(scoped ? JSON.parse(scoped) : {});
    } catch {
      setCustomProfile({});
    }

    // 2. Scoped Store (ONLY if owned by this user)
    try {
      let store = null;
      const scopedStore = localStorage.getItem(`hual_user_store_${activeUserKey}`);
      if (scopedStore) {
        store = JSON.parse(scopedStore);
      } else {
        const userAddr = privyUser?.wallet?.address?.toLowerCase() || localSession?.wallet?.address?.toLowerCase();
        if (userAddr) {
          const allStores = JSON.parse(localStorage.getItem('hual_all_created_stores') || '[]');
          const match = allStores.find(s => s.ownerAddress && s.ownerAddress.toLowerCase() === userAddr);
          if (match) store = match;
        }
      }
      setUserStore(store);
      setUserRole(store ? 'merchant' : 'consumer');
    } catch {
      setUserStore(null);
      setUserRole('consumer');
    }

    // 3. Scoped Profile Picture
    try {
      const scopedPic = localStorage.getItem(`hual_profile_picture_${activeUserKey}`);
      setProfilePicture(scopedPic || null);
    } catch {
      setProfilePicture(null);
    }

    // 4. Scoped USDC Balance
    try {
      const userAddr = privyUser?.wallet?.address?.toLowerCase() || localSession?.wallet?.address?.toLowerCase();
      const scopedBal = localStorage.getItem(`hual_usdc_balance_${activeUserKey}`) || (userAddr ? localStorage.getItem(`hual_usdc_balance_${userAddr}`) : null);
      if (scopedBal !== null && !isNaN(parseFloat(scopedBal))) {
        setUsdcBalance(parseFloat(scopedBal));
      } else {
        setUsdcBalance(1000);
      }
    } catch {
      setUsdcBalance(1000);
    }
  }, [isAuthenticated, activeUserKey]);

  const updateUserLocation = (newLoc) => {
    setUserLocation(newLoc);
    localStorage.setItem('hual_user_location', newLoc);
  };

  const createStore = (storeData) => {
    if (!isAuthenticated) {
      throw new Error("You must create an account and sign in through Privy to create a store.");
    }

    const cleanStoreHandle = storeData.handle || `@${(storeData.name || 'store').toLowerCase().replace(/[^a-z0-9]/g, '')}.hual`;
    const newStore = {
      id: `store-${Date.now()}`,
      name: storeData.name || 'My Flagship Store',
      handle: cleanStoreHandle,
      verified: true,
      category: storeData.category || 'Curated Goods',
      location: storeData.location || userLocation,
      fullAddress: storeData.fullAddress || storeData.location || userLocation,
      rating: 5.0,
      reviewsCount: 1,
      followersCount: '1.2k',
      avatar: storeData.avatar || '/assets/air_max_95.jpg',
      banner: storeData.banner || '/assets/nike_store_banner.jpg',
      pickupTime: storeData.pickupTime || 'Ready in 30 mins',
      deliveryTime: storeData.deliveryTime || 'Same-day courier',
      openingTime: storeData.openingTime || '09:00 AM',
      closingTime: storeData.closingTime || '07:00 PM',
      operatingHours: storeData.operatingHours || 'Mon - Sat: 9:00 AM - 7:00 PM',
      phone: storeData.phone || '+234 1 800 4825',
      chatRep: `${storeData.name ? storeData.name.split(' ')[0] : 'Store Lead'} (Store Lead • Online)`,
      description: storeData.description || 'Verified merchant boutique on Hual with living Product Passports.',
      ownerAddress: privyUser?.wallet?.address || localSession?.wallet?.address || user?.address
    };

    setUserStore(newStore);
    setUserRole('merchant');
    if (activeUserKey) {
      localStorage.setItem(`hual_user_store_${activeUserKey}`, JSON.stringify(newStore));
      localStorage.setItem(`hual_user_role_${activeUserKey}`, 'merchant');
    }

    try {
      const existing = JSON.parse(localStorage.getItem('hual_all_created_stores') || '[]');
      const updatedList = [newStore, ...existing.filter(s => s.id !== newStore.id)];
      localStorage.setItem('hual_all_created_stores', JSON.stringify(updatedList));
    } catch {}

    return newStore;
  };

  const updateStore = (storeData) => {
    setUserStore(prev => {
      const updated = {
        ...(prev || {}),
        ...storeData
      };
      if (activeUserKey) {
        localStorage.setItem(`hual_user_store_${activeUserKey}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Normalize user: ONLY real authenticated Privy users have a profile!
  const user = useMemo(() => {
    if (privyAuth && privyUser) {
      const googleAccount = privyUser.linkedAccounts?.find(a => a.type === 'google') || privyUser.google;
      const emailAccount = privyUser.linkedAccounts?.find(a => a.type === 'email') || privyUser.email;
      const walletAccount = privyUser.wallet || privyUser.linkedAccounts?.find(a => a.type === 'wallet');

      const email = googleAccount?.email || emailAccount?.address || privyUser.email?.address || '';
      const baseName = googleAccount?.name || (email ? email.split('@')[0] : 'Verified Member');
      const finalName = customProfile.name || baseName;
      const baseUsername = (email ? email.split('@')[0] : 'member').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const finalUsername = customProfile.username ? customProfile.username.replace(/^@/, '') : baseUsername;
      const finalBio = customProfile.bio || 'Living Digital Passport Collector on Monad.';

      // Real Privy Embedded Wallet Address:
      const address = walletAccount?.address || privyUser.wallet?.address || null;

      return {
        id: privyUser.id,
        email: email || 'account@haul.store',
        name: finalName,
        username: finalUsername,
        handle: `@${finalUsername}`,
        bio: finalBio,
        address,
        location: userLocation,
        role: userRole,
        store: userStore,
        profilePicture: profilePicture || null,
        provider: googleAccount ? 'google' : (emailAccount ? 'email' : 'wallet'),
        linkedAccounts: {
          google: Boolean(googleAccount),
          email: Boolean(emailAccount),
          sms: Boolean(privyUser.linkedAccounts?.some(a => a.type === 'phone' || a.type === 'sms')),
          discord: Boolean(privyUser.linkedAccounts?.some(a => a.type === 'discord')),
          twitter: Boolean(privyUser.linkedAccounts?.some(a => a.type === 'twitter'))
        },
        privyUser
      };
    }

    // Authenticated Privy session created through PrivyService embedded wallet
    if (localSession) {
      const baseName = localSession.name || (localSession.email ? localSession.email.split('@')[0] : 'Member');
      const finalName = customProfile.name || baseName;
      const baseUsername = (localSession.username || localSession.email?.split('@')[0] || 'member').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const finalUsername = customProfile.username ? customProfile.username.replace(/^@/, '') : baseUsername;
      const finalBio = customProfile.bio || 'Living Digital Passport Collector on Monad.';

      return {
        id: localSession.userId,
        email: localSession.email,
        name: finalName,
        username: finalUsername,
        handle: `@${finalUsername}`,
        bio: finalBio,
        address: localSession.wallet?.address || null,
        location: userLocation,
        role: userRole,
        store: userStore,
        profilePicture: profilePicture || null,
        provider: localSession.provider || 'email',
        linkedAccounts: localSession.linkedAccounts || {
          google: localSession.provider === 'google',
          email: true,
          sms: false,
          discord: false,
          twitter: false
        },
        privyUser: localSession
      };
    }

    // Unauthenticated visitor: zero profile, cannot create store
    return null;
  }, [privyAuth, privyUser, localSession, userLocation, userRole, userStore, profilePicture, customProfile]);

  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // User identifier key

  const userKey = user?.id || (user?.email ? user.email.toLowerCase() : (user?.address ? user.address.toLowerCase() : 'guest'));

  // Automatically sync balance whenever active user or userKey changes
  useEffect(() => {
    try {
      const keys = [
        user?.address ? `hual_usdc_balance_${user.address.toLowerCase()}` : null,
        userKey ? `hual_usdc_balance_${userKey}` : null,
        'hual_usdc_balance'
      ].filter(Boolean);

      for (const k of keys) {
        const val = localStorage.getItem(k);
        if (val !== null) {
          const num = parseFloat(val);
          if (!isNaN(num)) {
            setUsdcBalance(num);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Sync balance error:', e);
    }
  }, [userKey, user?.address]);

  const refreshBalance = async (address) => {
    const targetAddr = address || user?.address;
    if (!targetAddr) return;
    setLoadingBalance(true);
    try {
      const onchainBal = await PrivyService.getUsdcBalance(targetAddr);
      const keys = [
        userKey ? `hual_usdc_balance_${userKey}` : null,
        `hual_usdc_balance_${targetAddr.toLowerCase()}`,
        'hual_usdc_balance'
      ].filter(Boolean);

      let savedVal = null;
      for (const k of keys) {
        const s = localStorage.getItem(k);
        if (s !== null) {
          const parsed = parseFloat(s);
          if (!isNaN(parsed)) {
            savedVal = parsed;
            break;
          }
        }
      }

      if (savedVal === null) {
        const balToSet = onchainBal > 0 ? onchainBal : 2500;
        setUsdcBalance(balToSet);
        keys.forEach(k => localStorage.setItem(k, String(balToSet)));
      } else {
        setUsdcBalance(savedVal);
      }
    } catch (err) {
      console.warn('Balance refresh failed:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const logout = async () => {
    try {
      if (privyLogout) await privyLogout();
    } catch (e) {
      console.warn('Privy logout error:', e);
    }
    PrivyService.clearSession();
    setLocalSession(null);
    setUserStore(null);
    setUserRole('consumer');
    setCustomProfile({});
    setProfilePicture(null);
    setUsdcBalance(0);

    // Clear legacy un-scoped items
    localStorage.removeItem('hual_user_custom_profile');
    localStorage.removeItem('hual_user_store');
    localStorage.removeItem('hual_profile_picture');
    localStorage.removeItem('hual_user_role');
    localStorage.removeItem('hual_user_name');
    localStorage.removeItem('hual_my_passports');
    localStorage.removeItem('hual_cart');
    localStorage.removeItem('hual_usdc_balance');
    localStorage.removeItem('hual_onboarded');
    localStorage.removeItem('privy_hual_session');

    window.dispatchEvent(new Event('hual_auth_signout'));
  };

  const faucetUsdc = async (amount = 1000) => {
    let txHash = null;
    if (user?.address) {
      try {
        txHash = await PrivyService.faucetUsdc(user.address, amount);
      } catch (e) {
        console.warn('Faucet onchain error:', e);
      }
    }
    setUsdcBalance(prev => {
      const newBal = Number((prev + Number(amount)).toFixed(2));
      const keys = [
        userKey ? `hual_usdc_balance_${userKey}` : null,
        user?.address ? `hual_usdc_balance_${user.address.toLowerCase()}` : null,
        'hual_usdc_balance'
      ].filter(Boolean);
      keys.forEach(k => localStorage.setItem(k, String(newBal)));
      return newBal;
    });
    return txHash;
  };

  const deductUsdc = (amount) => {
    setUsdcBalance(prev => {
      const newBal = Math.max(0, Number((prev - Number(amount)).toFixed(2)));
      const keys = [
        userKey ? `hual_usdc_balance_${userKey}` : null,
        user?.address ? `hual_usdc_balance_${user.address.toLowerCase()}` : null,
        'hual_usdc_balance'
      ].filter(Boolean);
      keys.forEach(k => localStorage.setItem(k, String(newBal)));
      return newBal;
    });
  };

  const transferUsdc = async ({ recipientAddress, amount }) => {
    if (!user) throw new Error("Please connect your Privy account first");
    const identifier = user.email || user.id || user.address;
    const result = await PrivyService.transferUsdc({
      fromIdentifier: identifier,
      recipientAddress,
      amountUsdc: Number(amount)
    });
    if (user?.address) {
      await refreshBalance(user.address);
    }
    return result;
  };

  const loginWithPrivy = async (newSession, isNewUser) => {
    setLocalSession(newSession);
    if (isNewUser) {
      setIsNewUserTrigger(true);
      await detectLiveLocation(true);
    }
    if (newSession?.wallet?.address) {
      await refreshBalance(newSession.wallet.address);
    }
  };

  const triggerLogin = () => {
    try {
      if (privyReady && privyLogin && privyLogin !== privyLoginEmpty) {
        privyLogin();
      } else {
        setLoginModalOpen(true);
      }
    } catch {
      setLoginModalOpen(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session: localSession,
        user,
        authenticated: isAuthenticated,
        ready: privyReady,
        usdcBalance,
        loadingBalance,
        deductUsdc,
        userLocation,
        updateUserLocation,
        detectLiveLocation,
        userRole,
        userStore,
        profilePicture,
        updateProfilePicture,
        customProfile,
        updateProfile,
        createStore,
        updateStore,
        login: triggerLogin,
        openLoginModal: () => setLoginModalOpen(true),
        logout,
        loginWithPrivy,
        refreshBalance,
        faucetUsdc,
        transferUsdc,
        linkGoogle: privyLinkGoogle,
        linkEmail: privyLinkEmail,
        linkPhone: privyLinkPhone,
        linkTwitter: privyLinkTwitter,
        linkDiscord: privyLinkDiscord,
        exportWallet: privyExportWallet,
        isAgeVerified,
        ageVerificationOpen,
        setAgeVerificationOpen,
        verifyUserAge,
        resetAgeVerification,
        isNewUserTrigger,
        clearNewUserTrigger: () => setIsNewUserTrigger(false)
      }}
    >
      {children}
      <PrivyLoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
        onLoginSuccess={loginWithPrivy} 
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      session: null,
      user: null,
      authenticated: false,
      ready: true,
      usdcBalance: 2500,
      loadingBalance: false,
      deductUsdc: () => {},
      userLocation: 'Victoria Island, Lagos',
      updateUserLocation: () => {},
      detectLiveLocation: async () => 'Victoria Island, Lagos',
      userRole: 'consumer',
      userStore: null,
      profilePicture: null,
      updateProfilePicture: () => {},
      customProfile: {},
      updateProfile: () => {},
      createStore: () => {},
      updateStore: () => {},
      login: () => {},
      openLoginModal: () => {},
      logout: () => {},
      loginWithPrivy: () => {},
      refreshBalance: async () => {},
      faucetUsdc: async () => {},
      transferUsdc: async () => {},
      linkGoogle: () => {},
      linkEmail: () => {},
      linkPhone: () => {},
      linkTwitter: () => {},
      linkDiscord: () => {},
      exportWallet: () => {},
      isAgeVerified: true,
      ageVerificationOpen: false,
      setAgeVerificationOpen: () => {},
      verifyUserAge: () => {},
      resetAgeVerification: () => {},
      isNewUserTrigger: false,
      clearNewUserTrigger: () => {}
    };
  }
  return context;
}
