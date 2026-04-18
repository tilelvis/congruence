// ─────────────────────────────────────────────────────────────────────────────
// PUZZLE GENERATOR — Latin square + modular cage generator
// ─────────────────────────────────────────────────────────────────────────────

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
      const size = Math.max(2, Math.min(5, avgSize + randomInt(-1, 1)));
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

      cages.push({
        id: cageId,
        cells,
        modulus: 0,
        remainder: 0,
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

function assignConstraints(cages: Cage[], solution: number[][], modulus: number): Cage[] {
  return cages.map(cage => {
    const sum = cage.cells.reduce((s, c) => s + solution[c.row][c.col], 0);
    return { ...cage, modulus, remainder: sum % modulus };
  });
}

function hasUniqueSolution(grid: Cell[][], cages: Cage[]): boolean {
  const n = grid.length;
  for (let i = 0; i < n; i++) {
    const rv = new Set<number>(), cv = new Set<number>();
    for (let j = 0; j < n; j++) {
      const r = grid[i][j].value, c = grid[j][i].value;
      if (r !== 0) { if (rv.has(r)) return false; rv.add(r); }
      if (c !== 0) { if (cv.has(c)) return false; cv.add(c); }
    }
  }
  for (const cage of cages) {
    const filled = cage.cells.filter(c => grid[c.row][c.col].value !== 0);
    if (filled.length === cage.cells.length) {
      const sum = filled.reduce((s, c) => s + grid[c.row][c.col].value, 0);
      if (sum % cage.modulus !== cage.remainder) return false;
    }
  }
  return true;
}

export function generatePuzzle(size: number, difficulty: string): Puzzle {
  const configs: Record<string, { modulus: number; cageCount: number; clueFrac: number }> = {
    novice: { modulus: 3, cageCount: 8,  clueFrac: 0.55 },
    easy:   { modulus: 3, cageCount: 10, clueFrac: 0.50 },
    medium: { modulus: 4, cageCount: 12, clueFrac: 0.45 },
    hard:   { modulus: 4, cageCount: 14, clueFrac: 0.38 },
    expert: { modulus: 5, cageCount: 16, clueFrac: 0.32 },
    master: { modulus: 5, cageCount: 18, clueFrac: 0.28 },
  };
  const cfg = configs[difficulty] ?? configs.medium;
  const targetClues = Math.floor(size * size * cfg.clueFrac);

  const solution = generateLatinSquare(size);
  let cages = generateCages(size, cfg.cageCount);
  cages = assignConstraints(cages, solution, cfg.modulus);

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

  // Punch holes
  const positions = shuffleArray(
    Array.from({ length: size * size }, (_, i) => ({ r: Math.floor(i / size), c: i % size }))
  );
  let removed = 0;
  const toRemove = size * size - targetClues;

  for (const { r, c } of positions) {
    if (removed >= toRemove) break;
    const orig = grid[r][c].value;
    grid[r][c].value = 0;
    grid[r][c].isGiven = false;

    if (hasUniqueSolution(grid, cages)) {
      removed++;
    } else {
      grid[r][c].value = orig;
      grid[r][c].isGiven = true;
    }
  }

  return { size, grid, cages, solution, difficulty };
}
