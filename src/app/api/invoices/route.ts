export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentIntents } from '@/lib/db/schema';
import { DEPOSIT_PACKS } from '@/lib/constants/depositPacks';

export async function POST(request: NextRequest) {
  const auth = await verifyRequest(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { productId, amount, token, network } = body;

  // Validate the product exists
  const pack = DEPOSIT_PACKS.find(p => p.id === productId);
  if (!pack && productId !== 'custom') {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
  }

  const invoice = `inv-${randomUUID()}`;
  const recipientAddress = network === 'alien'
    ? process.env.NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS!
    : process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS!;

  await db.insert(paymentIntents).values({
    invoice,
    senderAlienId: auth.alienId,
    recipientAddress,
    amount: amount ?? pack?.amount ?? '10',
    token: token ?? 'ALIEN',
    network: network ?? 'alien',
    productId,
    status: 'pending',
  });

  return NextResponse.json({ invoice });
}
