/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#2d6a4f',
          emerald: '#34d399',
          orange: '#f97316',
          charcoal: '#374151',
          light: '#f3f4f6'
        }
      }
    },
  },
  plugins: [],
}
