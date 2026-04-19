import React from 'react';

export function AlienProvider({ children, autoReady }) {
  return React.createElement(React.Fragment, null, children);
}

export function useAlien() {
  const [authToken, setAuthToken] = React.useState(null);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = window.__ALIEN_AUTH_TOKEN__;
      if (token) {
        setAuthToken(token);
        // In a real scenario, we might decode the JWT or fetch user info
        // For the mock, we just set a non-dummy ID if we have a token
        setUser({ alienId: 'user-' + token.slice(-8), username: 'Alien User' });
      }
    }
  }, []);

  return {
    authToken: authToken,
    isBridgeAvailable: typeof window !== 'undefined' && (!!window.__ALIEN_AUTH_TOKEN__ || !!window.__ALIEN_BRIDGE__),
    user: user
  };
}

export function usePayment(options) {
  return {
    supported: true,
    isLoading: false,
    pay: async (params) => {
      if (options && options.onPaid) {
        options.onPaid('tx-' + Math.random().toString(36).slice(2));
      }
      return { status: 'paid', txHash: 'tx-' + Math.random().toString(36).slice(2) };
    },
    reset: () => {}
  };
}

export function useHaptic() {
  return {
    vibrate: (style) => {}
  };
}
