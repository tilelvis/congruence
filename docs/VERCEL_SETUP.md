# Vercel Deployment Guide

1. Create a PostgreSQL database (Neon recommended).
2. Add all environment variables from `.env.example` to Vercel.
3. Deploy the project.
4. Update `NEXT_PUBLIC_APP_URL` with the deployment domain.
5. Create a webhook at dev.alien.org pointing to `https://YOUR_DOMAIN/api/webhooks/payment` and update `WEBHOOK_PUBLIC_KEY`.
