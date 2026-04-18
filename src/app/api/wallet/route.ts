export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { gameWallets, walletLedger } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/wallet — fetch balance + ledger
export async function GET(request: NextRequest) {
  const auth = await verifyRequest(request);
  if (auth instanceof NextResponse) return auth;

  // Ensure wallet exists
  let wallet = await db.select().from(gameWallets)
    .where(eq(gameWallets.alienId, auth.alienId)).limit(1);

  if (wallet.length === 0) {
    await db.insert(gameWallets).values({ alienId: auth.alienId });
    wallet = await db.select().from(gameWallets)
      .where(eq(gameWallets.alienId, auth.alienId)).limit(1);
  }

  const ledger = await db.select().from(walletLedger)
    .where(eq(walletLedger.alienId, auth.alienId))
    .orderBy(desc(walletLedger.createdAt))
    .limit(20);

  return NextResponse.json({ wallet: wallet[0], ledger });
}
