import { format } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import { es } from 'date-fns/locale/es';
import { CURRENCY_SYMBOL } from '../constants';

/**
 * Formats a date string or Date object into a readable format.
 * @param date The date to format (string or Date object).
 * @param dateFormat The desired date format string (default: 'dd MMM yyyy').
 * @returns Formatted date string or 'Fecha inválida' if parsing fails.
 */
export const formatDate = (date: string | Date | undefined | null, dateFormat: string = 'dd MMM yyyy'): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, dateFormat, { locale: es });
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return 'Fecha inválida';
  }
};

/**
 * Formats a number as currency.
 * @param amount The number to format.
 * @param currency The currency symbol (default: 'Bs.').
 * @returns Formatted currency string.
 */
export const formatCurrency = (amount: number | undefined | null, currency: string = CURRENCY_SYMBOL): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currency} 0.00`;
  }
  return `${currency} ${amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Generates a simple unique ID (for client-side use, not cryptographically secure).
 * Useful for temporary list keys or similar. For database IDs, rely on Firestore's auto-generated IDs.
 * @returns A pseudo-unique string.
 */
export const generateClientSideId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Capitalizes the first letter of a string.
 * @param str The string to capitalize.
 * @returns The capitalized string.
 */
export const capitalizeFirstLetter = (str: string | undefined | null): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates a string to a specified length and adds an ellipsis.
 * @param str The string to truncate.
 * @param maxLength The maximum length before truncating.
 * @returns The truncated string with ellipsis, or the original string if shorter than maxLength.
 */
export const truncateString = (str: string | undefined | null, maxLength: number): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

// Add other helper functions as needed, e.g., for data transformation, validation helpers (though dedicated validators.ts might be better for complex validation).