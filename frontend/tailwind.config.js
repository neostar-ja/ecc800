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
        },
        background: {
          DEFAULT: '#ffffff',
          dark: '#0f0f23',
          paper: '#f8fafc',
          'paper-dark': '#1e293b',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#1e293b',
          hover: '#f1f5f9',
          'hover-dark': '#334155',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        'ibm': ['"IBM Plex Sans"', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        'ibm-flex': ['"IBM Plex Sans"', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translateY(0)' },
          '40%, 43%': { transform: 'translateY(-10px)' },
          '70%': { transform: 'translateY(-5px)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-dark': '0 2px 15px -3px rgba(0, 0, 0, 0.3), 0 10px 20px -2px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
