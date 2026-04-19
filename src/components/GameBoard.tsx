// src/components/GameBoard.tsx
'use client';

import { GameGrid } from './GameGrid';
import { NumberPad } from './NumberPad';
import { GameHUD } from './GameHUD';

export function GameBoard() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <GameHUD />
      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        <GameGrid />
      </div>
      <NumberPad />
    </div>
  );
}
