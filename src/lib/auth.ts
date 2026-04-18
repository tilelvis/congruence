import { createAuthClient, JwtErrors } from '@alien_org/auth-client';
import { NextRequest, NextResponse } from 'next/server';

const authClient = createAuthClient();

export async function verifyRequest(request: NextRequest): Promise<{ alienId: string } | NextResponse> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
  }

  try {
    const { sub } = await authClient.verifyToken(token);
    return { alienId: sub };
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
