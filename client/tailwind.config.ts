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
          DEFAULT: '#244E77',
          light: '#2F6699',
          dark: '#163754',
        },
        accent: {
          500: '#f59e0b',
          400: '#fbbf24',
        },
      },
      animation: {
        'slide-down': 'slideDown 0.25s ease-out',
        'slide-up': 'slideUp 0.28s ease-out',
        'fade-in': 'fadeIn 0.25s ease-out',
      },
      keyframes: {
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-0.5rem)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(1rem)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
