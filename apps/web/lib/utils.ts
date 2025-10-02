import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isTokenExpired = (
  expiresAt: string | null | undefined
): boolean => {
  if (!expiresAt) {
    return false;
  }
  return new Date(expiresAt) < new Date();
};
