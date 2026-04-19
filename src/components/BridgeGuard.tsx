'use client';

import { useGameStore } from '@/store/gameStore';

export function BridgeGuard({ children }: { children: React.ReactNode }) {
  const isAlienApp = useGameStore((state) => state.isAlienApp);

  if (!isAlienApp) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-space-950 p-6 text-center">
        <div className="max-w-xs space-y-6">
          <div className="text-6xl animate-bounce">🛸</div>
          <h1 className="font-orbitron text-2xl font-black tracking-tighter text-alien-gold">
            ACCESS DENIED
          </h1>
          <p className="font-exo2 text-slate-400 leading-relaxed">
            This miniapp must be opened within the <span className="text-alien-blue font-bold">Alien App</span> to access secure features and your ALN wallet.
          </p>
          <div className="pt-4">
            <a
              href="https://alien.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-alien-blue/10 border border-alien-blue/30 rounded-full text-alien-blue font-orbitron text-xs font-bold tracking-widest hover:bg-alien-blue/20 transition-all"
            >
              GET ALIEN APP
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
