// src/components/SplashScreen.tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { useAlien } from '@/lib/alienClient';

export function SplashScreen() {
  const { goTo } = useGameStore();
  const { user } = useAlien();

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '40px 24px',
    }}>
      {/* Logo area */}
      <div style={{ textAlign: 'center' }}>
        <div className="animate-float" style={{ fontSize: 72, lineHeight: 1, marginBottom: 16 }}>
          👾
        </div>
        <h1
          className="glow-green"
          style={{
            fontFamily: 'var(--font-orbitron), monospace',
            fontSize: 'clamp(28px, 9vw, 40px)',
            fontWeight: 900,
            letterSpacing: '0.08em',
            color: '#00ff88',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          CONGRUENCE
        </h1>
        <p style={{
          color: 'rgba(0,255,136,0.5)',
          fontSize: 11,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          marginTop: 8,
          fontFamily: 'var(--font-orbitron)',
        }}>
          Modular Arithmetic · Deep Space
        </p>
        {user && (
          <p style={{
            color: 'rgba(6,182,212,0.7)',
            fontSize: 12,
            fontFamily: 'var(--font-orbitron)',
            marginTop: 12,
            letterSpacing: '0.1em',
          }}>
            ▸ {user.username ?? user.alienId?.slice(0, 12) + '…'}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => goTo('difficulty')}
          style={{
            width: '100%',
            padding: '18px 0',
            borderRadius: 16,
            fontFamily: 'var(--font-orbitron)',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '0.1em',
            background: 'linear-gradient(135deg, #00ff88, #06b6d4)',
            color: '#020408',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(0,255,136,0.4), 0 4px 20px rgba(0,0,0,0.5)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.96)')}
          // @ts-ignore
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          🚀 LAUNCH GAME
        </button>
        <button
          onClick={() => goTo('leaderboard')}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 16,
            fontFamily: 'var(--font-orbitron)',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.08em',
            background: 'rgba(245,158,11,0.08)',
            color: '#f59e0b',
            border: '1.5px solid rgba(245,158,11,0.35)',
            cursor: 'pointer',
            transition: 'transform 0.1s',
          }}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.96)')}
          // @ts-ignore
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          🏆 GALACTIC LEADERBOARD
        </button>
        <button
          onClick={() => goTo('tutorial')}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 16,
            fontFamily: 'var(--font-exo2, sans-serif)',
            fontWeight: 600,
            fontSize: 14,
            background: 'rgba(15,32,64,0.8)',
            color: 'rgba(255,255,255,0.5)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.1s',
          }}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.96)')}
          // @ts-ignore
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          📡 How To Play
        </button>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, letterSpacing: '0.15em', fontFamily: 'var(--font-orbitron)' }}>
        ALIEN NETWORK · VERIFIED HUMANS ONLY
      </p>
    </div>
  );
}
