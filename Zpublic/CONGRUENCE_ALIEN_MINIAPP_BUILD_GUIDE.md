# 🛸 CONGRUENCE — Alien Miniapp Build Guide
### Complete Deployment Instructions for Jules AI

> **One deployment. Zero shortcuts.** This document contains everything needed to build,
> configure, and deploy the Congruence modular-arithmetic puzzle game as a miniapp on
> [alien.org](https://alien.org) — including all source code, token-payment gating,
> webhook integration, deeplinks, and leaderboard.

---

## TABLE OF CONTENTS

1. [Platform Overview](#1-platform-overview)
2. [Project Setup & Boilerplate](#2-project-setup--boilerplate)
3. [Environment Variables](#3-environment-variables)
4. [File Structure](#4-file-structure)
5. [Alien SDK Integration](#5-alien-sdk-integration)
6. [Aliencoin Payment Gate](#6-aliencoin-payment-gate)
7. [Core Game Logic](#7-core-game-logic)
8. [UI Components — Mobile-First](#8-ui-components--mobile-first)
9. [API Routes (Webhooks & Score Submission)](#9-api-routes-webhooks--score-submission)
10. [Deeplinks & Manifest](#10-deeplinks--manifest)
11. [Leaderboard (Neon Postgres)](#11-leaderboard-neon-postgres)
12. [Alien-Themed Visual Design](#12-alien-themed-visual-design)
13. [Build & Deploy to Vercel](#13-build--deploy-to-vercel)
14. [Post-Deploy: Register Miniapp on Alien](#14-post-deploy-register-miniapp-on-alien)
15. [Testing Checklist](#15-testing-checklist)

---

## 1. PLATFORM OVERVIEW

### What is Alien.org?
Alien is a Solana-based verified-human identity app. Each user has an **Alien ID** — a
cryptographically-secured identity tied to proof-of-humanity. The native token is
**Aliencoin** (SPL token on Solana). The app supports miniapps (embedded web experiences)
that can read the user's Alien ID and request Solana token transfers.

### Miniapp Architecture
- Miniapps are **Next.js web apps** hosted externally (Vercel recommended)
- They communicate with the Alien host app via the **`@alien-id/miniapp-sdk`** package
- Authentication is handled via **`@alien-id/sso-sdk-js`** (JWT-based)
- Payments use native Solana SPL token transfers signed in the Alien wallet
- The Alien app provides the frame (no browser chrome); your app fills the viewport

### Key SDKs
| Package | Purpose |
|---------|---------|
| `@alien-id/miniapp-sdk` | Context, user info, payment requests, events |
| `@alien-id/sso-sdk-js` | SSO / JWT verification for server-side auth |
| `@solana/web3.js` | Build Solana transactions for token transfers |
| `@solana/spl-token` | Aliencoin SPL token utilities |

---

## 2. PROJECT SETUP & BOILERPLATE

### Step 1 — Clone the Official Boilerplate

```bash
# Use the official alien-id miniapp boilerplate
npx degit alien-id/miniapp-boilerplate congruence-alien
cd congruence-alien
```

If degit fails (private template), manually scaffold:

```bash
npx create-next-app@latest congruence-alien \
  --typescript \
  --tailwind \
  --app \
  --no-eslint \
  --src-dir \
  --import-alias "@/*"
cd congruence-alien
```

### Step 2 — Install Dependencies

```bash
npm install \
  @alien-id/miniapp-sdk \
  @alien-id/sso-sdk-js \
  @solana/web3.js \
  @solana/spl-token \
  zustand \
  lucide-react \
  @neondatabase/serverless \
  drizzle-orm \
  class-variance-authority \
  clsx \
  tailwind-merge \
  jose \
  bs58

npm install --save-dev \
  @types/node \
  tsx
```

### Step 3 — Configure Tailwind

Replace `tailwind.config.ts` entirely:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Alien-themed palette (space + neon)
        space: {
          950: '#020408',
          900: '#050d18',
          800: '#0a1628',
          700: '#0f2040',
          600: '#163058',
        },
        alien: {
          green:  '#00ff88',
          purple: '#8b5cf6',
          blue:   '#3b82f6',
          cyan:   '#06b6d4',
          gold:   '#f59e0b',
          red:    '#ef4444',
        },
        cage: {
          0: '#DC2626',
          1: '#2563EB',
          2: '#16A34A',
          3: '#CA8A04',
          4: '#9333EA',
          5: '#DB2777',
          6: '#0891B2',
          7: '#EA580C',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scanline': 'scanline 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          from: { textShadow: '0 0 10px #00ff88, 0 0 20px #00ff88' },
          to:   { textShadow: '0 0 20px #00ff88, 0 0 40px #00ff88, 0 0 60px #00ff88' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        }
      }
    },
  },
  plugins: [],
}

export default config
```

---

## 3. ENVIRONMENT VARIABLES

Create `.env.local` (never commit this file):

```bash
# ── Alien Platform ──────────────────────────────────────────────
# Get these from dev.alien.org after registering your miniapp
ALIEN_APP_ID=your_alien_app_id_here
ALIEN_APP_SECRET=your_alien_app_secret_here
ALIEN_WEBHOOK_SECRET=your_webhook_signing_secret_here

# ── Solana / Aliencoin ──────────────────────────────────────────
# Aliencoin SPL token mint address on Solana mainnet
NEXT_PUBLIC_ALIENCOIN_MINT=AiENCoiNMiNTAddReSsHEReXXXXXXXXXXXXXXXXXX
# Your game treasury wallet (receives token payments)
NEXT_PUBLIC_TREASURY_WALLET=YoURTReaSuRyWaLLeTAddReSsHERe
# Solana RPC endpoint
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# ── Game Economics ──────────────────────────────────────────────
# Cost in Aliencoin (with 9 decimals) per trial continuation
NEXT_PUBLIC_TRIAL_COST_TOKENS=5
# Free trials before payment required
NEXT_PUBLIC_FREE_TRIALS=3

# ── Database (Neon/Postgres) ────────────────────────────────────
DATABASE_URL=postgresql://user:password@hostname/dbname?sslmode=require

# ── App URL (set after Vercel deploy) ───────────────────────────
NEXT_PUBLIC_APP_URL=https://congruence.vercel.app
```

Create `.env.example` (safe to commit):

```bash
ALIEN_APP_ID=
ALIEN_APP_SECRET=
ALIEN_WEBHOOK_SECRET=
NEXT_PUBLIC_ALIENCOIN_MINT=
NEXT_PUBLIC_TREASURY_WALLET=
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_TRIAL_COST_TOKENS=5
NEXT_PUBLIC_FREE_TRIALS=3
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
```

---

## 4. FILE STRUCTURE

```
congruence-alien/
├── .env.local                         ← secrets (gitignored)
├── .env.example                       ← template (committed)
├── next.config.ts
├── tailwind.config.ts
├── public/
│   ├── icon.png                       ← 512x512 alien eye logo
│   ├── hero.png                       ← 1200x630 splash screen
│   ├── screenshot-1.png               ← gameplay screenshot
│   └── manifest.json                  ← Alien miniapp manifest
├── src/
│   ├── app/
│   │   ├── layout.tsx                 ← root layout with AlienProvider
│   │   ├── page.tsx                   ← game entry point
│   │   ├── globals.css
│   │   └── api/
│   │       ├── webhook/
│   │       │   └── route.ts           ← Alien webhook receiver
│   │       ├── score/
│   │       │   └── route.ts           ← score submission endpoint
│   │       ├── leaderboard/
│   │       │   └── route.ts           ← leaderboard fetch
│   │       └── verify-payment/
│   │           └── route.ts           ← Solana tx verification
│   ├── components/
│   │   ├── AlienProvider.tsx          ← SDK context wrapper
│   │   ├── PaymentGate.tsx            ← Aliencoin trial paywall
│   │   ├── GameShell.tsx              ← full-screen mobile frame
│   │   ├── SplashScreen.tsx           ← animated title + menu
│   │   ├── DifficultySelect.tsx       ← difficulty picker
│   │   ├── GameBoard.tsx              ← main game screen
│   │   ├── GameGrid.tsx               ← n×n puzzle grid
│   │   ├── NumberPad.tsx              ← mobile number input
│   │   ├── GameHUD.tsx                ← timer / score / controls
│   │   ├── VictoryScreen.tsx          ← win celebration + score post
│   │   ├── Leaderboard.tsx            ← global score table
│   │   └── Tutorial.tsx               ← how to play overlay
│   ├── lib/
│   │   ├── puzzleGenerator.ts         ← Latin square + cage gen
│   │   ├── puzzleSolver.ts            ← validation engine
│   │   ├── alienClient.ts             ← Alien SDK helpers
│   │   ├── solanaPayment.ts           ← Aliencoin transfer builder
│   │   ├── scoreVerification.ts       ← anti-cheat hash
│   │   └── utils.ts                   ← cn() and misc helpers
│   ├── store/
│   │   └── gameStore.ts               ← Zustand global state
│   └── types/
│       └── alien.d.ts                 ← Alien SDK type extensions
```

---

## 5. ALIEN SDK INTEGRATION

### `src/types/alien.d.ts`

```typescript
// Type augmentation for Alien miniapp SDK
declare module '@alien-id/miniapp-sdk' {
  export interface AlienUser {
    alienId: string;
    username?: string;
    avatarUrl?: string;
    walletAddress: string;    // Solana public key
    isVerifiedHuman: boolean;
  }

  export interface AlienContext {
    user: AlienUser | null;
    isReady: boolean;
    isInAlienApp: boolean;
  }

  export interface PaymentRequest {
    amount: number;           // Token amount (human-readable, e.g. 5)
    tokenMint: string;        // SPL token mint address
    recipient: string;        // Treasury wallet
    memo?: string;            // e.g. "Congruence trial purchase"
    onSuccess: (txSignature: string) => void;
    onError: (error: Error) => void;
  }

  export function useAlien(): AlienContext;
  export function requestPayment(req: PaymentRequest): Promise<void>;
  export function postScore(score: number, metadata?: Record<string, unknown>): Promise<void>;
  export function openDeepLink(path: string): void;
  export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void;
  export function AlienProvider(props: { children: React.ReactNode }): JSX.Element;
}
```

### `src/lib/alienClient.ts`

```typescript
'use client';

import { useAlien, hapticFeedback, openDeepLink } from '@alien-id/miniapp-sdk';

/**
 * Detect if running inside the Alien app frame.
 * Falls back gracefully in browser dev mode.
 */
export function isAlienApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.navigator.userAgent.includes('AlienApp') ||
    window.__ALIEN_CONTEXT__ !== undefined ||
    new URLSearchParams(window.location.search).has('alien_context')
  );
}

/**
 * Wrapper: vibrate on mobile if supported, then trigger Alien haptics
 */
export function buzz(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  try {
    hapticFeedback(type);
  } catch (_) {
    // Not in Alien app — silently skip
  }
  if (navigator.vibrate) {
    const patterns = { light: 10, medium: 30, heavy: 60, success: [10, 50, 10], error: [50, 20, 50] };
    navigator.vibrate(patterns[type] as number | number[]);
  }
}

/**
 * Share a score result as a deep link back into Alien
 */
export function shareScore(score: number, difficulty: string, size: number) {
  const path = `/congruence?score=${score}&diff=${difficulty}&size=${size}`;
  try {
    openDeepLink(path);
  } catch (_) {
    // Fallback for browser
    if (navigator.share) {
      navigator.share({
        title: '🛸 CONGRUENCE',
        text: `I scored ${score} on ${difficulty} (${size}×${size})! Beat me on Alien.`,
        url: `${process.env.NEXT_PUBLIC_APP_URL}${path}`,
      });
    }
  }
}

export { useAlien };
```

### `src/components/AlienProvider.tsx`

```tsx
'use client';

import { AlienProvider as SDKProvider } from '@alien-id/miniapp-sdk';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Wraps the entire app in the Alien SDK context.
 * This MUST be the outermost provider in layout.tsx.
 */
export function AlienProvider({ children }: Props) {
  return (
    <SDKProvider>
      {children}
    </SDKProvider>
  );
}
```

### `src/app/layout.tsx`

```tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AlienProvider } from '@/components/AlienProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CONGRUENCE — Alien Miniapp',
  description: 'A modular arithmetic logic puzzle from deep space.',
  manifest: '/manifest.json',
  icons: { icon: '/icon.png', apple: '/icon.png' },
  openGraph: {
    title: 'CONGRUENCE',
    description: 'The universe\'s hardest number puzzle.',
    images: ['/hero.png'],
  },
};

// Critical: prevent user scaling and overscroll — this is a game
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#050d18',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className={`${inter.variable} h-full overflow-hidden bg-space-950 text-white`}>
        <AlienProvider>
          {children}
        </AlienProvider>
      </body>
    </html>
  );
}
```

---

## 6. ALIENCOIN PAYMENT GATE

This is the system that lets players use Aliencoin to unlock additional puzzle trials.

### Design Philosophy (Harmless & Fun)
- Each player gets **3 free trials** per difficulty per day (stored in localStorage + server).
- To play more, they pay **5 Aliencoin** per pack of 5 additional puzzles.
- Payment is a Solana SPL token transfer to the treasury wallet.
- No subscription, no forced purchase — fully opt-in. Players are shown their remaining free trials clearly.

### `src/lib/solanaPayment.ts`

```typescript
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

const ALIENCOIN_MINT = new PublicKey(process.env.NEXT_PUBLIC_ALIENCOIN_MINT!);
const TREASURY = new PublicKey(process.env.NEXT_PUBLIC_TREASURY_WALLET!);
const ALIENCOIN_DECIMALS = 9; // SPL token decimals

/**
 * Returns the amount in raw lamports for a given human-readable token amount
 */
export function toRawAmount(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** ALIENCOIN_DECIMALS));
}

/**
 * Build a Solana transaction that transfers Aliencoin from the user to treasury.
 * The Alien app's wallet will sign and broadcast this.
 */
export async function buildTrialPaymentTransaction(
  senderWallet: string,
  trialsCount: number = 5
): Promise<Transaction> {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );

  const sender = new PublicKey(senderWallet);
  const costPerPack = Number(process.env.NEXT_PUBLIC_TRIAL_COST_TOKENS || 5);
  const rawAmount = toRawAmount(costPerPack);

  // Get the associated token accounts
  const senderATA = await getAssociatedTokenAddress(ALIENCOIN_MINT, sender);
  const treasuryATA = await getAssociatedTokenAddress(ALIENCOIN_MINT, TREASURY);

  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  const tx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: sender,
  });

  tx.add(
    createTransferInstruction(
      senderATA,
      treasuryATA,
      sender,
      rawAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  return tx;
}

/**
 * Verify a completed transaction on-chain.
 * Called server-side from /api/verify-payment
 */
export async function verifyPaymentTransaction(
  txSignature: string,
  expectedSender: string
): Promise<{ valid: boolean; amount: number }> {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );

  try {
    const tx = await connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });

    if (!tx || !tx.meta || tx.meta.err) {
      return { valid: false, amount: 0 };
    }

    // Check the transfer was to our treasury and from the expected sender
    const instructions = tx.transaction.message.instructions;
    for (const ix of instructions) {
      if ('parsed' in ix && ix.program === 'spl-token' && ix.parsed.type === 'transfer') {
        const info = ix.parsed.info;
        const treasuryATA = (await getAssociatedTokenAddress(
          ALIENCOIN_MINT, TREASURY
        )).toString();

        if (
          info.destination === treasuryATA &&
          info.authority === expectedSender
        ) {
          const humanAmount = Number(BigInt(info.amount)) / 10 ** ALIENCOIN_DECIMALS;
          const expectedAmount = Number(process.env.NEXT_PUBLIC_TRIAL_COST_TOKENS || 5);
          return {
            valid: humanAmount >= expectedAmount,
            amount: humanAmount,
          };
        }
      }
    }
    return { valid: false, amount: 0 };
  } catch {
    return { valid: false, amount: 0 };
  }
}
```

### `src/components/PaymentGate.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAlien, requestPayment } from '@alien-id/miniapp-sdk';
import { buzz } from '@/lib/alienClient';

