import { createAuthClient, JwtErrors } from '@alien_org/auth-client';
import { NextRequest, NextResponse } from 'next/server';

// audience = your NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS (your provider address)
const authClient = createAuthClient({
  audience: process.env.NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS!,
});

export async function verifyRequest(
  request: NextRequest,
): Promise<{ alienId: string } | NextResponse> {
  const header = request.headers.get('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: 'Missing authorization token' },
      { status: 401 },
    );
  }

  try {
    const { sub } = await authClient.verifyToken(token);
    return { alienId: sub };
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    if (error instanceof JwtErrors.JOSEError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
  }
}
