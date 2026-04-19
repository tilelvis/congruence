export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { gameWallets, walletLedger } from '@/lib/db/schema';
import { eq, desc, notInArray, sql, and, or, isNull } from 'drizzle-orm';
import { BLACKLISTED_INVOICES } from '@/lib/constants/blacklistedInvoices';

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
    .where(
      and(
        eq(walletLedger.alienId, auth.alienId),
        or(
          isNull(walletLedger.invoice),
          notInArray(walletLedger.invoice, BLACKLISTED_INVOICES)
        )
      )
    )
    .orderBy(desc(walletLedger.createdAt))
    .limit(20);

  return NextResponse.json({ wallet: wallet[0], ledger });
}
