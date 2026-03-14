import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // YouTube Color Scheme
        youtube: {
          red: '#FF0000',
          'red-dark': '#CC0000',
          'red-light': '#FF3333',
          dark: '#0F0F0F',
          'dark-secondary': '#181818',
          'dark-tertiary': '#212121',
          gray: '#AAAAAA',
          'gray-light': '#F1F1F1',
          'gray-dark': '#717171',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
