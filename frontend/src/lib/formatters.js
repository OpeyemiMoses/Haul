/**
 * Currency and Number Formatting Utilities for Hual Commerce
 * Ensures all numbers, prices, balances and follower/review counts 
 * have standard comma separators (e.g., $3,899.00, 1,250 reviews).
 */

export const formatCurrency = (val, decimals = 2) => {
  if (val === undefined || val === null || val === '') return '$0.00';
  const num = Number(val);
  if (isNaN(num)) return '$0.00';
  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatNumber = (val) => {
  if (val === undefined || val === null || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US');
};

export const formatShortNumber = (val) => {
  if (val === undefined || val === null) return '0';
  if (typeof val === 'string' && (val.includes('k') || val.includes('M'))) return val;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toLocaleString('en-US');
};

export const calculateProximity = (buyerLoc, merchantLoc) => {
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
    if (m.includes('ikoyi')) return { distance: '16.8 km', transit: '40 mins drive', pickupReady: 'Ready in 1 hour' };
    if (m.includes('lekki')) return { distance: '24.5 km', transit: '55 mins drive', pickupReady: 'Ready in 1.5 hours' };
    return { distance: '8.0 km', transit: '25 mins drive', pickupReady: 'Ready in 35 mins' };
  }
  return { distance: '3.2 km', transit: '12 mins drive', pickupReady: 'Ready in 30 mins' };
};
