/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          navy: '#0b1329',
          card: '#111c38',
          border: '#1f2e54',
          accent: '#2563eb',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}
