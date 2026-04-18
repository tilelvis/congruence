const React = require("react");
module.exports = {
  AlienProvider: ({children}) => React.createElement("div", null, children),
  useAlien: () => ({ user: null, isReady: true, isInAlienApp: false }),
  requestPayment: async () => {},
  postScore: async () => {},
  openDeepLink: () => {},
  hapticFeedback: () => {}
};
