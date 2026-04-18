export function createAuthClient(): {
  verifyToken: (token: string) => Promise<{ sub: string }>;
};
export namespace JwtErrors {
  export class JWTExpired extends Error {}
}
