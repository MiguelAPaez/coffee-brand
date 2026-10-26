import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2A1B12',
        cream: '#F4EDE4',
        cherry: '#B3262E',
        mist: 'rgb(244 237 228 / 0.6)',
        scene: '#1A110C',
      },
      fontFamily: {
        display: ['Fraunces', '"Fraunces Fallback"', 'Georgia', 'serif'],
        sans: ['Inter', '"Inter Fallback"', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
} satisfies Config
