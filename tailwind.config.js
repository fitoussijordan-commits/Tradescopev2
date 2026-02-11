/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
        },
        sidebar: 'var(--sidebar)',
        accent: {
          DEFAULT: 'var(--accent)',
          dim: 'var(--accent-dim)',
          glow: 'var(--accent-glow)',
        },
        profit: {
          DEFAULT: 'var(--profit)',
          dim: 'var(--profit-dim)',
        },
        loss: {
          DEFAULT: 'var(--loss)',
          dim: 'var(--loss-dim)',
        },
        txt: {
          1: 'var(--txt-1)',
          2: 'var(--txt-2)',
          3: 'var(--txt-3)',
        },
        brd: {
          DEFAULT: 'var(--brd)',
          hover: 'var(--brd-hover)',
        },
      },
      fontFamily: {
        display: ['Instrument Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
