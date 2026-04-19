# Environment Variables Documentation

The following environment variables are required for the Congruence miniapp.

## Database
- `DATABASE_URL`: PostgreSQL connection string (Neon or Supabase).

## Alien Platform
- `WEBHOOK_PUBLIC_KEY`: Ed25519 public key for verifying payment webhooks (from dev.alien.org).
- `NEXT_PUBLIC_ALN_RECIPIENT_ADDRESS`:
- `NEXT_PUBLIC_ALN_RECIPIENT_ADDRESS`: Alien Provider address to receive ALN tokens.

## General
- `NEXT_PUBLIC_APP_URL`: Your base deployment URL.
- `RUN_MIGRATIONS`: Set to `true` to run Drizzle migrations on deploy.
