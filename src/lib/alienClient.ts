'use client';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error';

export function buzz(type: HapticType = 'light') {
  if (typeof window !== 'undefined') {
    const bridge = (window as any).alien;
    try {
      if (bridge?.haptics?.vibrate) {
        bridge.haptics.vibrate(type);
      } else if (bridge?.hapticFeedback) {
        bridge.hapticFeedback(type);
      }
    } catch (e) {
      console.warn('[AlienBridge] buzz failed', e);
    }
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

export function shareScore(score: number, difficulty: string, size: number) {
  const path = `/congruence?score=${score}&diff=${difficulty}&size=${size}`;
  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({
      title: '🛸 CONGRUENCE',
      text: `I scored ${score} on ${difficulty} (${size}×${size})! Beat me on Alien.`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}${path}`,
    });
  }
}
