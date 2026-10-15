/**
 * Currency symbol mapping
 */
const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
  JPY: '¥',
};

/**
 * Format numeric amount with currency code
 */
export const formatCurrency = (amount, currency = 'INR') => {
  const numeric = Number(amount) || 0;
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${symbol}${numeric.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format ISO date string into readable date (e.g., Oct 14, 2026)
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date for input elements (YYYY-MM-DD)
 */
export const formatDateForInput = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (percent) => {
  const num = Number(percent) || 0;
  return `${num.toFixed(1)}%`;
};
