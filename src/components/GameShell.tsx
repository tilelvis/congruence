// src/components/GameShell.tsx
import { ReactNode } from 'react';

export function GameShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="space-grid"
      style={{
        position: 'fixed',
        inset: 0,
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#020408',
        color: 'white',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Radial glow at top */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '40%',
          background: 'radial-gradient(ellipse, rgba(0,255,136,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* Content */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
