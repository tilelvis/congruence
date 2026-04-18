'use client';

import { useGameStore } from '@/store/gameStore';
import { formatTime, formatScore } from '@/lib/utils';

export function GameHUD() {
  const { elapsed, score, hints, errors, puzzle, goTo } = useGameStore();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-space-900/80 backdrop-blur border-b border-space-700">
      {/* Back */}
      <button
        onClick={() => goTo('splash')}
        className="text-slate-500 font-mono text-sm active:text-white transition-colors"
      >
        ✕
      </button>

      {/* Timer */}
      <div className="font-mono text-lg text-alien-cyan tabular-nums">
        ⏱ {formatTime(elapsed)}
      </div>

      {/* Score */}
      <div className="font-mono text-base text-alien-gold tabular-nums">
        {formatScore(score > 0 ? score : Math.floor(1000 * ((puzzle?.size ?? 5) / 5)))}
      </div>

      {/* Hints & Errors */}
      <div className="flex gap-3 text-xs font-mono">
        <span className="text-amber-400">💡{hints}</span>
        <span className="text-red-400">✗{errors}</span>
      </div>
    </div>
  );
}
