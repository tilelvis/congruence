'use client';

import { useGameStore } from '@/store/gameStore';
import { buzz } from '@/lib/alienClient';
import { useAlien } from '@alien-id/miniapps-react';

const DIFFICULTIES = [
  { id: 'novice', label: 'Cadet',   desc: '5×5 · Easy warmup',       icon: '🌱', size: 5, color: 'from-emerald-600 to-teal-600' },
  { id: 'easy',   label: 'Pilot',   desc: '6×6 · Gentle probe',       icon: '🛸', size: 6, color: 'from-blue-600 to-cyan-600' },
  { id: 'medium', label: 'Scout',   desc: '6×6 · Standard mission',   icon: '⚡', size: 6, color: 'from-violet-600 to-purple-600' },
  { id: 'hard',   label: 'Soldier', desc: '8×8 · Complex signals',    icon: '🔭', size: 8, color: 'from-orange-600 to-amber-600' },
  { id: 'expert', label: 'Commander', desc: '9×9 · Alien cipher',    icon: '🧬', size: 9, color: 'from-red-600 to-rose-600' },
  { id: 'master', label: 'Overlord', desc: '9×9 · Ultimate test',     icon: '☠️', size: 9, color: 'from-slate-600 to-gray-700' },
];

export function DifficultySelect() {
  const { startGame, goTo } = useGameStore();
  const { authToken } = useAlien();

  async function handleSelect(size: number, difficulty: string) {
    if (!authToken) return;
    buzz('medium');

    // Spend 1 ALN from game wallet
    const res = await fetch('/api/wallet/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ difficulty }),
    });

    if (!res.ok) {
      const data = await res.json();
      if (data.error === 'insufficient_balance') {
        goTo('wallet');
        return;
      }
      return;
    }

    startGame(size, difficulty);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => goTo('splash')} className="text-slate-400 p-2 -ml-2">
          ← Back
        </button>
        <h2 className="text-lg font-bold text-alien-green tracking-wide">SELECT MISSION</h2>
        <div className="w-10" />
      </div>

      {/* Difficulty grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {DIFFICULTIES.map(d => (
          <button
            key={d.id}
            onClick={() => handleSelect(d.size, d.id)}
            className="
              w-full flex items-center gap-4 p-4 rounded-2xl
              bg-space-800 border border-space-700
              active:scale-[0.98] transition-all
              hover:border-alien-green/40
            "
          >
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center text-2xl
              bg-gradient-to-br ${d.color} shrink-0
            `}>
              {d.icon}
            </div>
            <div className="text-left">
              <div className="font-bold text-white">{d.label}</div>
              <div className="text-xs text-slate-400">{d.desc}</div>
            </div>
            <div className="ml-auto text-slate-600 text-lg">›</div>
          </button>
        ))}
      </div>
    </div>
  );
}
