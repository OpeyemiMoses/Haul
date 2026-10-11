/**
 * Hual Ownership Transfer Registry
 * Handles peer-to-peer ownership transfers of Living Product Passports.
 * Transfers can be initiated by username (@username), email, or Monad address.
 * Transferred items require acceptance by the recipient on their own Passport page.
 */

import { resolveRecipient } from './userRegistry';

const TRANSFERS_STORAGE_KEY = 'hual_pending_transfers';

export function getAllTransfers() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRANSFERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to load transfers:', err);
    return [];
  }
}

export function saveAllTransfers(transfers) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers));
    window.dispatchEvent(new CustomEvent('hual_transfers_updated'));
  } catch (err) {
    console.warn('Failed to save transfers:', err);
  }
}

/**
 * Get all transfers categorized for a given user.
 */
export function getUserTransfers(currentUser) {
  if (!currentUser) return { incoming: [], outgoing: [], history: [], all: [] };

  const all = getAllTransfers();
  const currentAddress = (currentUser.address || currentUser.wallet?.address || '').toLowerCase();
  const currentEmail = (currentUser.email || (currentUser.email?.address || currentUser.google?.email) || '').toLowerCase();
  const currentUsername = (currentUser.username || (currentEmail ? currentEmail.split('@')[0] : '')).replace(/^@/, '').toLowerCase();
  const currentHandle = `@${currentUsername}`;
  const currentId = (currentUser.id || '').toLowerCase();

  const isUserRecipient = (t) => {
    if (!t || !t.recipient) return false;
    const rQuery = (t.recipient.query || '').replace(/^@/, '').toLowerCase();
    const rUser = (t.recipient.username || '').replace(/^@/, '').toLowerCase();
    const rHandle = (t.recipient.handle || '').toLowerCase();
    const rAddr = (t.recipient.address || '').toLowerCase();
    const rEmail = (t.recipient.email || '').toLowerCase();

    if (currentUsername && (rUser === currentUsername || rQuery === currentUsername)) return true;
    if (currentHandle && (rHandle === currentHandle.toLowerCase() || rQuery === currentHandle.toLowerCase())) return true;
    if (currentAddress && (rAddr === currentAddress || rQuery === currentAddress)) return true;
    if (currentEmail && (rEmail === currentEmail || rQuery === currentEmail)) return true;
    return false;
  };

  const isUserSender = (t) => {
    if (!t || !t.sender) return false;
    const sId = (t.sender.id || '').toLowerCase();
    const sAddr = (t.sender.address || '').toLowerCase();
    const sEmail = (t.sender.email || '').toLowerCase();
    const sUser = (t.sender.username || (t.sender.handle || '').replace(/^@/, '')).toLowerCase();

    if (currentId && sId === currentId) return true;
    if (currentAddress && sAddr === currentAddress) return true;
    if (currentEmail && sEmail === currentEmail) return true;
    if (currentUsername && sUser === currentUsername) return true;
    return false;
  };

  const incoming = all.filter(t => t.status === 'PENDING' && isUserRecipient(t));
  const outgoing = all.filter(t => isUserSender(t) && t.status === 'PENDING');
  const history = all.filter(t => (isUserRecipient(t) || isUserSender(t)) && t.status !== 'PENDING');

  return { incoming, outgoing, history, all };
}

/**
 * Initiates a new ownership transfer request to a username, handle, email, or address.
 */
