export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, gameWallets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const auth = await verifyRequest(request);
  if (auth instanceof NextResponse) return auth;

  // Find or create user
  let user = await db.select().from(users).where(eq(users.alienId, auth.alienId)).limit(1);
  if (user.length === 0) {
    await db.insert(users).values({ alienId: auth.alienId });
    await db.insert(gameWallets).values({ alienId: auth.alienId });
    user = await db.select().from(users).where(eq(users.alienId, auth.alienId)).limit(1);
  }

  // Get or create wallet
  let wallet = await db.select().from(gameWallets).where(eq(gameWallets.alienId, auth.alienId)).limit(1);
  if (wallet.length === 0) {
    await db.insert(gameWallets).values({ alienId: auth.alienId });
    wallet = await db.select().from(gameWallets).where(eq(gameWallets.alienId, auth.alienId)).limit(1);
  }

  return NextResponse.json({
    alienId: auth.alienId,
    wallet: wallet[0],
  });
}
