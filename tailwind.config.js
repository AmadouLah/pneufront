/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        pneumali: {
          "primary": "#10b981", // green-500
          "primary-content": "#ffffff",
          "secondary": "#059669", // green-600
          "secondary-content": "#ffffff",
          "accent": "#34d399", // green-400
          "accent-content": "#000000",
          "neutral": "#374151", // gray-700
          "neutral-content": "#ffffff",
          "base-100": "#1f2937", // gray-800
          "base-200": "#111827", // gray-900
          "base-300": "#000000", // black
          "base-content": "#ffffff",
          "info": "#3b82f6",
          "info-content": "#ffffff",
          "success": "#10b981",
          "success-content": "#ffffff",
          "warning": "#f59e0b",
          "warning-content": "#000000",
          "error": "#ef4444",
          "error-content": "#ffffff",
        },
      },
    ],
  },
};
