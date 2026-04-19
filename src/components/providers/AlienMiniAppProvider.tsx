'use client';

import { useEffect } from 'react';
import { useAlienBridge } from '@/hooks/use-alien-bridge';
import { useGameStore } from '@/store/gameStore';

export function AlienMiniAppProvider({ children }: { children: React.ReactNode }) {
  const { user, ready, isAlienApp, error } = useAlienBridge();
  const setBridgeState = useGameStore((state) => state.setBridgeState);

  useEffect(() => {
    setBridgeState({
      alienUser: user,
      bridgeReady: ready,
      isAlienApp,
      bridgeError: error,
    });
  }, [user, ready, isAlienApp, error, setBridgeState]);

  if (!ready) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050d18] text-white">
        <div className="mb-8 text-6xl animate-pulse">🛸</div>
        <h2 className="font-orbitron text-xl font-bold tracking-[0.2em] text-cyan-400">
          CONGRUENCE
        </h2>
        <div className="mt-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500" style={{ animationDelay: '0ms' }} />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500" style={{ animationDelay: '200ms' }} />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500" style={{ animationDelay: '400ms' }} />
        </div>
        <p className="mt-6 font-exo2 text-xs uppercase tracking-widest text-slate-500">
          Syncing with Alien Bridge...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
