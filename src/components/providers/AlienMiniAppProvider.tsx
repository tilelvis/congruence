'use client';

import { useEffect } from 'react';
import { useAlienBridge } from '@/hooks/use-alien-bridge';
import { useGameStore } from '@/store/gameStore';

export function AlienMiniAppProvider({ children }: { children: React.ReactNode }) {
  const { user, ready, isAlienApp, error, pay, haptic } = useAlienBridge();
  const setBridgeState = useGameStore((state) => state.setBridgeState);

  // Sync everything to Zustand
  useEffect(() => {
    setBridgeState({
      alienUser: user,
      isAlienApp,
      bridgeReady: ready,
      bridgeError: error,
    });
  }, [user, ready, isAlienApp, error, setBridgeState]);

  // Expose the real pay function to the store
  useEffect(() => {
    if (ready && pay) {
      useGameStore.setState({ pay });
    }
  }, [ready, pay]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050d18] text-white">
        <div className="text-6xl mb-4">🛸</div>
        <h1 className="text-2xl font-bold tracking-widest mb-2">CONGRUENCE</h1>
        <p className="text-sm text-gray-400">Syncing with Alien Bridge...</p>
      </div>
    );
  }

  if (error) {
    console.error('[AlienMiniAppProvider]', error);
  }

  return <>{children}</>;
}
