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
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          dim: 'var(--accent-dim)',
          glow: 'var(--accent-glow)',
          strong: 'var(--accent-strong)',
        },
        warn: 'rgb(var(--warn-rgb) / <alpha-value>)',
        profit: {
          DEFAULT: 'rgb(var(--profit-rgb) / <alpha-value>)',
          dim: 'var(--profit-dim)',
        },
        loss: {
          DEFAULT: 'rgb(var(--loss-rgb) / <alpha-value>)',
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
        display: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
