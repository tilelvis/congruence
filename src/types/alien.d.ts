// Type augmentation for Alien miniapp SDK
declare module '@alien-id/miniapp-sdk' {
  export interface AlienUser {
    alienId: string;
    username?: string;
    avatarUrl?: string;
    walletAddress: string;    // Solana public key
    isVerifiedHuman: boolean;
  }

  export interface AlienContext {
    user: AlienUser | null;
    isReady: boolean;
    isInAlienApp: boolean;
  }

  export interface PaymentRequest {
    amount: number;           // Token amount (human-readable, e.g. 5)
    tokenMint: string;        // SPL token mint address
    recipient: string;        // Treasury wallet
    memo?: string;            // e.g. "Congruence trial purchase"
    onSuccess: (txSignature: string) => void;
    onError: (error: Error) => void;
  }

  export function useAlien(): AlienContext;
  export function requestPayment(req: PaymentRequest): Promise<void>;
  export function postScore(score: number, metadata?: Record<string, unknown>): Promise<void>;
  export function openDeepLink(path: string): void;
  export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void;
  export function AlienProvider(props: { children: React.ReactNode }): JSX.Element;
}

interface Window {
  __ALIEN_CONTEXT__?: any;
}
