'use client';

import { AlienProvider as SDKProvider } from '@alien-id/miniapp-sdk';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Wraps the entire app in the Alien SDK context.
 * This MUST be the outermost provider in layout.tsx.
 */
export function AlienProvider({ children }: Props) {
  return (
    <SDKProvider>
      {children}
    </SDKProvider>
  );
}
