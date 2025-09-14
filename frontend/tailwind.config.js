/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f1f7',
          100: '#e9e4f0',
          200: '#d6cde3',
          300: '#bba8d0',
          400: '#9c7db9',
          500: '#7B5BA4', // Primary color
          600: '#6b4c8e',
          700: '#5a4077',
          800: '#4c3863',
          900: '#413053',
        },
        secondary: {
          50: '#fef4ed',
          100: '#fde6d4',
          200: '#fac9a8',
          300: '#f6a271',
          400: '#F17422', // Secondary color
          500: '#ec6d20',
          600: '#dd5316',
          700: '#b84215',
          800: '#923719',
          900: '#762f18',
        }
      },
      fontFamily: {
        'thai': ['"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
