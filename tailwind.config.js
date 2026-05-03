/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0d1117',
          panel: '#131a23',
          panel2: '#1a2230',
          border: '#1f2a3a',
        },
        accent: {
          cyan: '#00d4aa',
          amber: '#f59e0b',
          red: '#ef4444',
          dim: '#5b6b80',
        },
      },
      fontFamily: {
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
        display: ['Syne', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -8px rgba(0, 212, 170, 0.45)',
      },
    },
  },
  plugins: [],
}
