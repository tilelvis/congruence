// src/components/GameHUD.tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { formatTime, formatScore } from '@/lib/utils';

export function GameHUD() {
  const { elapsed, puzzle, hints, errors, goTo, level, alienTokenBalance } = useGameStore();
  const baseScore = puzzle ? Math.floor(1000 * (puzzle.size / 5)) : 1000;
  const liveScore = Math.max(100, baseScore - elapsed * 2 - hints * 50 - errors * 10);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      background: 'rgba(5,13,24,0.95)',
      borderBottom: '1px solid rgba(0,255,136,0.15)',
      backdropFilter: 'blur(8px)',
      flexShrink: 0,
    }}>
      {/* Exit & Level */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => goTo('splash')}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: 'rgba(255,255,255,0.4)',
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, cursor: 'pointer',
          }}
        >
          ✕
        </button>
        <div style={{
          fontFamily: 'var(--font-orbitron)',
          fontSize: 12,
          fontWeight: 700,
          color: '#00ff88',
          letterSpacing: '0.05em',
        }}>
          LVL {level}
        </div>
      </div>

      {/* Timer */}
      <div style={{
        fontFamily: 'var(--font-orbitron)',
        fontSize: 18,
        fontWeight: 700,
        color: '#06b6d4',
        letterSpacing: '0.05em',
        textShadow: '0 0 12px rgba(6,182,212,0.6)',
      }}>
        {formatTime(elapsed)}
      </div>

      {/* Live score */}
      <div style={{
        fontFamily: 'var(--font-orbitron)',
        fontSize: 16,
        fontWeight: 700,
        color: '#f59e0b',
        letterSpacing: '0.05em',
        textShadow: '0 0 12px rgba(245,158,11,0.5)',
      }}>
        {formatScore(liveScore)}
      </div>

      {/* Tokens & Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
        <div style={{
          fontFamily: 'var(--font-orbitron)',
          fontSize: 10,
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <span>{alienTokenBalance}</span>
          <span>🪙</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-orbitron)',
            fontSize: 9,
            color: '#ef4444',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 4,
            padding: '1px 4px',
          }}>
            ✗{errors}
          </span>
        </div>
      </div>
    </div>
  );
}