const FREE_TRIALS = Number(process.env.NEXT_PUBLIC_FREE_TRIALS || 3);
const TRIAL_COST = Number(process.env.NEXT_PUBLIC_TRIAL_COST_TOKENS || 5);
const STORAGE_KEY = 'congruence_trials';

interface TrialData {
  used: number;
  purchased: number;
  date: string; // YYYY-MM-DD
  paidSignatures: string[];
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function loadTrials(): TrialData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('no data');
    const data: TrialData = JSON.parse(raw);
    // Reset daily free trials at midnight
    if (data.date !== getTodayKey()) {
      return { used: 0, purchased: data.purchased, date: getTodayKey(), paidSignatures: data.paidSignatures };
    }
    return data;
  } catch {
    return { used: 0, purchased: 0, date: getTodayKey(), paidSignatures: [] };
  }
}

function saveTrials(data: TrialData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface Props {
  onTrialGranted: () => void;
  children: React.ReactNode;
}

export function PaymentGate({ onTrialGranted, children }: Props) {
  const { user, isReady } = useAlien();
  const [trials, setTrials] = useState<TrialData | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    if (isReady) {
      const t = loadTrials();
      setTrials(t);
    }
  }, [isReady]);

  const remaining = trials
    ? Math.max(0, FREE_TRIALS - trials.used) + trials.purchased
    : FREE_TRIALS;
  const hasTrials = remaining > 0;

  function consumeTrial() {
    if (!trials) return;
    const updated = { ...trials, used: trials.used + 1 };
    saveTrials(updated);
    setTrials(updated);
    onTrialGranted();
  }

  async function handlePurchase() {
    if (!user?.walletAddress) {
      setError('Connect your Alien wallet to purchase trials.');
      return;
    }
    setPaying(true);
    setError(null);

    try {
      await requestPayment({
        amount: TRIAL_COST,
        tokenMint: process.env.NEXT_PUBLIC_ALIENCOIN_MINT!,
        recipient: process.env.NEXT_PUBLIC_TREASURY_WALLET!,
        memo: `Congruence: 5 trial pack (${user.alienId})`,
        onSuccess: async (txSignature: string) => {
          // Verify on server
          const res = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txSignature, alienId: user.alienId }),
          });
          const data = await res.json();

          if (data.valid) {
            const updated = {
              ...trials!,
              purchased: (trials?.purchased || 0) + 5,
              paidSignatures: [...(trials?.paidSignatures || []), txSignature],
            };
            saveTrials(updated);
            setTrials(updated);
            setShowGate(false);
            buzz('success');
          } else {
            setError('Payment verified failed. Contact support.');
            buzz('error');
          }
          setPaying(false);
        },
        onError: (err: Error) => {
          setError(err.message || 'Payment cancelled.');
          buzz('error');
          setPaying(false);
        },
      });
    } catch (err) {
      setError('Payment request failed. Try again.');
      buzz('error');
      setPaying(false);
    }
  }

  if (!isReady || !trials) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-alien-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If player has trials available, just show the game
  if (!showGate) {
    return (
      <div className="contents">
        {/* Trial counter pill */}
        <div className="absolute top-3 right-14 z-20">
          <button
            onClick={() => { if (!hasTrials) setShowGate(true); }}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
              ${hasTrials
                ? 'bg-alien-green/20 text-alien-green border border-alien-green/40'
                : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
              }
            `}
          >
            <span>🛸</span>
            <span>{remaining} trial{remaining !== 1 ? 's' : ''}</span>
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Payment gate overlay
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/90 backdrop-blur-sm">
      <div className="w-full max-w-xs bg-space-800 border border-alien-purple/40 rounded-2xl p-6 text-center">
        {/* Alien icon */}
        <div className="text-5xl mb-4 animate-float">🛸</div>

        <h2 className="text-xl font-bold text-alien-green mb-2">TRIAL PACK</h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          You've used all your free trials for today.
          Get <span className="text-white font-bold">5 more puzzles</span> to keep
          decoding transmissions.
        </p>

        <div className="bg-space-900 rounded-xl p-4 mb-6 border border-alien-gold/30">
          <div className="text-2xl font-bold text-alien-gold">{TRIAL_COST} Aliencoin</div>
          <div className="text-xs text-slate-500 mt-1">≈ 5 additional puzzles</div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 mb-4 text-red-400 text-xs">
            {error}
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={paying}
          className="
            w-full py-3.5 rounded-xl font-bold text-space-950
            bg-alien-green hover:bg-alien-green/90
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all active:scale-95
          "
        >
          {paying ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-space-950 border-t-transparent rounded-full animate-spin" />
              Authorizing...
            </span>
          ) : (
            `Purchase ${TRIAL_COST} Aliencoin`
          )}
        </button>

        <button
          onClick={() => setShowGate(false)}
          className="w-full mt-3 py-2.5 text-slate-500 text-sm hover:text-slate-300 transition-colors"
        >
          Maybe later
        </button>

        <p className="text-xs text-slate-600 mt-4">
          Free trials reset daily at midnight 🌙
          <br/>Daily free trials: {FREE_TRIALS}
        </p>
      </div>
    </div>
  );
}

// Hook for consuming a trial when starting a game
export function useTrialGate() {
  function canPlay(): boolean {
    const t = loadTrials();
    return Math.max(0, FREE_TRIALS - t.used) + t.purchased > 0;
  }

  function consumeTrial(): boolean {
    const t = loadTrials();
    const remaining = Math.max(0, FREE_TRIALS - t.used) + t.purchased;
    if (remaining <= 0) return false;

    if (t.used < FREE_TRIALS) {
      saveTrials({ ...t, used: t.used + 1 });
    } else {
      saveTrials({ ...t, purchased: Math.max(0, t.purchased - 1) });
    }
    return true;
  }

  return { canPlay, consumeTrial };
}
```

---

## 7. CORE GAME LOGIC

Copy these files verbatim. They implement the mathematical engine of Congruence.

### `src/lib/puzzleGenerator.ts`

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// PUZZLE GENERATOR — Latin square + modular cage generator
// ─────────────────────────────────────────────────────────────────────────────

export interface Cell {
  row: number;
  col: number;
  value: number;       // 0 = hole, 1-n = given clue
  isGiven: boolean;
  isValid: boolean;
  cageId: number;
  playerValue: number; // 0 = empty, 1-n = player entry
  notes: Set<number>;
}

export interface Cage {
  id: number;
  cells: Array<{ row: number; col: number }>;
  modulus: number;
  remainder: number;
  color: string;
}

export interface Puzzle {
  size: number;
  grid: Cell[][];
  cages: Cage[];
  solution: number[][];
  difficulty: string;
}

const CAGE_COLORS = [
  '#DC2626', '#2563EB', '#16A34A', '#CA8A04',
  '#9333EA', '#DB2777', '#0891B2', '#EA580C',
  '#059669', '#7C3AED', '#BE185D', '#0369A1'
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLatinSquare(n: number): number[][] {
  const base = shuffleArray(Array.from({ length: n }, (_, i) => i + 1));
  const square = Array.from({ length: n }, (_, i) =>
    base.map((_, j) => base[(j + i) % n])
  );
  const rowPerm = shuffleArray(Array.from({ length: n }, (_, i) => i));
  const colPerm = shuffleArray(Array.from({ length: n }, (_, i) => i));
  const result: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      result[i][j] = square[rowPerm[i]][colPerm[j]];
    }
  }
  return result;
}

function generateCages(n: number, targetCount: number): Cage[] {
  const visited: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  const cages: Cage[] = [];
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  const avgSize = Math.max(2, Math.floor((n * n) / targetCount));
  let cageId = 0;

  for (let sr = 0; sr < n; sr++) {
    for (let sc = 0; sc < n; sc++) {
      if (visited[sr][sc]) continue;
      const size = Math.max(2, Math.min(5, avgSize + randomInt(-1, 1)));
      const cells: Array<{ row: number; col: number }> = [];
      const queue = [{ row: sr, col: sc }];
      visited[sr][sc] = true;

      while (queue.length > 0 && cells.length < size) {
        const cell = queue.shift()!;
        cells.push(cell);
        for (const [dr, dc] of shuffleArray(dirs)) {
          const nr = cell.row + dr, nc = cell.col + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited[nr][nc]) {
            visited[nr][nc] = true;
            queue.push({ row: nr, col: nc });
            if (cells.length >= size) break;
          }
        }
      }

      cages.push({
        id: cageId,
        cells,
        modulus: 0,
        remainder: 0,
        color: CAGE_COLORS[cageId % CAGE_COLORS.length]
      });
      cageId++;
    }
  }

  // Merge orphaned cells
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!visited[i][j]) {
        let best = 0, bestDist = Infinity;
        for (let c = 0; c < cages.length; c++) {
          for (const cell of cages[c].cells) {
            const d = Math.abs(cell.row - i) + Math.abs(cell.col - j);
            if (d < bestDist) { bestDist = d; best = c; }
          }
        }
        cages[best].cells.push({ row: i, col: j });
        visited[i][j] = true;
      }
    }
  }

  return cages;
}

