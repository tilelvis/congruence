import { create } from 'zustand';
import { generatePuzzle, type Puzzle } from '@/lib/puzzleGenerator';
import { isSolved, getHint } from '@/lib/puzzleSolver';
import { calculateScore } from '@/lib/scoreVerification';

export type Screen = 'splash' | 'difficulty' | 'game' | 'victory' | 'leaderboard' | 'tutorial';

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

  // Actions
  goTo: (screen: Screen) => void;
  startGame: (size: number, difficulty: string) => void;
  selectCell: (row: number, col: number) => void;
  enterNumber: (num: number) => void;
  clearCell: () => void;
  useHint: () => void;
  undo: () => void;
  tick: () => void;
  finishGame: () => void;
  resetAll: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'splash',
  puzzle: null,
  selectedCell: null,
  elapsed: 0,
  hints: 0,
  errors: 0,
  score: 0,
  history: [],
  isTimerRunning: false,

  goTo: (screen) => set({ screen }),

  startGame: (size, difficulty) => {
    const puzzle = generatePuzzle(size, difficulty);
    set({
      puzzle, screen: 'game',
      selectedCell: null, elapsed: 0, hints: 0,
      errors: 0, score: 0, history: [], isTimerRunning: true,
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

    // Check dupe
    let newErrors = errors;
    const rowVals = newGrid[row]
      .filter((_, j) => j !== col)
      .map(c => c.playerValue || c.value)
      .filter(Boolean);
    const colVals = newGrid
      .filter((_, i) => i !== row)
      .map(r => r[col].playerValue || r[col].value)
      .filter(Boolean);
    if (rowVals.includes(num) || colVals.includes(num)) newErrors++;

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

  useHint: () => {
    const { puzzle, hints } = get();
    if (!puzzle) return;
    const hint = getHint(puzzle);
    if (!hint) return;
    const newGrid = puzzle.grid.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    newGrid[hint.row][hint.col].playerValue = hint.value;
    set({
      puzzle: { ...puzzle, grid: newGrid },
      hints: hints + 1,
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

    // Auto-check on every tick
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

  resetAll: () => set({
    screen: 'splash', puzzle: null, selectedCell: null,
    elapsed: 0, hints: 0, errors: 0, score: 0,
    history: [], isTimerRunning: false,
  }),
}));
