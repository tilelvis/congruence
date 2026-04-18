# 🛸 CONGRUENCE — Alien Miniapp

Congruence is a modular arithmetic logic puzzle game built as a miniapp for the [Alien.org](https://alien.org) platform. Solve $N \times N$ grids by satisfying Latin square rules and modular cage constraints.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- An Upstash Redis database

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/congruence.git
cd congruence

# Install dependencies
npm install
```

### 3. Local Development
1. Create a `.env.local` file based on `.env.example`.
2. Start the development server:
```bash
npm run dev
```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Documentation

For detailed setup instructions, please refer to the following guides:

- [Vercel Deployment Guide](docs/VERCEL_SETUP.md)
- [Alien Developer Dashboard Setup](docs/ALIEN_DASHBOARD_SETUP.md)
- [Environment Variables Reference](docs/ENVIRONMENT_VARIABLES.md)

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Blockchain**: Solana (@solana/web3.js)
- **Database**: Upstash Redis
- **Platform**: Alien SDK

## 👽 Platform Integration
Congruence leverages the Alien SDK for:
- **Identity**: Securely identifying verified humans.
- **Payments**: Accepting Aliencoin (SPL tokens) for extra game trials.
- **Haptics**: Providing tactile feedback on mobile devices.
- **Deep Links**: Allowing users to share scores and jump directly into missions.

## 📄 License
MIT
