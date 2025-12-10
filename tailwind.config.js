/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      // MEDLESS Color Palette
      colors: {
        // Primary Brand Colors
        'medless-primary': '#2FB585',      // Main MEDLESS green
        'medless-primary-dark': '#1B9C6E', // Darker green for hover
        'medless-primary-light': '#36C48C', // Lighter green
        
        // Backgrounds
        'medless-bg-ultra-light': '#FAFEFB',  // Ultra light mint
        'medless-bg-light': '#F4FBF7',        // Light mint
        'medless-bg-card': '#E7F8EF',         // Card/box background
        'medless-bg-card-hover': '#D4F1E3',   // Card hover
        
        // Text Colors
        'medless-text-primary': '#1B2A36',    // Dark blue (main text)
        'medless-text-secondary': '#5E6A71',  // Medium gray
        'medless-text-tertiary': '#94A3B8',   // Light gray
        
        // Borders & Dividers
        'medless-border-light': '#E9ECEF',    // Very light border
        'medless-border-primary': 'rgba(47, 181, 133, 0.2)', // Primary with opacity
        'medless-border-primary-hover': 'rgba(47, 181, 133, 0.3)',
        
        // Shadows (used in boxShadow)
        'medless-shadow-sm': 'rgba(0, 0, 0, 0.04)',
        'medless-shadow-md': 'rgba(47, 181, 133, 0.12)',
        'medless-shadow-lg': 'rgba(47, 181, 133, 0.25)',
      },
      
      // Typography Scale
      fontSize: {
        // Article Typography
        'article-hero': ['42px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '300' }],
        'article-subtitle': ['20px', { lineHeight: '1.5', fontWeight: '400' }],
        'article-body': ['18px', { lineHeight: '1.75', fontWeight: '400' }],
        'article-h2': ['32px', { lineHeight: '1.3', fontWeight: '500' }],
        'article-h3': ['24px', { lineHeight: '1.4', fontWeight: '500' }],
        
        // UI Typography
        'display-xl': ['56px', { lineHeight: '1.1', fontWeight: '300' }],
        'display-lg': ['48px', { lineHeight: '1.15', fontWeight: '300' }],
        'hero-title': ['42px', { lineHeight: '1.2', fontWeight: '300' }],
        'section-title': ['40px', { lineHeight: '1.2', fontWeight: '300' }],
        'card-title': ['21px', { lineHeight: '1.4', fontWeight: '500' }],
        'card-description': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        'meta-text': ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        'button-text': ['16px', { lineHeight: '1.5', fontWeight: '500' }],
      },
      
      // Spacing Scale (consistent with design)
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
        '34': '8.5rem',   // 136px
      },
      
      // Border Radius
      borderRadius: {
        'medless-sm': '12px',
        'medless-md': '14px',
        'medless-lg': '16px',
        'medless-xl': '20px',
        'medless-button': '24px',
      },
      
      // Box Shadows
      boxShadow: {
        'medless-card': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medless-card-hover': '0 8px 20px rgba(47, 181, 133, 0.12)',
        'medless-button': '0 2px 8px rgba(47, 181, 133, 0.1)',
        'medless-button-hover': '0 4px 16px rgba(47, 181, 133, 0.25)',
        'medless-header': '0 1px 3px rgba(0, 0, 0, 0.03)',
      },
      
      // Container Max Widths
      maxWidth: {
        'article': '800px',
        'container': '1200px',
      },
      
      // Animation & Transitions
      transitionDuration: {
        'medless': '250ms',
      },
      
      transitionTimingFunction: {
        'medless': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
