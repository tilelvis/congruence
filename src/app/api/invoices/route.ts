import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentIntents } from '@/lib/db/schema';
import { DEPOSIT_PACKS } from '@/lib/constants/depositPacks';

export async function POST(request: NextRequest) {
  // 1. Verify auth token
  const auth = await verifyRequest(request);
  if (auth instanceof NextResponse) return auth;

  let body: { productId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { productId } = body;

  // 2. Find product in SERVER-SIDE catalog (never trust client amounts)
  const product = DEPOSIT_PACKS.find(p => p.id === productId);
  if (!product || !product.recipientAddress) {
    return NextResponse.json({ error: 'Unknown product or missing recipient address' }, { status: 400 });
  }

  // 3. Create invoice — plain UUID, 36 chars, well under 64-byte limit
  const invoice = randomUUID();

  // 4. Save payment intent
  try {
    await db.insert(paymentIntents).values({
      invoice,
      senderAlienId: auth.alienId,
      recipientAddress: product.recipientAddress,
      amount: product.amount,
      token: product.token,
      network: product.network,
      productId: product.id,
      status: 'pending',
    });
  } catch (err) {
    console.error('Failed to create payment intent:', err);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 },
    );
  }

  return NextResponse.json({ invoice });
}
