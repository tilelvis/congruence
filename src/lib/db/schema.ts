import { pgTable, text, uuid, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// Auto-registered users (find-or-create on first auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  alienId: text('alien_id').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payment intents — created before each payment
export const paymentIntents = pgTable('payment_intents', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoice: text('invoice').notNull().unique(), // inv-<uuid>
  senderAlienId: text('sender_alien_id').notNull(),
  recipientAddress: text('recipient_address').notNull(),
  amount: text('amount').notNull(), // in smallest units
  token: text('token').notNull(), // 'ALIEN' | 'USDC'
  network: text('network').notNull(), // 'alien' | 'solana'
  productId: text('product_id').notNull(),
  status: text('status').notNull().default('pending'), // pending|completed|failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Confirmed on-chain transactions (written by webhook)
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderAlienId: text('sender_alien_id').notNull(),
  recipientAddress: text('recipient_address').notNull(),
  txHash: text('tx_hash').notNull(),
  status: text('status').notNull(), // 'paid' | 'failed'
  amount: text('amount').notNull(),
  token: text('token').notNull(),
  network: text('network').notNull(),
  invoice: text('invoice').notNull(),
  isTest: boolean('is_test').default(false),
  payload: text('payload').notNull(), // full JSON for audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// In-game wallet balances (credited by webhook, debited by game logic)
export const gameWallets = pgTable('game_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  alienId: text('alien_id').notNull().unique(),
  balance: integer('balance').notNull().default(0), // ALIEN tokens (integer)
  totalDeposited: integer('total_deposited').notNull().default(0),
  totalSpent: integer('total_spent').notNull().default(0),
  totalWithdrawn: integer('total_withdrawn').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Ledger of all game wallet transactions
export const walletLedger = pgTable('wallet_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  alienId: text('alien_id').notNull(),
  type: text('type').notNull(), // 'deposit'|'trial_spend'|'withdrawal'
  amount: integer('amount').notNull(), // positive = credit, negative = debit
  balance: integer('balance').notNull(),// balance AFTER this transaction
  memo: text('memo'), // e.g. "5x trial pack" or "withdrawal to wallet"
  invoice: text('invoice'), // linked payment invoice (if deposit)
  txHash: text('tx_hash'), // Solana/Alien tx hash
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Withdrawal requests (user → their Alien wallet)
export const withdrawals = pgTable('withdrawals', {
  id: uuid('id').primaryKey().defaultRandom(),
  alienId: text('alien_id').notNull(),
  amount: integer('amount').notNull(),
  status: text('status').notNull().default('pending'), // pending|processing|completed|failed
  txHash: text('tx_hash'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Leaderboard entries
export const leaderboard = pgTable('leaderboard', {
  id: uuid('id').primaryKey().defaultRandom(),
  alienId: text('alien_id').notNull(),
  username: text('username').notNull(),
  score: integer('score').notNull(),
  difficulty: text('difficulty').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Nonces for score submission (anti-replay)
export const nonces = pgTable('nonces', {
  nonce: text('nonce').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
