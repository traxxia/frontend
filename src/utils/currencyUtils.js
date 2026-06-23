/**
 * Normalizes a currency name, code, or symbol into its standard symbol.
 * If no match is found, returns the upper-cased currency string as a fallback.
 * 
 * @param {string} currency - The currency name, code, or symbol (e.g., 'usd', 'Euro', '£')
 * @returns {string} The resolved symbol or the normalized currency code.
 */
export const getCurrencySymbol = (currency) => {
  if (!currency) return '';
  const clean = currency.toLowerCase().trim();

  // USD variants
  if (['usd', 'us dollars', 'us dollar', 'dollars', 'dollar', '$', 'united states dollar', 'united states dollars'].includes(clean)) {
    return '$';
  }

  // EUR variants
  if (['eur', 'euros', 'euro', '€'].includes(clean)) {
    return '€';
  }

  // GBP variants
  if (['gbp', 'pounds', 'pound', '£', 'great britain pound', 'great britain pounds', 'sterling'].includes(clean)) {
    return '£';
  }

  // JPY / CNY variants (Yen/Yuan)
  if (['jpy', 'yen', 'japanese yen', 'cny', 'yuan', 'chinese yuan', 'renminbi', '¥'].includes(clean)) {
    return '¥';
  }

  // INR variants (Rupee)
  if (['inr', 'rupees', 'rupee', '₹', 'indian rupee', 'indian rupees'].includes(clean)) {
    return '₹';
  }

  // CAD variants (Canadian Dollar)
  if (['cad', 'canadian dollar', 'canadian dollars', 'c$'].includes(clean)) {
    return 'C$';
  }

  // AUD variants (Australian Dollar)
  if (['aud', 'australian dollar', 'australian dollars', 'a$'].includes(clean)) {
    return 'A$';
  }

  // CHF variants (Swiss Franc)
  if (['chf', 'swiss franc', 'swiss francs', 'fr.', 'fr'].includes(clean)) {
    return 'CHF';
  }

  // SGD variants (Singapore Dollar)
  if (['sgd', 'singapore dollar', 'singapore dollars', 's$'].includes(clean)) {
    return 'S$';
  }

  // NZD variants (New Zealand Dollar)
  if (['nzd', 'new zealand dollar', 'new zealand dollars', 'nz$'].includes(clean)) {
    return 'NZ$';
  }

  // If it's a single character symbol, return it
  if (clean.length === 1 && !/[a-zA-Z0-9]/.test(clean)) {
    return currency;
  }

  return currency.toUpperCase().trim();
};

/**
 * Formats a numeric value with its proper currency symbol placement.
 * If the currency resolves to a prefix symbol (e.g. $, €, £, ¥, ₹), it prepends it.
 * Otherwise, it appends the resolved symbol/code with a space.
 * 
 * @param {number} value - The numeric value to format
 * @param {string} currency - The currency code/name
 * @param {object} options - Optional toLocaleString options
 * @returns {string} The formatted currency string
 */
export const formatCurrencyValue = (value, currency, options = {}) => {
  if (value === null || value === undefined || isNaN(value)) return '';

  const symbol = getCurrencySymbol(currency);
  
  // Format the number value
  const formattedValue = Number(value).toLocaleString(undefined, options);

  if (!symbol) return formattedValue;

  // Decide if symbol is a prefix (e.g. starts with standard symbols or is CAD/AUD/SGD style)
  const isPrefix = /^[$\u20AC\u00A3\u00A5\u20B9]/.test(symbol) || ['C$', 'A$', 'S$', 'NZ$'].includes(symbol);

  if (isPrefix) {
    return `${symbol} ${formattedValue}`;
  } else {
    return `${formattedValue} ${symbol}`;
  }
};
