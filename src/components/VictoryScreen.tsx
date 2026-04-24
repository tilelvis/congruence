// src/components/VictoryScreen.tsx
'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAlien } from '@alien_org/react';
import { formatTime, formatScore } from '@/lib/utils';
import { hashPayload, buildScorePayload } from '@/lib/scoreVerification';

export function VictoryScreen() {
  const { score, elapsed, hints, errors, puzzle, goTo, nextLevel, level } = useGameStore();
  const { user } = useAlien();
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!submitted && user && puzzle) {
      submitScore();
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const autoNext = setTimeout(() => {
      nextLevel();
    }, 3500);

    return () => {
      clearInterval(timer);
      clearTimeout(autoNext);
    };
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
      // Score submission is best-effort
    }
  }

  const stars = score >= 1800 ? 3 : score >= 1200 ? 2 : 1;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '32px 24px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.08) 0%, transparent 60%)',
    }}>
      {/* Stars + Title */}
      <div style={{ textAlign: 'center' }}>
        <div className="animate-float" style={{ fontSize: 56, marginBottom: 12 }}>
          {stars === 3 ? '🌟🌟🌟' : stars === 2 ? '⭐⭐' : '⭐'}
        </div>
        <h2 className="glow-green" style={{
          fontFamily: 'var(--font-orbitron)', fontSize: 26, fontWeight: 900,
          color: '#00ff88', letterSpacing: '0.06em', margin: 0,
        }}>
          LVL {level} COMPLETE!
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6, fontFamily: 'var(--font-orbitron)', letterSpacing: '0.1em' }}>
          SIGNAL DECODED
        </p>
      </div>

      {/* Score card */}
      <div style={{
        width: '100%', maxWidth: 300,
        background: 'rgba(10,22,40,0.9)',
        border: '1px solid rgba(0,255,136,0.2)',
        borderRadius: 20, padding: 20,
        boxShadow: '0 0 40px rgba(0,255,136,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Final Score</span>
          <span className="glow-gold" style={{
            fontFamily: 'var(--font-orbitron)', fontSize: 28, fontWeight: 900,
            color: '#f59e0b',
          }}>{formatScore(score)}</span>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
        {[
          { label: 'Time', value: formatTime(elapsed), color: '#06b6d4' },
          { label: 'Hints used', value: `${hints} × −50`, color: '#f59e0b' },
          { label: 'Errors', value: `${errors} × −10`, color: '#ef4444' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{row.label}</span>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: 13, color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => nextLevel()} style={{
          width: '100%', padding: '18px 0', borderRadius: 14,
          fontFamily: 'var(--font-orbitron)', fontWeight: 700, fontSize: 15,
          letterSpacing: '0.08em',
          background: 'linear-gradient(135deg, #00ff88, #06b6d4)',
          color: '#020408', border: 'none', cursor: 'pointer',
          boxShadow: '0 0 30px rgba(0,255,136,0.35)',
        }}>
          NEXT LEVEL {countdown > 0 ? `(${countdown}s)` : ''}
        </button>
        <button onClick={() => goTo('splash')} style={{
          width: '100%', padding: '13px 0', borderRadius: 14, fontSize: 13,
          background: 'rgba(15,32,64,0.6)', color: 'rgba(255,255,255,0.4)',
          border: '1.5px solid rgba(255,255,255,0.1)', cursor: 'pointer',
        }}>Main Menu</button>
      </div>
    </div>
  );
}
