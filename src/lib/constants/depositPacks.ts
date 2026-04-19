// ── Product catalog (server-side source of truth) ──────────────
// amount is in ALN's smallest unit (integer)
export const DEPOSIT_PACKS = [
  {
    id: 'aln-10',
    amount: '10', // 10 ALN
    displayAmount: '10',
    token: 'ALN',
    network: 'alien',
    recipientAddress: '000000090400000000004d8adc325fbb',
    label: '10 ALN',
    trials: 10,
    bonus: '',
  },
  {
    id: 'aln-25',
    amount: '25', // 25 ALN
    displayAmount: '25',
    token: 'ALN',
    network: 'alien',
    recipientAddress: '000000090400000000004d8adc325fbb',
    label: '25 ALN',
    trials: 27,
    bonus: '+8%',
  },
  {
    id: 'aln-50',
    amount: '50', // 50 ALN
    displayAmount: '50',
    token: 'ALN',
    network: 'alien',
    recipientAddress: '000000090400000000004d8adc325fbb',
    label: '50 ALN',
    trials: 60,
    bonus: '+20%',
  },
  {
    id: 'aln-100',
    amount: '100', // 100 ALN
    displayAmount: '100',
    token: 'ALN',
    network: 'alien',
    recipientAddress: '000000090400000000004d8adc325fbb',
    label: '100 ALN',
    trials: 130,
    bonus: '+30%',
  },
] as const;

export type DepositPack = typeof DEPOSIT_PACKS[number];
