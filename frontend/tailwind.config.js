/** @type {import('tailwindcss').Config} */
module.exports = {
  // YOU MUST ADD THIS CONTENT ARRAY 👇
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#111111',
        'brand-light': '#F9FAFB',
        'brand-pink': '#FF00A2',
        'brand-pink-start': '#D0007A',
        'brand-pink-end': '#A0005C',
        'input-bg': '#222222',
        'input-border': '#444444',
        'shape-pink': '#FFC0E4'
      }
    },
  },
  plugins: [],
}