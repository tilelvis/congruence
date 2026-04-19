export const JwtErrors = {
  JWTExpired: class extends Error {},
  JOSEError: class extends Error {},
};

export function createAuthClient(options) {
  return {
    verifyToken: async (token) => ({
      sub: 'dummy-id',
      username: 'dummy-user'
    })
  };
}
