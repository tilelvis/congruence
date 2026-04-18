'use client';

import { useState } from 'react';

const STEPS = [
  {
    title: '🛸 Mission Briefing',
    body: 'You are decoding an alien transmission locked in a number grid. Fill every row and column with numbers 1 to N — each exactly once.',
    visual: '1 2 3\n4 5 6\n7 8 9',
  },
  {
    title: '🧬 Cage Constraints',
    body: 'Colored regions are "cages". The sum of numbers inside must satisfy a modular equation shown as ≡ r (mod m).\n\nExample: ≡2(mod3) means the sum, when divided by 3, leaves a remainder of 2.',
    visual: 'Sum = 5\n5 mod 3 = 2 ✓',
  },
  {
    title: '🔬 Strategy',
    body: 'Combine two techniques:\n• Latin square: eliminate duplicates in rows/columns\n• Modular math: test which sums fit the cage remainder\n\nOverlapping constraints narrow down each cell.',
    visual: null,
  },
  {
    title: '💡 Scoring',
    body: 'Base Score + Time Bonus − Hint Penalty − Error Penalty\n\nSolve fast, use no hints, make no errors for maximum score. Your score posts to the Galactic Leaderboard.',
    visual: null,
  },
];

export function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs bg-space-800 rounded-2xl p-6 border border-alien-purple/40">
        <h2 className="text-xl font-black text-alien-green mb-3">{s.title}</h2>
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line mb-4">{s.body}</p>

        {s.visual && (
          <div className="bg-space-900 rounded-xl p-4 mb-4 font-mono text-alien-cyan text-sm text-center whitespace-pre">
            {s.visual}
          </div>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-alien-green' : 'bg-space-600'}`} />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl border border-space-600 text-slate-400 text-sm font-semibold"
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : onClose()}
            className="flex-1 py-3 rounded-xl bg-alien-green text-space-950 font-bold text-sm"
          >
            {step < STEPS.length - 1 ? 'Next →' : '🚀 Play Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
