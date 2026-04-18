# 🔐 CONGRUENCE — Vercel Environment Variables & In-Game Wallet Guide
### Based on official docs.alien.org — accurate as of April 2026

---

## PART 1 — EXACT VERCEL ENVIRONMENT VARIABLES

These are the ONLY four environment variables the Alien platform itself requires.
Everything else is your own infrastructure.

### How to add them in Vercel
1. Go to your project → **Settings** → **Environment Variables**
2. Set scope to **Production + Preview + Development** for all of them
3. After adding, **redeploy** (Vercel does not auto-apply new env vars)

---

### Variable 1: `DATABASE_URL`
**What it is:** PostgreSQL connection string for your database.
**Where to get it:** Create a free PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com). They give you a connection string like:
```
postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```
**Set in Vercel as:**
```
DATABASE_URL=postgresql://user:password@your-host/dbname?sslmode=require
```

---

### Variable 2: `WEBHOOK_PUBLIC_KEY`
**What it is:** An Ed25519 public key (hex-encoded) that the Alien platform uses to sign payment webhook requests. You use it to VERIFY those requests are genuine.

**Where to get it:**
1. Go to [dev.alien.org/dashboard/webhooks](https://dev.alien.org/dashboard/webhooks)
2. Click **Create webhook**
3. Select your Mini App
4. Set URL to: `https://YOUR_VERCEL_DOMAIN/api/webhooks/payment`
5. Click **Create**
6. ⚠️ **COPY THE KEY IMMEDIATELY** — it is only shown ONCE

It looks like: `a3f9b2c1d4e5f6789012345678901234567890abcdef1234567890abcdef1234`

**Set in Vercel as:**
```
WEBHOOK_PUBLIC_KEY=a3f9b2c1d4e5f6789012345678901234567890abcdef1234567890abcdef1234
```
This is a **server-side only** variable (no `NEXT_PUBLIC_` prefix). Never expose it to the client.

---

### Variable 3: `NEXT_PUBLIC_RECIPIENT_ADDRESS`
**What it is:** Your Solana wallet address that receives **USDC payments**.
**Where to get it:** Any Solana wallet you own (Phantom, Backpack, etc.). Copy the public key.

**Set in Vercel as:**
```
NEXT_PUBLIC_RECIPIENT_ADDRESS=YourSolanaWalletPublicKeyHere
```

---

### Variable 4: `NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS`
**What it is:** Your **Alien Provider address** — receives ALIEN token payments. This is NOT a regular Solana wallet address. It is the provider address assigned to your mini app by Alien.

**Where to get it:**
1. Go to [dev.alien.org](https://dev.alien.org)
2. Navigate to your Mini App settings or the Webhooks page
3. Find **"Provider Address"** — copy it

**Set in Vercel as:**
```
NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS=your-alien-provider-address-here
```

---

### Optional: `RUN_MIGRATIONS`
Set this if you want your database schema to auto-migrate on every deploy:
```
RUN_MIGRATIONS=true
```

---

### Complete `.env.local` for local development:
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/congruence

# Alien Platform (from dev.alien.org)
WEBHOOK_PUBLIC_KEY=<paste-from-dev-portal-webhooks-page>
NEXT_PUBLIC_RECIPIENT_ADDRESS=<your-solana-wallet-public-key>
NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS=<your-alien-provider-address>

# App URL (update after Vercel deploy)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: auto-run DB migrations
RUN_MIGRATIONS=false
```

### Complete Vercel dashboard (4 required + 2 optional):
| Variable Name | Value Source | Public? |
|---|---|---|
| `DATABASE_URL` | Neon/Supabase dashboard | No |
| `WEBHOOK_PUBLIC_KEY` | dev.alien.org → Webhooks → Create | No |
| `NEXT_PUBLIC_RECIPIENT_ADDRESS` | Your Solana wallet public key | Yes |
| `NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS` | dev.alien.org → Mini App → Provider Address | Yes |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL | Yes |
| `RUN_MIGRATIONS` | `true` | No |

---

## PART 2 — HOW ALIEN TOKEN PAYMENTS ACTUALLY WORK

This is the critical mental model Jules needs before writing any payment code.

### The Two Token Types

| Token | Network value | Recipient env var | Who receives |
|-------|--------------|-------------------|--------------|
| USDC | `"solana"` | `NEXT_PUBLIC_RECIPIENT_ADDRESS` | Your Solana wallet |
| ALIEN | `"alien"` | `NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS` | Your Alien provider address |

**For the in-game wallet, we use ALIEN tokens on the `"alien"` network.**

### The Payment Flow — Step by Step

```
1. USER taps "Deposit 10 ALIEN" inside the game
           │
2. FRONTEND calls POST /api/invoices
   → sends: { recipientAddress, amount, token: "ALIEN", network: "alien", productId }
   → backend creates a payment_intent row in DB, returns invoice ID
           │
3. FRONTEND calls payment.pay({ recipient, amount, token, network, invoice, item })
   → This opens the ALIEN APP'S NATIVE PAYMENT UI
   → User sees: "Pay 10 ALIEN to Congruence Game"
   → User taps Approve (or Cancel)
           │
4. ALIEN APP broadcasts the transaction
   → payment.pay() returns: { status: "paid", txHash: "..." }
           │
5. ALIEN PLATFORM sends webhook POST to /api/webhooks/payment
   → payload: { invoice, status: "finalized", txHash, amount, token, network }
   → signed with Ed25519 — you MUST verify with WEBHOOK_PUBLIC_KEY
           │
6. YOUR WEBHOOK HANDLER:
   → Verifies Ed25519 signature
   → Finds the payment_intent by invoice ID
   → If status === "finalized": credits the user's in-game balance
   → Updates payment_intent status to "completed"
```

### Key Rules
- **Amount is in SMALLEST UNITS.** For ALIEN token: `"10"` means 10 ALIEN (no decimals — the Alien network uses integer amounts in their payment system, unlike USDC which uses 6 decimal places / microUSDC).
- **Never credit the user in the frontend `onPaid` callback.** That fires immediately after broadcast, before on-chain confirmation. ALWAYS wait for the webhook `status: "finalized"`.
- **The webhook is the source of truth.** The frontend result is just UX feedback.
- **`invoice` is your correlation ID.** It links the frontend payment.pay() call → DB row → webhook → balance credit.

### Why the In-Game Wallet Makes Sense
Instead of making the user pay per puzzle (which requires an Alien wallet approve popup every time), you:
1. User deposits ALIEN once → game wallet credits them
2. User spends from game balance for each trial → **instant, no wallet popups**
3. User can withdraw their remaining balance back to their Alien wallet at any time

This is far better UX. One payment approval → many game sessions.

---

## PART 3 — IN-GAME WALLET IMPLEMENTATION

### Packages to install
```bash
npm install @alien_org/react @alien_org/auth-client drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

Note the correct package names from the official docs:
- `@alien_org/react` (NOT `@alien-id/miniapp-sdk`)
- `@alien_org/auth-client` (NOT `@alien-id/sso-sdk-js`)

### Updated `src/app/providers.tsx` (Root Provider)

```tsx
'use client';

import { AlienProvider } from '@alien_org/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AlienProvider>
        {children}
      </AlienProvider>
    </QueryClientProvider>
  );
}
```

### Updated `src/app/layout.tsx`

```tsx
import type { Metadata, Viewport } from 'next';
import { Orbitron, Exo_2 } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron', weight: ['400','700','900'] });
const exo2 = Exo_2({ subsets: ['latin'], variable: '--font-exo2', weight: ['300','400','600','700'] });

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1,
  userScalable: false, viewportFit: 'cover', themeColor: '#020408',
};

export const metadata: Metadata = {
  title: 'CONGRUENCE',
  description: 'Modular arithmetic puzzle — Alien Network Edition',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${exo2.variable}`}
      style={{ height: '100%', overflow: 'hidden' }}>
      <body style={{ height: '100%', overflow: 'hidden', background: '#020408', color: 'white', margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

### Database Schema — `src/lib/db/schema.ts`

```typescript
import { pgTable, text, uuid, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// Auto-registered users (find-or-create on first auth)
export const users = pgTable('users', {
  id:         uuid('id').primaryKey().defaultRandom(),
  alienId:    text('alien_id').notNull().unique(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  updatedAt:  timestamp('updated_at').defaultNow().notNull(),
});

// Payment intents — created before each payment
export const paymentIntents = pgTable('payment_intents', {
  id:               uuid('id').primaryKey().defaultRandom(),
  invoice:          text('invoice').notNull().unique(),   // inv-<uuid>
  senderAlienId:    text('sender_alien_id').notNull(),
  recipientAddress: text('recipient_address').notNull(),
  amount:           text('amount').notNull(),             // in smallest units
  token:            text('token').notNull(),              // 'ALIEN' | 'USDC'
  network:          text('network').notNull(),            // 'alien' | 'solana'
  productId:        text('product_id').notNull(),
  status:           text('status').notNull().default('pending'), // pending|completed|failed
  createdAt:        timestamp('created_at').defaultNow().notNull(),
});

// Confirmed on-chain transactions (written by webhook)
export const transactions = pgTable('transactions', {
  id:               uuid('id').primaryKey().defaultRandom(),
  senderAlienId:    text('sender_alien_id').notNull(),
  recipientAddress: text('recipient_address').notNull(),
  txHash:           text('tx_hash').notNull(),
  status:           text('status').notNull(),             // 'paid' | 'failed'
  amount:           text('amount').notNull(),
  token:            text('token').notNull(),
  network:          text('network').notNull(),
  invoice:          text('invoice').notNull(),
  isTest:           boolean('is_test').default(false),
  payload:          text('payload').notNull(),            // full JSON for audit
  createdAt:        timestamp('created_at').defaultNow().notNull(),
});

// In-game wallet balances (credited by webhook, debited by game logic)
export const gameWallets = pgTable('game_wallets', {
  id:           uuid('id').primaryKey().defaultRandom(),
  alienId:      text('alien_id').notNull().unique(),
  balance:      integer('balance').notNull().default(0),  // ALIEN tokens (integer)
  totalDeposited: integer('total_deposited').notNull().default(0),
  totalSpent:   integer('total_spent').notNull().default(0),
  totalWithdrawn: integer('total_withdrawn').notNull().default(0),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
});

// Ledger of all game wallet transactions
export const walletLedger = pgTable('wallet_ledger', {
  id:        uuid('id').primaryKey().defaultRandom(),
  alienId:   text('alien_id').notNull(),
  type:      text('type').notNull(),      // 'deposit'|'trial_spend'|'withdrawal'
  amount:    integer('amount').notNull(), // positive = credit, negative = debit
  balance:   integer('balance').notNull(),// balance AFTER this transaction
  memo:      text('memo'),                // e.g. "5x trial pack" or "withdrawal to wallet"
  invoice:   text('invoice'),             // linked payment invoice (if deposit)
  txHash:    text('tx_hash'),             // Solana/Alien tx hash
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Withdrawal requests (user → their Alien wallet)
export const withdrawals = pgTable('withdrawals', {
  id:           uuid('id').primaryKey().defaultRandom(),
  alienId:      text('alien_id').notNull(),
  amount:       integer('amount').notNull(),
  status:       text('status').notNull().default('pending'), // pending|processing|completed|failed
  txHash:       text('tx_hash'),
  requestedAt:  timestamp('requested_at').defaultNow().notNull(),
  completedAt:  timestamp('completed_at'),
});
```

### Database Connection — `src/lib/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
export type DB = typeof db;
```

### Migration — `drizzle.config.ts` (project root)

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

Run migrations:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

### Auth Helper — `src/lib/auth.ts`

```typescript
import { createAuthClient, JwtErrors } from '@alien_org/auth-client';
import { NextRequest, NextResponse } from 'next/server';

const authClient = createAuthClient();

export async function verifyRequest(request: NextRequest): Promise<{ alienId: string } | NextResponse> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
  }
  try {
    const { sub } = await authClient.verifyToken(token);
    return { alienId: sub };
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

---

## PART 4 — ALL API ROUTES

### `src/app/api/me/route.ts`

```typescript
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
```

### `src/app/api/invoices/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { paymentIntents } from '@/lib/db/schema';

// ALIEN token deposit amounts available to the user
export const DEPOSIT_PACKS = [
  { id: 'alien-10',  amount: '10',  label: '10 ALIEN',  trials: 10 },
  { id: 'alien-25',  amount: '25',  label: '25 ALIEN',  trials: 27 }, // 8% bonus
  { id: 'alien-50',  amount: '50',  label: '50 ALIEN',  trials: 60 }, // 20% bonus
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
```

### `src/app/api/webhooks/payment/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentIntents, transactions, gameWallets, walletLedger } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { DEPOSIT_PACKS } from '../invoices/route';

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
```

### `src/app/api/wallet/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { gameWallets, walletLedger, transactions } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

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
```

### `src/app/api/wallet/spend/route.ts`

```typescript
// Called server-side when a user starts a puzzle (spends 1 ALIEN from game wallet)
import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { gameWallets, walletLedger } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

const TRIAL_COST = 1; // 1 ALIEN per trial

export async function POST(request: NextRequest) {
  const auth = await verifyRequest(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const { difficulty } = body;

  // Get current balance
  const wallets = await db.select().from(gameWallets)
    .where(eq(gameWallets.alienId, auth.alienId)).limit(1);

  if (wallets.length === 0 || wallets[0].balance < TRIAL_COST) {
    return NextResponse.json({ error: 'insufficient_balance', balance: wallets[0]?.balance ?? 0 }, { status: 402 });
  }

  // Deduct atomically
  await db.update(gameWallets)
    .set({
      balance: sql`${gameWallets.balance} - ${TRIAL_COST}`,
      totalSpent: sql`${gameWallets.totalSpent} + ${TRIAL_COST}`,
      updatedAt: new Date(),
    })
    .where(eq(gameWallets.alienId, auth.alienId));

  const updated = await db.select().from(gameWallets)
    .where(eq(gameWallets.alienId, auth.alienId)).limit(1);

  await db.insert(walletLedger).values({
    alienId: auth.alienId,
    type: 'trial_spend',
    amount: -TRIAL_COST,
    balance: updated[0].balance,
    memo: `Trial: ${difficulty ?? 'puzzle'}`,
  });

  return NextResponse.json({ success: true, balance: updated[0].balance });
}
```

### `src/app/api/wallet/withdraw/route.ts`

```typescript
// Initiates a withdrawal from the game wallet back to the user's Alien wallet.
// NOTE: Actual ALIEN token transfer to the user's Alien wallet must be done
// via a server-side Solana transaction signed by your treasury private key.
// This route records the request; fulfillment requires your treasury keypair.

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { gameWallets, walletLedger, withdrawals } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

const MIN_WITHDRAWAL = 5; // Minimum 5 ALIEN to withdraw

export async function POST(request: NextRequest) {
  const auth = await verifyRequest(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { amount } = body as { amount: number };

  if (!amount || amount < MIN_WITHDRAWAL) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ${MIN_WITHDRAWAL} ALIEN` },
      { status: 400 }
    );
  }

  // Check balance
  const wallets = await db.select().from(gameWallets)
    .where(eq(gameWallets.alienId, auth.alienId)).limit(1);

  if (wallets.length === 0 || wallets[0].balance < amount) {
    return NextResponse.json(
      { error: 'insufficient_balance', balance: wallets[0]?.balance ?? 0 },
      { status: 402 }
    );
  }

  // Deduct from balance
  await db.update(gameWallets)
    .set({
      balance: sql`${gameWallets.balance} - ${amount}`,
      totalWithdrawn: sql`${gameWallets.totalWithdrawn} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(gameWallets.alienId, auth.alienId));

  const updated = await db.select().from(gameWallets)
    .where(eq(gameWallets.alienId, auth.alienId)).limit(1);

  // Record withdrawal request
  await db.insert(withdrawals).values({
    alienId: auth.alienId,
    amount,
    status: 'pending',
  });

  // Write ledger
  await db.insert(walletLedger).values({
    alienId: auth.alienId,
    type: 'withdrawal',
    amount: -amount,
    balance: updated[0].balance,
    memo: `Withdrawal: ${amount} ALIEN to Alien wallet`,
  });

  // TODO: Trigger the actual on-chain transfer here using your treasury keypair.
  // This requires your treasury's private key (stored as a server-side secret, NEVER public).
  // Use @solana/web3.js + @solana/spl-token to build + send the transfer transaction.
  // Until automated, you can process withdrawals manually from the Drizzle Studio GUI.

  return NextResponse.json({
    success: true,
    balance: updated[0].balance,
    message: `Withdrawal of ${amount} ALIEN queued. Processing within 24 hours.`,
  });
}
```

---

## PART 5 — IN-GAME WALLET PAGE COMPONENT

This is a full-screen wallet page accessible from the bottom navigation tab.

### `src/components/WalletPage.tsx`

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAlien, usePayment } from '@alien_org/react';

// Deposit packs — must match DEPOSIT_PACKS in /api/invoices/route.ts
const PACKS = [
  { id: 'alien-10',  amount: '10',  label: '10 ALIEN',  trials: 10,  bonus: '' },
  { id: 'alien-25',  amount: '25',  label: '25 ALIEN',  trials: 27,  bonus: '+8%' },
  { id: 'alien-50',  amount: '50',  label: '50 ALIEN',  trials: 60,  bonus: '+20%' },
  { id: 'alien-100', amount: '100', label: '100 ALIEN', trials: 130, bonus: '+30%' },
];

interface WalletData {
  balance: number;
  totalDeposited: number;
  totalSpent: number;
  totalWithdrawn: number;
}

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  balance: number;
  memo: string | null;
  createdAt: string;
}

interface Props {
  onBack: () => void;
}

export function WalletPage({ onBack }: Props) {
  const { authToken, isBridgeAvailable } = useAlien();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [tab, setTab] = useState<'deposit' | 'history' | 'withdraw'>('deposit');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const payment = usePayment({
    onPaid: (txHash) => {
      setStatus('✅ Payment sent! Balance updating...');
      // Optimistically refresh after 2s (webhook may arrive slightly later)
      setTimeout(() => fetchWallet(), 2000);
    },
    onCancelled: () => setStatus('Payment cancelled.'),
    onFailed: (code) => setStatus(`Payment failed: ${code}`),
  });

  const fetchWallet = useCallback(async () => {
    if (!authToken) return;
    const res = await fetch('/api/wallet', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setWallet(data.wallet);
      setLedger(data.ledger);
    }
    setIsLoading(false);
  }, [authToken]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  async function handleDeposit(pack: typeof PACKS[0]) {
    if (!authToken) return;
    setStatus(null);

    // 1. Create invoice on backend
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        productId: pack.id,
        amount: pack.amount,
        token: 'ALIEN',
        network: 'alien',
        recipientAddress: process.env.NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS,
      }),
    });
    if (!res.ok) { setStatus('Failed to create invoice.'); return; }
    const { invoice } = await res.json();

    // 2. Open Alien payment UI — this shows the native approval screen
    await payment.pay({
      recipient: process.env.NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS!,
      amount: pack.amount,
      token: 'ALIEN',
      network: 'alien',
      invoice,
      item: {
        title: `Congruence — ${pack.trials} Trials`,
        iconUrl: `${process.env.NEXT_PUBLIC_APP_URL}/icon.png`,
        quantity: 1,
      },
    });
  }

  async function handleWithdraw() {
    if (!authToken) return;
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount < 5) { setStatus('Minimum withdrawal is 5 ALIEN.'); return; }

    setStatus('Processing withdrawal...');
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(data.message);
      setWallet(prev => prev ? { ...prev, balance: data.balance } : null);
      setWithdrawAmount('');
    } else {
      setStatus(data.error ?? 'Withdrawal failed.');
    }
  }

  const S = {
    page: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', background: '#020408' },
    header: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 10px', borderBottom: '1px solid rgba(0,255,136,0.12)' },
    backBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', width: 36, height: 36, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'var(--font-orbitron)', fontSize: 15, fontWeight: 700, letterSpacing: '0.15em', color: '#00ff88', textShadow: '0 0 10px rgba(0,255,136,0.4)' },
    balanceCard: { margin: '16px', padding: '20px', background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 18, boxShadow: '0 0 40px rgba(0,255,136,0.05)', textAlign: 'center' as const },
    balanceLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'var(--font-orbitron)', letterSpacing: '0.1em', marginBottom: 8 },
    balanceNum: { fontFamily: 'var(--font-orbitron)', fontSize: 42, fontWeight: 900, color: '#00ff88', textShadow: '0 0 20px rgba(0,255,136,0.5)', lineHeight: 1 },
    balanceUnit: { color: 'rgba(0,255,136,0.6)', fontSize: 16, fontFamily: 'var(--font-orbitron)', marginTop: 4 },
    statsRow: { display: 'flex', justifyContent: 'space-around', marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' },
    statItem: { textAlign: 'center' as const },
    statVal: { fontFamily: 'var(--font-orbitron)', fontSize: 14, fontWeight: 700, color: '#06b6d4' },
    statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3, letterSpacing: '0.05em' },
    tabs: { display: 'flex', margin: '0 16px 12px', background: 'rgba(10,22,40,0.8)', borderRadius: 12, padding: 4 },
    tab: (active: boolean) => ({ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 12, fontFamily: 'var(--font-orbitron)', fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: active ? 'rgba(0,255,136,0.15)' : 'transparent', color: active ? '#00ff88' : 'rgba(255,255,255,0.35)', boxShadow: active ? '0 0 10px rgba(0,255,136,0.2)' : 'none' }),
    content: { flex: 1, overflowY: 'auto' as const, padding: '0 16px 16px' },
    packGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    pack: (highlight?: boolean) => ({
      padding: '14px 12px', borderRadius: 14, cursor: 'pointer',
      background: highlight ? 'rgba(0,255,136,0.08)' : 'rgba(10,22,40,0.9)',
      border: `1.5px solid ${highlight ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.08)'}`,
      textAlign: 'center' as const, transition: 'all 0.1s',
    }),
    packAmount: { fontFamily: 'var(--font-orbitron)', fontSize: 18, fontWeight: 900, color: '#f59e0b', textShadow: '0 0 8px rgba(245,158,11,0.4)' },
    packTrials: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
    packBonus: { fontSize: 10, color: '#00ff88', fontFamily: 'var(--font-orbitron)', marginTop: 3 },
    statusBox: { margin: '0 0 12px', padding: '12px 14px', borderRadius: 10, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', fontSize: 13, color: '#00ff88', fontFamily: 'var(--font-exo2)' },
    input: { width: '100%', padding: '14px', borderRadius: 12, background: 'rgba(10,22,40,0.9)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'white', fontSize: 18, fontFamily: 'var(--font-orbitron)', textAlign: 'center' as const, marginBottom: 12, boxSizing: 'border-box' as const, outline: 'none' },
    withdrawBtn: { width: '100%', padding: '16px', borderRadius: 14, fontFamily: 'var(--font-orbitron)', fontWeight: 700, fontSize: 14, letterSpacing: '0.08em', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: '#020408', border: 'none', cursor: 'pointer' },
    ledgerRow: (type: string) => ({
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 14px', borderRadius: 10, marginBottom: 8,
      background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(255,255,255,0.06)',
    }),
    ledgerType: (type: string) => ({ fontSize: 10, fontFamily: 'var(--font-orbitron)', letterSpacing: '0.08em', color: type === 'deposit' ? '#10b981' : type === 'withdrawal' ? '#8b5cf6' : '#f59e0b' }),
    ledgerMemo: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
    ledgerAmt: (amount: number) => ({ fontFamily: 'var(--font-orbitron)', fontSize: 15, fontWeight: 700, color: amount > 0 ? '#10b981' : '#f59e0b' }),
  };

  if (!isBridgeAvailable) {
    return (
      <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🛸</div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-orbitron)', fontSize: 13, textAlign: 'center', padding: '0 32px', lineHeight: 1.6 }}>
          Open this app inside the Alien app to access your wallet.
        </p>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button onClick={onBack} style={S.backBtn}>←</button>
        <span style={S.title}>⚡ GAME WALLET</span>
      </div>

      {/* Balance card */}
      <div style={S.balanceCard}>
        <div style={S.balanceLabel}>AVAILABLE BALANCE</div>
        {isLoading ? (
          <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid #00ff88', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={S.balanceNum}>{wallet?.balance ?? 0}</div>
        )}
        <div style={S.balanceUnit}>ALIEN TOKENS</div>
        {wallet && (
          <div style={S.statsRow}>
            {[
              { val: wallet.totalDeposited, lbl: 'DEPOSITED' },
              { val: wallet.totalSpent,     lbl: 'SPENT' },
              { val: wallet.totalWithdrawn, lbl: 'WITHDRAWN' },
            ].map(s => (
              <div key={s.lbl} style={S.statItem}>
                <div style={S.statVal}>{s.val}</div>
                <div style={S.statLbl}>{s.lbl}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {(['deposit', 'withdraw', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={S.tab(tab === t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={S.content}>
        {status && <div style={S.statusBox}>{status}</div>}

        {/* ── DEPOSIT TAB ── */}
        {tab === 'deposit' && (
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 14, fontFamily: 'var(--font-exo2)', lineHeight: 1.5 }}>
              Deposit ALIEN tokens into your game wallet. 1 ALIEN = 1 trial.
              Larger packs include bonus trials.
            </p>
            <div style={S.packGrid}>
              {PACKS.map((pack, i) => (
                <button
                  key={pack.id}
                  onClick={() => handleDeposit(pack)}
                  disabled={payment.isLoading}
                  onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
                  style={{ ...S.pack(i === 2), border: 'none', cursor: 'pointer' }}
                >
                  <div style={S.packAmount}>{pack.label}</div>
                  <div style={S.packTrials}>{pack.trials} trials</div>
                  {pack.bonus && <div style={S.packBonus}>{pack.bonus} BONUS</div>}
                </button>
              ))}
            </div>
            {payment.isLoading && (
              <p style={{ textAlign: 'center', color: '#06b6d4', fontSize: 13, fontFamily: 'var(--font-orbitron)', marginTop: 16 }}>
                Awaiting wallet approval...
              </p>
            )}
          </div>
        )}

        {/* ── WITHDRAW TAB ── */}
        {tab === 'withdraw' && (
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16, fontFamily: 'var(--font-exo2)', lineHeight: 1.5 }}>
              Withdraw ALIEN tokens back to your Alien app wallet.
              Minimum {5} ALIEN. Processed within 24 hours.
            </p>
            <input
              type="number"
              placeholder="Amount (min 5)"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              min={5}
              max={wallet?.balance ?? 0}
              style={S.input}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Available: {wallet?.balance ?? 0} ALIEN</span>
              <button
                onClick={() => setWithdrawAmount(String(wallet?.balance ?? 0))}
                style={{ background: 'none', border: 'none', color: '#06b6d4', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-orbitron)' }}
              >
                MAX
              </button>
            </div>
            <button onClick={handleWithdraw} style={S.withdrawBtn}>
              ↑ WITHDRAW TO ALIEN WALLET
            </button>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div>
            {ledger.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-orbitron)', fontSize: 13 }}>
                No transactions yet
              </div>
            ) : ledger.map(entry => (
              <div key={entry.id} style={S.ledgerRow(entry.type)}>
                <div>
                  <div style={S.ledgerType(entry.type)}>{entry.type.replace('_', ' ').toUpperCase()}</div>
                  <div style={S.ledgerMemo}>{entry.memo}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={S.ledgerAmt(entry.amount)}>
                  {entry.amount > 0 ? '+' : ''}{entry.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## PART 6 — WIRING THE WALLET INTO THE GAME

### Update `src/store/gameStore.ts` — add wallet screen

```typescript
// Add 'wallet' to the Screen type:
export type Screen = 'splash' | 'difficulty' | 'game' | 'victory' | 'leaderboard' | 'tutorial' | 'wallet';
```

### Update `src/app/page.tsx` — add WalletPage case

```tsx
import { WalletPage } from '@/components/WalletPage';

// Inside renderScreen():
case 'wallet': return <WalletPage onBack={() => goTo('splash')} />;
```

### Update `src/components/SplashScreen.tsx` — add wallet button

```tsx
// Add this button alongside the others:
<button
  onClick={() => goTo('wallet')}
  style={{
    width: '100%', padding: '14px 0', borderRadius: 16,
    fontFamily: 'var(--font-exo2)', fontWeight: 600, fontSize: 14,
    background: 'rgba(139,92,246,0.08)',
    color: '#8b5cf6',
    border: '1.5px solid rgba(139,92,246,0.3)',
    cursor: 'pointer', transition: 'transform 0.1s',
  }}
  onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.96)')}
  onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
>
  ⚡ Game Wallet
</button>
```

### Update `src/components/DifficultySelect.tsx` — spend from wallet before starting

Replace `handleSelect` with this version that calls the server first:

```typescript
async function handleSelect(size: number, difficulty: string) {
  if (!authToken) return;
  buzz('medium');

  // Spend 1 ALIEN from game wallet (server-side, anti-cheat)
  const res = await fetch('/api/wallet/spend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ difficulty }),
  });

  if (!res.ok) {
    const data = await res.json();
    if (data.error === 'insufficient_balance') {
      // Navigate to wallet to top up
      goTo('wallet');
      return;
    }
    return;
  }

  startGame(size, difficulty);
}
```

This means `authToken` from `useAlien()` must be available in `DifficultySelect`. Add it:

```typescript
const { authToken } = useAlien();
// Also import: import { useAlien } from '@alien_org/react';
```

---

## PART 7 — COMPLETE TOKEN FLOW DIAGRAM

```
USER ACTION: Tap "Deposit 50 ALIEN"
                │
                ▼
[WalletPage.tsx] handleDeposit(pack)
  → POST /api/invoices  { amount: "50", token: "ALIEN", network: "alien", productId: "alien-50" }
  ← { invoice: "inv-abc-123" }
                │
                ▼
payment.pay({
  recipient: NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS,
  amount: "50", token: "ALIEN", network: "alien",
  invoice: "inv-abc-123",
  item: { title: "60 Trials", ... }
})
                │
                ▼
[ALIEN APP NATIVE UI]  ← User sees: "Pay 50 ALIEN to Congruence"
  User taps: APPROVE
                │
                ▼
payment.onPaid(txHash)  ← immediate (broadcast, not yet confirmed)
  → Show "Balance updating..." message
                │
  [~5-30 seconds later, on-chain confirmation]
                ▼
[ALIEN PLATFORM] POST /api/webhooks/payment
  { invoice: "inv-abc-123", status: "finalized", txHash: "...", amount: "50" }
  Header: x-webhook-signature: <ed25519 sig>
                │
                ▼
[webhook handler]
  1. Verify Ed25519 signature with WEBHOOK_PUBLIC_KEY ✓
  2. Find payment_intent by invoice
  3. Credit game_wallets.balance += 50
  4. Write walletLedger entry (type: "deposit", amount: +50)
  5. Update payment_intent.status = "completed"
                │
                ▼
USER BALANCE: 60 trials available ✓

══════════════════════════════════════

USER ACTION: Start puzzle (difficulty: "expert")
                │
                ▼
[DifficultySelect.tsx] handleSelect("expert", 9)
  → POST /api/wallet/spend { difficulty: "expert" }
  [Server checks: balance >= 1 ALIEN]
  → game_wallets.balance -= 1
  → walletLedger entry (type: "trial_spend", amount: -1)
  ← { success: true, balance: 59 }
                │
                ▼
startGame(9, "expert")  ← game starts

══════════════════════════════════════

USER ACTION: Tap "Withdraw 20 ALIEN"
                │
                ▼
[WalletPage.tsx] handleWithdraw(20)
  → POST /api/wallet/withdraw { amount: 20 }
  [Server checks: balance >= 20, balance >= MIN_WITHDRAWAL]
  → game_wallets.balance -= 20
  → withdrawals row created (status: "pending")
  → walletLedger entry (type: "withdrawal", amount: -20)
  ← { success: true, balance: 39, message: "Processing within 24h" }
                │
                ▼
[YOU (game operator) manually send ALIEN tokens back to user's Alien wallet]
  Using your treasury private key + @solana/web3.js
  Update withdrawals.status = "completed" + txHash
```

---

## PART 8 — IMPORTANT NOTES FOR JULES

### 1. Correct package names
The real Alien SDK packages are:
```bash
npm install @alien_org/react          # NOT @alien-id/miniapp-sdk
npm install @alien_org/auth-client    # NOT @alien-id/sso-sdk-js
```
The underscore (`_`) in `alien_org` is correct. This is different from what was in the original build guide.

### 2. ALIEN token amount format
When calling `payment.pay()` for ALIEN tokens on the `"alien"` network, the `amount` field is a **string of the integer amount** — e.g., `"10"` means 10 ALIEN. No decimals, no multiplication by 10^9. This is different from USDC which uses microUSDC (6 decimal places).

### 3. The webhook signature is Ed25519, not HMAC
The original guide used HMAC-SHA256. The real Alien platform uses **Ed25519**. The implementation above uses `crypto.subtle.importKey` with `{ name: 'Ed25519' }`. Use it exactly as shown.

### 4. `WEBHOOK_PUBLIC_KEY` is shown ONLY ONCE
When you create the webhook in the dev portal and it shows you the public key — copy it immediately and save it. If you miss it, you must delete and recreate the webhook to get a new key pair.

### 5. Withdrawal fulfillment is manual for now
The `/api/wallet/withdraw` route records the request and deducts from the balance, but the actual on-chain ALIEN token transfer back to the user requires your treasury wallet's **private key** on the server. This is a sensitive operation. For now, process withdrawals manually via Drizzle Studio. Automate it only once you have proper key management (HSM or similar).

### 6. `NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS` is NOT a Solana wallet
It is your **Alien provider address** — found in the dev.alien.org portal, not in a Solana wallet app.
```
