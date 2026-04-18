import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for Alien miniapp — allow embedding in alien.org
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        // Allow alien.org to embed this app
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://alien.org https://*.alien.org" },
        // HTTPS everywhere
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ],
    },
  ],
  // Optimize for mobile
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
