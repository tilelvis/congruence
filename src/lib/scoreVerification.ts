// Simple anti-cheat: hash the score with session data
// Server verifies the hash before writing to leaderboard

export function buildScorePayload(
  alienId: string,
  score: number,
  elapsed: number,
  hints: number,
  errors: number,
  difficulty: string,
  size: number,
  nonce: string
): string {
  return `${alienId}:${score}:${elapsed}:${hints}:${errors}:${difficulty}:${size}:${nonce}`;
}

export async function hashPayload(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function calculateScore(
  size: number,
  elapsed: number,
  hints: number,
  errors: number
): number {
  const base = Math.floor(1000 * (size / 5));
  const timeBonus = Math.max(0, base - elapsed * 2);
  const final = Math.max(100, base + timeBonus - hints * 50 - errors * 10);
  return final;
}
