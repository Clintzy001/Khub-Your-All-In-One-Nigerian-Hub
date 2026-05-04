/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // This defines the 'primary' color your index.css uses
        primary: {
          DEFAULT: '#5B2EFF', // This maps to bg-primary
          50: '#efe5ff',
          100: '#dfccff',
          200: '#bf99ff',
          300: '#9f66ff',
          400: '#7f33ff',
          500: '#5B2EFF',
          600: '#4925cc',
          700: '#371c99',
          800: '#241266',
          900: '#120933',
        },
        // Fix for the 'bg-surface' error in your index.css
        surface: '#F8FAFC', 
        // Fix for the 'text-dark' error in your index.css
        dark: '#0F172A',
        
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  // Fixed: Changed require() to the imported variable
  plugins: [tailwindcssAnimate],
}
