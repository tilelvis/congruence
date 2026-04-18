module.exports = {
  createAuthClient: () => ({
    verifyToken: async (token) => ({ sub: "dummy-alien-id" })
  }),
  JwtErrors: {
    JWTExpired: class extends Error {}
  }
};
