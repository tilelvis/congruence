import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentIntents } from '@/lib/db/schema';
import { DEPOSIT_PACKS } from '@/lib/constants/depositPacks';

export async function POST(request: NextRequest) {
  const auth = await verifyRequest(request);
  if (auth instanceof NextResponse) return auth;

  let body: { productId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { productId } = body;

  const product = DEPOSIT_PACKS.find(p => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
  }

  const recipientAddress = process.env.NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS;
  if (!recipientAddress) {
    console.error('NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS is not set');
    return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
  }

  const invoice = randomUUID();

  try {
    await db.insert(paymentIntents).values({
      invoice,
      senderAlienId: auth.alienId,
      recipientAddress,
      amount: product.amount,
      token: product.token,
      network: product.network,
      productId: product.id,
      status: 'pending',
    });
  } catch (err) {
    console.error('Failed to create payment intent:', err);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }

  return NextResponse.json({ invoice });
}
