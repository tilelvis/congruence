// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Alien-themed palette (space + neon)
        space: {
          950: '#020408',
          900: '#050d18',
          800: '#0a1628',
          700: '#0f2040',
          600: '#163058',
        },
        alien: {
          green:  '#00ff88',
          purple: '#8b5cf6',
          blue:   '#3b82f6',
          cyan:   '#06b6d4',
          gold:   '#f59e0b',
          red:    '#ef4444',
        },
        cage: {
          0: '#DC2626',
          1: '#2563EB',
          2: '#16A34A',
          3: '#CA8A04',
          4: '#9333EA',
          5: '#DB2777',
          6: '#0891B2',
          7: '#EA580C',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scanline': 'scanline 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          from: { textShadow: '0 0 10px #00ff88, 0 0 20px #00ff88' },
          to:   { textShadow: '0 0 20px #00ff88, 0 0 40px #00ff88, 0 0 60px #00ff88' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        }
      }
    },
  },
  plugins: [],
}

export default config