export function initiateTransferRequest({ passport, senderUser, recipientQuery, message }) {
  if (!passport) throw new Error('Missing passport to transfer.');
  if (!recipientQuery || !recipientQuery.trim()) throw new Error('Please enter a recipient username, handle, or address.');

  const cleanQuery = recipientQuery.trim();
  const resolved = resolveRecipient(cleanQuery);
  const cleanUsername = resolved?.username ? resolved.username.replace(/^@/, '') : cleanQuery.replace(/^@/, '');

  const senderUsername = senderUser?.username || (senderUser?.email ? senderUser.email.split('@')[0] : 'Member');
  const senderHandle = `@${senderUsername.replace(/^@/, '')}`;
  const senderAddress = senderUser?.address || senderUser?.wallet?.address || null;
  const senderEmail = senderUser?.email || null;
  const senderId = senderUser?.id || senderAddress || senderUsername;

  // Prevent self-transfer
  if (
    cleanUsername.toLowerCase() === senderUsername.toLowerCase() ||
    (resolved?.address && senderAddress && resolved.address.toLowerCase() === senderAddress.toLowerCase())
  ) {
    throw new Error('You cannot transfer an item to yourself.');
  }

  const transferId = `trans-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newTransfer = {
    transferId,
    status: 'PENDING',
    passport: {
      ...passport,
      transferPending: true,
      pendingTransferId: transferId
    },
    sender: {
      id: senderId,
      name: senderUser?.name || senderUsername,
      username: senderUsername,
      handle: senderHandle,
      address: senderAddress,
      email: senderEmail
    },
    recipient: {
      query: cleanQuery,
      username: cleanUsername,
      handle: `@${cleanUsername}`,
      name: resolved?.name || cleanUsername,
      address: resolved?.address || null,
      email: resolved?.email || null,
      resolved
    },
    message: (message || '').trim(),
    createdAt: new Date().toLocaleString(),
    timestamp: Date.now()
  };

  const all = getAllTransfers();
  const tokenStr = String(passport.tokenId || '');
  const serialStr = String(passport.serialNumber || '');
  const filtered = all.filter(t => {
    if (t.status !== 'PENDING') return true;
    const tTok = String(t.passport?.tokenId || '');
    const tSer = String(t.passport?.serialNumber || '');
    return !(tokenStr && tTok === tokenStr) && !(serialStr && tSer === serialStr);
  });

  saveAllTransfers([newTransfer, ...filtered]);

  // Mark the passport in sender's local storage as transferPending
  markPassportPending(passport, transferId, newTransfer.recipient, senderId, senderAddress);

  return newTransfer;
}

/**
 * Accepts an incoming transfer request and transfers the passport into recipient's collection.
 */
export function acceptTransferRequest(transferId, currentUser) {
  const all = getAllTransfers();
  const transfer = all.find(t => t.transferId === transferId);
  if (!transfer) throw new Error('Transfer request not found.');
  if (transfer.status !== 'PENDING') throw new Error(`Transfer is already ${transfer.status.toLowerCase()}.`);

  const currentUsername = currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : 'New Owner');
  const currentAddress = currentUser?.address || currentUser?.wallet?.address || null;
  const currentEmail = currentUser?.email || null;
  const currentKey = currentUser?.id || (currentUser?.email ? currentUser.email.toLowerCase() : 'guest');

  // 1. Update transfer record
  const updatedTransfers = all.map(t => {
    if (t.transferId === transferId) {
      return {
        ...t,
        status: 'ACCEPTED',
        acceptedAt: new Date().toLocaleString(),
        acceptedBy: {
          username: currentUsername,
          address: currentAddress,
          email: currentEmail
        }
      };
    }
    return t;
  });
  saveAllTransfers(updatedTransfers);

  // 2. Prepare accepted passport
  const original = transfer.passport;
  const newTransferCount = (original.transferCount || 0) + 1;
  const prevHistory = Array.isArray(original.transferHistory) ? original.transferHistory : [];

  const acceptedPassport = {
    ...original,
    transferPending: false,
    pendingTransferId: null,
    pendingRecipient: null,
    currentState: 'COLLECTED',
    currentStateIndex: 4,
    currentOwner: `@${currentUsername.replace(/^@/, '')}`,
    ownerAddress: currentAddress,
    transferCount: newTransferCount,
    lastTransferredAt: new Date().toLocaleString(),
    transferHistory: [
      {
        transferId,
        from: transfer.sender.handle || transfer.sender.name || 'Previous Owner',
        fromAddress: transfer.sender.address,
        to: `@${currentUsername.replace(/^@/, '')}`,
        toAddress: currentAddress,
        date: new Date().toLocaleDateString(),
        message: transfer.message || 'Ownership transferred on Haul.'
      },
      ...prevHistory
    ]
  };

  // 3. Add to recipient's collection
  addPassportToRecipient(acceptedPassport, currentKey, currentAddress);

  // 4. Remove from sender's collection
  removePassportFromSender(original, transfer.sender.id, transfer.sender.address);

  // Trigger UI sync events
  window.dispatchEvent(new CustomEvent('hual_transfer_accepted', { detail: { transferId, passport: acceptedPassport } }));
  window.dispatchEvent(new CustomEvent('hual_storage_update'));

  return acceptedPassport;
}

/**
 * Declines an incoming transfer request and returns the item to sender.
 */
export function declineTransferRequest(transferId) {
  const all = getAllTransfers();
  const transfer = all.find(t => t.transferId === transferId);
  if (!transfer) return;

  const updatedTransfers = all.map(t => {
    if (t.transferId === transferId) {
      return {
        ...t,
        status: 'DECLINED',
        declinedAt: new Date().toLocaleString()
      };
    }
    return t;
  });
  saveAllTransfers(updatedTransfers);

  unmarkPassportPending(transfer.passport, transfer.sender.id, transfer.sender.address);

  window.dispatchEvent(new CustomEvent('hual_transfer_declined', { detail: { transferId } }));
  window.dispatchEvent(new CustomEvent('hual_storage_update'));
}

/**
 * Cancels an outgoing transfer before it is accepted.
 */
export function cancelTransferRequest(transferId) {
  const all = getAllTransfers();
  const transfer = all.find(t => t.transferId === transferId);
  if (!transfer) return;

  const updatedTransfers = all.map(t => {
    if (t.transferId === transferId) {
      return {
        ...t,
        status: 'CANCELLED',
        cancelledAt: new Date().toLocaleString()
      };
    }
    return t;
  });
  saveAllTransfers(updatedTransfers);

  unmarkPassportPending(transfer.passport, transfer.sender.id, transfer.sender.address);

  window.dispatchEvent(new CustomEvent('hual_transfer_cancelled', { detail: { transferId } }));
  window.dispatchEvent(new CustomEvent('hual_storage_update'));
}

/* ================= INTERNAL STORAGE SYNC HELPERS ================= */

function markPassportPending(passport, transferId, recipient, senderId, senderAddress) {
  const updateList = (list) => list.map(p => {
    if (p.tokenId === passport.tokenId || p.serialNumber === passport.serialNumber) {
      return {
        ...p,
        transferPending: true,
        pendingTransferId: transferId,
        pendingRecipient: recipient
      };
    }
    return p;
  });

  mutatePassportStores(updateList, senderId, senderAddress);
}

function unmarkPassportPending(passport, senderId, senderAddress) {
  const updateList = (list) => list.map(p => {
    if (p.tokenId === passport.tokenId || p.serialNumber === passport.serialNumber) {
      return {
        ...p,
        transferPending: false,
        pendingTransferId: null,
        pendingRecipient: null
      };
    }
    return p;
  });

  mutatePassportStores(updateList, senderId, senderAddress);
}

function removePassportFromSender(passport, senderId, senderAddress) {
  const filterList = (list) => list.filter(p => 
    p.tokenId !== passport.tokenId && p.serialNumber !== passport.serialNumber
  );

  mutatePassportStores(filterList, senderId, senderAddress);
}

function addPassportToRecipient(passport, recipientKey, recipientAddress) {
  const appendToList = (list) => {
    const without = list.filter(p => p.tokenId !== passport.tokenId && p.serialNumber !== passport.serialNumber);
    return [passport, ...without];
  };

  try {
    const globalPass = JSON.parse(localStorage.getItem('hual_my_passports') || '[]');
    localStorage.setItem('hual_my_passports', JSON.stringify(appendToList(globalPass)));

    if (recipientKey) {
      const userScoped = JSON.parse(localStorage.getItem(`hual_my_passports_${recipientKey}`) || '[]');
      localStorage.setItem(`hual_my_passports_${recipientKey}`, JSON.stringify(appendToList(userScoped)));
    }

    if (recipientAddress) {
      const addrScoped = JSON.parse(localStorage.getItem(`hual_my_passports_${recipientAddress.toLowerCase()}`) || '[]');
      localStorage.setItem(`hual_my_passports_${recipientAddress.toLowerCase()}`, JSON.stringify(appendToList(addrScoped)));
    }
  } catch (err) {
    console.warn('Error adding passport to recipient stores:', err);
  }
}

function mutatePassportStores(mutationFn, userId, userAddress) {
  try {
    const globalPass = JSON.parse(localStorage.getItem('hual_my_passports') || '[]');
    localStorage.setItem('hual_my_passports', JSON.stringify(mutationFn(globalPass)));

    if (userId) {
      const userScoped = JSON.parse(localStorage.getItem(`hual_my_passports_${userId}`) || '[]');
      localStorage.setItem(`hual_my_passports_${userId}`, JSON.stringify(mutationFn(userScoped)));
    }

    if (userAddress) {
      const addrScoped = JSON.parse(localStorage.getItem(`hual_my_passports_${userAddress.toLowerCase()}`) || '[]');
      localStorage.setItem(`hual_my_passports_${userAddress.toLowerCase()}`, JSON.stringify(mutationFn(addrScoped)));
    }
  } catch (err) {
    console.warn('Error mutating passport stores:', err);
  }
}
