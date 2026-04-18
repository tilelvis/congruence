import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

const ALIENCOIN_MINT_STR = process.env.NEXT_PUBLIC_ALIENCOIN_MINT || 'So11111111111111111111111111111111111111112';
const TREASURY_STR = process.env.NEXT_PUBLIC_TREASURY_WALLET || 'So11111111111111111111111111111111111111112';

const ALIENCOIN_DECIMALS = 9; // SPL token decimals

export function toRawAmount(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** ALIENCOIN_DECIMALS));
}

export async function buildTrialPaymentTransaction(
  senderWallet: string,
  // @ts-ignore
  trialsCount: number = 5
): Promise<Transaction> {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );

  const sender = new PublicKey(senderWallet);
  const mint = new PublicKey(ALIENCOIN_MINT_STR);
  const treasury = new PublicKey(TREASURY_STR);
  const costPerPack = Number(process.env.NEXT_PUBLIC_TRIAL_COST_TOKENS || 5);
  const rawAmount = toRawAmount(costPerPack);

  const senderATA = await getAssociatedTokenAddress(mint, sender);
  const treasuryATA = await getAssociatedTokenAddress(mint, treasury);

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

    const instructions = tx.transaction.message.instructions;
    const mint = new PublicKey(ALIENCOIN_MINT_STR);
    const treasury = new PublicKey(TREASURY_STR);
    for (const ix of instructions) {
      if ('parsed' in ix && ix.program === 'spl-token' && ix.parsed.type === 'transfer') {
        const info = ix.parsed.info;
        const treasuryATA = (await getAssociatedTokenAddress(
          mint, treasury
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
