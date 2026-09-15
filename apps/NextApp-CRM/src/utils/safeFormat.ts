import { format } from 'date-fns';
import { timestampToDate } from '../types';

/**
 * Safely format a timestamp or date value for display.
 * Returns 'N/A' if the value is missing or invalid.
 */
export function safeFormat(timestamp: number | string | undefined, fmt: string): string {
  if (!timestamp || isNaN(Number(timestamp))) return 'N/A';
  const date = timestampToDate(Number(timestamp));
  if (!date || isNaN(date.getTime())) return 'N/A';
  return format(date, fmt);
}
