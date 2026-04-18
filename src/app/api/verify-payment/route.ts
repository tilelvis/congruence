import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentTransaction } from '@/lib/solanaPayment';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
  const { txSignature, alienId, walletAddress } = await req.json();

  if (!txSignature || !alienId || !walletAddress) {
    return NextResponse.json({ valid: false, error: 'Missing params' }, { status: 400 });
  }

  // Replay check
  const txKey = `payment:${txSignature}`;
  const seen = await redis.exists(txKey);
  if (seen) {
    return NextResponse.json({ valid: false, error: 'Transaction already used' }, { status: 400 });
  }

  // Verify on-chain (using walletAddress, not alienId)
  const result = await verifyPaymentTransaction(txSignature, walletAddress);

  if (result.valid) {
    // Mark transaction as used (permanent)
    await redis.set(txKey, alienId);
    // Log the purchase
    await redis.lpush(`purchases:${alienId}`, JSON.stringify({
      txSignature, amount: result.amount, ts: Date.now()
    }));
  }

  return NextResponse.json(result);
}
