import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AlienProvider } from '@/components/AlienProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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

// Critical: prevent user scaling and overscroll — this is a game
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#050d18',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className={`${inter.variable} h-full overflow-hidden bg-space-950 text-white`}>
        <AlienProvider>
          {children}
        </AlienProvider>
      </body>
    </html>
  );
}
