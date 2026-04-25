'use strict';

// Guard: on the server, export no-op stubs so API routes don't crash.
// React.createContext is a browser/client-only API.
if (typeof window === 'undefined') {
  module.exports = {
    AlienProvider: ({ children }) => children,
    useAlien: () => ({ user: null, isReady: false, authToken: null, isBridgeAvailable: false }),
    usePayment: () => ({ pay: async () => ({ status: 'failed' }), isLoading: false }),
  };
} else {
  const React = require('react');

  const AlienContext = React.createContext({
    user: null,
    isReady: false,
    authToken: null,
    isBridgeAvailable: false,
  });

  function AlienProvider({ children }) {
    const [state, setState] = React.useState({
      user: null,
      isReady: false,
      authToken: null,
      isBridgeAvailable: false,
    });

    React.useEffect(() => {
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

      if (window.alien?.app?.ready) {
        window.alien.app.ready();
      } else {
        const interval = setInterval(() => {
          if (window.alien?.app?.ready) {
            window.alien.app.ready();
            clearInterval(interval);
          }
        }, 100);
        setTimeout(() => clearInterval(interval), 5000);
      }

      return () => window.removeEventListener('message', handleMessage);
    }, []);

    return React.createElement(AlienContext.Provider, { value: state }, children);
  }

  function useAlien() {
    return React.useContext(AlienContext);
  }

  function usePayment(options = {}) {
    const [isLoading, setIsLoading] = React.useState(false);

    const pay = React.useCallback(async (params) => {
      if (!window.alien?.payment?.pay) {
        options.onFailed?.('BRIDGE_UNAVAILABLE');
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
                options.onPaid?.(data.payload.txHash);
                resolve({ status: 'paid', txHash: data.payload.txHash });
              } else if (data.payload.status === 'cancelled') {
                options.onCancelled?.();
                resolve({ status: 'cancelled' });
              } else {
                options.onFailed?.(data.payload.errorCode ?? 'FAILED');
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
                         }
