/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0A0F1E', 800: '#0D1526', 700: '#111B33', 600: '#162040' },
        accent: { DEFAULT: '#6366F1', light: '#818CF8' }
      },
      backdropBlur: { xs: '2px' }
    }
  },
  plugins: []
}
