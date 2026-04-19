'use client';

import { useEffect } from 'react';
import { useAlienBridge } from '@/hooks/use-alien-bridge';
import { useGameStore } from '@/store/gameStore';

export function AlienMiniAppProvider({ children }: { children: React.ReactNode }) {
  const { user, ready, isAlienApp, error, pay } = useAlienBridge();
  const setBridgeState = useGameStore((state) => state.setBridgeState);

  // Sync bridge state (user, ready status, error) into Zustand
  useEffect(() => {
    setBridgeState({
      alienUser: user,
      isAlienApp,
      bridgeReady: ready,
      bridgeError: error,
    });
  }, [user, ready, isAlienApp, error, setBridgeState]);

  // Expose the real bridge pay() function to the store once ready
  // This overwrites the dummy pay() in gameStore
  useEffect(() => {
    if (ready && typeof pay === 'function') {
      useGameStore.setState({ pay });
      console.log('[AlienMiniAppProvider] Real pay function injected into store');
    }
  }, [ready, pay]);

  // Optional: Add haptic feedback example on key events (uncomment if bridge.haptics exists)
  // useEffect(() => {
  //   if (ready && isAlienApp) {
  //     // Example: bridge.haptics?.light() on game actions
  //   }
  // }, [ready, isAlienApp]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050d18] text-white">
        <div className="text-6xl mb-6 animate-pulse">🛸</div>
        <h1 className="text-3xl font-bold tracking-[0.125em] mb-3">CONGRUENCE</h1>
        <p className="text-sm text-gray-400">Connecting to Alien Bridge...</p>
      </div>
    );
  }

  if (error && isAlienApp) {
    console.error('[AlienMiniAppProvider] Bridge error:', error);
    // You can show a fallback UI here if needed
  }

  return <>{children}</>;
}
