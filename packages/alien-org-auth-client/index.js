const { jwtVerify, createRemoteJWKSet } = require('jose');

const JWKS_URL = 'https://auth.alien.org/.well-known/jwks.json';
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

class JOSEError extends Error {}
class JWTExpired extends JOSEError {}

const JwtErrors = { JOSEError, JWTExpired };

function createAuthClient() {
  return {
    async verifyToken(token) {
      try {
        const { payload } = await jwtVerify(token, JWKS, {
          issuer: 'https://auth.alien.org',
        });
        if (!payload.sub) throw new JOSEError('Missing sub claim');
        return { sub: payload.sub };
      } catch (err) {
        if (err.code === 'ERR_JWT_EXPIRED') throw new JWTExpired(err.message);
        if (err instanceof JOSEError) throw err;
        throw new JOSEError(err.message);
      }
    },
  };
}

module.exports = { createAuthClient, JwtErrors };
