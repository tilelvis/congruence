export const DEPOSIT_PACKS = [
  {
    id: 'aln-10',
    amount: '10',
    displayAmount: '10',
    token: 'ALN',
    network: 'alien',
    label: '10 ALN',
    trials: 10,
    bonus: '',
  },
  {
    id: 'aln-25',
    amount: '25',
    displayAmount: '25',
    token: 'ALN',
    network: 'alien',
    label: '25 ALN',
    trials: 27,
    bonus: '+8%',
  },
  {
    id: 'aln-50',
    amount: '50',
    displayAmount: '50',
    token: 'ALN',
    network: 'alien',
    label: '50 ALN',
    trials: 60,
    bonus: '+20%',
  },
  {
    id: 'aln-100',
    amount: '100',
    displayAmount: '100',
    token: 'ALN',
    network: 'alien',
    label: '100 ALN',
    trials: 130,
    bonus: '+30%',
  },
] as const;

export type DepositPack = typeof DEPOSIT_PACKS[number];
