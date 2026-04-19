'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAlien, usePayment } from '@alien-id/miniapps-react';
import { DEPOSIT_PACKS, type DepositPack } from '@/lib/constants/depositPacks';

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
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const isFetching = useRef(false);

  // ── usePayment must be called at component level, not inside handlers ──
  const payment = usePayment({
    onPaid: (txHash: string) => {
      setStatusMsg({ text: '✅ Payment confirmed! Balance will update shortly.', isError: false });
      // Webhook will credit balance. Poll for 10s to pick up the update.
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        fetchWallet();
        if (attempts >= 5) clearInterval(poll);
      }, 2000);
    },
    onCancelled: () => {
      setStatusMsg({ text: 'Payment cancelled.', isError: false });
      payment.reset();
    },
    onFailed: (errorCode?: string) => {
      setStatusMsg({
        text: `Payment failed: ${errorCode ?? 'unknown error'}`,
        isError: true,
      });
      payment.reset();
    },
  });

  const fetchWallet = useCallback(async () => {
    if (!authToken || isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet);
        setLedger(data.ledger ?? []);
      }
    } finally {
      isFetching.current = false;
      setIsLoadingWallet(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // ── DEPOSIT HANDLER ────────────────────────────────────────────
  async function handleDeposit(pack: DepositPack) {
    // Guard 1: must be in Alien app
    if (!isBridgeAvailable) {
      setStatusMsg({ text: 'Open this app inside the Alien app to make payments.', isError: true });
      return;
    }
    // Guard 2: payments must be supported by this host version
    if (!payment.supported) {
      setStatusMsg({ text: 'Payments are not supported in this version of the Alien app. Please update.', isError: true });
      return;
    }
    // Guard 3: must have auth token
    if (!authToken) {
      setStatusMsg({ text: 'Not authenticated. Please restart the app.', isError: true });
      return;
    }
    // Guard 4: prevent double-tap
    if (payment.isLoading) return;

    setStatusMsg(null);
    try {
      // Step 1: Create invoice on YOUR backend.
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ productId: pack.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatusMsg({
          text: `Failed to create invoice: ${err.error ?? res.status}`,
          isError: true,
        });
        return;
      }

      const { invoice } = await res.json();

      // Step 2: Open the Alien native payment approval UI.
      await payment.pay({
        recipient: pack.recipientAddress,
        amount: pack.amount,
        token: pack.token,
        network: pack.network,
        invoice,
        item: {
          title: `Congruence — ${pack.trials} Trials`,
          iconUrl: `${process.env.NEXT_PUBLIC_APP_URL}/icon.png`,
          quantity: 1,
        },
      });
    } catch (err) {
      console.error('Deposit error:', err);
      setStatusMsg({ text: 'An unexpected error occurred. Try again.', isError: true });
      payment.reset();
    }
  }

  // ── WITHDRAW HANDLER ───────────────────────────────────────────
  async function handleWithdraw() {
    if (!authToken) return;
    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount < 5) {
      setStatusMsg({ text: 'Minimum withdrawal is 5 ALIEN.', isError: true });
      return;
    }
    if (!wallet || amount > wallet.balance) {
      setStatusMsg({ text: `Insufficient balance. You have ${wallet?.balance ?? 0} ALIEN.`, isError: true });
      return;
    }
    setStatusMsg({ text: 'Submitting withdrawal request...', isError: false });
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusMsg({ text: data.message, isError: false });
      setWallet(prev => prev ? { ...prev, balance: data.balance } : null);
      setWithdrawAmount('');
      fetchWallet(); // refresh ledger
    } else {
      setStatusMsg({ text: data.error ?? 'Withdrawal failed.', isError: true });
    }
  }

  // ── STYLES ───────────────────────────────────────────────────
  const S = {
    page: {
      flex: 1, display: 'flex', flexDirection: 'column' as const,
      overflow: 'hidden', background: '#020408',
    },
    header: {
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px 10px',
      borderBottom: '1px solid rgba(0,255,136,0.12)',
      flexShrink: 0,
    },
    backBtn: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, color: 'rgba(255,255,255,0.5)',
      width: 36, height: 36, cursor: 'pointer', fontSize: 16,
    },
    title: {
      fontFamily: 'var(--font-orbitron, monospace)',
      fontSize: 14, fontWeight: 700, letterSpacing: '0.15em', color: '#00ff88',
    },
    balanceCard: {
      margin: '14px 16px', padding: '18px',
      background: 'rgba(10,22,40,0.9)',
      border: '1px solid rgba(0,255,136,0.2)',
      borderRadius: 18, textAlign: 'center' as const,
    },
    tabs: {
      display: 'flex', margin: '0 16px 12px',
      background: 'rgba(10,22,40,0.8)', borderRadius: 12, padding: 4, gap: 4,
    },
    scrollArea: {
      flex: 1, overflowY: 'auto' as const,
      padding: '0 16px 20px',
    },
    packGrid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
    },
    status: (isError: boolean) => ({
      padding: '12px 14px', borderRadius: 10, marginBottom: 12,
      background: isError ? 'rgba(239,68,68,0.08)' : 'rgba(0,255,136,0.06)',
      border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(0,255,136,0.2)'}`,
      color: isError ? '#ef4444' : '#00ff88',
      fontSize: 13, lineHeight: 1.5,
      fontFamily: 'var(--font-exo2, sans-serif)',
    }),
  };

  if (!isBridgeAvailable) {
    return (
      <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
        <div style={{ fontSize: 48 }}>🛸</div>
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'var(--font-orbitron, monospace)',
          fontSize: 13, textAlign: 'center', lineHeight: 1.7,
        }}>
          Open this app inside the<br />Alien app to access your wallet.
        </p>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={onBack} style={S.backBtn}>←</button>
        <span style={S.title}>⚡ GAME WALLET</span>
      </div>
      <div style={S.balanceCard}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'var(--font-orbitron)', letterSpacing: '0.1em', marginBottom: 8 }}>
          AVAILABLE BALANCE
        </div>
        {isLoadingWallet ? (
          <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 24, height: 24, border: '2px solid #00ff88', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 40, fontWeight: 900, color: '#00ff88', textShadow: '0 0 20px rgba(0,255,136,0.5)', lineHeight: 1 }}>
              {wallet?.balance ?? 0}
            </div>
            <div style={{ color: 'rgba(0,255,136,0.6)', fontSize: 14, fontFamily: 'var(--font-orbitron)', marginTop: 4 }}>
              ALIEN TOKENS
            </div>
          </>
        )}
        {wallet && (
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { val: wallet.totalDeposited, lbl: 'DEPOSITED' },
              { val: wallet.totalSpent, lbl: 'SPENT' },
              { val: wallet.totalWithdrawn, lbl: 'WITHDRAWN' },
            ].map(s => (
              <div key={s.lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 13, fontWeight: 700, color: '#06b6d4' }}>{s.val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3, letterSpacing: '0.08em' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={S.tabs}>
        {(['deposit', 'withdraw', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setStatusMsg(null); }}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 9,
              fontSize: 11, fontFamily: 'var(--font-orbitron)', fontWeight: 600,
              letterSpacing: '0.05em', cursor: 'pointer', border: 'none',
              background: tab === t ? 'rgba(0,255,136,0.15)' : 'transparent',
              color: tab === t ? '#00ff88' : 'rgba(255,255,255,0.35)',
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <div style={S.scrollArea}>
        {statusMsg && <div style={S.status(statusMsg.isError)}>{statusMsg.text}</div>}
        {tab === 'deposit' && (
          <>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 14, lineHeight: 1.6 }}>
              Deposit ALIEN tokens once. 1 ALIEN = 1 puzzle trial.
              Larger packs include bonus trials.
            </p>
            {!payment.supported && (
              <div style={S.status(true)}>
                ⚠️ Payments not supported. Make sure you're using the latest Alien app.
              </div>
            )}
            <div style={S.packGrid}>
              {DEPOSIT_PACKS.map((pack, i) => (
                <button
                  key={pack.id}
                  onClick={() => handleDeposit(pack)}
                  disabled={payment.isLoading || !payment.supported}
                  style={{
                    padding: '16px 12px', borderRadius: 14,
                    background: i === 2 ? 'rgba(0,255,136,0.07)' : 'rgba(10,22,40,0.9)',
                    border: `1.5px solid ${i === 2 ? 'rgba(0,255,136,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: payment.isLoading || !payment.supported ? 'not-allowed' : 'pointer',
                    textAlign: 'center', transition: 'all 0.1s',
                    opacity: payment.isLoading && !payment.supported ? 0.4 : 1,
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 17, fontWeight: 900, color: '#f59e0b' }}>
                    {pack.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>
                    {pack.trials} trials
                  </div>
                  {pack.bonus && (
                    <div style={{ fontSize: 10, color: '#00ff88', fontFamily: 'var(--font-orbitron)', marginTop: 3 }}>
                      {pack.bonus} BONUS
                    </div>
                  )}
                </button>
              ))}
            </div>
            {payment.isLoading && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <div style={{ width: 28, height: 28, border: '2px solid #06b6d4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                <p style={{ color: '#06b6d4', fontSize: 13, fontFamily: 'var(--font-orbitron)', letterSpacing: '0.05em' }}>
                  Awaiting wallet approval...
                </p>
              </div>
            )}
          </>
        )}
        {tab === 'withdraw' && (
          <>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16, lineHeight: 1.6 }}>
              Withdraw your ALIEN tokens back to your Alien app wallet.
              Minimum 5 ALIEN. Processed within 24 hours.
            </p>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Amount (min 5)"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              min={5}
              max={wallet?.balance ?? 0}
              style={{
                width: '100%', padding: 14, borderRadius: 12,
                background: 'rgba(10,22,40,0.9)', border: '1.5px solid rgba(255,255,255,0.12)',
                color: 'white', fontSize: 20, fontFamily: 'var(--font-orbitron)',
                textAlign: 'center', marginBottom: 10, boxSizing: 'border-box', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                Available: {wallet?.balance ?? 0} ALIEN
              </span>
              <button
                onClick={() => setWithdrawAmount(String(wallet?.balance ?? 0))}
                style={{ background: 'none', border: 'none', color: '#06b6d4', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-orbitron)' }}
              >
                MAX
              </button>
            </div>
            <button
              onClick={handleWithdraw}
              style={{
                width: '100%', padding: 16, borderRadius: 14,
                fontFamily: 'var(--font-orbitron)', fontWeight: 700,
                fontSize: 14, letterSpacing: '0.08em',
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                color: '#020408', border: 'none', cursor: 'pointer',
              }}
            >
              ↑ WITHDRAW TO ALIEN WALLET
            </button>
          </>
        )}
        {tab === 'history' && (
          <>
            {ledger.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-orbitron)', fontSize: 13 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                No transactions yet
              </div>
            ) : ledger.map(entry => {
              const typeColor = entry.type === 'deposit' ? '#10b981' : entry.type === 'withdrawal' ? '#8b5cf6' : '#f59e0b';
              return (
                <div key={entry.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                  background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-orbitron)', letterSpacing: '0.08em', color: typeColor }}>
                      {entry.type.replace('_', ' ').toUpperCase()}
                    </div>
                    {entry.memo && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{entry.memo}</div>
                    )}
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
                      {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-orbitron)', fontSize: 15, fontWeight: 700, color: entry.amount > 0 ? '#10b981' : '#f59e0b' }}>
                    {entry.amount > 0 ? '+' : ''}{entry.amount}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
