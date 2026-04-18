'use client';

import { useAlien, hapticFeedback, openDeepLink } from '@alien-id/miniapp-sdk';

/**
 * Detect if running inside the Alien app frame.
 * Falls back gracefully in browser dev mode.
 */
export function isAlienApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.navigator.userAgent.includes('AlienApp') ||
    (window as typeof window & { __ALIEN_CONTEXT__?: unknown }).__ALIEN_CONTEXT__ !== undefined ||
    new URLSearchParams(window.location.search).has('alien_context')
  );
}

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error';

/**
 * Wrapper: vibrate on mobile if supported, then trigger Alien haptics
 */
export function buzz(type: HapticType = 'light') {
  try {
    hapticFeedback(type);
  } catch (_) {
    // Not in Alien app — silently skip
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      medium: 30,
      heavy: 60,
      success: [10, 50, 10],
      error: [50, 20, 50]
    };
    navigator.vibrate(patterns[type]);
  }
}

/**
 * Share a score result as a deep link back into Alien
 */
export function shareScore(score: number, difficulty: string, size: number) {
  const path = `/congruence?score=${score}&diff=${difficulty}&size=${size}`;
  try {
    openDeepLink(path);
  } catch (_) {
    // Fallback for browser
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: '🛸 CONGRUENCE',
        text: `I scored ${score} on ${difficulty} (${size}×${size})! Beat me on Alien.`,
        url: `${process.env.NEXT_PUBLIC_APP_URL}${path}`,
      });
    }
  }
}

export { useAlien };
