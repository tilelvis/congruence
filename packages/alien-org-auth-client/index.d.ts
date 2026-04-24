export namespace JwtErrors {
  export class JWTExpired extends Error {}
  export class JOSEError extends Error {}
}

export interface AuthClient {
  verifyToken(token: string): Promise<{ sub: string; username: string }>;
}

export function createAuthClient(): AuthClient;
