'use client';

import { useGameStore } from '@/store/gameStore';
import { useAlien } from '@/lib/alienClient';

export function SplashScreen() {
  const { goTo } = useGameStore();
  const { user } = useAlien();

  return (
    <div className="flex-1 flex flex-col items-center justify-between py-10 px-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-3 animate-float">👾</div>
        <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text
          bg-gradient-to-b from-alien-green to-alien-cyan animate-glow">
          CONGRUENCE
        </h1>
        <p className="text-slate-400 text-xs mt-2 tracking-widest uppercase">
          Modular Arithmetic · Deep Space Edition
        </p>
        {user && (
          <p className="text-alien-green/70 text-xs mt-3 font-mono">
            ▸ {user.username ?? user.alienId.slice(0, 12) + '…'}
          </p>
        )}
      </div>

      {/* Main actions */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => goTo('difficulty')}
          className="
            w-full py-4 rounded-2xl font-bold text-lg text-space-950
            bg-gradient-to-r from-alien-green to-alien-cyan
            active:scale-95 transition-transform shadow-lg shadow-alien-green/30
          "
        >
          🚀 LAUNCH GAME
        </button>
        <button
          onClick={() => goTo('wallet')}
          className="
            w-full py-3.5 rounded-2xl font-bold text-alien-purple
            bg-space-800 border border-alien-purple/40
            active:scale-95 transition-transform
          "
        >
          ⚡ GAME WALLET
        </button>
        <button
          onClick={() => goTo('leaderboard')}
          className="
            w-full py-3.5 rounded-2xl font-bold text-alien-gold
            bg-space-800 border border-alien-gold/40
            active:scale-95 transition-transform
          "
        >
          🏆 GALACTIC LEADERBOARD
        </button>
        <button
          onClick={() => goTo('tutorial')}
          className="
            w-full py-3.5 rounded-2xl font-semibold text-slate-300
            bg-space-800 border border-slate-700
            active:scale-95 transition-transform
          "
        >
          📡 HOW TO PLAY
        </button>
      </div>

      {/* Footer */}
      <p className="text-slate-700 text-xs text-center">
        Alien Network · Verified Humans Only
      </p>
    </div>
  );
}
