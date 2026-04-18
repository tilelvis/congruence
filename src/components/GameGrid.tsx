// src/components/GameGrid.tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { validatePuzzle } from '@/lib/puzzleSolver';
import { buzz } from '@/lib/alienClient';
import { useEffect, useState } from 'react';

export function GameGrid() {
  const { puzzle, selectedCell, selectCell } = useGameStore();
  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!puzzle) return null;

  const { size, grid, cages } = puzzle;
  const validation = validatePuzzle(puzzle);

  // Responsive cell size: fit within ~92vw, max 46px
  const maxWidth = Math.min(windowWidth ?? 375, 375) - 32;
  const cellPx = Math.floor(Math.min(46, maxWidth / size));
  const gap = 3;

  const cageBounds: Record<number, { minR: number; minC: number }> = {};
  for (const cage of cages) {
    const rows = cage.cells.map(c => c.row);
    const cols = cage.cells.map(c => c.col);
    cageBounds[cage.id] = { minR: Math.min(...rows), minC: Math.min(...cols) };
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${cellPx}px)`,
        gap,
        padding: 6,
        background: 'rgba(10,22,40,0.8)',
        borderRadius: 16,
        border: '1px solid rgba(0,255,136,0.12)',
        boxShadow: '0 0 40px rgba(0,255,136,0.06), inset 0 0 40px rgba(0,0,0,0.3)',
      }}
    >
      {grid.map((row, ri) =>
        row.map((cell, ci) => {
          const cage = cages.find(c => c.cells.some(cc => cc.row === ri && cc.col === ci));
          const isSelected = selectedCell?.row === ri && selectedCell?.col === ci;
          const isOrigin = cage && cageBounds[cage.id]?.minR === ri && cageBounds[cage.id]?.minC === ci;
          const displayVal = cell.playerValue || cell.value;
          const isError = validation.errors.some(e => e.row === ri && e.col === ci);
          const cageStatus = cage
            ? validation.satisfiedCages.includes(cage.id) ? 'ok'
            : validation.violatedCages.includes(cage.id) ? 'bad' : 'pending'
            : 'pending';

          // Cell background
          let bg = 'rgba(15,32,64,0.9)';
          if (cell.isGiven) bg = 'rgba(5,13,24,0.95)';
          if (isSelected) bg = 'rgba(22,48,88,1)';
          if (isError) bg = 'rgba(80,10,10,0.9)';

          // Border color
          let borderColor = cage ? cage.color + '55' : 'rgba(22,48,88,0.8)';
          if (cageStatus === 'ok') borderColor = '#10b98166';
          if (cageStatus === 'bad') borderColor = '#ef444466';
          if (isSelected) borderColor = '#3b82f6';

          // Number color
          let numColor = '#06b6d4';
          if (cell.isGiven) numColor = 'rgba(255,255,255,0.9)';
          if (isError) numColor = '#ef4444';

          const fontSize = Math.max(13, Math.floor(cellPx * 0.44));

          return (
            <button
              key={`${ri}-${ci}`}
              onClick={() => { if (!cell.isGiven) { selectCell(ri, ci); buzz('light'); } }}
              disabled={cell.isGiven}
              style={{
                position: 'relative',
                width: cellPx,
                height: cellPx,
                background: bg,
                border: `2px solid ${borderColor}`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: cell.isGiven ? 'default' : 'pointer',
                transition: 'background 0.12s, border-color 0.12s, box-shadow 0.12s',
                boxShadow: isSelected
                  ? '0 0 0 2px #3b82f6, 0 0 16px rgba(59,130,246,0.5), inset 0 0 8px rgba(59,130,246,0.1)'
                  : cageStatus === 'ok'
                  ? '0 0 8px rgba(16,185,129,0.2)'
                  : 'none',
                // Subtle inner gradient for depth
                backgroundImage: isSelected
                  ? 'linear-gradient(135deg, rgba(59,130,246,0.15), transparent)'
                  : cell.isGiven
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.03), transparent)'
                  : 'none',
              }}
            >
              {/* Number */}
              <span style={{
                fontFamily: 'var(--font-orbitron), monospace',
                fontSize,
                fontWeight: cell.isGiven ? 900 : 700,
                color: numColor,
                lineHeight: 1,
                textShadow: !cell.isGiven && displayVal
                  ? `0 0 8px ${numColor}80`
                  : 'none',
                letterSpacing: '-0.02em',
              }}>
                {displayVal || ''}
              </span>

              {/* Cage label — top-left corner */}
              {isOrigin && cage && (
                <span style={{
                  position: 'absolute',
                  top: 1,
                  left: 1,
                  fontSize: Math.max(6, Math.floor(cellPx * 0.17)),
                  fontFamily: 'var(--font-orbitron), monospace',
                  fontWeight: 700,
                  color: '#fff',
                  background: cage.color,
                  borderRadius: '3px 0 3px 0',
                  padding: '1px 3px',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  zIndex: 2,
                  boxShadow: `0 0 6px ${cage.color}80`,
                }}>
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
