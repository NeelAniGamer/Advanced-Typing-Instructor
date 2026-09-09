/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#07090e',
        surface: 'rgba(15, 23, 42, 0.75)',
        surfaceBorder: 'rgba(255, 255, 255, 0.08)',
        cyber: {
          cyan: '#00f5ff',
          neon: '#39ff14',
          purple: '#b388ff',
          amber: '#ffd54f',
          red: '#ff1744',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 245, 255, 0.35)',
        'neon-purple': '0 0 20px rgba(179, 136, 255, 0.35)',
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.35)',
        'neon-red': '0 0 20px rgba(255, 23, 68, 0.35)',
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
