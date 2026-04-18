# Environment Variables Documentation

The following environment variables are required for Congruence to function properly.

## Alien Platform
- `ALIEN_APP_ID`: Unique ID for your app from dev.alien.org.
- `ALIEN_APP_SECRET`: Secret key for server-to-server communication.
- `ALIEN_WEBHOOK_SECRET`: Used to verify signatures of incoming webhooks.

## Solana & Aliencoin
- `NEXT_PUBLIC_ALIENCOIN_MINT`: The SPL token mint address for Aliencoin on Solana Mainnet.
- `NEXT_PUBLIC_TREASURY_WALLET`: The Solana public key that will receive payments.
- `SOLANA_RPC_URL`: A Solana RPC endpoint (default: `https://api.mainnet-beta.solana.com`).

## Game Settings
- `NEXT_PUBLIC_TRIAL_COST_TOKENS`: Cost in Aliencoin for 5 additional trials (default: `5`).
- `NEXT_PUBLIC_FREE_TRIALS`: Number of free daily trials (default: `3`).

## Database (Upstash Redis)
- `UPSTASH_REDIS_REST_URL`: REST URL from your Upstash console.
- `UPSTASH_REDIS_REST_TOKEN`: REST token from your Upstash console.

## General
- `NEXT_PUBLIC_APP_URL`: The public base URL of your application.
