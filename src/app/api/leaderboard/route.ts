import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'global';
  const today = new Date().toISOString().split('T')[0];
  const key = type === 'daily' ? `leaderboard:daily:${today}` : 'leaderboard:global';

  // Get top 50 by score descending
  const raw = await redis.zrange(key, 0, 49, { rev: true, withScores: true });

  const entries = [];
  for (let i = 0; i < raw.length; i += 2) {
    try {
      const data = JSON.parse(raw[i] as string);
      entries.push({ ...data, rank: entries.length + 1 });
    } catch { /* skip malformed */ }
  }

  return NextResponse.json({ entries });
}
