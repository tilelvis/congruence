import { create } from 'zustand';
import { generatePuzzle, type Puzzle } from '@/lib/puzzleGenerator';
import { isSolved, getHint } from '@/lib/puzzleSolver';
import { calculateScore } from '@/lib/scoreVerification';
import { persist } from 'zustand/middleware';
import { type AlienUser } from '@/hooks/use-alien-bridge';

export type Screen = 'splash' | 'difficulty' | 'game' | 'victory' | 'leaderboard' | 'tutorial' | 'wallet';

interface HistoryEntry {
  row: number;
  col: number;
  prev: number;
}

interface GameState {
  screen: Screen;
  puzzle: Puzzle | null;
  selectedCell: { row: number; col: number } | null;
  elapsed: number;
  hints: number;
  errors: number;
  score: number;
  history: HistoryEntry[];
  isTimerRunning: boolean;

  // Economy & Progression
  freeHintsRemaining: number;
  alienTokenBalance: number;
  level: number;
  gameNumber: number;

  // Alien Bridge State
  alienUser: AlienUser | null;
  isAlienApp: boolean;
  bridgeReady: boolean;
  bridgeError: string | null;

  // Actions
  goTo: (screen: Screen) => void;
  startGame: (size?: number, difficulty?: string) => void;
  selectCell: (row: number, col: number) => void;
  enterNumber: (num: number) => void;
  clearCell: () => void;
  useHint: (alienId: string) => Promise<void>;
  undo: () => void;
  tick: () => void;
  finishGame: () => void;
  nextLevel: () => void;
  resetAll: () => void;
  addTokens: (amount: number) => void;
  setBridgeState: (state: Partial<Pick<GameState, 'alienUser' | 'isAlienApp' | 'bridgeReady' | 'bridgeError'>>) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      screen: 'splash',
      puzzle: null,
      selectedCell: null,
      elapsed: 0,
      hints: 0,
      errors: 0,
      score: 0,
      history: [],
      isTimerRunning: false,

      freeHintsRemaining: 3,
      alienTokenBalance: 100, // Starting balance
      level: 1,
      gameNumber: 1,

      alienUser: null,
      isAlienApp: false,
      bridgeReady: false,
      bridgeError: null,

      goTo: (screen) => set({ screen }),

      startGame: (size, difficulty) => {
        const state = get();
        const effectiveSize = size ?? (state.level === 1 ? 5 : state.level === 2 ? 6 : 8);
        const effectiveDiff = difficulty ?? (state.level === 1 ? 'novice' : state.level === 2 ? 'medium' : 'hard');

        const puzzle = generatePuzzle(effectiveSize, effectiveDiff);
        set({
          puzzle, screen: 'game',
          selectedCell: null, elapsed: 0, hints: 0,
          errors: 0, score: 0, history: [], isTimerRunning: true,
          freeHintsRemaining: 3,
        });
      },

      selectCell: (row, col) => set({ selectedCell: { row, col } }),

      enterNumber: (num) => {
        const { puzzle, selectedCell, errors, history } = get();
        if (!puzzle || !selectedCell) return;
        const { row, col } = selectedCell;
        const cell = puzzle.grid[row][col];
        if (cell.isGiven) return;

        const newGrid = puzzle.grid.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
        const prev = newGrid[row][col].playerValue;
        newGrid[row][col].playerValue = num;
        newGrid[row][col].notes.clear();

        // Immediate feedback error checking
        let newErrors = errors;
        const rowVals = newGrid[row].map(c => c.playerValue || c.value);
        const colVals = newGrid.map(r => r[col].playerValue || r[col].value);

        const hasRowConflict = rowVals.filter(v => v === num).length > 1;
        const hasColConflict = colVals.filter(v => v === num).length > 1;

        if (hasRowConflict || hasColConflict) newErrors++;

        set({
          puzzle: { ...puzzle, grid: newGrid },
          errors: newErrors,
          history: [...history, { row, col, prev }],
        });
      },

      clearCell: () => {
        const { puzzle, selectedCell, history } = get();
        if (!puzzle || !selectedCell) return;
        const { row, col } = selectedCell;
        if (puzzle.grid[row][col].isGiven) return;
        const prev = puzzle.grid[row][col].playerValue;
        const newGrid = puzzle.grid.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
        newGrid[row][col].playerValue = 0;
        set({
          puzzle: { ...puzzle, grid: newGrid },
          history: [...history, { row, col, prev }],
        });
      },

      useHint: async (alienId: string) => {
        const { puzzle, hints, freeHintsRemaining, alienTokenBalance } = get();
        if (!puzzle) return;

        let newFreeHints = freeHintsRemaining;
        let newBalance = alienTokenBalance;

        if (freeHintsRemaining > 0) {
          newFreeHints--;
        } else {
          // Gated by server-side token deduction
          try {
            const res = await fetch('/api/game/use-hint', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ alienId })
            });
            const data = await res.json();
            if (!res.ok) {
              alert(data.error || "Failed to use hint");
              return;
            }
            newBalance = data.balance;
          } catch (err) {
            console.error("Hint deduction error:", err);
            return;
          }
        }

        const hint = getHint(puzzle);
        if (!hint) return;
        const newGrid = puzzle.grid.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
        newGrid[hint.row][hint.col].playerValue = hint.value;
        set({
          puzzle: { ...puzzle, grid: newGrid },
          hints: hints + 1,
          freeHintsRemaining: newFreeHints,
          alienTokenBalance: newBalance,
          selectedCell: { row: hint.row, col: hint.col },
        });
      },

      undo: () => {
        const { puzzle, history } = get();
        if (!puzzle || history.length === 0) return;
        const last = history[history.length - 1];
        const newGrid = puzzle.grid.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
        newGrid[last.row][last.col].playerValue = last.prev;
        set({
          puzzle: { ...puzzle, grid: newGrid },
          history: history.slice(0, -1),
        });
      },

      tick: () => {
        const { isTimerRunning, elapsed, puzzle } = get();
        if (!isTimerRunning) return;
        const newElapsed = elapsed + 1;
        set({ elapsed: newElapsed });

        if (puzzle && isSolved(puzzle)) {
          get().finishGame();
        }
      },

      finishGame: () => {
        const { puzzle, elapsed, hints, errors } = get();
        if (!puzzle) return;
        const score = calculateScore(puzzle.size, elapsed, hints, errors);
        set({ score, screen: 'victory', isTimerRunning: false });
      },

      nextLevel: () => {
        const { level, gameNumber } = get();
        const nextLvl = level < 3 ? level + 1 : 3;
        set({ level: nextLvl, gameNumber: gameNumber + 1 });
        get().startGame();
      },

      resetAll: () => set({
        screen: 'splash', puzzle: null, selectedCell: null,
        elapsed: 0, hints: 0, errors: 0, score: 0,
        history: [], isTimerRunning: false,
        level: 1, gameNumber: 1, freeHintsRemaining: 3,
      }),

      addTokens: (amount) => set(state => ({ alienTokenBalance: state.alienTokenBalance + amount })),

      setBridgeState: (bridgeState) => set((state) => ({ ...state, ...bridgeState })),
    }),
    {
      name: 'congruence-storage',
      partialize: (state) => ({
        alienTokenBalance: state.alienTokenBalance,
        level: state.level,
        gameNumber: state.gameNumber
      }),
    }
  )
);
