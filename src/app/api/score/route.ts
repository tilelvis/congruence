import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { hashPayload, buildScorePayload } from '@/lib/scoreVerification';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Scoring plausibility check
const MIN_TIMES: Record<string, number> = {
  novice: 30, easy: 60, medium: 90, hard: 120, expert: 180, master: 240,
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { alienId, username, score, elapsed, hints, errors, difficulty, size, hash, nonce } = body as {
    alienId: string; username: string; score: number; elapsed: number;
    hints: number; errors: number; difficulty: string; size: number;
    hash: string; nonce: string;
  };

  // Verify hash (anti-cheat)
  const expected = buildScorePayload(alienId, score, elapsed, hints, errors, difficulty, size, nonce as string);
  const expectedHash = await hashPayload(expected);
  if (hash !== expectedHash) {
    return NextResponse.json({ error: 'Invalid score hash' }, { status: 400 });
  }

  // Minimum time check
  const minTime = MIN_TIMES[difficulty as keyof typeof MIN_TIMES] ?? 30;
  if (elapsed < minTime) {
    return NextResponse.json({ error: 'Score rejected: too fast' }, { status: 400 });
  }

  // Nonce replay check
  const nonceKey = `nonce:${nonce}`;
  const exists = await redis.exists(nonceKey);
  if (exists) {
    return NextResponse.json({ error: 'Duplicate submission' }, { status: 400 });
  }
  await redis.setex(nonceKey, 86400, '1'); // Expire nonce after 24h

  // Write to sorted set (global and daily)
  const today = new Date().toISOString().split('T')[0];
  const entry = JSON.stringify({ alienId, username, score, difficulty, size });

  await redis.zadd('leaderboard:global', { score, member: entry });
  await redis.zadd(`leaderboard:daily:${today}`, { score, member: entry });
  // Daily leaderboard expires after 7 days
  await redis.expire(`leaderboard:daily:${today}`, 7 * 86400);

  return NextResponse.json({ success: true, score });
}
