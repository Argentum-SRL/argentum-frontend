/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'sans-serif'],
      },
      colors: {
        primary: 'var(--primary)',
        silver: 'var(--silver)',
        secondary: 'var(--secondary)',
        gold: 'var(--gold)',
        page: 'var(--page)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        text: 'var(--text)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
      fontSize: {
        'hero': ['40px', { fontWeight: '700' }],
        'title': ['28px', { fontWeight: '700' }],
        'subtitle': ['20px', { fontWeight: '600' }],
        'ui': ['15px', { fontWeight: '500' }],
        'body': ['13px', { fontWeight: '400' }],
        'label': ['11px', { fontWeight: '500' }],
        'xs':   ['12px', { lineHeight: '16px' }],
        'sm':   ['13px', { lineHeight: '20px' }],
        'base': ['15px', { lineHeight: '24px' }],
        'lg':   ['17px', { lineHeight: '28px' }],
        'xl':   ['20px', { lineHeight: '28px' }],
        '2xl':  ['24px', { lineHeight: '32px' }],
        '3xl':  ['30px', { lineHeight: '36px' }],
      },
    },
  },
  plugins: [],
}