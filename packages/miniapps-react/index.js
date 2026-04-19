import React from 'react';

export function AlienProvider({ children, autoReady }) {
  const [authToken, setAuthToken] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [isBridgeAvailable, setIsBridgeAvailable] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Simulate the bridge if not present for development,
    // but in reality it's injected by the Alien App as window.alien
    if (!window.alien) {
      window.alien = {
        app: {
          ready: () => {
            console.log('[Mock Bridge] app.ready() called');
            // Simulate the app:ready response from the host
            setTimeout(() => {
              window.postMessage(JSON.stringify({
                type: 'app:ready',
                payload: {
                  alienId: 'user-mock-123',
                  token: 'mock-jwt-token-123',
                  callSign: 'MockAlien'
                }
              }), '*');
            }, 100);
          }
        },
        payment: {
          pay: (params) => {
            console.log('[Mock Bridge] payment.pay() called', params);
            // Simulate user approval and payment:response
            setTimeout(() => {
              window.postMessage(JSON.stringify({
                type: 'payment:response',
                payload: {
                  status: 'paid',
                  txHash: '0xmocktxhash123',
                  invoice: params.invoice
                }
              }), '*');
            }, 1000);
          }
        }
      };
    }

    setIsBridgeAvailable(true);

    const handleMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'app:ready' && data.payload) {
          setAuthToken(data.payload.token);
          setUser({ alienId: data.payload.alienId, username: data.payload.callSign });
          // Also set on window for convenience or compatibility
          window.__ALIEN_AUTH_TOKEN__ = data.payload.token;
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('message', handleMessage);

    // Auto-ready if requested
    if (autoReady !== false) {
      window.alien.app.ready();
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [autoReady]);

  const value = {
    authToken,
    user,
    isBridgeAvailable,
    ready: () => window.alien?.app?.ready()
  };

  // Create a context if needed, but for now we'll just use a simple approach
  // Since we are mocking the module, we can just return the children
  return React.createElement(React.Fragment, null, children);
}

// We need to export a way to access the context.
// For this mock, we'll use a global-ish state since it's a singleton in the app
let globalState = {
  authToken: null,
  user: null,
  isBridgeAvailable: false
};

export function useAlien() {
  const [state, setState] = React.useState(globalState);

  React.useEffect(() => {
    const checkState = () => {
      // In a real implementation, this would be tied to the Provider's state
      // For this mock, we'll try to pick up from window if available
      if (typeof window !== 'undefined' && window.__ALIEN_AUTH_TOKEN__) {
        const newState = {
          authToken: window.__ALIEN_AUTH_TOKEN__,
          user: { alienId: 'user-mock-123', username: 'MockAlien' },
          isBridgeAvailable: true
        };
        if (JSON.stringify(newState) !== JSON.stringify(globalState)) {
          globalState = newState;
          setState(newState);
        }
      }
    };
    const interval = setInterval(checkState, 100);
    return () => clearInterval(interval);
  }, []);

  return state;
}

export function usePayment(options) {
  const [isLoading, setIsLoading] = React.useState(false);

  const pay = async (params) => {
    setIsLoading(true);
    return new Promise((resolve) => {
      const handleMessage = (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.type === 'payment:response' && data.payload.invoice === params.invoice) {
            window.removeEventListener('message', handleMessage);
            setIsLoading(false);
            if (data.payload.status === 'paid') {
              options?.onPaid?.(data.payload.txHash);
            } else if (data.payload.status === 'cancelled') {
              options?.onCancelled?.();
            } else {
              options?.onFailed?.(data.payload.status);
            }
            resolve(data.payload);
          }
        } catch (e) {}
      };
      window.addEventListener('message', handleMessage);
      window.alien?.payment?.pay(params);
    });
  };

  return {
    supported: true,
    isLoading,
    pay,
    reset: () => setIsLoading(false)
  };
}

export function useHaptic() {
  return {
    vibrate: (style) => console.log('[Haptic]', style)
  };
}