function assignConstraints(cages: Cage[], solution: number[][], modulus: number): Cage[] {
  return cages.map(cage => {
    const sum = cage.cells.reduce((s, c) => s + solution[c.row][c.col], 0);
    return { ...cage, modulus, remainder: sum % modulus };
  });
}

function hasUniqueSolution(grid: Cell[][], cages: Cage[]): boolean {
  const n = grid.length;
  for (let i = 0; i < n; i++) {
    const rv = new Set<number>(), cv = new Set<number>();
    for (let j = 0; j < n; j++) {
      const r = grid[i][j].value, c = grid[j][i].value;
      if (r !== 0) { if (rv.has(r)) return false; rv.add(r); }
      if (c !== 0) { if (cv.has(c)) return false; cv.add(c); }
    }
  }
  for (const cage of cages) {
    const filled = cage.cells.filter(c => grid[c.row][c.col].value !== 0);
    if (filled.length === cage.cells.length) {
      const sum = filled.reduce((s, c) => s + grid[c.row][c.col].value, 0);
      if (sum % cage.modulus !== cage.remainder) return false;
    }
  }
  return true;
}

export function generatePuzzle(size: number, difficulty: string): Puzzle {
  const configs: Record<string, { modulus: number; cageCount: number; clueFrac: number }> = {
    novice: { modulus: 3, cageCount: 8,  clueFrac: 0.55 },
    easy:   { modulus: 3, cageCount: 10, clueFrac: 0.50 },
    medium: { modulus: 4, cageCount: 12, clueFrac: 0.45 },
    hard:   { modulus: 4, cageCount: 14, clueFrac: 0.38 },
    expert: { modulus: 5, cageCount: 16, clueFrac: 0.32 },
    master: { modulus: 5, cageCount: 18, clueFrac: 0.28 },
  };
  const cfg = configs[difficulty] ?? configs.medium;
  const targetClues = Math.floor(size * size * cfg.clueFrac);

  const solution = generateLatinSquare(size);
  let cages = generateCages(size, cfg.cageCount);
  cages = assignConstraints(cages, solution, cfg.modulus);

  // Build initial full grid
  const grid: Cell[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({
      row: r, col: c,
      value: solution[r][c],
      isGiven: true, isValid: true,
      cageId: cages.find(cage => cage.cells.some(cell => cell.row === r && cell.col === c))?.id ?? -1,
      playerValue: 0, notes: new Set<number>()
    }))
  );

  // Punch holes
  const positions = shuffleArray(
    Array.from({ length: size * size }, (_, i) => ({ r: Math.floor(i / size), c: i % size }))
  );
  let removed = 0;
  const toRemove = size * size - targetClues;

  for (const { r, c } of positions) {
    if (removed >= toRemove) break;
    const orig = grid[r][c].value;
    grid[r][c].value = 0;
    grid[r][c].isGiven = false;

    if (hasUniqueSolution(grid, cages)) {
      removed++;
    } else {
      grid[r][c].value = orig;
      grid[r][c].isGiven = true;
    }
  }

  return { size, grid, cages, solution, difficulty };
}
```

### `src/lib/puzzleSolver.ts`

```typescript
import type { Cell, Cage, Puzzle } from './puzzleGenerator';

