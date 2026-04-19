import React from 'react';

export interface AlienProviderProps {
  children: React.ReactNode;
  autoReady?: boolean;
}

export function AlienProvider(props: AlienProviderProps): JSX.Element;

export interface AlienUser {
  alienId: string;
  username: string;
}

export function useAlien(): {
  authToken: string | null;
  isBridgeAvailable: boolean;
  user: AlienUser | null;
};

export interface PaymentOptions {
  onPaid?: (txHash: string) => void;
  onCancelled?: () => void;
  onFailed?: (errorCode?: string) => void;
  onError?: (error: { code: string; message: string }) => void;
}

export interface PaymentState {
  supported: boolean;
  isLoading: boolean;
  pay: (params: any) => Promise<{ status: string; txHash?: string }>;
  reset: () => void;
}

export function usePayment(options?: PaymentOptions): PaymentState;

export function useHaptic(): {
  vibrate: (style: 'light' | 'medium' | 'heavy') => void;
};
