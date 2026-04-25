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
    // This only runs in the browser — useEffect never runs on the server.
    const handleMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'app:ready' && data.payload) {
          const { alienId, token, callSign } = data.payload;
          setState({
            user: { alienId, username: callSign ?? null },
            isReady: true,
            authToken: token,
            isBridgeAvailable: true,
          });
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleMessage);

    // Call ready() immediately if bridge is already injected,
    // otherwise poll briefly for it (Alien app injects it after load).
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
      setTimeout(() => clearInterval(interval), 8000);
    }

    return () => window.removeEventListener('message', handleMessage);
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
