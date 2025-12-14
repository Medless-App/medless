/**
 * MEDLESS TAILWIND CONFIGURATION
 * Imports design tokens from central source
 */

const tokens = require('./src/design-system/tokens.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      // All design tokens imported from central source
      colors: tokens.colors,
      fontSize: tokens.fontSize,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.boxShadow,
      maxWidth: tokens.maxWidth,
      transitionDuration: tokens.transitionDuration,
      transitionTimingFunction: tokens.transitionTimingFunction,
    },
  },
  plugins: [],
}
