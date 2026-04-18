'use client';

import { useGameStore } from '@/store/gameStore';
import { validatePuzzle } from '@/lib/puzzleSolver';
import { cn } from '@/lib/utils';
import { buzz } from '@/lib/alienClient';

export function GameGrid() {
  const { puzzle, selectedCell, selectCell } = useGameStore();
  if (!puzzle) return null;

  const { size, grid, cages } = puzzle;
  const validation = validatePuzzle(puzzle);

  // Cell size calculation for mobile
  const cellPx = Math.min(42, Math.floor((343) / size));

  const cageBounds: Record<number, { minR: number; minC: number }> = {};
  for (const cage of cages) {
    const rows = cage.cells.map(c => c.row);
    const cols = cage.cells.map(c => c.col);
    cageBounds[cage.id] = {
      minR: Math.min(...rows),
      minC: Math.min(...cols),
    };
  }

  return (
    <div
      className="relative grid gap-[2px] bg-space-700 p-[2px] rounded-xl"
      style={{ gridTemplateColumns: `repeat(${size}, ${cellPx}px)` }}
    >
      {grid.map((row, ri) =>
        row.map((cell, ci) => {
          const cage = cages.find(c => c.cells.some(cc => cc.row === ri && cc.col === ci));
          const isSelected = selectedCell?.row === ri && selectedCell?.col === ci;
          const isOrigin = cage && cageBounds[cage.id].minR === ri && cageBounds[cage.id].minC === ci;
          const displayVal = cell.playerValue || cell.value;
          const isError = validation.errors.some(e => e.row === ri && e.col === ci);
          const cageStatus = cage
            ? validation.satisfiedCages.includes(cage.id) ? 'satisfied'
            : validation.violatedCages.includes(cage.id) ? 'violated'
            : 'pending'
            : 'pending';

          return (
            <button
              key={`${ri}-${ci}`}
              onClick={() => {
                if (!cell.isGiven) { selectCell(ri, ci); buzz('light'); }
              }}
              disabled={cell.isGiven}
              style={{
                width: cellPx, height: cellPx,
                borderColor: cage
                  ? cageStatus === 'satisfied' ? '#10b981'
                  : cageStatus === 'violated' ? '#ef4444'
                  : `${cage.color}60`
                  : '#334155',
                borderWidth: cage ? 2 : 1,
              }}
              className={cn(
                'relative flex items-center justify-center rounded-md',
                'font-bold transition-all duration-100',
                'focus:outline-none',
                cell.isGiven  && 'bg-space-700 cursor-default',
                !cell.isGiven && !isSelected && 'bg-space-800',
                isSelected    && 'bg-space-600 ring-2 ring-alien-blue',
                isError       && 'bg-red-900/60',
              )}
            >
              <span
                className={cn(
                  'text-base leading-none',
                  cell.isGiven  && 'text-slate-200 font-extrabold',
                  !cell.isGiven && displayVal && 'text-alien-cyan',
                  isError       && 'text-red-400',
                )}
                style={{ fontSize: Math.max(12, cellPx * 0.44) }}
              >
                {displayVal || ''}
              </span>

              {isOrigin && cage && (
                <span
                  className="absolute top-0 left-0 text-[8px] font-bold leading-tight px-0.5 rounded-br-sm rounded-tl-sm text-white z-10"
                  style={{ backgroundColor: cage.color, fontSize: Math.max(7, cellPx * 0.18) }}
                >
                  ≡{cage.remainder}({cage.modulus})
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
