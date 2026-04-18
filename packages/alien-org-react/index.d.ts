import React from "react";
export interface AlienUser {
  alienId: string;
  username?: string;
  avatarUrl?: string;
}
export interface AlienContext {
  user: AlienUser | null;
  isReady: boolean;
  authToken: string | null;
  isBridgeAvailable: boolean;
}
export function useAlien(): AlienContext;
export function usePayment(options: {
  onPaid?: (txHash: string) => void;
  onCancelled?: () => void;
  onFailed?: (code: string) => void;
}): {
  pay: (params: any) => Promise<{ status: string; txHash?: string }>;
  isLoading: boolean;
};
export function AlienProvider(props: { children: React.ReactNode }): JSX.Element;
