export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentIntents } from '@/lib/db/schema';

// ALIEN token deposit amounts available to the user
export const DEPOSIT_PACKS = [
  { id: 'alien-10', amount: '10', label: '10 ALIEN', trials: 10 },
  { id: 'alien-25', amount: '25', label: '25 ALIEN', trials: 27 }, // 8% bonus
  { id: 'alien-50', amount: '50', label: '50 ALIEN', trials: 60 }, // 20% bonus
  { id: 'alien-100', amount: '100', label: '100 ALIEN', trials: 130 }, // 30% bonus
];

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
