import type { Metadata, Viewport } from 'next';
import { Orbitron, Exo_2 } from 'next/font/google';
import './globals.css';
import { AlienProvider } from '@/components/AlienProvider';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '700', '900'],
});

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
  weight: ['300', '400', '600', '700'],
});

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
    <html lang="en" className={`${orbitron.variable} ${exo2.variable} h-full overflow-hidden`}>
      <body className="h-full overflow-hidden bg-[#020408] text-white font-[family-name:var(--font-exo2)]">
        <AlienProvider>
          {children}
        </AlienProvider>
      </body>
    </html>
  );
}
