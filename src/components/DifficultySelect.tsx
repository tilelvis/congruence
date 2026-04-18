// src/components/DifficultySelect.tsx
'use client';

import { useGameStore } from '@/store/gameStore';
import { useTrialGate } from './PaymentGate';
import { buzz } from '@/lib/alienClient';

const DIFFICULTIES = [
  { id: 'novice', label: 'CADET', desc: '5×5 • Mod 3 • Gentle warmup', icon: '🌱', size: 5, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
  { id: 'easy', label: 'PILOT', desc: '6×6 • Mod 3 • First contact', icon: '🛸', size: 6, color: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
  { id: 'medium', label: 'SCOUT', desc: '6×6 • Mod 4 • Standard mission', icon: '⚡', size: 6, color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' },
  { id: 'hard', label: 'SOLDIER', desc: '8×8 • Mod 4 • Complex signals', icon: '🔭', size: 8, color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  { id: 'expert', label: 'COMMANDER', desc: '9×9 • Mod 5 • Alien cipher', icon: '🧬', size: 9, color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
  { id: 'master', label: 'OVERLORD', desc: '9×9 • Mod 5 • Ultimate test', icon: '☠️', size: 9, color: '#64748b', glow: 'rgba(100,116,139,0.3)' },
];

export function DifficultySelect() {
  const { startGame, goTo } = useGameStore();
  const { canPlay, consumeTrial } = useTrialGate();

  function handleSelect(size: number, difficulty: string) {
    if (!canPlay()) { goTo('game'); return; }
    consumeTrial();
    buzz('medium');
    startGame(size, difficulty);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px 8px',
        borderBottom: '1px solid rgba(0,255,136,0.1)',
      }}>
        <button
          onClick={() => goTo('splash')}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: 'rgba(255,255,255,0.4)', width: 36, height: 36,
            cursor: 'pointer', fontSize: 14,
          }}
        >
          ←
        </button>
        <span style={{
          fontFamily: 'var(--font-orbitron)', fontWeight: 700, fontSize: 14,
          letterSpacing: '0.15em', color: '#00ff88',
          textShadow: '0 0 10px rgba(0,255,136,0.5)',
        }}>
          SELECT MISSION
        </span>
        <div style={{ width: 36 }} />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DIFFICULTIES.map((d, i) => (
          <button
            key={d.id}
            onClick={() => handleSelect(d.size, d.id)}
            onTouchStart={e => {
              e.currentTarget.style.transform = 'scale(0.97)';
              e.currentTarget.style.borderColor = d.color + '80';
            }}
            // @ts-ignore
            onTouchEnd={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = d.color + '30';
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 14,
              background: 'rgba(10,22,40,0.8)',
              border: `1.5px solid ${d.color}30`,
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.12s',
              animationDelay: `${i * 60}ms`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Icon badge */}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `linear-gradient(135deg, ${d.color}22, ${d.color}11)`,
              border: `1.5px solid ${d.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
              boxShadow: `0 0 16px ${d.glow}`,
            }}>
              {d.icon}
            </div>
            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-orbitron)', fontWeight: 700, fontSize: 13,
                color: d.color, letterSpacing: '0.12em',
                textShadow: `0 0 8px ${d.glow}`,
              }}>
                {d.label}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontFamily: 'var(--font-exo2)' }}>
                {d.desc}
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
