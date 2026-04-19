// ── Product catalog (server-side source of truth) ──────────────
// amount is in ALIEN's smallest unit (9 decimals)
export const DEPOSIT_PACKS = [
  {
    id: 'alien-10',
    amount: '10000000000', // 10 ALIEN (9 decimals)
    displayAmount: '10',
    token: 'ALIEN',
    network: 'alien',
    recipientAddress: process.env.NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS!,
    label: '10 ALIEN',
    trials: 10,
    bonus: '',
  },
  {
    id: 'alien-25',
    amount: '25000000000', // 25 ALIEN
    displayAmount: '25',
    token: 'ALIEN',
    network: 'alien',
    recipientAddress: process.env.NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS!,
    label: '25 ALIEN',
    trials: 27,
    bonus: '+8%',
  },
  {
    id: 'alien-50',
    amount: '50000000000', // 50 ALIEN
    displayAmount: '50',
    token: 'ALIEN',
    network: 'alien',
    recipientAddress: process.env.NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS!,
    label: '50 ALIEN',
    trials: 60,
    bonus: '+20%',
  },
  {
    id: 'alien-100',
    amount: '100000000000', // 100 ALIEN
    displayAmount: '100',
    token: 'ALIEN',
    network: 'alien',
    recipientAddress: process.env.NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS!,
    label: '100 ALIEN',
    trials: 130,
    bonus: '+30%',
  },
] as const;

export type DepositPack = typeof DEPOSIT_PACKS[number];
