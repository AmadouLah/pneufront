/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#00d9ff',
        'primary-content': '#000000',
        neutral: '#0a0a0a',
        'neutral-soft': '#1a1a1a',
        'base-100': '#000000',
        'base-content': '#ffffff',
      },
      boxShadow: {
        'pneu-card': '0 30px 60px rgba(0, 217, 255, 0.15)',
        overlay: '0 20px 40px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        pneumali: {
          "primary": "#00d9ff",        // Cyan
          "primary-content": "#000000",
          "secondary": "#1a1a1a",      // Dark gray
          "secondary-content": "#ffffff",
          "accent": "#00d9ff",         // Cyan
          "accent-content": "#000000",
          "neutral": "#0a0a0a",        // Almost black
          "neutral-content": "#ffffff",
          "base-100": "#000000",       // Black
          "base-200": "#0a0a0a",       // Very dark gray
          "base-300": "#1a1a1a",       // Dark gray
          "base-content": "#ffffff",
          "info": "#00d9ff",
          "info-content": "#000000",
          "success": "#00d9ff",
          "success-content": "#000000",
          "warning": "#fbbd23",
          "warning-content": "#000000",
          "error": "#f87272",
          "error-content": "#ffffff",
        },
      },
    ],
  },
};
