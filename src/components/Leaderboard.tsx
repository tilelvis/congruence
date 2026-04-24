'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAlien } from '@alien_org/react';

interface Entry {
  rank: number;
  alienId: string;
  username: string;
  score: number;
  difficulty: string;
}

export function Leaderboard() {
  const { goTo } = useGameStore();
  const { user } = useAlien();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'global' | 'daily'>('global');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?type=${tab}`)
      .then(r => r.json())
      .then(data => { setEntries(data.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-space-700">
        <button onClick={() => goTo('splash')} className="text-slate-400 p-2 -ml-2">← Back</button>
        <h2 className="text-lg font-bold text-alien-gold tracking-wide">🏆 RANKINGS</h2>
        <div className="w-10" />
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-3 mb-2 bg-space-800 rounded-xl p-1">
        {(['global', 'daily'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`
              flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all
              ${tab === t ? 'bg-alien-purple text-white' : 'text-slate-400'}
            `}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-alien-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-3">🛸</div>
            <p>No transmissions yet. Be first!</p>
          </div>
        ) : entries.map((e) => (
          <div
            key={e.alienId + e.rank}
            className={`
              flex items-center gap-3 p-3 rounded-xl border
              ${e.alienId === user?.alienId
                ? 'bg-alien-green/10 border-alien-green/40'
                : 'bg-space-800 border-space-700'
              }
            `}
          >
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0
              ${e.rank === 1 ? 'bg-yellow-500 text-black' :
                e.rank === 2 ? 'bg-slate-400 text-black' :
                e.rank === 3 ? 'bg-amber-700 text-white' :
                'bg-space-700 text-slate-400'}
            `}>
              {e.rank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">
                {e.alienId === user?.alienId ? `${e.username} (you)` : e.username}
              </div>
              <div className="text-xs text-slate-500 capitalize">{e.difficulty}</div>
            </div>
            <div className="font-black text-alien-gold font-mono">
              {e.score.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
