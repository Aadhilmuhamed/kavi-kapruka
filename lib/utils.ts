import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as an LKR-style price string. */
export function formatPrice(value: number, currency = 'LKR'): string {
  const n = Number.isFinite(value) ? value : 0;
  return `${currency} ${n.toLocaleString()}`;
}
