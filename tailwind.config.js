/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-base': '#0a0a0f',
        'dark-card': '#1a1a24',
        'accent-gold': '#d4af37',
        'accent-amber': '#ffbf69',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
