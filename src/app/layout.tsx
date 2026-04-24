import type { Metadata, Viewport } from 'next';
import { Orbitron, Exo_2 } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '700', '900']
});

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
  weight: ['300', '400', '600', '700']
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#020408',
};

export const metadata: Metadata = {
  title: 'CONGRUENCE',
  description: 'Modular arithmetic puzzle — Alien Network Edition',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${exo2.variable}`}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <body
        style={{
          height: '100%',
          overflow: 'hidden',
          background: '#020408',
          color: 'white',
          margin: 0
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
