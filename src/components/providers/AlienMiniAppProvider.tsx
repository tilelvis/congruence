'use client';

import { useEffect } from 'react';
import { useAlienBridge } from '@/hooks/use-alien-bridge';
import { useGameStore } from '@/store/gameStore';

export function AlienMiniAppProvider({ children }: { children: React.ReactNode }) {
  const { user, ready, isAlienApp, error, pay } = useAlienBridge();
  const setBridgeState = useGameStore((state) => state.setBridgeState);

  // Sync bridge state into Zustand
  useEffect(() => {
    setBridgeState({
      alienUser: user,
      isAlienApp,
      bridgeReady: ready,
      bridgeError: error,
    });
  }, [user, ready, isAlienApp, error, setBridgeState]);

  // Expose the real bridge pay() to the store once ready
  // We wrap it to handle the recipient difference safely
  useEffect(() => {
    if (ready && typeof pay === 'function') {
      const wrappedPay = async (params: {
        invoice: string;
        recipient?: string;
        amount: string;
        token?: string;
        network?: string;
        memo?: string;
      }) => {
        // Ensure recipient is always a string for the bridge
        const bridgeParams = {
          ...params,
          recipient: params.recipient ?? '', // fallback to empty string if undefined
        };

        return pay(bridgeParams);
      };

      useGameStore.setState({ pay: wrappedPay });
      console.log('[AlienMiniAppProvider] Real pay function (wrapped) injected into store');
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
    console.error('[AlienMiniAppProvider] Bridge error:', error);
  }

  return <>{children}</>;
}
