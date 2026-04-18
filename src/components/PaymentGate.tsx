'use client';

import { useState, useEffect } from 'react';
import { useAlien, requestPayment } from '@alien-id/miniapp-sdk';
import { buzz } from '@/lib/alienClient';

const FREE_TRIALS = Number(process.env.NEXT_PUBLIC_FREE_TRIALS || 3);
const TRIAL_COST = Number(process.env.NEXT_PUBLIC_TRIAL_COST_TOKENS || 5);
const STORAGE_KEY = 'congruence_trials';

interface TrialData {
  used: number;
  purchased: number;
  date: string; // YYYY-MM-DD
  paidSignatures: string[];
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function loadTrials(): TrialData {
  if (typeof window === 'undefined') return { used: 0, purchased: 0, date: getTodayKey(), paidSignatures: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('no data');
    const data: TrialData = JSON.parse(raw);
    // Reset daily free trials at midnight
    if (data.date !== getTodayKey()) {
      return { used: 0, purchased: data.purchased, date: getTodayKey(), paidSignatures: data.paidSignatures };
    }
    return data;
  } catch {
    return { used: 0, purchased: 0, date: getTodayKey(), paidSignatures: [] };
  }
}

function saveTrials(data: TrialData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface Props {
  onTrialGranted: () => void;
  children: React.ReactNode;
}

export function PaymentGate({ onTrialGranted, children }: Props) {
  const { user, isReady } = useAlien();
  const [trials, setTrials] = useState<TrialData | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    if (isReady) {
      const t = loadTrials();
      setTrials(t);
    }
  }, [isReady]);

  const remaining = trials
    ? Math.max(0, FREE_TRIALS - trials.used) + trials.purchased
    : FREE_TRIALS;
  const hasTrials = remaining > 0;

  async function handlePurchase() {
    if (!user?.walletAddress) {
      setError('Connect your Alien wallet to purchase trials.');
      return;
    }
    setPaying(true);
    setError(null);

    try {
      await requestPayment({
        amount: TRIAL_COST,
        tokenMint: process.env.NEXT_PUBLIC_ALIENCOIN_MINT!,
        recipient: process.env.NEXT_PUBLIC_TREASURY_WALLET!,
        memo: `Congruence: 5 trial pack (${user.alienId})`,
        onSuccess: async (txSignature: string) => {
          // Verify on server
          const res = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              txSignature,
              alienId: user.alienId,
              walletAddress: user.walletAddress
            }),
          });
          const data = await res.json();

          if (data.valid) {
            const updated = {
              ...trials!,
              purchased: (trials?.purchased || 0) + 5,
              paidSignatures: [...(trials?.paidSignatures || []), txSignature],
            };
            saveTrials(updated);
            setTrials(updated);
            setShowGate(false);
            buzz('success');
          } else {
            setError('Payment verified failed. Contact support.');
            buzz('error');
          }
          setPaying(false);
        },
        onError: (err: Error) => {
          setError(err.message || 'Payment cancelled.');
          buzz('error');
          setPaying(false);
        },
      });
    } catch (err) {
      setError('Payment request failed. Try again.');
      buzz('error');
      setPaying(false);
    }
  }

  if (!isReady || !trials) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-alien-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If player has trials available, just show the game
  if (!showGate) {
    return (
      <div className="contents">
        {/* Trial counter pill */}
        <div className="absolute top-3 right-14 z-20">
          <button
            onClick={() => { if (!hasTrials) setShowGate(true); }}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
              ${hasTrials
                ? 'bg-alien-green/20 text-alien-green border border-alien-green/40'
                : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
              }
            `}
          >
            <span>🛸</span>
            <span>{remaining} trial{remaining !== 1 ? 's' : ''}</span>
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Payment gate overlay
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/90 backdrop-blur-sm">
      <div className="w-full max-w-xs bg-space-800 border border-alien-purple/40 rounded-2xl p-6 text-center">
        {/* Alien icon */}
        <div className="text-5xl mb-4 animate-float">🛸</div>

        <h2 className="text-xl font-bold text-alien-green mb-2">TRIAL PACK</h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          You've used all your free trials for today.
          Get <span className="text-white font-bold">5 more puzzles</span> to keep
          decoding transmissions.
        </p>

        <div className="bg-space-900 rounded-xl p-4 mb-6 border border-alien-gold/30">
          <div className="text-2xl font-bold text-alien-gold">{TRIAL_COST} Aliencoin</div>
          <div className="text-xs text-slate-500 mt-1">≈ 5 additional puzzles</div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 mb-4 text-red-400 text-xs">
            {error}
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={paying}
          className="
            w-full py-3.5 rounded-xl font-bold text-space-950
            bg-alien-green hover:bg-alien-green/90
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all active:scale-95
          "
        >
          {paying ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-space-950 border-t-transparent rounded-full animate-spin" />
              Authorizing...
            </span>
          ) : (
            `Purchase ${TRIAL_COST} Aliencoin`
          )}
        </button>

        <button
          onClick={() => setShowGate(false)}
          className="w-full mt-3 py-2.5 text-slate-500 text-sm hover:text-slate-300 transition-colors"
        >
          Maybe later
        </button>

        <p className="text-xs text-slate-600 mt-4">
          Free trials reset daily at midnight 🌙
          <br/>Daily free trials: {FREE_TRIALS}
        </p>
      </div>
    </div>
  );
}

// Hook for consuming a trial when starting a game
export function useTrialGate() {
  function canPlay(): boolean {
    const t = loadTrials();
    return Math.max(0, FREE_TRIALS - t.used) + t.purchased > 0;
  }

  function consumeTrial(): boolean {
    const t = loadTrials();
    const remaining = Math.max(0, FREE_TRIALS - t.used) + t.purchased;
    if (remaining <= 0) return false;

    if (t.used < FREE_TRIALS) {
      saveTrials({ ...t, used: t.used + 1 });
    } else {
      saveTrials({ ...t, purchased: Math.max(0, t.purchased - 1) });
    }
    return true;
  }

  return { canPlay, consumeTrial };
}
