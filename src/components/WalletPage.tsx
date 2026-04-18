'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAlien, usePayment } from '@alien_org/react';

// Deposit packs — must match DEPOSIT_PACKS in /api/invoices/route.ts
const PACKS = [
  { id: 'alien-10', amount: '10', label: '10 ALIEN', trials: 10, bonus: '' },
  { id: 'alien-25', amount: '25', label: '25 ALIEN', trials: 27, bonus: '+8%' },
  { id: 'alien-50', amount: '50', label: '50 ALIEN', trials: 60, bonus: '+20%' },
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
              { val: wallet.totalSpent, lbl: 'SPENT' },
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
                  // @ts-ignore
                  onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                  // @ts-ignore
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
