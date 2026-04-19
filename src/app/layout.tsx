import type { Metadata, Viewport } from 'next';
import { Orbitron, Exo_2 } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AlienMiniAppProvider } from '@/components/providers/AlienMiniAppProvider';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
});

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#050d18',
};

export const metadata: Metadata = {
  title: 'CONGRUENCE — Alien Miniapp',
  description: 'A modular arithmetic logic puzzle from deep space.',
  manifest: '/manifest.json',
  icons: { icon: '/icon.png', apple: '/icon.png' },
  openGraph: {
    title: 'CONGRUENCE',
    description: 'The universe\'s hardest number puzzle.',
    images: ['/hero.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${exo2.variable} antialiased`}>
        <Providers>
          <AlienMiniAppProvider>
            {children}
          </AlienMiniAppProvider>
        </Providers>
      </body>
    </html>
  );
}
