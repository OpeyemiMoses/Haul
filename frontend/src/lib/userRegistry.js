/**
 * Hual Onchain & Offchain User Registry & Identity Resolver
 * Resolves @usernames, emails, and Monad addresses for seamless peer-to-peer transfers.
 */

export const DEFAULT_USERS = [];

export function getRegistry() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('hual_user_registry');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Purge any legacy seed / demo accounts
    const seedUsernames = new Set(['dami', 'nike_lagos', 'adidas_vi', 'puma_lekki', 'zara_ikeja', 'consumer']);
    const cleaned = parsed.filter(u => {
      const uName = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      if (seedUsernames.has(uName)) return false;
      if (uEmail.endsWith('@hual.xyz')) return false;
      return true;
    });

    if (cleaned.length !== parsed.length) {
      localStorage.setItem('hual_user_registry', JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (err) {
    console.warn('Failed to read user registry:', err);
    return [];
  }
}

export function isUsernameAvailable(username, currentUserIdentifier) {
  if (!username) return false;
  const clean = username.replace(/^@/, '').trim().toLowerCase();
  if (clean.length < 3) return false;

  const registry = getRegistry();
  const currentClean = (currentUserIdentifier || '').trim().toLowerCase();

  const match = registry.find(u => (u.username || '').toLowerCase() === clean);
  if (!match) return true;

  // If the matching entry belongs to the current user (same address or email)
  if (currentClean && (
    (match.address && match.address.toLowerCase() === currentClean) ||
    (match.email && match.email.toLowerCase() === currentClean) ||
    (match.id && match.id.toLowerCase() === currentClean)
  )) {
    return true;
  }

  return false;
}

export function registerUser({ username, email, address, name, avatar, id }) {
  if (typeof window === 'undefined') return;
  if (!username && !email && !address) return;

  const cleanUsername = (username || '').replace(/^@/, '').trim().toLowerCase();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanAddress = (address || '').trim();
  const cleanId = (id || '').trim();

  // Enforce username uniqueness across all users
  if (cleanUsername) {
    const isAvail = isUsernameAvailable(cleanUsername, cleanAddress || cleanEmail || cleanId);
    if (!isAvail) {
      throw new Error(`Username @${cleanUsername} is already taken by another user.`);
    }
  }

  const registry = getRegistry();
  const index = registry.findIndex(u => 
    (cleanAddress && (u.address || '').toLowerCase() === cleanAddress.toLowerCase()) ||
    (cleanEmail && (u.email || '').toLowerCase() === cleanEmail) ||
    (cleanId && (u.id || '').toLowerCase() === cleanId.toLowerCase())
  );

  const prev = index >= 0 ? registry[index] : {};
  const updatedEntry = {
    ...prev,
    username: cleanUsername || prev.username || (cleanEmail ? cleanEmail.split('@')[0] : `user_${Date.now().toString().slice(-4)}`),
    handle: `@${cleanUsername || prev.username || (cleanEmail ? cleanEmail.split('@')[0] : 'user')}`,
    name: name || prev.name || (cleanEmail ? cleanEmail.split('@')[0] : 'Hual Member'),
    email: cleanEmail || prev.email || '',
    address: cleanAddress || prev.address || deriveAddressFromEmail(cleanEmail || 'user@hual.xyz'),
    avatar: avatar !== undefined ? avatar : (prev.avatar || null),
    updatedAt: new Date().toISOString()
  };

  let newRegistry;
  if (index >= 0) {
    newRegistry = [...registry];
    newRegistry[index] = updatedEntry;
  } else {
    newRegistry = [updatedEntry, ...registry];
  }

  try {
    localStorage.setItem('hual_user_registry', JSON.stringify(newRegistry));
  } catch (err) {
    console.warn('Failed to save user to registry:', err);
  }
  return updatedEntry;
}

/**
 * Deterministically derives an Ethereum/Monad-compatible 0x hex address from any email.
 */
export function deriveAddressFromEmail(email) {
  if (!email) return '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  let hash = 0;
  const str = email.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hexPart = Math.abs(hash).toString(16).padStart(8, '0');
  const secondHex = Math.abs(hash * 31 + 42).toString(16).padStart(8, '0');
  const thirdHex = Math.abs(hash * 17 + 89).toString(16).padStart(8, '0');
  const fourthHex = Math.abs(hash * 7 + 13).toString(16).padStart(8, '0');
  const fifthHex = Math.abs(hash * 13 + 99).toString(16).padStart(8, '0');
  return `0x${hexPart}${secondHex}${thirdHex}${fourthHex}${fifthHex}`.slice(0, 42);
}

/**
 * Resolves a query (0x address, @username, username, or email) to an actionable address.
 */
export function resolveRecipient(query) {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim();
  if (!clean) return null;

  // 1. Check if directly a valid 42-char 0x hex address
  if (/^0x[a-fA-F0-9]{40}$/.test(clean)) {
    const registry = getRegistry();
    const match = registry.find(u => (u.address || '').toLowerCase() === clean.toLowerCase());
    return {
      type: 'address',
      address: clean,
      username: match ? match.handle : null,
      name: match ? match.name : null,
      email: match ? match.email : null,
      label: match ? `${match.name} (${match.handle || clean.slice(0, 8)})` : clean
    };
  }

  const registry = getRegistry();

  // 2. Check if username (with or without @, or .hual)
  const normalizedUser = clean.replace(/^@/, '').replace(/\.hual$/i, '').toLowerCase();
  const userMatch = registry.find(u => (u.username || '').toLowerCase() === normalizedUser);
  if (userMatch && userMatch.address) {
    return {
      type: 'username',
      address: userMatch.address,
      username: userMatch.handle || `@${userMatch.username}`,
      name: userMatch.name,
      email: userMatch.email,
      label: `${userMatch.name} (${userMatch.handle || '@' + userMatch.username})`
    };
  }

  // 3. Check if email (contains @ and .)
  if (clean.includes('@') && clean.includes('.')) {
    const emailMatch = registry.find(u => (u.email || '').toLowerCase() === clean.toLowerCase());
    if (emailMatch && emailMatch.address) {
      return {
        type: 'email',
        address: emailMatch.address,
        username: emailMatch.handle,
        name: emailMatch.name,
        email: emailMatch.email,
        label: `${emailMatch.name} (${emailMatch.email})`
      };
    }
    // Auto-derive address from new email
    const derived = deriveAddressFromEmail(clean);
    return {
      type: 'email',
      address: derived,
      username: `@${clean.split('@')[0]}`,
      name: clean.split('@')[0],
      email: clean,
      isDerived: true,
      label: `${clean} (Monad Embedded)`
    };
  }

  // 4. Fuzzy fallback for partial username
  const partial = registry.find(u => (u.username || '').toLowerCase().includes(normalizedUser));
  if (partial && partial.address) {
    return {
      type: 'username',
      address: partial.address,
      username: partial.handle || `@${partial.username}`,
      name: partial.name,
      email: partial.email,
      label: `${partial.name} (${partial.handle})`
    };
  }

  return null;
}