export interface ValidationResult {
  isComplete: boolean;
  isValid: boolean;
  errors: Array<{ row: number; col: number; reason: string }>;
  satisfiedCages: number[];
  violatedCages: number[];
  pendingCages: number[];
}

export function validatePuzzle(puzzle: Puzzle): ValidationResult {
  const { size, grid, cages } = puzzle;
  const errors: ValidationResult['errors'] = [];
  const satisfiedCages: number[] = [];
  const violatedCages: number[] = [];
  const pendingCages: number[] = [];

  const val = (r: number, c: number) => grid[r][c].playerValue || grid[r][c].value;

  // Latin square check
  for (let i = 0; i < size; i++) {
    const rowMap = new Map<number, number[]>();
    const colMap = new Map<number, number[]>();
    for (let j = 0; j < size; j++) {
      const rv = val(i, j), cv = val(j, i);
      if (rv) { if (!rowMap.has(rv)) rowMap.set(rv, []); rowMap.get(rv)!.push(j); }
      if (cv) { if (!colMap.has(cv)) colMap.set(cv, []); colMap.get(cv)!.push(j); }
    }
    for (const [v, cols] of rowMap) {
      if (cols.length > 1) cols.forEach(c => errors.push({ row: i, col: c, reason: `Dup ${v} row ${i+1}` }));
    }
    for (const [v, rows] of colMap) {
      if (rows.length > 1) rows.forEach(r => errors.push({ row: r, col: i, reason: `Dup ${v} col ${i+1}` }));
    }
  }

  // Cage constraint check
  for (const cage of cages) {
    const values = cage.cells.map(c => val(c.row, c.col));
    const filled = values.filter(v => v !== 0);
    if (filled.length < cage.cells.length) {
      pendingCages.push(cage.id);
    } else {
      const sum = filled.reduce((s, v) => s + v, 0);
      (sum % cage.modulus === cage.remainder ? satisfiedCages : violatedCages).push(cage.id);
    }
  }

  let isComplete = errors.length === 0 && violatedCages.length === 0;
  if (isComplete) {
    for (let i = 0; i < size && isComplete; i++) {
      for (let j = 0; j < size && isComplete; j++) {
        if (val(i, j) === 0) isComplete = false;
      }
    }
  }

  return { isComplete, isValid: errors.length === 0, errors, satisfiedCages, violatedCages, pendingCages };
}

export function isSolved(puzzle: Puzzle): boolean {
  return validatePuzzle(puzzle).isComplete;
}

export function getHint(puzzle: Puzzle): { row: number; col: number; value: number } | null {
  for (let i = 0; i < puzzle.grid.length; i++) {
    for (let j = 0; j < puzzle.grid[i].length; j++) {
      const cell = puzzle.grid[i][j];
      if (!cell.isGiven && cell.playerValue === 0) {
        return { row: i, col: j, value: puzzle.solution[i][j] };
      }
    }
  }
  return null;
}
```

### `src/lib/scoreVerification.ts`

```typescript
// Simple anti-cheat: hash the score with session data
// Server verifies the hash before writing to leaderboard

export function buildScorePayload(
  alienId: string,
  score: number,
  elapsed: number,
  hints: number,
  errors: number,
  difficulty: string,
  size: number,
  nonce: string
): string {
  return `${alienId}:${score}:${elapsed}:${hints}:${errors}:${difficulty}:${size}:${nonce}`;
}

export async function hashPayload(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function calculateScore(
  size: number,
  elapsed: number,
  hints: number,
  errors: number
): number {
  const base = Math.floor(1000 * (size / 5));
  const timeBonus = Math.max(0, base - elapsed * 2);
  const final = Math.max(100, base + timeBonus - hints * 50 - errors * 10);
  return final;
}
```

### `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}
```

---

## 8. UI COMPONENTS — MOBILE-FIRST

**Critical design rules:**
- No page scroll — the entire game lives in `100dvh` (dynamic viewport height, handles iOS safe areas)
- Navigation via React state, not browser routes
- Number pad at the bottom, grid in the middle
- All touch targets ≥ 44px

### `src/store/gameStore.ts`

```typescript
import { create } from 'zustand';
import { generatePuzzle, type Puzzle } from '@/lib/puzzleGenerator';
import { isSolved, getHint } from '@/lib/puzzleSolver';
import { calculateScore } from '@/lib/scoreVerification';

export type Screen = 'splash' | 'difficulty' | 'game' | 'victory' | 'leaderboard' | 'tutorial';

interface HistoryEntry {
  row: number;
  col: number;
  prev: number;
}

interface GameState {
  screen: Screen;
  puzzle: Puzzle | null;
  selectedCell: { row: number; col: number } | null;
  elapsed: number;
  hints: number;
  errors: number;
  score: number;
  history: HistoryEntry[];
  isTimerRunning: boolean;

  // Actions
  goTo: (screen: Screen) => void;
  startGame: (size: number, difficulty: string) => void;
  selectCell: (row: number, col: number) => void;
  enterNumber: (num: number) => void;
  clearCell: () => void;
  useHint: () => void;
  undo: () => void;
  tick: () => void;
  finishGame: () => void;
  resetAll: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'splash',
  puzzle: null,
  selectedCell: null,
  elapsed: 0,
  hints: 0,
  errors: 0,
  score: 0,
  history: [],
  isTimerRunning: false,

  goTo: (screen) => set({ screen }),

  startGame: (size, difficulty) => {
    const puzzle = generatePuzzle(size, difficulty);
    set({
      puzzle, screen: 'game',
      selectedCell: null, elapsed: 0, hints: 0,
      errors: 0, score: 0, history: [], isTimerRunning: true,
    });
  },

  selectCell: (row, col) => set({ selectedCell: { row, col } }),

  enterNumber: (num) => {
    const { puzzle, selectedCell, errors, history } = get();
    if (!puzzle || !selectedCell) return;
    const { row, col } = selectedCell;
    const cell = puzzle.grid[row][col];
    if (cell.isGiven) return;

    const newGrid = puzzle.grid.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    const prev = newGrid[row][col].playerValue;
    newGrid[row][col].playerValue = num;
    newGrid[row][col].notes.clear();

    // Check dupe
    let newErrors = errors;
    const rowVals = newGrid[row]
      .filter((_, j) => j !== col)
      .map(c => c.playerValue || c.value)
      .filter(Boolean);
    const colVals = newGrid
      .filter((_, i) => i !== row)
      .map(r => r[col].playerValue || r[col].value)
      .filter(Boolean);
    if (rowVals.includes(num) || colVals.includes(num)) newErrors++;

    set({
      puzzle: { ...puzzle, grid: newGrid },
      errors: newErrors,
      history: [...history, { row, col, prev }],
    });
  },

  clearCell: () => {
    const { puzzle, selectedCell, history } = get();
    if (!puzzle || !selectedCell) return;
    const { row, col } = selectedCell;
    if (puzzle.grid[row][col].isGiven) return;
    const prev = puzzle.grid[row][col].playerValue;
    const newGrid = puzzle.grid.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    newGrid[row][col].playerValue = 0;
    set({
      puzzle: { ...puzzle, grid: newGrid },
      history: [...history, { row, col, prev }],
    });
  },

  useHint: () => {
    const { puzzle, hints } = get();
    if (!puzzle) return;
    const hint = getHint(puzzle);
    if (!hint) return;
    const newGrid = puzzle.grid.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    newGrid[hint.row][hint.col].playerValue = hint.value;
    set({
      puzzle: { ...puzzle, grid: newGrid },
      hints: hints + 1,
      selectedCell: { row: hint.row, col: hint.col },
    });
  },

  undo: () => {
    const { puzzle, history } = get();
    if (!puzzle || history.length === 0) return;
    const last = history[history.length - 1];
    const newGrid = puzzle.grid.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    newGrid[last.row][last.col].playerValue = last.prev;
    set({
      puzzle: { ...puzzle, grid: newGrid },
      history: history.slice(0, -1),
    });
  },

  tick: () => {
    const { isTimerRunning, elapsed, puzzle } = get();
    if (!isTimerRunning) return;
    const newElapsed = elapsed + 1;
    set({ elapsed: newElapsed });

    // Auto-check on every tick
    if (puzzle && isSolved(puzzle)) {
      get().finishGame();
    }
  },

