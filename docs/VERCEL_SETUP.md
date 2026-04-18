# Vercel Setup Guide for Congruence

This guide explains how to deploy the Congruence miniapp to Vercel.

## 1. Prerequisites
- A GitHub account.
- A Vercel account.

## 2. Deployment Steps

1.  **Push to GitHub**:
    Create a new repository on GitHub and push your code.

2.  **Import to Vercel**:
    - Go to the [Vercel Dashboard](https://vercel.com/dashboard).
    - Click **"New Project"**.
    - Select your `congruence-alien` repository.

3.  **Configure Project**:
    - **Framework Preset**: Next.js.
    - **Root Directory**: `./` (Root).

4.  **Environment Variables**:
    Add the following variables (see `docs/ENVIRONMENT_VARIABLES.md` for details):
    - `ALIEN_APP_ID`
    - `ALIEN_APP_SECRET`
    - `ALIEN_WEBHOOK_SECRET`
    - `NEXT_PUBLIC_ALIENCOIN_MINT`
    - `NEXT_PUBLIC_TREASURY_WALLET`
    - `UPSTASH_REDIS_REST_URL`
    - `UPSTASH_REDIS_REST_TOKEN`
    - `NEXT_PUBLIC_APP_URL` (Set to your Vercel deployment URL after the first deploy)

5.  **Deploy**:
    Click **"Deploy"**.

## 3. Post-Deployment Configuration

Once the deployment is complete, copy the production URL (e.g., `https://congruence-alien.vercel.app`) and update the following:
1.  Set `NEXT_PUBLIC_APP_URL` in Vercel Environment Variables to this URL.
2.  Update `public/manifest.json` URLs to match this domain.
3.  Trigger a new deployment on Vercel to apply these changes.
