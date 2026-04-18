export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentIntents, transactions, gameWallets, walletLedger } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { DEPOSIT_PACKS } from '../../invoices/route';

async function verifySignature(publicKeyHex: string, signatureHex: string, body: string): Promise<boolean> {
  try {
    const publicKey = await crypto.subtle.importKey(
      'raw',
      Buffer.from(publicKeyHex, 'hex'),
      { name: 'Ed25519' },
      false,
      ['verify'],
    );
    return crypto.subtle.verify(
      'Ed25519',
      publicKey,
      Buffer.from(signatureHex, 'hex'),
      Buffer.from(body),
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHex = request.headers.get('x-webhook-signature') ?? '';

  if (!signatureHex) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
  }

  const isValid = await verifySignature(
    process.env.WEBHOOK_PUBLIC_KEY!,
    signatureHex,
    rawBody,
  );

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: {
    invoice: string;
    recipient: string;
    status: 'finalized' | 'failed';
    txHash?: string;
    amount?: string;
    token?: string;
    network?: string;
    test?: boolean;
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Find the payment intent
  const intents = await db.select()
    .from(paymentIntents)
    .where(eq(paymentIntents.invoice, payload.invoice))
    .limit(1);

  if (intents.length === 0) {
    // Unknown invoice — ignore but return 200 so Alien doesn't retry
    return NextResponse.json({ received: true });
  }

  const intent = intents[0];

  // Record the transaction regardless of status
  await db.insert(transactions).values({
    senderAlienId: intent.senderAlienId,
    recipientAddress: intent.recipientAddress,
    txHash: payload.txHash ?? 'unknown',
    status: payload.status === 'finalized' ? 'paid' : 'failed',
    amount: payload.amount ?? intent.amount,
    token: payload.token ?? intent.token,
    network: payload.network ?? intent.network,
    invoice: payload.invoice,
    isTest: payload.test ?? false,
    payload: rawBody,
  });

  if (payload.status === 'finalized') {
    // ── Credit the user's in-game wallet ──
    const depositAmount = parseInt(payload.amount ?? intent.amount, 10);

    // Find or create game wallet
    const wallets = await db.select().from(gameWallets)
      .where(eq(gameWallets.alienId, intent.senderAlienId)).limit(1);

    if (wallets.length === 0) {
      await db.insert(gameWallets).values({ alienId: intent.senderAlienId });
    }

    // Update balance atomically
    await db.update(gameWallets)
      .set({
        balance: sql`${gameWallets.balance} + ${depositAmount}`,
        totalDeposited: sql`${gameWallets.totalDeposited} + ${depositAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(gameWallets.alienId, intent.senderAlienId));

    // Get updated balance for ledger entry
    const updatedWallet = await db.select().from(gameWallets)
      .where(eq(gameWallets.alienId, intent.senderAlienId)).limit(1);

    // Write ledger entry
    const pack = DEPOSIT_PACKS.find(p => p.id === intent.productId);
    await db.insert(walletLedger).values({
      alienId: intent.senderAlienId,
      type: 'deposit',
      amount: depositAmount,
      balance: updatedWallet[0]?.balance ?? depositAmount,
      memo: pack ? `Deposited ${pack.label} (${pack.trials} trials)` : `Deposited ${depositAmount} ALIEN`,
      invoice: payload.invoice,
      txHash: payload.txHash,
    });

    // Mark intent as completed
    await db.update(paymentIntents)
      .set({ status: 'completed' })
      .where(eq(paymentIntents.invoice, payload.invoice));

  } else {
    // Mark failed
    await db.update(paymentIntents)
      .set({ status: 'failed' })
      .where(eq(paymentIntents.invoice, payload.invoice));
  }

  return NextResponse.json({ success: true });
}
