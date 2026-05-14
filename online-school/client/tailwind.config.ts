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
    },
  },
  plugins: [],
};
