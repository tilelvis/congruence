'use client';

import { useEffect } from 'react';
import { useAlienBridge } from '@/hooks/use-alien-bridge';
import { useGameStore } from '@/store/gameStore';

export function AlienMiniAppProvider({ children }: { children: React.ReactNode }) {
  const { user, ready, isAlienApp, error, pay } = useAlienBridge();
  const setBridgeState = useGameStore((state) => state.setBridgeState);

  // Debug log so you can see what's happening
  useEffect(() => {
    console.log('[AlienProvider]', { 
      ready, 
      isAlienApp, 
      hasUser: !!user, 
      alienId: user?.alienId || 'NO ID',
      error 
    });
  }, [ready, isAlienApp, user, error]);

  // Sync everything to store
  useEffect(() => {
    setBridgeState({
      alienUser: user,
      isAlienApp,
      bridgeReady: ready,
      bridgeError: error,
    });
  }, [user, ready, isAlienApp, error, setBridgeState]);

  // Inject real pay function into store
  useEffect(() => {
    if (ready && typeof pay === 'function') {
      useGameStore.setState({ pay });
      console.log('[AlienMiniAppProvider] ✅ Real Alien pay() injected');
    }
  }, [ready, pay]);

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
    console.error('[AlienProvider] Bridge error:', error);
  }

  return <>{children}</>;
}
