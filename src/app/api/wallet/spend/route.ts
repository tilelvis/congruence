export const dynamic = "force-dynamic";
// Called server-side when a user starts a puzzle (spends 1 ALN from game wallet)
import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { gameWallets, walletLedger } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

const TRIAL_COST = 1; // 1 ALN per trial

export async function POST(request: NextRequest) {
  const auth = await verifyRequest(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const { difficulty } = body;

  // Get current balance
  const wallets = await db.select().from(gameWallets)
    .where(eq(gameWallets.alienId, auth.alienId)).limit(1);

  if (wallets.length === 0 || wallets[0].balance < TRIAL_COST) {
    return NextResponse.json({ error: 'insufficient_balance', balance: wallets[0]?.balance ?? 0 }, { status: 402 });
  }

  // Deduct atomically
  await db.update(gameWallets)
    .set({
      balance: sql`${gameWallets.balance} - ${TRIAL_COST}`,
      totalSpent: sql`${gameWallets.totalSpent} + ${TRIAL_COST}`,
      updatedAt: new Date(),
    })
    .where(eq(gameWallets.alienId, auth.alienId));

  const updated = await db.select().from(gameWallets)
    .where(eq(gameWallets.alienId, auth.alienId)).limit(1);

  await db.insert(walletLedger).values({
    alienId: auth.alienId,
    type: 'trial_spend',
    amount: -TRIAL_COST,
    balance: updated[0].balance,
    memo: `Trial: ${difficulty ?? 'puzzle'}`,
  });

  return NextResponse.json({ success: true, balance: updated[0].balance });
}
