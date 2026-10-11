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
