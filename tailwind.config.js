/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'reaction-pop': {
          '0%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.35)' },
          '30%': { transform: 'scale(0.85)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        'logo-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.85' },
        },
      },
      animation: {
        'reaction-pop': 'reaction-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'logo-pulse': 'logo-pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
