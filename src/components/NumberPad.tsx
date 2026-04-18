'use client';

import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { buzz } from '@/lib/alienClient';
import { useAlien } from '@alien_org/react';

export function NumberPad() {
  const { puzzle, enterNumber, clearCell, useHint, undo, freeHintsRemaining, alienTokenBalance } = useGameStore();
  const { user } = useAlien();

  if (!puzzle) return null;

  const nums = Array.from({ length: puzzle.size }, (_, i) => i + 1);
  const cols = puzzle.size <= 6 ? puzzle.size : Math.ceil(puzzle.size / 2);

  const isHintAffordable = freeHintsRemaining > 0 || alienTokenBalance >= 10;

  return (
    <div className="bg-space-900 border-t border-space-700 px-3 pt-3 pb-4">
      {/* Number buttons */}
      <div
        className="grid gap-2 mb-3"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {nums.map(n => (
          <button
            key={n}
            onClick={() => { enterNumber(n); buzz('light'); }}
            className="
              h-12 rounded-xl font-bold text-lg
              bg-space-700 text-white border border-space-600
              active:scale-90 active:bg-alien-blue transition-all
            "
          >
            {n}
          </button>
        ))}
      </div>

      {/* Action row */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => { clearCell(); buzz('light'); }}
          className="h-11 rounded-xl text-sm font-semibold text-slate-400 bg-space-800 border border-space-700 active:scale-90 transition-all"
        >
          ✕ Clear
        </button>
        <button
          onClick={() => { undo(); buzz('light'); }}
          className="h-11 rounded-xl text-sm font-semibold text-slate-400 bg-space-800 border border-space-700 active:scale-90 transition-all"
        >
          ↺ Undo
        </button>
        <button
          onClick={() => {
            useHint(user?.alienId || 'dummy-user-id');
            buzz('medium');
          }}
          disabled={!isHintAffordable}
          className={cn(
            "h-11 rounded-xl text-sm font-bold border active:scale-90 transition-all",
            isHintAffordable
              ? "text-alien-gold bg-space-800 border-alien-gold/30"
              : "text-slate-600 bg-space-900 border-space-800 opacity-50 cursor-not-allowed"
          )}
        >
          {freeHintsRemaining > 0 ? `💡 Hint (${freeHintsRemaining})` : `💡 Hint (10 🪙)`}
        </button>
      </div>
    </div>
  );
}
