// src/components/GameBoard.tsx
'use client';

import { GameGrid } from './GameGrid';
import { NumberPad } from './NumberPad';
import { GameHUD } from './GameHUD';

export function GameBoard() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <GameHUD />
      {/* CRITICAL: flex-1 + align/justify center to prevent floating top */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        overflow: 'hidden',
      }}>
        <GameGrid />
      </div>
      <NumberPad />
    </div>
  );
}
