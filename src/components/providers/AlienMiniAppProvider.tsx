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

  if