  finishGame: () => {
    const { puzzle, elapsed, hints, errors } = get();
    if (!puzzle) return;
    const score = calculateScore(puzzle.size, elapsed, hints, errors);
    set({ score, screen: 'victory', isTimerRunning: false });
  },

  resetAll: () => set({
    screen: 'splash', puzzle: null, selectedCell: null,
    elapsed: 0, hints: 0, errors: 0, score: 0,
    history: [], isTimerRunning: false,
  }),
}));
```

### `src/app/page.tsx`

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameShell } from '@/components/GameShell';
import { SplashScreen } from '@/components/SplashScreen';
import { DifficultySelect } from '@/components/DifficultySelect';
import { GameBoard } from '@/components/GameBoard';
import { VictoryScreen } from '@/components/VictoryScreen';
import { Leaderboard } from '@/components/Leaderboard';
import { Tutorial } from '@/components/Tutorial';
import { PaymentGate } from '@/components/PaymentGate';

export default function Home() {
  const { screen, tick, goTo } = useGameStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => tick(), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [tick]);

  const renderScreen = () => {
    switch (screen) {
      case 'splash':      return <SplashScreen />;
      case 'difficulty':  return <DifficultySelect />;
      case 'game':        return (
        <PaymentGate onTrialGranted={() => {}}>
          <GameBoard />
        </PaymentGate>
      );
      case 'victory':     return <VictoryScreen />;
      case 'leaderboard': return <Leaderboard />;
      case 'tutorial':    return <Tutorial onClose={() => goTo('splash')} />;
      default:            return <SplashScreen />;
    }
  };

  return (
    <GameShell>
      {renderScreen()}
    </GameShell>
  );
}
```

### `src/components/GameShell.tsx`

```tsx
// Full-screen mobile container — no scroll, safe area insets
import { ReactNode } from 'react';

export function GameShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        fixed inset-0 flex flex-col
        bg-space-950 text-white
        overflow-hidden select-none
        [env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]
        [env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]
      "
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Subtle space background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,136,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative flex flex-col flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

### `src/components/SplashScreen.tsx`

```tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { useAlien } from '@/lib/alienClient';

export function SplashScreen() {
  const { goTo } = useGameStore();
  const { user } = useAlien();

  return (
    <div className="flex-1 flex flex-col items-center justify-between py-10 px-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-3 animate-float">👾</div>
        <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text
          bg-gradient-to-b from-alien-green to-alien-cyan animate-glow">
          CONGRUENCE
        </h1>
        <p className="text-slate-400 text-xs mt-2 tracking-widest uppercase">
          Modular Arithmetic · Deep Space Edition
        </p>
        {user && (
          <p className="text-alien-green/70 text-xs mt-3 font-mono">
            ▸ {user.username ?? user.alienId.slice(0, 12) + '…'}
          </p>
        )}
      </div>

      {/* Main actions */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => goTo('difficulty')}
          className="
            w-full py-4 rounded-2xl font-bold text-lg text-space-950
            bg-gradient-to-r from-alien-green to-alien-cyan
            active:scale-95 transition-transform shadow-lg shadow-alien-green/30
          "
        >
          🚀 Launch Game
        </button>
        <button
          onClick={() => goTo('leaderboard')}
          className="
            w-full py-3.5 rounded-2xl font-bold text-alien-gold
            bg-space-800 border border-alien-gold/40
            active:scale-95 transition-transform
          "
        >
          🏆 Galactic Leaderboard
        </button>
        <button
          onClick={() => goTo('tutorial')}
          className="
            w-full py-3.5 rounded-2xl font-semibold text-slate-300
            bg-space-800 border border-slate-700
            active:scale-95 transition-transform
          "
        >
          📡 How To Play
        </button>
      </div>

      {/* Footer */}
      <p className="text-slate-700 text-xs text-center">
        Alien Network · Verified Humans Only
      </p>
    </div>
  );
}
```

### `src/components/DifficultySelect.tsx`

```tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { useTrialGate } from './PaymentGate';
import { buzz } from '@/lib/alienClient';

const DIFFICULTIES = [
  { id: 'novice', label: 'Cadet',   desc: '5×5 · Easy warmup',       icon: '🌱', size: 5, color: 'from-emerald-600 to-teal-600' },
  { id: 'easy',   label: 'Pilot',   desc: '6×6 · Gentle probe',       icon: '🛸', size: 6, color: 'from-blue-600 to-cyan-600' },
  { id: 'medium', label: 'Scout',   desc: '6×6 · Standard mission',   icon: '⚡', size: 6, color: 'from-violet-600 to-purple-600' },
  { id: 'hard',   label: 'Soldier', desc: '8×8 · Complex signals',    icon: '🔭', size: 8, color: 'from-orange-600 to-amber-600' },
  { id: 'expert', label: 'Commander','desc': '9×9 · Alien cipher',    icon: '🧬', size: 9, color: 'from-red-600 to-rose-600' },
  { id: 'master', label: 'Overlord', desc: '9×9 · Ultimate test',     icon: '☠️', size: 9, color: 'from-slate-600 to-gray-700' },
];

