import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B1220', // base background — deep clinical navy-black
        panel: '#121A2B', // raised surfaces (cards, monitor housing)
        panel2: '#182238', // nested surfaces
        line: '#243049', // hairlines / dividers
        vital: '#3ECF8E', // ECG green — calm, nominal
        alert: '#E85D5D', // clinical red — critical values only
        gold: '#D9A544', // pay / reward accent, used sparingly
        ivory: '#E8ECF1', // primary text
        muted: '#7C8AA5', // secondary text
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        ecg: {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-800' },
        },
      },
      animation: {
        ecg: 'ecg linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
