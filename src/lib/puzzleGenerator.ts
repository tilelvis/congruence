// ─────────────────────────────────────────────────────────────────────────────
// PUZZLE GENERATOR — Latin square + modular cage generator
// ─────────────────────────────────────────────────────────────────────────────
import { countSolutions } from './puzzleSolver';

export interface Cell {
  row: number;
  col: number;
  value: number;       // 0 = hole, 1-n = given clue
  isGiven: boolean;
  isValid: boolean;
  cageId: number;
  playerValue: number; // 0 = empty, 1-n = player entry
  notes: Set<number>;
}

export interface Cage {
  id: number;
  cells: Array<{ row: number; col: number }>;
  modulus: number;
  remainder: number;
  color: string;
}

export interface Puzzle {
  size: number;
  grid: Cell[][];
  cages: Cage[];
  solution: number[][];
  difficulty: string;
}

const CAGE_COLORS = [
  '#DC2626', '#2563EB', '#16A34A', '#CA8A04',
  '#9333EA', '#DB2777', '#0891B2', '#EA580C',
  '#059669', '#7C3AED', '#BE185D', '#0369A1'
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLatinSquare(n: number): number[][] {
  const base = shuffleArray(Array.from({ length: n }, (_, i) => i + 1));
  const square = Array.from({ length: n }, (_, i) =>
    base.map((_, j) => base[(j + i) % n])
  );
  const rowPerm = shuffleArray(Array.from({ length: n }, (_, i) => i));
  const colPerm = shuffleArray(Array.from({ length: n }, (_, i) => i));
  const result: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      result[i][j] = square[rowPerm[i]][colPerm[j]];
    }
  }
  return result;
}

function generateCages(n: number, targetCount: number): Cage[] {
  const visited: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  const cages: Cage[] = [];
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  const avgSize = Math.max(2, Math.floor((n * n) / targetCount));
  let cageId = 0;

  for (let sr = 0; sr < n; sr++) {
    for (let sc = 0; sc < n; sc++) {
      if (visited[sr][sc]) continue;
      const size = Math.max(2, Math.min(4, avgSize + randomInt(-1, 1)));
      const cells: Array<{ row: number; col: number }> = [];
      const queue = [{ row: sr, col: sc }];
      visited[sr][sc] = true;

      while (queue.length > 0 && cells.length < size) {
        const cell = queue.shift()!;
        cells.push(cell);
        for (const [dr, dc] of shuffleArray(dirs)) {
          const nr = cell.row + dr, nc = cell.col + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited[nr][nc]) {
            visited[nr][nc] = true;
            queue.push({ row: nr, col: nc });
            if (cells.length >= size) break;
          }
        }
      }

      // Procedural modulus and remainder
      const modulus = randomInt(3, 5);

      cages.push({
        id: cageId,
        cells,
        modulus,
        remainder: 0, // Assigned later based on solution
        color: CAGE_COLORS[cageId % CAGE_COLORS.length]
      });
      cageId++;
    }
  }

  // Merge orphaned cells
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!visited[i][j]) {
        let best = 0, bestDist = Infinity;
        for (let c = 0; c < cages.length; c++) {
          for (const cell of cages[c].cells) {
            const d = Math.abs(cell.row - i) + Math.abs(cell.col - j);
            if (d < bestDist) { bestDist = d; best = c; }
          }
        }
        cages[best].cells.push({ row: i, col: j });
        visited[i][j] = true;
      }
    }
  }

  return cages;
}

function assignConstraints(cages: Cage[], solution: number[][]): Cage[] {
  return cages.map(cage => {
    const sum = cage.cells.reduce((s, c) => s + solution[c.row][c.col], 0);
    return { ...cage, remainder: sum % cage.modulus };
  });
}

function checkUniqueness(grid: Cell[][], cages: Cage[]): boolean {
  const size = grid.length;
  const initialGrid = grid.map(r => r.map(c => c.value));
  return countSolutions(size, initialGrid, cages, 2) === 1;
}

export function generatePuzzle(size: number, difficulty: string): Puzzle {
  const configs: Record<string, { cageCount: number; clueFrac: number }> = {
    novice: { cageCount: 8,  clueFrac: 0.45 },
    easy:   { cageCount: 10, clueFrac: 0.40 },
    medium: { cageCount: 12, clueFrac: 0.35 },
    hard:   { cageCount: 14, clueFrac: 0.30 },
    expert: { cageCount: 16, clueFrac: 0.25 },
    master: { cageCount: 18, clueFrac: 0.20 },
  };
  const cfg = configs[difficulty] ?? configs.medium;
  const targetClues = Math.floor(size * size * cfg.clueFrac);

  const solution = generateLatinSquare(size);
  let cages = generateCages(size, cfg.cageCount);
  cages = assignConstraints(cages, solution);

  // Build initial full grid
  const grid: Cell[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({
      row: r, col: c,
      value: solution[r][c],
      isGiven: true, isValid: true,
      cageId: cages.find(cage => cage.cells.some(cell => cell.row === r && cell.col === c))?.id ?? -1,
      playerValue: 0, notes: new Set<number>()
    }))
  );

  // Punch holes with uniqueness check
  const positions = shuffleArray(
    Array.from({ length: size * size }, (_, i) => ({ r: Math.floor(i / size), c: i % size }))
  );
  let removed = 0;
  const maxToRemove = size * size - targetClues;

  for (const { r, c } of positions) {
    if (removed >= maxToRemove) break;
    const orig = grid[r][c].value;
    grid[r][c].value = 0;
    grid[r][c].isGiven = false;

    if (checkUniqueness(grid, cages)) {
      removed++;
    } else {
      grid[r][c].value = orig;
      grid[r][c].isGiven = true;
    }
  }

  return { size, grid, cages, solution, difficulty };
}