export function DifficultySelect() {
  const { startGame, goTo } = useGameStore();
  const { canPlay, consumeTrial } = useTrialGate();

  function handleSelect(size: number, difficulty: string) {
    if (!canPlay()) {
      goTo('game'); // Will show payment gate
      return;
    }
    consumeTrial();
    buzz('medium');
    startGame(size, difficulty);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => goTo('splash')} className="text-slate-400 p-2 -ml-2">
          ← Back
        </button>
        <h2 className="text-lg font-bold text-alien-green tracking-wide">SELECT MISSION</h2>
        <div className="w-10" />
      </div>

      {/* Difficulty grid — scrollable section only */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {DIFFICULTIES.map(d => (
          <button
            key={d.id}
            onClick={() => handleSelect(d.size, d.id)}
            className="
              w-full flex items-center gap-4 p-4 rounded-2xl
              bg-space-800 border border-space-700
              active:scale-[0.98] transition-all
              hover:border-alien-green/40
            "
          >
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center text-2xl
              bg-gradient-to-br ${d.color} shrink-0
            `}>
              {d.icon}
            </div>
            <div className="text-left">
              <div className="font-bold text-white">{d.label}</div>
              <div className="text-xs text-slate-400">{d.desc}</div>
            </div>
            <div className="ml-auto text-slate-600 text-lg">›</div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### `src/components/GameBoard.tsx`

```tsx
'use client';

import { GameGrid } from './GameGrid';
import { NumberPad } from './NumberPad';
import { GameHUD } from './GameHUD';

export function GameBoard() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <GameHUD />
      {/* Grid — centered, takes available space */}
      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        <GameGrid />
      </div>
      {/* Number pad pinned to bottom */}
      <NumberPad />
    </div>
  );
}
```

### `src/components/GameHUD.tsx`

```tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { formatTime, formatScore } from '@/lib/utils';

export function GameHUD() {
  const { elapsed, score, hints, errors, puzzle, goTo } = useGameStore();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-space-900/80 backdrop-blur border-b border-space-700">
      {/* Back */}
      <button
        onClick={() => goTo('splash')}
        className="text-slate-500 font-mono text-sm active:text-white transition-colors"
      >
        ✕
      </button>

      {/* Timer */}
      <div className="font-mono text-lg text-alien-cyan tabular-nums">
        ⏱ {formatTime(elapsed)}
      </div>

      {/* Score */}
      <div className="font-mono text-base text-alien-gold tabular-nums">
        {formatScore(score > 0 ? score : Math.floor(1000 * ((puzzle?.size ?? 5) / 5)))}
      </div>

      {/* Hints & Errors */}
      <div className="flex gap-3 text-xs font-mono">
        <span className="text-amber-400">💡{hints}</span>
        <span className="text-red-400">✗{errors}</span>
      </div>
    </div>
  );
}
```

### `src/components/GameGrid.tsx`

```tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { validatePuzzle } from '@/lib/puzzleSolver';
import { cn } from '@/lib/utils';
import { buzz } from '@/lib/alienClient';

export function GameGrid() {
  const { puzzle, selectedCell, selectCell } = useGameStore();
  if (!puzzle) return null;

  const { size, grid, cages } = puzzle;
  const validation = validatePuzzle(puzzle);

  // Cell size: maximize to fit screen (account for HUD ~56px + numpad ~200px)
  // On mobile (375px wide - 16px padding each side = 343px), max cell = 343/9 ≈ 38px
  const cellPx = Math.min(42, Math.floor((343) / size));

  // Cage label position: top-left cell of each cage
  const cageBounds: Record<number, { minR: number; minC: number }> = {};
  for (const cage of cages) {
    const rows = cage.cells.map(c => c.row);
    const cols = cage.cells.map(c => c.col);
    cageBounds[cage.id] = {
      minR: Math.min(...rows),
      minC: Math.min(...cols),
    };
  }

  return (
    <div
      className="relative grid gap-[2px] bg-space-700 p-[2px] rounded-xl"
      style={{ gridTemplateColumns: `repeat(${size}, ${cellPx}px)` }}
    >
      {grid.map((row, ri) =>
        row.map((cell, ci) => {
          const cage = cages.find(c => c.cells.some(cc => cc.row === ri && cc.col === ci));
          const isSelected = selectedCell?.row === ri && selectedCell?.col === ci;
          const isOrigin = cage && cageBounds[cage.id].minR === ri && cageBounds[cage.id].minC === ci;
          const displayVal = cell.playerValue || cell.value;
          const isError = validation.errors.some(e => e.row === ri && e.col === ci);
          const cageStatus = cage
            ? validation.satisfiedCages.includes(cage.id) ? 'satisfied'
            : validation.violatedCages.includes(cage.id) ? 'violated'
            : 'pending'
            : 'pending';

          return (
            <button
              key={`${ri}-${ci}`}
              onClick={() => {
                if (!cell.isGiven) { selectCell(ri, ci); buzz('light'); }
              }}
              disabled={cell.isGiven}
              style={{
                width: cellPx, height: cellPx,
                borderColor: cage
                  ? cageStatus === 'satisfied' ? '#10b981'
                  : cageStatus === 'violated' ? '#ef4444'
                  : `${cage.color}60`
                  : '#334155',
                borderWidth: cage ? 2 : 1,
              }}
              className={cn(
                'relative flex items-center justify-center rounded-md',
                'font-bold transition-all duration-100',
                'focus:outline-none',
                // Background
                cell.isGiven  && 'bg-space-700 cursor-default',
                !cell.isGiven && !isSelected && 'bg-space-800',
                isSelected    && 'bg-space-600 ring-2 ring-alien-blue',
                isError       && 'bg-red-900/60',
              )}
            >
              <span
                className={cn(
                  'text-base leading-none',
                  cell.isGiven  && 'text-slate-200 font-extrabold',
                  !cell.isGiven && displayVal && 'text-alien-cyan',
                  isError       && 'text-red-400',
                )}
                style={{ fontSize: Math.max(12, cellPx * 0.44) }}
              >
                {displayVal || ''}
              </span>

              {/* Cage label */}
              {isOrigin && cage && (
                <span
                  className="absolute top-0 left-0 text-[8px] font-bold leading-tight px-0.5 rounded-br-sm rounded-tl-sm text-white z-10"
                  style={{ backgroundColor: cage.color, fontSize: Math.max(7, cellPx * 0.18) }}
                >
                  ≡{cage.remainder}({cage.modulus})
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
```

### `src/components/NumberPad.tsx`

```tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { buzz } from '@/lib/alienClient';

export function NumberPad() {
  const { puzzle, enterNumber, clearCell, useHint, undo } = useGameStore();
  if (!puzzle) return null;

  const nums = Array.from({ length: puzzle.size }, (_, i) => i + 1);
  const cols = puzzle.size <= 6 ? puzzle.size : Math.ceil(puzzle.size / 2);

  function tap(fn: () => void, type: 'light' | 'medium' = 'light') {
    return () => { fn(); buzz(type); };
  }

  return (
    <div className="bg-space-900 border-t border-space-700 px-3 pt-3 pb-4">
      {/* Number buttons */}
      <div
        className="grid gap-2 mb-3"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {nums.map(n => (
          <button
            key={n}
            onClick={tap(() => enterNumber(n))}
            className="
              h-12 rounded-xl font-bold text-lg
              bg-space-700 text-white border border-space-600
              active:scale-90 active:bg-alien-blue transition-all
            "
          >
            {n}
          </button>
        ))}
      </div>

      {/* Action row */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={tap(clearCell)}
          className="h-11 rounded-xl text-sm font-semibold text-slate-400 bg-space-800 border border-space-700 active:scale-90 transition-all"
        >
          ✕ Clear
        </button>
        <button
          onClick={tap(undo)}
          className="h-11 rounded-xl text-sm font-semibold text-slate-400 bg-space-800 border border-space-700 active:scale-90 transition-all"
        >
          ↺ Undo
        </button>
        <button
          onClick={tap(() => useHint(), 'medium')}
          className="h-11 rounded-xl text-sm font-bold text-alien-gold bg-space-800 border border-alien-gold/30 active:scale-90 transition-all"
        >
          💡 Hint
        </button>
      </div>
    </div>
  );
}
```

### `src/components/VictoryScreen.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAlien } from '@/lib/alienClient';
import { formatTime, formatScore } from '@/lib/utils';
import { hashPayload, buildScorePayload } from '@/lib/scoreVerification';

export function VictoryScreen() {
  const { score, elapsed, hints, errors, puzzle, goTo, startGame } = useGameStore();
  const { user } = useAlien();
  const [submitted, setSubmitted] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!submitted && user && puzzle) {
      submitScore();
    }
  }, []);

  async function submitScore() {
    if (!user || !puzzle || submitted) return;
    setSubmitted(true);

    const nonce = Math.random().toString(36).slice(2);
    const payload = buildScorePayload(
      user.alienId, score, elapsed, hints, errors, puzzle.difficulty, puzzle.size, nonce
    );
    const hash = await hashPayload(payload);

    try {
      await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alienId: user.alienId,
          username: user.username || user.alienId.slice(0, 8),
          score, elapsed, hints, errors,
          difficulty: puzzle.difficulty,
          size: puzzle.size,
          hash, nonce,
        }),
      });
    } catch {
      // Score submission is best-effort — game still works offline
    }
  }

  const stars = score >= 1800 ? 3 : score >= 1200 ? 2 : 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-between py-8 px-4">
      {/* Stars */}
      <div className="text-center">
        <div className="text-5xl mb-2 animate-float">
          {['⭐','⭐⭐','⭐⭐⭐'][stars - 1]}
        </div>
        <h2 className="text-3xl font-black text-alien-green tracking-tight">
          SIGNAL DECODED!
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {puzzle?.difficulty?.toUpperCase()} · {puzzle?.size}×{puzzle?.size}
        </p>
      </div>

      {/* Score card */}
      <div className="w-full max-w-xs bg-space-800 rounded-2xl p-5 border border-alien-green/20 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Final Score</span>
          <span className="text-2xl font-black text-alien-gold">{formatScore(score)}</span>
        </div>
        <div className="h-px bg-space-700" />
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Time</span>
          <span className="font-mono text-alien-cyan">{formatTime(elapsed)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Hints</span>
          <span className="font-mono text-amber-400">{hints} × −50</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Errors</span>
          <span className="font-mono text-red-400">{errors} × −10</span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => puzzle && startGame(puzzle.size, puzzle.difficulty)}
          className="
            w-full py-4 rounded-2xl font-bold text-lg text-space-950
            bg-gradient-to-r from-alien-green to-alien-cyan
            active:scale-95 transition-transform
          "
        >
          ▶ Play Again
        </button>
        <button
          onClick={() => goTo('leaderboard')}
          className="w-full py-3.5 rounded-2xl font-bold text-alien-gold bg-space-800 border border-alien-gold/40 active:scale-95 transition-transform"
        >
          🏆 Leaderboard
        </button>
        <button
          onClick={() => goTo('difficulty')}
          className="w-full py-3 rounded-2xl font-semibold text-slate-400 bg-space-800 border border-space-700 active:scale-95 transition-transform"
        >
          New Mission
        </button>
      </div>
    </div>
  );
}
```

### `src/components/Leaderboard.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAlien } from '@/lib/alienClient';

interface Entry {
  rank: number;
  alienId: string;
  username: string;
  score: number;
  difficulty: string;
}

export function Leaderboard() {
  const { goTo } = useGameStore();
  const { user } = useAlien();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'global' | 'daily'>('global');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?type=${tab}`)
      .then(r => r.json())
      .then(data => { setEntries(data.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-space-700">
        <button onClick={() => goTo('splash')} className="text-slate-400 p-2 -ml-2">← Back</button>
        <h2 className="text-lg font-bold text-alien-gold tracking-wide">🏆 RANKINGS</h2>
        <div className="w-10" />
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-3 mb-2 bg-space-800 rounded-xl p-1">
        {(['global', 'daily'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`
              flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all
              ${tab === t ? 'bg-alien-purple text-white' : 'text-slate-400'}
            `}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-alien-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-3">🛸</div>
            <p>No transmissions yet. Be first!</p>
          </div>
        ) : entries.map((e) => (
          <div
            key={e.alienId + e.rank}
            className={`
              flex items-center gap-3 p-3 rounded-xl border
              ${e.alienId === user?.alienId
                ? 'bg-alien-green/10 border-alien-green/40'
                : 'bg-space-800 border-space-700'
              }
            `}
          >
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0
              ${e.rank === 1 ? 'bg-yellow-500 text-black' :
                e.rank === 2 ? 'bg-slate-400 text-black' :
                e.rank === 3 ? 'bg-amber-700 text-white' :
                'bg-space-700 text-slate-400'}
            `}>
              {e.rank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">
                {e.alienId === user?.alienId ? `${e.username} (you)` : e.username}
              </div>
              <div className="text-xs text-slate-500 capitalize">{e.difficulty}</div>
            </div>
            <div className="font-black text-alien-gold font-mono">
              {e.score.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### `src/components/Tutorial.tsx`

```tsx
'use client';

import { useState } from 'react';

const STEPS = [
  {
    title: '🛸 Mission Briefing',
    body: 'You are decoding an alien transmission locked in a number grid. Fill every row and column with numbers 1 to N — each exactly once.',
    visual: '1 2 3\n4 5 6\n7 8 9',
  },
  {
    title: '🧬 Cage Constraints',
    body: 'Colored regions are "cages". The sum of numbers inside must satisfy a modular equation shown as ≡ r (mod m).\n\nExample: ≡2(mod3) means the sum, when divided by 3, leaves a remainder of 2.',
    visual: 'Sum = 5\n5 mod 3 = 2 ✓',
  },
  {
    title: '🔬 Strategy',
    body: 'Combine two techniques:\n• Latin square: eliminate duplicates in rows/columns\n• Modular math: test which sums fit the cage remainder\n\nOverlapping constraints narrow down each cell.',
    visual: null,
  },
  {
    title: '💡 Scoring',
    body: 'Base Score + Time Bonus − Hint Penalty − Error Penalty\n\nSolve fast, use no hints, make no errors for maximum score. Your score posts to the Galactic Leaderboard.',
    visual: null,
  },
];

export function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs bg-space-800 rounded-2xl p-6 border border-alien-purple/40">
        <h2 className="text-xl font-black text-alien-green mb-3">{s.title}</h2>
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line mb-4">{s.body}</p>

        {s.visual && (
          <div className="bg-space-900 rounded-xl p-4 mb-4 font-mono text-alien-cyan text-sm text-center whitespace-pre">
            {s.visual}
          </div>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-alien-green' : 'bg-space-600'}`} />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl border border-space-600 text-slate-400 text-sm font-semibold"
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : onClose()}
            className="flex-1 py-3 rounded-xl bg-alien-green text-space-950 font-bold text-sm"
          >
            {step < STEPS.length - 1 ? 'Next →' : '🚀 Play Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 9. API ROUTES (WEBHOOKS & SCORE SUBMISSION)

### `src/app/api/webhook/route.ts`
```typescript
// Alien platform webhook receiver
// Alien sends signed POST requests to this URL for events like:
// - miniapp_opened, score_posted, payment_completed

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-alien-signature') ?? '';
  const secret = process.env.ALIEN_WEBHOOK_SECRET ?? '';

  // Verify HMAC-SHA256 signature
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const trusted = `sha256=${expected}`;

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== trusted.length) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  let diff = 0;
  for (let i = 0; i < signature.length; i++) {
    diff |= signature.charCodeAt(i) ^ trusted.charCodeAt(i);
  }
  if (diff !== 0) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = event.type as string;
  console.log('[Alien Webhook]', type, event);

  switch (type) {
    case 'miniapp_opened':
      // Could log analytics, check if user is new, etc.
      break;
    case 'payment_completed':
      // Handled via /api/verify-payment — double-check on-chain
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

// Required for webhook verification: respond to GET with status
export async function GET() {
  return NextResponse.json({ status: 'ok', app: 'congruence' });
}
```

### `src/app/api/score/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { hashPayload, buildScorePayload } from '@/lib/scoreVerification';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Scoring plausibility check
const MIN_TIMES: Record<string, number> = {
  novice: 30, easy: 60, medium: 90, hard: 120, expert: 180, master: 240,
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { alienId, username, score, elapsed, hints, errors, difficulty, size, hash, nonce } = body as {
    alienId: string; username: string; score: number; elapsed: number;
    hints: number; errors: number; difficulty: string; size: number;
    hash: string; nonce: string;
  };

  // Verify hash (anti-cheat)
  const expected = buildScorePayload(alienId, score, elapsed, hints, errors, difficulty, size, nonce as string);
  const expectedHash = await hashPayload(expected);
  if (hash !== expectedHash) {
    return NextResponse.json({ error: 'Invalid score hash' }, { status: 400 });
  }

  // Minimum time check
  const minTime = MIN_TIMES[difficulty] ?? 30;
  if (elapsed < minTime) {
    return NextResponse.json({ error: 'Score rejected: too fast' }, { status: 400 });
  }

  // Nonce replay check
  const nonceKey = `nonce:${nonce}`;
  const exists = await redis.exists(nonceKey);
  if (exists) {
    return NextResponse.json({ error: 'Duplicate submission' }, { status: 400 });
  }
  await redis.setex(nonceKey, 86400, '1'); // Expire nonce after 24h

  // Write to sorted set (global and daily)
  const today = new Date().toISOString().split('T')[0];
  const entry = JSON.stringify({ alienId, username, score, difficulty, size });

  await redis.zadd('leaderboard:global', { score, member: entry });
  await redis.zadd(`leaderboard:daily:${today}`, { score, member: entry });
  // Daily leaderboard expires after 7 days
  await redis.expire(`leaderboard:daily:${today}`, 7 * 86400);

  return NextResponse.json({ success: true, score });
}
```

### `src/app/api/leaderboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'global';
  const today = new Date().toISOString().split('T')[0];
  const key = type === 'daily' ? `leaderboard:daily:${today}` : 'leaderboard:global';

  // Get top 50 by score descending
  const raw = await redis.zrange(key, 0, 49, { rev: true, withScores: true });

  const entries = [];
  for (let i = 0; i < raw.length; i += 2) {
    try {
      const data = JSON.parse(raw[i] as string);
      entries.push({ ...data, rank: entries.length + 1 });
    } catch { /* skip malformed */ }
  }

  return NextResponse.json({ entries });
}
```

### `src/app/api/verify-payment/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentTransaction } from '@/lib/solanaPayment';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
  const { txSignature, alienId } = await req.json();

  if (!txSignature || !alienId) {
    return NextResponse.json({ valid: false, error: 'Missing params' }, { status: 400 });
  }

  // Replay check
  const txKey = `payment:${txSignature}`;
  const seen = await redis.exists(txKey);
  if (seen) {
    return NextResponse.json({ valid: false, error: 'Transaction already used' }, { status: 400 });
  }

  // Verify on-chain
  const result = await verifyPaymentTransaction(txSignature, alienId);

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
```

---

## 10. DEEPLINKS & MANIFEST

### `public/manifest.json`

This is the Alien miniapp manifest. Register this URL at dev.alien.org.

```json
{
  "version": "1",
  "name": "Congruence",
  "subtitle": "Modular Arithmetic Puzzle",
  "description": "Decode alien transmissions by solving n×n modular arithmetic number grids. A unique logic puzzle found nowhere else in the galaxy.",
  "iconUrl": "https://YOUR_VERCEL_DOMAIN/icon.png",
  "heroImageUrl": "https://YOUR_VERCEL_DOMAIN/hero.png",
  "splashImageUrl": "https://YOUR_VERCEL_DOMAIN/hero.png",
  "splashBackgroundColor": "#050d18",
  "homeUrl": "https://YOUR_VERCEL_DOMAIN",
  "webhookUrl": "https://YOUR_VERCEL_DOMAIN/api/webhook",
  "primaryCategory": "games",
  "tags": ["puzzle", "math", "logic", "aliens", "modular"],
  "screenshotUrls": [
    "https://YOUR_VERCEL_DOMAIN/screenshot-1.png"
  ],
  "deepLinks": [
    {
      "path": "/congruence",
      "description": "Open Congruence game"
    },
    {
      "path": "/congruence?diff=novice",
      "description": "Start a Novice mission"
    },
    {
      "path": "/congruence?diff=expert",
      "description": "Start an Expert mission"
    },
    {
      "path": "/congruence?screen=leaderboard",
      "description": "Open the Galactic Leaderboard"
    }
  ],
  "permissions": [
    "wallet_address",
    "alien_id",
    "payment_request"
  ]
}
```

### Deeplink Handler in `src/app/page.tsx`

Add this to the `Home` component, before `return`:

```typescript
// Handle incoming deeplink parameters
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get('screen');
  const diff = params.get('diff');
  const score = params.get('score');

  if (screen === 'leaderboard') {
    goTo('leaderboard');
  } else if (diff) {
    const sizeMap: Record<string, number> = {
      novice: 5, easy: 6, medium: 6, hard: 8, expert: 9, master: 9
    };
    goTo('difficulty');
    // Auto-start after a short delay so the AlienProvider is ready
    setTimeout(() => {
      startGame(sizeMap[diff] ?? 5, diff);
    }, 800);
  }
}, []); // eslint-disable-line
```

---

## 11. LEADERBOARD (NEON POSTGRES)

### Setup

1. Go to [neon.tech](https://neon.tech) and create a **Postgres** database
2. Copy the `DATABASE_URL` to `.env.local` and to Vercel environment variables.
3. Run migrations or apply the schema via Drizzle Kit.

### Schema (Drizzle)

The following tables are managed via Drizzle ORM in `src/lib/db/schema.ts`:
- `users`: Registered users.
- `leaderboard`: Global and daily high scores.
- `nonces`: Anti-replay protection for scores.
- `game_wallets`: In-game ALIEN token balances.
- `wallet_ledger`: Transaction history for wallets.

---

## 12. ALIEN-THEMED VISUAL DESIGN

### Design Language
The game uses a **deep space / alien terminal** aesthetic:
- Dark space backgrounds (`#020408` to `#050d18`)
- Neon alien green (`#00ff88`) as the primary accent
- Grid-overlay background mimics alien scan screens
- Typography is tight and military — uppercase, letter-spaced
- Cells pulse/glow when selected
- Cage colors are vivid, high-contrast
- All animations are subtle (float, glow, scanline)

