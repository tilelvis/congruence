'use client';

import { AlienProvider } from '@alien-id/miniapps-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {/*
      AlienProvider MUST be the outermost wrapper.
      autoReady={true} is the default — it signals app:ready to the host
      which tells the Alien app the miniapp has loaded and is interactive.
      */}
      <AlienProvider autoReady={true}>
        {children}
      </AlienProvider>
    </QueryClientProvider>
  );
}
