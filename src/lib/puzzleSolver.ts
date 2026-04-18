import type { Cell, Cage, Puzzle } from './puzzleGenerator';

export interface ValidationResult {
  isComplete: boolean;
  isValid: boolean;
  errors: Array<{ row: number; col: number; reason: string }>;
  satisfiedCages: number[];
  violatedCages: number[];
  pendingCages: number[];
}

export function validatePuzzle(puzzle: Puzzle): ValidationResult {
  const { size, grid, cages } = puzzle;
  const errors: ValidationResult['errors'] = [];
  const satisfiedCages: number[] = [];
  const violatedCages: number[] = [];
  const pendingCages: number[] = [];

  const val = (r: number, c: number) => grid[r][c].playerValue || grid[r][c].value;

  // Latin square check
  for (let i = 0; i < size; i++) {
    const rowMap = new Map<number, number[]>();
    const colMap = new Map<number, number[]>();
    for (let j = 0; j < size; j++) {
      const rv = val(i, j), cv = val(j, i);
      if (rv) { if (!rowMap.has(rv)) rowMap.set(rv, []); rowMap.get(rv)!.push(j); }
      if (cv) { if (!colMap.has(cv)) colMap.set(cv, []); colMap.get(cv)!.push(j); }
    }
    for (const [v, cols] of rowMap) {
      if (cols.length > 1) cols.forEach(c => errors.push({ row: i, col: c, reason: `Dup ${v} row ${i+1}` }));
    }
    for (const [v, rows] of colMap) {
      if (rows.length > 1) rows.forEach(r => errors.push({ row: r, col: i, reason: `Dup ${v} col ${i+1}` }));
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
  for (let i = 0; i < puzzle.grid.length; i++) {
    for (let j = 0; j < puzzle.grid[i].length; j++) {
      const cell = puzzle.grid[i][j];
      if (!cell.isGiven && cell.playerValue === 0) {
        return { row: i, col: j, value: puzzle.solution[i][j] };
      }
    }
  }
  return null;
}
