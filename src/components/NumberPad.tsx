// src/components/NumberPad.tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { buzz } from '@/lib/alienClient';

export function NumberPad() {
  const { puzzle, enterNumber, clearCell, useHint, undo, freeHintsRemaining, alienTokenBalance } = useGameStore();

  if (!puzzle) return null;

  const nums = Array.from({ length: puzzle.size }, (_, i) => i + 1);
  const cols = puzzle.size <= 5 ? puzzle.size : puzzle.size <= 6 ? 6 : Math.ceil(puzzle.size / 2);

  const NUM_BTN: React.CSSProperties = {
    height: 50,
    borderRadius: 10,
    fontFamily: 'var(--font-orbitron), monospace',
    fontWeight: 700,
    fontSize: 20,
    background: 'rgba(15,32,64,0.95)',
    color: '#e2e8f0',
    border: '1.5px solid rgba(6,182,212,0.25)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.08s',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  };

  const ACT_BTN: React.CSSProperties = {
    ...NUM_BTN,
    height: 44,
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    border: '1.5px solid rgba(255,255,255,0.1)',
  };

  function tapEffect(e: React.TouchEvent<HTMLButtonElement>) {
    const btn = e.currentTarget;
    btn.style.transform = 'scale(0.88)';
    btn.style.background = 'rgba(6,182,212,0.2)';
    btn.style.borderColor = '#06b6d4';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
      btn.style.background = NUM_BTN.background as string;
      btn.style.borderColor = 'rgba(6,182,212,0.25)';
    }, 120);
  }

  const isHintAffordable = freeHintsRemaining > 0 || alienTokenBalance >= 10;

  return (
    <div style={{
      background: 'rgba(2,4,8,0.97)',
      borderTop: '1px solid rgba(0,255,136,0.12)',
      padding: '12px 14px 16px',
      flexShrink: 0,
    }}>
      {/* Number grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8,
        marginBottom: 10,
      }}>
        {nums.map(n => (
          <button
            key={n}
            onTouchStart={tapEffect}
            onClick={() => { enterNumber(n); buzz('light'); }}
            style={NUM_BTN}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Action row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 8 }}>
        <button
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.9)'; }}
          // @ts-ignore
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          onClick={() => { clearCell(); buzz('light'); }}
          style={ACT_BTN}
        >
          ✕ Clear
        </button>
        <button
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.9)'; }}
          // @ts-ignore
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          onClick={() => { undo(); buzz('light'); }}
          style={ACT_BTN}
        >
          ↺ Undo
        </button>
        <button
          onTouchStart={e => { if (isHintAffordable) e.currentTarget.style.transform = 'scale(0.9)'; }}
          // @ts-ignore
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          onClick={() => { useHint(); buzz('medium'); }}
          disabled={!isHintAffordable}
          style={{
            ...ACT_BTN,
            color: isHintAffordable ? '#f59e0b' : 'rgba(255,255,255,0.2)',
            border: `1.5px solid ${isHintAffordable ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.05)'}`,
            background: isHintAffordable ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.02)',
            boxShadow: isHintAffordable ? '0 0 12px rgba(245,158,11,0.1)' : 'none',
            fontSize: 11,
            opacity: isHintAffordable ? 1 : 0.5,
          }}
        >
          {freeHintsRemaining > 0
            ? `💡 Hint (${freeHintsRemaining})`
            : `💡 Hint (10 🪙)`}
        </button>
      </div>
    </div>
  );
}
