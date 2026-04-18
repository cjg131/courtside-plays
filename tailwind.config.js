/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Courtside brand palette (matches the existing Courtside app)
        court: {
          bg: '#0f172a',       // dark slate, app background
          panel: '#1e293b',    // panel / card background
          line: '#334155',     // borders
          wood: '#d4a373',     // court floor tan
          woodDark: '#b08060', // court floor shading
          paint: '#3b82f6',    // lane / paint blue
          accent: '#f97316',   // basketball orange
        },
        jersey: {
          offense: '#2563eb',  // blue = offense (numbered)
          defense: '#dc2626',  // red = defense (X)
          ghost: '#94a3b8',    // ghost actor for branch previews
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        dribble: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        pulse_ring: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
      },
      animation: {
        dribble: 'dribble 0.4s infinite ease-in-out',
        'pulse-ring': 'pulse_ring 1.2s infinite ease-out',
      },
    },
  },
  plugins: [],
};
