'use client';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function setPreference(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
}
