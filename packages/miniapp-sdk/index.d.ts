import React from "react";
export interface AlienUser {
  alienId: string;
  username?: string;
  avatarUrl?: string;
  walletAddress: string;
  isVerifiedHuman: boolean;
}
export interface AlienContext {
  user: AlienUser | null;
  isReady: boolean;
  isInAlienApp: boolean;
}
export interface PaymentRequest {
  amount: number;
  tokenMint: string;
  recipient: string;
  memo?: string;
  onSuccess: (txSignature: string) => void;
  onError: (error: Error) => void;
}
export function useAlien(): AlienContext;
export function requestPayment(req: PaymentRequest): Promise<void>;
export function postScore(score: number, metadata?: Record<string, unknown>): Promise<void>;
export function openDeepLink(path: string): void;
export function hapticFeedback(type: "light" | "medium" | "heavy" | "success" | "error"): void;
export function AlienProvider(props: { children: React.ReactNode }): JSX.Element;
