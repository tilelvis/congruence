'use strict';

const React = require('react');

const DEFAULT = {
  user: null,
  isReady: false,
  authToken: null,
  isBridgeAvailable: false,
};

const AlienContext = React.createContext(DEFAULT);

function AlienProvider({ children }) {
  const [state, setState] = React.useState(DEFAULT);

  React.useEffect(() => {
    // Helper to commit a ready state from any payload shape
    function commitReady(alienId, token, callSign) {
      if (!token || !alienId) return;
      window.__ALIEN_AUTH_TOKEN__ = token;
      setState({
        user: { alienId, username: callSign ?? null },
        isReady: true,
        authToken: token,
        isBridgeAvailable: true,
      });
    }

    // Case 1: token was already injected before this effect ran
    if (window.__ALIEN_AUTH_TOKEN__ && window.__ALIEN_USER__) {
      commitReady(
        window.__ALIEN_USER__.alienId,
        window.__ALIEN_AUTH_TOKEN__,
        window.__ALIEN_USER__.callSign,
      );
      return;
    }

    // Case 2: listen for the app:ready postMessage
    const handleMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        // Shape A: { type: 'app:ready', payload: { alienId, token, callSign } }
        if (data.type === 'app:ready' && data.payload?.token) {
          commitReady(data.payload.alienId, data.payload.token, data.payload.callSign);
        }
        // Shape B: { alienId, token, callSign } at top level
        if (!data.type && data.token && data.alienId) {
          commitReady(data.alienId, data.token, data.callSign);
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleMessage);

    // Call ready() to prompt the host to send app:ready
    const callReady = () => {
      if (window.alien?.app?.ready) {
        window.alien.app.ready();
        return true;
      }
      return false;
    };

    if (!callReady()) {
      const interval = setInterval(() => {
        if (callReady()) clearInterval(interval);
      }, 100);
      setTimeout(() => clearInterval(interval), 5000);
    }

    // Case 3: fallback timeout — if no response after 5s, mark isReady=true
    // so the UI stops spinning. isBridgeAvailable stays false → shows
    // "open in Alien app" screen instead of infinite spinner.
    const timeout = setTimeout(() => {
      setState(prev => {
        if (!prev.isReady) return { ...prev, isReady: true };
        return prev;
      });
    }, 5000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, []);

  return React.createElement(AlienContext.Provider, { value: state }, children);
}

function useAlien() {
  return React.useContext(AlienContext);
}

function usePayment(options) {
  const opts = options || {};
  const [isLoading, setIsLoading] = React.useState(false);

  const pay = React.useCallback(async (params) => {
    if (typeof window === 'undefined' || !window.alien?.payment?.pay) {
      opts.onFailed?.('BRIDGE_UNAVAILABLE');
      return { status: 'failed' };
    }

    setIsLoading(true);
    return new Promise((resolve) => {
      const handleMessage = (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.type === 'payment:response' && data.payload?.invoice === params.invoice) {
            window.removeEventListener('message', handleMessage);
            setIsLoading(false);
            if (data.payload.status === 'paid') {
              opts.onPaid?.(data.payload.txHash);
              resolve({ status: 'paid', txHash: data.payload.txHash });
            } else if (data.payload.status === 'cancelled') {
              opts.onCancelled?.();
              resolve({ status: 'cancelled' });
            } else {
              opts.onFailed?.(data.payload.errorCode ?? 'FAILED');
              resolve({ status: 'failed' });
            }
          }
        } catch (_) {}
      };
      window.addEventListener('message', handleMessage);
      window.alien.payment.pay(params);
    });
  }, []);

  return { pay, isLoading };
}

module.exports = { AlienProvider, useAlien, usePayment };
