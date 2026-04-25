/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans:    ['"Geist"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono:    ['"Geist Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        forest: {
          50:  '#f3f7f4', 100: '#e1ebe3', 200: '#c2d6c7', 300: '#94b89d',
          400: '#5e9170', 500: '#3d7350', 600: '#2c5b3e', 700: '#234834',
          800: '#1c3a2b', 900: '#163024', 950: '#0a1c14'
        },
        cream: {
          50:  '#fefdf8', 100: '#fbf8ec', 200: '#f5efd6', 300: '#ede2b3',
          400: '#e2d088', 500: '#d6bc63'
        },
        brass: { 400: '#c89c4d', 500: '#b08234', 600: '#8f6826' },
        ink:    { 900: '#0d1410', 800: '#1a221d', 700: '#2c3530', 500: '#5d6862', 400: '#869089' }
      },
      boxShadow: {
        'phone': '0 30px 80px -20px rgba(22, 48, 36, 0.35), 0 12px 30px -10px rgba(22, 48, 36, 0.2)',
        'card':  '0 1px 3px rgba(13, 20, 16, 0.06), 0 4px 12px -2px rgba(13, 20, 16, 0.04)',
        'lift':  '0 8px 24px -8px rgba(22, 48, 36, 0.18)'
      },
      animation: {
        'typing': 'typing 1.4s ease-in-out infinite'
      },
      keyframes: {
        typing: { '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 }, '40%': { transform: 'scale(1)', opacity: 1 } }
      }
    }
  },
  plugins: []
};
