import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leaderboard } from '@/lib/db/schema';
import { desc, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'global';

  let query = db.select()
    .from(leaderboard)
    .orderBy(desc(leaderboard.score))
    .limit(50);

  if (type === 'daily') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query = db.select()
      .from(leaderboard)
      .where(gte(leaderboard.createdAt, today))
      .orderBy(desc(leaderboard.score))
      .limit(50) as any;
  }

  const rows = await query;
  const entries = rows.map((row, index) => ({
    ...row,
    rank: index + 1
  }));

  return NextResponse.json({ entries });
}
