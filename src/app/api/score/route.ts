import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leaderboard, nonces } from '@/lib/db/schema';
import { hashPayload, buildScorePayload } from '@/lib/scoreVerification';

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
  const minTime = MIN_TIMES[difficulty] ?? 30;
  if (elapsed < minTime) {
    return NextResponse.json({ error: 'Score rejected: too fast' }, { status: 400 });
  }

  try {
    // Nonce replay check & insert
    await db.insert(nonces).values({ nonce });

    // Write to leaderboard
    await db.insert(leaderboard).values({
      alienId,
      username,
      score,
      difficulty,
      size,
    });

    return NextResponse.json({ success: true, score });
  } catch (error: any) {
    if (error.code === '23505') { // Postgres unique violation
      return NextResponse.json({ error: 'Duplicate submission' }, { status: 400 });
    }
    console.error('Score submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
