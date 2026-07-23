import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a date string or Date object into a readable format.
 * @param {string|Date} dateInput
 * @param {string} pattern - date-fns format pattern, default 'dd MMM yyyy'
 */
export function formatDate(dateInput, pattern = 'dd MMM yyyy') {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return '';
  return format(date, pattern);
}
