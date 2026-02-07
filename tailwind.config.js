/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#08090E', secondary: '#0E1018', card: '#13151F', 'card-hover': '#181B28' },
        sidebar: '#0B0C14',
        accent: { DEFAULT: '#3B82F6', dim: 'rgba(59, 130, 246, 0.12)', glow: 'rgba(59, 130, 246, 0.25)' },
        profit: { DEFAULT: '#22C55E', dim: 'rgba(34, 197, 94, 0.12)' },
        loss: { DEFAULT: '#EF4444', dim: 'rgba(239, 68, 68, 0.12)' },
        txt: { 1: '#F0F2F5', 2: '#8B92A5', 3: '#4B5269' },
        brd: { DEFAULT: 'rgba(255, 255, 255, 0.06)', hover: 'rgba(255, 255, 255, 0.12)' },
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
