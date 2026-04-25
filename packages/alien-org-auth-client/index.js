const jose = require('jose');

const JWKS = jose.createRemoteJWKSet(new URL('https://auth.alien.org/.well-known/jwks.json'));

class JOSEError extends Error {
  constructor(message) {
    super(message);
    this.name = 'JOSEError';
  }
}

class JWTExpired extends JOSEError {
  constructor(message) {
    super(message ?? 'JWT Expired');
    this.name = 'JWTExpired';
  }
}

const JwtErrors = { JOSEError, JWTExpired };

function createAuthClient() {
  return {
    async verifyToken(token) {
      try {
        const { payload } = await jose.jwtVerify(token, JWKS, {
          issuer: 'https://auth.alien.org',
        });
        if (!payload.sub) throw new JOSEError('Missing sub claim in JWT');
        return { sub: payload.sub, username: payload.username ?? null };
      } catch (err) {
        if (err.code === 'ERR_JWT_EXPIRED') throw new JWTExpired(err.message);
        if (err instanceof JOSEError) throw err;
        throw new JOSEError(err?.message ?? 'Token verification failed');
      }
    },
  };
}

module.exports = { createAuthClient, JwtErrors };
