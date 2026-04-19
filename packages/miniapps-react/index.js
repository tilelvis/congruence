import React from 'react';

export function AlienProvider({ children, autoReady }) {
  return React.createElement(React.Fragment, null, children);
}

export function useAlien() {
  return {
    authToken: 'dummy-token',
    isBridgeAvailable: true,
    user: { alienId: 'dummy-id', username: 'dummy-user' }
  };
}

export function usePayment(options) {
  return {
    supported: true,
    isLoading: false,
    pay: async (params) => {
      if (options && options.onPaid) {
        options.onPaid('0x123-dummy-hash');
      }
      return { status: 'paid', txHash: '0x123-dummy-hash' };
    },
    reset: () => {}
  };
}

export function useHaptic() {
  return {
    vibrate: (style) => {}
  };
}
