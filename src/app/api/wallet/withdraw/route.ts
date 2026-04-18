export const dynamic = "force-dynamic";
// Initiates a withdrawal from the game wallet back to the user's Alien wallet.
import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { gameWallets, walletLedger, withdrawals } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

const MIN_WITHDRAWAL = 5; // Minimum 5 ALIEN to withdraw

export async function POST(request: NextRequest) {
  const auth = await verifyRequest(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { amount } = body as { amount: number };

  if (!amount || amount < MIN_WITHDRAWAL) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ${MIN_WITHDRAWAL} ALIEN` },
      { status: 400 }
    );
  }

  // Check balance
  const wallets = await db.select().from(gameWallets)
    .where(eq(gameWallets.alienId, auth.alienId)).limit(1);

  if (wallets.length === 0 || wallets[0].balance < amount) {
    return NextResponse.json(
      { error: 'insufficient_balance', balance: wallets[0]?.balance ?? 0 },
      { status: 402 }
    );
  }

  // Deduct from balance
  await db.update(gameWallets)
    .set({
      balance: sql`${gameWallets.balance} - ${amount}`,
      totalWithdrawn: sql`${gameWallets.totalWithdrawn} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(gameWallets.alienId, auth.alienId));

  const updated = await db.select().from(gameWallets)
    .where(eq(gameWallets.alienId, auth.alienId)).limit(1);

  // Record withdrawal request
  await db.insert(withdrawals).values({
    alienId: auth.alienId,
    amount,
    status: 'pending',
  });

  // Write ledger
  await db.insert(walletLedger).values({
    alienId: auth.alienId,
    type: 'withdrawal',
    amount: -amount,
    balance: updated[0].balance,
    memo: `Withdrawal: ${amount} ALIEN to Alien wallet`,
  });

  return NextResponse.json({
    success: true,
    balance: updated[0].balance,
    message: `Withdrawal of ${amount} ALIEN queued. Processing within 24 hours.`,
  });
}
