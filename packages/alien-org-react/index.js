const React = require("react");
module.exports = {
  AlienProvider: ({children}) => React.createElement("div", null, children),
  useAlien: () => ({ user: null, isReady: true, authToken: "dummy-token", isBridgeAvailable: true }),
  usePayment: () => ({
    pay: async () => ({ status: "paid", txHash: "dummy-tx" }),
    isLoading: false
  })
};
