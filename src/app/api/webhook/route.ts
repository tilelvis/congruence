// Alien platform webhook receiver
// Alien sends signed POST requests to this URL for events like:
// - miniapp_opened, score_posted, payment_completed

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-alien-signature') ?? '';
  const secret = process.env.ALIEN_WEBHOOK_SECRET ?? '';

  // Verify HMAC-SHA256 signature
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const trusted = `sha256=${expected}`;

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== trusted.length) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  let diff = 0;
  for (let i = 0; i < signature.length; i++) {
    diff |= signature.charCodeAt(i) ^ trusted.charCodeAt(i);
  }
  if (diff !== 0) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = event.type as string;
  console.log('[Alien Webhook]', type, event);

  switch (type) {
    case 'miniapp_opened':
      // Could log analytics, check if user is new, etc.
      break;
    case 'payment_completed':
      // Handled via /api/verify-payment — double-check on-chain
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

// Required for webhook verification: respond to GET with status
export async function GET() {
  return NextResponse.json({ status: 'ok', app: 'congruence' });
}
