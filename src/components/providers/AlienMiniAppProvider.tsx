'use client';

import { useEffect } from 'react';
import { useAlienBridge } from '@/hooks/use-alien-bridge';
import { useGameStore } from '@/store/gameStore';

export function AlienMiniAppProvider({ children }: { children: React.ReactNode }) {
  const { user, ready, isAlienApp, error, pay } = useAlienBridge();
  const setBridgeState = useGameStore((state) => state.setBridgeState);

  // Sync Alien Bridge state (user, ready, error, etc.) into Zustand store
  useEffect(() => {
    setBridgeState({
      alienUser: user,
      isAlienApp,
      bridgeReady: ready,
      bridgeError: error,
    });
  }, [user, ready, isAlienApp, error, setBridgeState]);

  // Inject the real pay() function from the bridge into the store once ready
  useEffect(() => {
    if (ready && typeof pay === 'function') {
      useGameStore.setState({ pay });
      console.log('[AlienMiniAppProvider] ✅ Real Alien pay function injected into store');
    }
  }, [ready, pay]);

  // Loading screen while connecting to Alien Bridge
  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050d18] text-white">
        <div className="text-6xl mb-6 animate-pulse">🛸</div>
        <h1 className="text-3xl font-bold tracking-[0.125em] mb-3">CONGRUENCE</h1>
        <p className="text-sm text-gray-400">Connecting to Alien Bridge...</p>
      </div>
    );
  }

  // Optional: log errors when running inside Alien app
  if (error && isAlienApp) {
    console.error('[AlienMiniAppProvider] Bridge error:', error);
  }

  return <>{children}</>;
}
