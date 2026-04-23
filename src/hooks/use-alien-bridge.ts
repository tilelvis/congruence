'use client';

import { useEffect, useState, useCallback } from 'react';

interface AlienUser {
  alienId:   string;
  token:     string;
  callSign?: string;
}

interface PaymentResult {
  status:  'paid' | 'failed' | 'cancelled';
  txHash?: string;
  invoice: string;
}

export function useAlienBridge() {
  const [user, setUser]           = useState<AlienUser | null>(null);
  const [ready, setReady]         = useState(false);
  const [isAlienApp, setIsAlienApp] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds total

    const tryConnect = () => {
      attempts++;

      // Try multiple possible bridge objects used by Alien mini-apps
      const possibleBridges = [
        (window as any).alien,
        (window as any).__miniAppsBridge__,
        (window as any).alienBridge,
        (window as any).bridge,
      ];

      const bridge = possibleBridges.find(b => !!b);

      if (!bridge) {
        if (attempts >= maxAttempts) {
          console.warn('[AlienBridge] No bridge found after 5s — not in Alien App');
          setReady(true);
          setIsAlienApp(false);
        } else {
          setTimeout(tryConnect, 100);
        }
        return;
      }

      setIsAlienApp(true);
      console.log('[AlienBridge] Bridge found:', Object.keys(bridge).slice(0, 10));

      // Listen for ready/identity messages (try multiple event types)
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          console.log('[AlienBridge] Message received:', data?.type || 'no type', data);

          if (data?.type?.includes('ready') || data?.type === 'identity' || data?.type === 'app:ready') {
            const payload = data.payload ?? data.data ?? data;

            const alienId = payload.alienId ?? payload.alien_id ?? payload.userId ?? payload.sub ?? payload.id;
            const token = payload.token ?? payload.jwt ?? payload.accessToken ?? payload.sessionToken;

            if (alienId) {
              console.log('[AlienBridge] ✅ Got real Alien ID:', alienId);
              setUser({
                alienId,
                token: token ?? '',
                callSign: payload.callSign ?? payload.username ?? payload.name,
              });
              setReady(true);
              window.removeEventListener('message', handleMessage);
              return;
            }
          }
        } catch (e) {
          // ignore non-JSON messages
        }
      };

      window.addEventListener('message', handleMessage);

      // Try multiple ways to signal ready
      try {
        bridge.app?.ready?.() || bridge.ready?.() || bridge.init?.() || bridge.connect?.();
        console.log('[AlienBridge] Called ready/init on bridge');
      } catch (e) {
        console.warn('[AlienBridge] ready() call failed, trying alternatives');
      }

      // Safety timeout
      setTimeout(() => {
        if (!user) {
          setError('No identity received from Alien');
          setReady(true);
          window.removeEventListener('message', handleMessage);
        }
      }, 6000);
    };

    tryConnect();
  }, []);

  const pay = useCallback((params: {
    invoice: string;
    recipient: string;
    amount: string;
    token?: string;
    network?: string;
    memo?: string;
  }): Promise<PaymentResult> => {
    return new Promise((resolve) => {
      const bridge = (window as any).alien || (window as any).__miniAppsBridge__ || (window as any).alienBridge;

      if (!bridge) {
        resolve({ status: 'failed', invoice: params.invoice });
        return;
      }

      const handlePayment = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data?.type?.includes('payment') || data?.type === 'result') {
            window.removeEventListener('message', handlePayment);
            const payload = data.payload ?? data;
            resolve({
              status: (payload.status ?? (payload.success ? 'paid' : 'failed')) as any,
              txHash: payload.txHash ?? payload.tx_hash,
              invoice: params.invoice,
            });
          }
        } catch {}
      };

      window.addEventListener('message', handlePayment);

      try {
        bridge.payment?.pay?.(params) || bridge.pay?.(params);
      } catch (e) {
        console.error('[AlienBridge] pay failed:', e);
        resolve({ status: 'failed', invoice: params.invoice });
      }

      setTimeout(() => {
        window.removeEventListener('message', handlePayment);
        resolve({ status: 'cancelled', invoice: params.invoice });
      }, 120000);
    });
  }, []);

  return { user, ready, isAlienApp, error, pay };
              }
