/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'reaction-pop': {
          '0%': { transform: 'scale(0)' },
          '15%': { transform: 'scale(1.4)' },
          '30%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.15)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'reaction-ring': {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '50%': { transform: 'scale(2.5)', opacity: '0.4' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
      },
      animation: {
        'reaction-pop': 'reaction-pop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'reaction-ring': 'reaction-ring 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
