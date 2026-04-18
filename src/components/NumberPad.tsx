'use client';

import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { buzz } from '@/lib/alienClient';

export function NumberPad() {
  const { puzzle, enterNumber, clearCell, useHint, undo } = useGameStore();
  if (!puzzle) return null;

  const nums = Array.from({ length: puzzle.size }, (_, i) => i + 1);
  const cols = puzzle.size <= 6 ? puzzle.size : Math.ceil(puzzle.size / 2);

  function tap(fn: () => void, type: 'light' | 'medium' = 'light') {
    return () => { fn(); buzz(type); };
  }

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
            onClick={tap(() => enterNumber(n))}
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
          onClick={tap(clearCell)}
          className="h-11 rounded-xl text-sm font-semibold text-slate-400 bg-space-800 border border-space-700 active:scale-90 transition-all"
        >
          ✕ Clear
        </button>
        <button
          onClick={tap(undo)}
          className="h-11 rounded-xl text-sm font-semibold text-slate-400 bg-space-800 border border-space-700 active:scale-90 transition-all"
        >
          ↺ Undo
        </button>
        <button
          onClick={tap(() => useHint(), 'medium')}
          className="h-11 rounded-xl text-sm font-bold text-alien-gold bg-space-800 border border-alien-gold/30 active:scale-90 transition-all"
        >
          💡 Hint
        </button>
      </div>
    </div>
  );
}
