/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        party: {
          dark: '#0F172A',
          card: '#1E293B',
          cardBorder: '#334155',
          primary: '#6366F1',
          accent: '#EC4899',
          yellow: '#FBBF24',
          green: '#10B981',
          cyan: '#06B6D4',
        }
      },
      fontFamily: {
        game: ['"Fredoka"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-short': 'bounce 0.5s ease-in-out 1',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(236, 72, 153, 0.7)' },
        }
      }
    },
  },
  plugins: [],
}
