/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      // ==================
      // MEDLESS FARBEN
      // ==================
      colors: {
        // Primary Brand Colors
        'medless-primary': '#2FB585',           // Haupt-Grün
        'medless-primary-dark': '#1B9C6E',      // Dunkleres Grün (Hover)
        'medless-primary-light': '#36C48C',     // Helleres Grün
        
        // Backgrounds
        'medless-bg-ultra-light': '#FAFEFB',    // Ultra-helles Mint
        'medless-bg-light': '#F4FBF7',          // Helles Mint
        'medless-bg-card': '#E7F8EF',           // Card/Box-Hintergrund
        'medless-bg-card-hover': '#D4F1E3',     // Card Hover
        
        // Text Colors
        'medless-text-primary': '#1B2A36',      // Dunkelblau (Haupttext)
        'medless-text-secondary': '#5E6A71',    // Mittelgrau
        'medless-text-tertiary': '#94A3B8',     // Hellgrau
        
        // Borders & Dividers
        'medless-border-light': '#E9ECEF',      // Sehr heller Border
        'medless-border-primary': 'rgba(47, 181, 133, 0.2)',
        'medless-border-primary-hover': 'rgba(47, 181, 133, 0.3)',
      },
      
      // ==================
      // TYPOGRAFIE
      // ==================
      fontSize: {
        // Article Typography (Magazin)
        'article-hero': ['42px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '300' }],
        'article-subtitle': ['20px', { lineHeight: '1.5', fontWeight: '400' }],
        'article-body': ['18px', { lineHeight: '1.75', fontWeight: '400' }],
        'article-h2': ['32px', { lineHeight: '1.3', fontWeight: '500' }],
        'article-h3': ['24px', { lineHeight: '1.4', fontWeight: '500' }],
        
        // UI Typography (Homepage / App)
        'hero-title': ['42px', { lineHeight: '1.2', fontWeight: '300' }],
        'section-title': ['40px', { lineHeight: '1.2', fontWeight: '300' }],
        'card-title': ['21px', { lineHeight: '1.4', fontWeight: '500' }],
        'card-description': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        'meta-text': ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        'button-text': ['16px', { lineHeight: '1.5', fontWeight: '500' }],
      },
      
      // ==================
      // SPACING
      // ==================
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
        '34': '8.5rem',   // 136px
      },
      
      // ==================
      // BORDER-RADIUS
      // ==================
      borderRadius: {
        'medless-sm': '12px',
        'medless-md': '14px',
        'medless-lg': '16px',
        'medless-xl': '20px',
        'medless-button': '24px',
      },
      
      // ==================
      // BOX-SHADOWS
      // ==================
      boxShadow: {
        'medless-card': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medless-card-hover': '0 8px 20px rgba(47, 181, 133, 0.12)',
        'medless-button': '0 2px 8px rgba(47, 181, 133, 0.1)',
        'medless-button-hover': '0 4px 16px rgba(47, 181, 133, 0.25)',
        'medless-header': '0 1px 3px rgba(0, 0, 0, 0.03)',
      },
      
      // ==================
      // CONTAINER MAX-WIDTHS
      // ==================
      maxWidth: {
        'article': '800px',
        'container': '1200px',
      },
      
      // ==================
      // TRANSITIONS
      // ==================
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
