// src/components/GameShell.tsx
import { ReactNode } from 'react';

export function GameShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        fixed inset-0 flex flex-col
        bg-space-950 text-white
        overflow-hidden select-none
        [env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]
        [env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]
      "
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Subtle space background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,136,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative flex flex-col flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
