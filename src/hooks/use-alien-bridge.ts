'use client';

import { useEffect, useState, useCallback } from 'react';

export interface AlienUser {
  alienId:   string;
  token:     string;
  callSign?: string;
}

export interface PaymentResult {
  status:  'paid' | 'failed' | 'cancelled';
  txHash?: string;
  invoice: string;
}

export interface PayParams {
  invoice:   string;
  recipient: string;
  amount:    string;
  token?:    string;
  network?:  string;
  memo?:     string;
}

export function useAlienBridge() {
  const [user, setUser]           = useState<AlienUser | null>(null);
  const [ready, setReady]         = useState(false);
  const [isAlienApp, setIsAlienApp] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prevent multiple initializations
    if (ready) return;

    // The bridge may not be injected instantly —
    // poll for up to 3 seconds before giving up
    let attempts = 0;
    const maxAttempts = 30; // 30 × 100ms = 3 seconds

    const tryConnect = () => {
      attempts++;

      const bridge = (window as any).alien;

      if (!bridge) {
        if (attempts >= maxAttempts) {
          // Genuinely not inside Alien App
          console.warn('[AlienBridge] window.alien not found after 3s — not in Alien App');
          setReady(true);
          setIsAlienApp(false);
        } else {
          // Try again in 100ms
          setTimeout(tryConnect, 100);
        }
        return;
      }

      // Bridge found
      setIsAlienApp(true);
      console.log('[AlienBridge] window.alien found, calling app.ready()');

      // Listen for identity response
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string'
            ? JSON.parse(event.data)
            : event.data;

          if (data?.type === 'app:ready' || data?.type === 'alien:ready') {
            console.log('[AlienBridge] message received:', data?.type, data);
            const payload = data.payload ?? data.data ?? data;

            const alienId = payload.alienId
              ?? payload.alien_id
              ?? payload.userId
              ?? payload.sub;

            const token = payload.token
              ?? payload.jwt
              ?? payload.accessToken;

            if (!alienId) {
              console.error('[AlienBridge] app:ready fired but no alienId in payload', payload);
              setError('Bridge connected but no alienId received');
              setReady(true);
              return;
            }

            console.log('[AlienBridge] Got alienId:', alienId);

            setUser({
              alienId,
              token:    token ?? '',
              callSign: payload.callSign ?? payload.username ?? payload.name,
            });
            setReady(true);
            window.removeEventListener('message', handleMessage);
          }
        } catch {
          // non-JSON messages are normal, ignore
        }
      };

      window.addEventListener('message', handleMessage);

      // Signal ready — this triggers the identity response
      try {
        if (bridge.app?.ready) {
          bridge.app.ready();
        } else if (typeof bridge.ready === 'function') {
          bridge.ready();
        } else if (typeof bridge.init === 'function') {
          bridge.init();
        } else {
          console.warn('[AlienBridge] No standard ready() method found on bridge');
        }
      } catch (e) {
        console.error('[AlienBridge] app.ready() threw:', e);
      }

      // Safety timeout — if no response in 5s, something is wrong
      setTimeout(() => {
        // Use a functional update or just check the ref-like state if it was a ref,
        // but here we just check if it's still not ready
        setReady(currentReady => {
          if (!currentReady && (window as any).alien) {
            console.error('[AlienBridge] No identity response after 5s');
            setError('Alien App did not respond with identity');
            return true;
          }
          return currentReady;
        });
      }, 5000);
    };

    tryConnect();
  }, [ready]);

  const haptic = useCallback((style: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'medium') => {
    const bridge = (window as any).alien;
    try {
      if (bridge?.haptics?.vibrate) {
        bridge.haptics.vibrate(style);
      } else if (bridge?.hapticFeedback) {
        bridge.hapticFeedback(style);
      }
    } catch (e) {
      console.warn('[AlienBridge] Haptic failed', e);
    }
  }, []);

  const pay = useCallback((params: PayParams): Promise<PaymentResult> => {
    return new Promise((resolve) => {
      const bridge = (window as any).alien;

      if (!bridge) {
        console.error('[AlienBridge] pay() called but window.alien not available');
        resolve({ status: 'failed', invoice: params.invoice });
        return;
      }

      console.log('[AlienBridge] Initiating payment:', params);

      // Listen for payment response
      const handlePayment = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string'
            ? JSON.parse(event.data)
            : event.data;

          console.log('[AlienBridge] payment message:', data?.type, data);

          // Handle multiple possible event type names
          const isPaymentResponse = (
            data?.type === 'payment:response' ||
            data?.type === 'payment:result' ||
            data?.type === 'alien:payment'
          );

          // Match by invoice OR just take first payment response
          const matchesInvoice = !data?.payload?.invoice
            || data?.payload?.invoice === params.invoice;

          if (isPaymentResponse && matchesInvoice) {
            window.removeEventListener('message', handlePayment);

            const payload = data.payload ?? data;
            const status  = payload.status ?? (payload.success ? 'paid' : 'failed');

            console.log('[AlienBridge] Payment result:', status, payload.txHash);

            if (status === 'paid') {
              haptic('success');
            } else if (status === 'failed') {
              haptic('error');
            }

            resolve({
              status:  status as PaymentResult['status'],
              txHash:  payload.txHash ?? payload.tx_hash ?? payload.transactionId,
              invoice: params.invoice,
            });
          }
        } catch {
          // ignore
        }
      };

      window.addEventListener('message', handlePayment);

      // Trigger the native payment sheet
      try {
        const payMethod = bridge.payment?.pay ?? bridge.pay;
        if (typeof payMethod === 'function') {
          payMethod({
            invoice:   params.invoice,
            recipient: params.recipient,
            amount:    params.amount,
            token:     params.token  ?? 'ALN',
            network:   params.network ?? 'alien',
            memo:      params.memo,
          });
        } else {
           throw new Error('No pay method found on bridge');
        }
      } catch (e) {
        console.error('[AlienBridge] payment.pay() threw:', e);
        window.removeEventListener('message', handlePayment);
        resolve({ status: 'failed', invoice: params.invoice });
      }

      // Timeout if no response in 2 minutes (user abandoned)
      setTimeout(() => {
        window.removeEventListener('message', handlePayment);
        resolve({ status: 'cancelled', invoice: params.invoice });
      }, 120_000);
    });
  }, [haptic]);

  return { user, ready, isAlienApp, error, pay, haptic };
}
