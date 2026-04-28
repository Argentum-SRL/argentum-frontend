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
      fontSize: {
        'hero': ['40px', { fontWeight: '700' }],
        'title': ['28px', { fontWeight: '700' }],
        'subtitle': ['20px', { fontWeight: '600' }],
        'ui': ['15px', { fontWeight: '500' }],
        'body': ['13px', { fontWeight: '400' }],
        'label': ['11px', { fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}