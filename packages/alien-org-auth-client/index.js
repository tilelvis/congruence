module.exports = {
  createAuthClient: () => ({
    verifyToken: async (token) => {
      if (!token || token === 'expired') {
        const { JwtErrors } = require('./index');
        throw new JwtErrors.JWTExpired();
      }
      return { sub: 'user-' + token.slice(-8) };
    }
  }),
  JwtErrors: {
    JWTExpired: class extends Error { constructor() { super('JWT Expired'); this.name = 'JWTExpired'; } },
    JOSEError: class extends Error { constructor() { super('JOSE Error'); this.name = 'JOSEError'; } }
  }
};
