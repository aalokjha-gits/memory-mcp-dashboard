import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hud: {
          bg: '#04070d',
          panel: 'rgba(8, 14, 24, 0.55)',
          line: 'rgba(0, 240, 255, 0.15)',
          cyan: '#00f0ff',
          cyanDim: '#0b8ba0',
          amber: '#ffb454',
          red: '#ff4d6d',
          green: '#57f287',
          violet: '#b388ff',
          text: '#c7e9f5',
          mute: '#5a7a8c',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'monospace'],
        display: ['Orbitron', 'Rajdhani', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 240, 255, 0.25), inset 0 0 20px rgba(0, 240, 255, 0.05)',
        glowStrong: '0 0 40px rgba(0, 240, 255, 0.45)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.4)' },
        },
        flicker: {
          '0%,19%,21%,23%,25%,54%,56%,100%': { opacity: '1' },
          '20%,24%,55%': { opacity: '0.4' },
        },
        boot: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        scan: 'scan 6s linear infinite',
        pulseDot: 'pulseDot 1.4s ease-in-out infinite',
        flicker: 'flicker 3s infinite',
        boot: 'boot 0.45s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;
