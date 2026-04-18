import type { Cell, Cage, Puzzle } from './puzzleGenerator';

export interface ValidationResult {
  isComplete: boolean;
  isValid: boolean;
  errors: Array<{ row: number; col: number; reason: string }>;
  satisfiedCages: number[];
  violatedCages: number[];
  pendingCages: number[];
}

/**
 * Checks for Latin Square conflicts in a list of cell values, ignoring zeros.
 */
const hasConflict = (values: number[]): boolean => {
  const filtered = values.filter(v => v !== 0);
  return new Set(filtered).size !== filtered.length;
};

export function validatePuzzle(puzzle: Puzzle): ValidationResult {
  const { size, grid, cages } = puzzle;
  const errors: ValidationResult['errors'] = [];
  const satisfiedCages: number[] = [];
  const violatedCages: number[] = [];
  const pendingCages: number[] = [];

  const val = (r: number, c: number) => grid[r][c].playerValue || grid[r][c].value;

  // Latin square check (non-blocking for zeros)
  for (let i = 0; i < size; i++) {
    const rowVals: number[] = [];
    const colVals: number[] = [];
    for (let j = 0; j < size; j++) {
      rowVals.push(val(i, j));
      colVals.push(val(j, i));
    }

    if (hasConflict(rowVals)) {
      // Find exact cells in conflict
      const counts = new Map<number, number>();
      rowVals.filter(v => v !== 0).forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
      rowVals.forEach((v, j) => {
        if (v !== 0 && counts.get(v)! > 1) errors.push({ row: i, col: j, reason: `Duplicate ${v} in row` });
      });
    }

    if (hasConflict(colVals)) {
      const counts = new Map<number, number>();
      colVals.filter(v => v !== 0).forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
      colVals.forEach((v, r) => {
        if (v !== 0 && counts.get(v)! > 1) errors.push({ row: r, col: i, reason: `Duplicate ${v} in column` });
      });
    }
  }

  // Cage constraint check
  for (const cage of cages) {
    const values = cage.cells.map(c => val(c.row, c.col));
    const filled = values.filter(v => v !== 0);
    if (filled.length < cage.cells.length) {
      pendingCages.push(cage.id);
    } else {
      const sum = filled.reduce((s, v) => s + v, 0);
      (sum % cage.modulus === cage.remainder ? satisfiedCages : violatedCages).push(cage.id);
    }
  }

  let isComplete = errors.length === 0 && violatedCages.length === 0;
  if (isComplete) {
    for (let i = 0; i < size && isComplete; i++) {
      for (let j = 0; j < size && isComplete; j++) {
        if (val(i, j) === 0) isComplete = false;
      }
    }
  }

  return { isComplete, isValid: errors.length === 0, errors, satisfiedCages, violatedCages, pendingCages };
}

export function isSolved(puzzle: Puzzle): boolean {
  return validatePuzzle(puzzle).isComplete;
}

export function getHint(puzzle: Puzzle): { row: number; col: number; value: number } | null {
  const emptyCells: Array<{r: number, c: number}> = [];
  for (let i = 0; i < puzzle.grid.length; i++) {
    for (let j = 0; j < puzzle.grid[i].length; j++) {
      const cell = puzzle.grid[i][j];
      if (!cell.isGiven && cell.playerValue === 0) {
        emptyCells.push({r: i, c: j});
      }
    }
  }
  if (emptyCells.length === 0) return null;
  const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  return { row: target.r, col: target.c, value: puzzle.solution[target.r][target.c] };
}

/**
 * Backtracking solver to count solutions.
 */
export function countSolutions(
  size: number,
  initialGrid: number[][], // 0 for empty
  cages: Cage[],
  limit: number = 2
): number {
  let solutions = 0;
  const grid = initialGrid.map(row => [...row]);

  function solve(r: number, c: number) {
    if (solutions >= limit) return;
    if (r === size) {
      solutions++;
      return;
    }

    const nextR = c === size - 1 ? r + 1 : r;
    const nextC = c === size - 1 ? 0 : c + 1;

    if (grid[r][c] !== 0) {
      solve(nextR, nextC);
      return;
    }

    for (let v = 1; v <= size; v++) {
      if (isSafe(r, c, v)) {
        grid[r][c] = v;
        solve(nextR, nextC);
        grid[r][c] = 0;
        if (solutions >= limit) return;
      }
    }
  }

  function isSafe(r: number, c: number, v: number): boolean {
    // Row check
    for (let i = 0; i < size; i++) if (grid[r][i] === v) return false;
    // Col check
    for (let i = 0; i < size; i++) if (grid[i][c] === v) return false;

    // Cage check
    const cage = cages.find(cg => cg.cells.some(cell => cell.row === r && cell.col === c));
    if (cage) {
      const cageCells = cage.cells;
      let sum = v;
      let filled = 1;
      for (const cell of cageCells) {
        if (cell.row === r && cell.col === c) continue;
        const val = grid[cell.row][cell.col];
        if (val !== 0) {
          sum += val;
          filled++;
        }
      }
      // If cage is fully filled, check modulus
      if (filled === cageCells.length) {
        if (sum % cage.modulus !== cage.remainder) return false;
      }
    }

    return true;
  }

  solve(0, 0);
  return solutions;
}
