# Alien Developer Dashboard Setup

Follow these steps to register your miniapp on the Alien platform.

## 1. Access the Portal
Visit [dev.alien.org](https://dev.alien.org) and sign in using your Alien ID.

## 2. Register Your Miniapp
Click on **"Create New Miniapp"** and fill in the details:
- **Name**: `Congruence`
- **Home URL**: Your Vercel deployment URL (e.g., `https://congruence.vercel.app`).
- **Manifest URL**: `https://YOUR_DOMAIN/manifest.json`.
- **Webhook URL**: `https://YOUR_DOMAIN/api/webhook`.

## 3. Obtain Credentials
Once created, the dashboard will provide:
- **App ID**: Copy to `ALIEN_APP_ID`.
- **App Secret**: Copy to `ALIEN_APP_SECRET`.
- **Webhook Secret**: Copy to `ALIEN_WEBHOOK_SECRET`.

Ensure these are added to your Vercel environment variables.

## 4. Webhook Verification
Use the "Test Webhook" button in the portal. Your app should respond with:
```json
{ "received": true }
```

## 5. Deeplink Registration
Register the following paths in the portal to enable deep linking:
- `/congruence`
- `/congruence?diff=novice`
- `/congruence?screen=leaderboard`

## 6. Submit for Review
Once testing is complete, submit your miniapp for review to be featured in the Alien App Directory.
