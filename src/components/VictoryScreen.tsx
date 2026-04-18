'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAlien } from '@/lib/alienClient';
import { formatTime, formatScore } from '@/lib/utils';
import { hashPayload, buildScorePayload } from '@/lib/scoreVerification';

export function VictoryScreen() {
  const { score, elapsed, hints, errors, puzzle, goTo, startGame } = useGameStore();
  const { user } = useAlien();
  const [submitted, setSubmitted] = useState(false);
  // @ts-ignore
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!submitted && user && puzzle) {
      submitScore();
    }
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
      // Score submission is best-effort — game still works offline
    }
  }

  const stars = score >= 1800 ? 3 : score >= 1200 ? 2 : 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-between py-8 px-4">
      {/* Stars */}
      <div className="text-center">
        <div className="text-5xl mb-2 animate-float">
          {['⭐','⭐⭐','⭐⭐⭐'][stars - 1]}
        </div>
        <h2 className="text-3xl font-black text-alien-green tracking-tight">
          SIGNAL DECODED!
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {puzzle?.difficulty?.toUpperCase()} · {puzzle?.size}×{puzzle?.size}
        </p>
      </div>

      {/* Score card */}
      <div className="w-full max-w-xs bg-space-800 rounded-2xl p-5 border border-alien-green/20 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Final Score</span>
          <span className="text-2xl font-black text-alien-gold">{formatScore(score)}</span>
        </div>
        <div className="h-px bg-space-700" />
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Time</span>
          <span className="font-mono text-alien-cyan">{formatTime(elapsed)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Hints</span>
          <span className="font-mono text-amber-400">{hints} × −50</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Errors</span>
          <span className="font-mono text-red-400">{errors} × −10</span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => puzzle && startGame(puzzle.size, puzzle.difficulty)}
          className="
            w-full py-4 rounded-2xl font-bold text-lg text-space-950
            bg-gradient-to-r from-alien-green to-alien-cyan
            active:scale-95 transition-transform
          "
        >
          ▶ Play Again
        </button>
        <button
          onClick={() => goTo('leaderboard')}
          className="w-full py-3.5 rounded-2xl font-bold text-alien-gold bg-space-800 border border-alien-gold/40 active:scale-95 transition-transform"
        >
          🏆 Leaderboard
        </button>
        <button
          onClick={() => goTo('difficulty')}
          className="w-full py-3 rounded-2xl font-semibold text-slate-400 bg-space-800 border border-space-700 active:scale-95 transition-transform"
        >
          New Mission
        </button>
      </div>
    </div>
  );
}
