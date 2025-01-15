const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-space-grotesk)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-space-grotesk)', ...defaultTheme.fontFamily.mono],
      },
      animation: {
        'gradient-xy': 'gradient-xy 15s ease infinite',
      },
      colors: {
        'solana-purple': '#9945FF',
        'solana-green': '#14F195',
        'solana-blue': '#00C2FF',
        dark: {
          DEFAULT: '#121212',
          secondary: '#1e1e1e',
          surface: '#242424',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
  ],
}