### `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

:root {
  --alien-green: #00ff88;
  --space-950: #020408;
}

* {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

html, body {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

/* Alien scanline overlay effect */
.scanline::before {
  content: '';
  position: fixed;
  top: -100%;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(transparent, rgba(0, 255, 136, 0.05), transparent);
  animation: scanline 8s linear infinite;
  pointer-events: none;
  z-index: 9999;
}

@keyframes scanline {
  0% { top: -10%; }
  100% { top: 110%; }
}

/* Prevent double-tap zoom on buttons */
button {
  touch-action: manipulation;
}

/* Safe area support */
.safe-bottom {
  padding-bottom: max(env(safe-area-inset-bottom, 0px), 16px);
}
```

### Icon & Hero Images

Generate using an AI image tool with these prompts:

**Icon (`icon.png`, 512×512):**
> "Minimalist alien eye logo, glowing green iris, dark space background, single centered eye with circuit patterns, neon green and black, crisp vector-style digital art"

**Hero (`hero.png`, 1200×630):**
> "Alien computer terminal showing a glowing 5x5 number grid puzzle, deep space background with stars, neon green numbers, modular math equations floating around the grid, dark cyberpunk sci-fi aesthetic"

Save both to `public/`.

---

## 13. BUILD & DEPLOY TO VERCEL

### Step 1 — `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for Alien miniapp — allow embedding in alien.org
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        // Allow alien.org to embed this app
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://alien.org https://*.alien.org" },
        // HTTPS everywhere
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ],
    },
  ],
  // Optimize for mobile
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
```

### Step 2 — Deploy

```bash
# Push to GitHub first
git init
git add .
git commit -m "feat: congruence alien miniapp initial commit"
git remote add origin https://github.com/YOUR_USERNAME/congruence-alien.git
git push -u origin main
```

Then in Vercel:
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select `congruence-alien`
3. Add all environment variables from `.env.local`
4. Deploy

After deploy, copy your production URL (e.g., `https://congruence-alien.vercel.app`) and:
- Replace all `YOUR_VERCEL_DOMAIN` in `public/manifest.json`
- Update `NEXT_PUBLIC_APP_URL` env variable in Vercel
- Redeploy

