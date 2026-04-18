import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameWallets, walletLedger } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { alienId } = await req.json();

    if (!alienId) {
      return NextResponse.json({ error: 'Missing alienId' }, { status: 400 });
    }

    // 1. Check wallet balance
    const wallets = await db.select().from(gameWallets)
      .where(eq(gameWallets.alienId, alienId)).limit(1);

    if (wallets.length === 0 || wallets[0].balance < 10) {
      return NextResponse.json({
        success: false,
        error: "Insufficient ALIEN tokens. 10 ALIEN required per hint."
      }, { status: 403 });
    }

    // 2. Deduct tokens
    await db.update(gameWallets)
      .set({
        balance: sql`${gameWallets.balance} - 10`,
        totalSpent: sql`${gameWallets.totalSpent} + 10`,
        updatedAt: new Date(),
      })
      .where(eq(gameWallets.alienId, alienId));

    // 3. Get updated balance for ledger
    const updatedWallet = await db.select().from(gameWallets)
      .where(eq(gameWallets.alienId, alienId)).limit(1);

    // 4. Record in ledger
    await db.insert(walletLedger).values({
      alienId,
      type: 'hint_spend',
      amount: -10,
      balance: updatedWallet[0]?.balance ?? 0,
      memo: 'Used 1 hint in-game',
    });

    return NextResponse.json({ success: true, balance: updatedWallet[0]?.balance });
  } catch (error) {
    console.error('Hint spend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
