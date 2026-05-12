/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFBF00',
        secondary: '#F2CF7E',
        accent: '#FFE642',
        dark: '#FF7900',
        text: '#2c2c2a',
        light: '#f9f9f9',
      },
      fontFamily: {
        serif: ['Georgia', 'Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}