---

## 14. POST-DEPLOY: REGISTER MINIAPP ON ALIEN

### Steps

1. **Visit** [dev.alien.org](https://dev.alien.org) and sign in with your Alien ID.

2. **Create New Miniapp:**
   - Name: `Congruence`
   - Home URL: `https://YOUR_VERCEL_DOMAIN`
   - Manifest URL: `https://YOUR_VERCEL_DOMAIN/manifest.json`
   - Webhook URL: `https://YOUR_VERCEL_DOMAIN/api/webhook`

3. **Get Credentials:**
   - Copy `ALIEN_APP_ID` → add to Vercel env vars
   - Copy `ALIEN_APP_SECRET` → add to Vercel env vars
   - Copy `ALIEN_WEBHOOK_SECRET` → add to Vercel env vars

4. **Trigger Redeploy** after adding env vars in Vercel.

5. **Verify Webhook:**
   - In the Alien dev portal, send a test webhook to your app
   - Confirm it returns `{ "received": true }`

6. **Configure Deeplinks:**
   - In the portal, register the deeplink paths from `manifest.json`
   - Test: `alien://miniapp/congruence?diff=novice`

7. **Set Aliencoin Mint:**
   - In the portal, find the official Aliencoin SPL token mint address
   - Update `NEXT_PUBLIC_ALIENCOIN_MINT` in Vercel env vars

8. **Create Treasury Wallet:**
   - Create a new Solana wallet (use Phantom or Backpack)
   - Export the public key
   - Update `NEXT_PUBLIC_TREASURY_WALLET` in Vercel env vars
   - **Keep the private key secure** — this receives Aliencoin payments

9. **Submit for Review** in the Alien miniapp directory.

---

## 15. TESTING CHECKLIST

Before going live, Jules should verify each item:

### Core Functionality
- [ ] App loads in `100dvh` with no scroll on iPhone SE (375×667)
- [ ] All 6 difficulties generate valid puzzles
- [ ] Grid fills the available space without overflow
- [ ] Number pad buttons are ≥44px touch targets
- [ ] Cage labels are readable at all grid sizes
- [ ] Modular constraint math is correct (manually verify 2-3 puzzles)
- [ ] Invalid cell (duplicate) shows red highlight
- [ ] Satisfied cage shows green border
- [ ] Hint reveals correct cell
- [ ] Undo restores previous state
- [ ] Timer counts up correctly
- [ ] Victory screen shows after puzzle solved
- [ ] Score calculation is correct per formula

### Alien SDK
- [ ] `AlienProvider` wraps the app
- [ ] `useAlien()` returns user data inside the Alien app
- [ ] Haptic feedback fires on cell tap
- [ ] App degrades gracefully in browser (no SDK crash)

### Payment Gate
- [ ] 3 free trials shown on trial counter pill
- [ ] After 3 trials, payment gate overlay appears
- [ ] Payment request opens Alien wallet
- [ ] Successful payment adds 5 trials
- [ ] Daily trials reset at midnight
- [ ] `/api/verify-payment` rejects replayed transactions

### API & Leaderboard
- [ ] `/api/webhook` responds 200 to Alien test pings
- [ ] Webhook signature verification works
- [ ] Score POST succeeds with valid hash
- [ ] Score POST rejects invalid hash
- [ ] Score POST rejects suspiciously fast times
- [ ] Leaderboard GET returns top 50 entries
- [ ] Daily leaderboard resets correctly

### Deeplinks
- [ ] `?screen=leaderboard` opens leaderboard directly
- [ ] `?diff=expert` starts an Expert game
- [ ] Share button sends valid deeplink

### Performance
- [ ] Lighthouse Performance ≥ 85 on mobile
- [ ] Bundle size: run `npm run build` and confirm no chunk > 500KB
- [ ] No console errors in production build

---

## APPENDIX: QUICK REFERENCE

### Scoring Formula
```
Base     = 1000 × (grid_size / 5)
Bonus    = max(0, Base − elapsed_seconds × 2)
Final    = max(100, Base + Bonus − hints×50 − errors×10)
```

### Difficulty → Grid Size
| Difficulty | Grid | Modulus |
|-----------|------|---------|
| novice    | 5×5  | 3       |
| easy      | 6×6  | 3       |
| medium    | 6×6  | 4       |
| hard      | 8×8  | 4       |
| expert    | 9×9  | 5       |
| master    | 9×9  | 5       |

### Aliencoin Payment Flow
```
User taps "Purchase" 
  → requestPayment() opens Alien wallet
  → User approves SPL token transfer 
  → onSuccess(txSignature) fires
  → POST /api/verify-payment with txSignature
  → Server checks on-chain (Solana RPC)
  → Server marks txSignature used in Redis
  → Client adds 5 trials to localStorage
```

### File Summary
| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout, AlienProvider, viewport config |
| `src/app/page.tsx` | Screen router + timer loop + deeplink handler |
| `src/components/AlienProvider.tsx` | Alien SDK wrapper |
| `src/components/PaymentGate.tsx` | Aliencoin trial paywall |
| `src/components/GameShell.tsx` | Full-screen mobile container |
| `src/components/SplashScreen.tsx` | Title + menu |
| `src/components/DifficultySelect.tsx` | Mission selector |
| `src/components/GameBoard.tsx` | Game layout (HUD + Grid + Pad) |
| `src/components/GameHUD.tsx` | Timer / score / controls bar |
| `src/components/GameGrid.tsx` | Interactive n×n puzzle grid |
| `src/components/NumberPad.tsx` | Mobile number entry + actions |
| `src/components/VictoryScreen.tsx` | Win screen + score submission |
| `src/components/Leaderboard.tsx` | Global / daily score table |
| `src/components/Tutorial.tsx` | How to play overlay |
| `src/lib/puzzleGenerator.ts` | Latin square + cage generator |
| `src/lib/puzzleSolver.ts` | Validation + hint engine |
| `src/lib/solanaPayment.ts` | Aliencoin SPL transfer builder + verifier |
| `src/lib/scoreVerification.ts` | Anti-cheat hash |
| `src/lib/alienClient.ts` | SDK helpers + haptics + share |
| `src/store/gameStore.ts` | Zustand global state |
| `src/app/api/webhook/route.ts` | Alien webhook receiver |
| `src/app/api/score/route.ts` | Score submission + anti-cheat |
| `src/app/api/leaderboard/route.ts` | Leaderboard read |
| `src/app/api/verify-payment/route.ts` | On-chain payment verification |
| `public/manifest.json` | Alien miniapp manifest + deeplinks |

---

*CONGRUENCE — Alien Network Edition*
*Built on alien-id/miniapp-boilerplate · Solana · Next.js 15 · Vercel*
*Decode the transmission. Prove you're human.*
