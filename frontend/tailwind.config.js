/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#f6f4ef',
        ink: '#1f2a37',
        slate: '#4b5563',
        accent: {
          DEFAULT: '#1f4ed8',
          light: '#5a7df0',
          dark: '#142c86',
        },
        chart: {
          automated: '#1f4ed8',
          manual: '#97b0ff',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 45px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        xl: '1.25rem',
      },
    },
  },
  plugins: [],
};
