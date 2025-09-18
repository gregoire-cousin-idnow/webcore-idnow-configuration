/**
 * Formatting utility functions
 */

/**
 * Formats a date to a localized string
 * @param date - The date to format (string or Date object)
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString(undefined, options);
};

/**
 * Formats a value for display
 * @param value - The value to format
 * @returns Formatted value as a string
 */
export const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  }
  
  return String(value);
};

/**
 * Truncates a string to a specified length
 * @param str - The string to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated string
 */
export const truncateString = (
  str: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (!str || str.length <= maxLength) {
    return str;
  }
  
  return `${str.slice(0, maxLength - suffix.length)}${suffix}`;
};

/**
 * Formats a configuration key for display
 * @param key - The configuration key
 * @returns Formatted key
 */
export const formatConfigKey = (key: string): string => {
  if (!key) return '';
  
  // Remove 'public.' prefix for display
  if (key.startsWith('public.')) {
    return key.substring(7);
  }
  
  return key;
};

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns Capitalized string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
