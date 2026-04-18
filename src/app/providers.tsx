'use client';

import { AlienProvider } from '@alien_org/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AlienProvider>
        {children}
      </AlienProvider>
    </QueryClientProvider>
  );
}
