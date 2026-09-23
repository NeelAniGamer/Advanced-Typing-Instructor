/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d1117',
        surface: 'rgba(22, 27, 34, 0.85)',
        surfaceBorder: 'rgba(255, 255, 255, 0.08)',
        cyber: {
          cyan: '#38bdf8',
          neon: '#34d399',
          purple: '#a78bfa',
          amber: '#fbbf24',
          red: '#f87171',
          blue: '#60a5fa',
        },
        organic: {
          sage: '#7C8D81',
          linen: '#FAF8F5',
          terracotta: '#C97D5A',
          graphite: '#333333',
          ochre: '#EBC078',
          steel: '#B8C0BF',
          card: '#FFFFFF',
          cardBorder: '#E5DFD7',
          surface: '#F4F0EA',
          muted: '#616864',
        }
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 4px 16px -2px rgba(56, 189, 248, 0.2)',
        'neon-purple': '0 4px 16px -2px rgba(167, 139, 250, 0.2)',
        'neon-green': '0 4px 16px -2px rgba(52, 211, 153, 0.2)',
        'neon-red': '0 4px 16px -2px rgba(248, 113, 113, 0.2)',
        'studio-card': '0 8px 24px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
        'organic-terracotta': '0 8px 24px -2px rgba(201, 125, 90, 0.35)',
        'organic-sage': '0 6px 20px -2px rgba(124, 141, 129, 0.3)',
        'organic-soft': '0 4px 20px -2px rgba(51, 51, 51, 0.06), 0 2px 8px -1px rgba(51, 51, 51, 0.04)',
        'organic-card': '0 10px 30px -4px rgba(51, 51, 51, 0.08), 0 4px 10px -2px rgba(51, 51, 51, 0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
