/**
 * MEDLESS DESIGN TOKENS
 * Single Source of Truth for all design decisions
 * 
 * Used by:
 * - tailwind.config.js (via require)
 * - Report Templates (via TypeScript import)
 * - Future: CSS Variables generation
 */

// ==================
// COLORS
// ==================
const colors = {
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
  
  // ===== NEW: Report-Specific Colors =====
  // (Extracted from hardcoded hex values in report templates)
  
  // Semantic Colors for Reports
  'medless-success-bg': '#D1FAE5',        // Success background (green tint)
  'medless-success-text': '#065F46',      // Success text (dark green)
  'medless-success-border': '#00C39A',    // Success border (bright green)
  
  'medless-warning-bg': '#FEF3C7',        // Warning background (yellow tint)
  'medless-warning-text': '#92400E',      // Warning text (dark brown)
  'medless-warning-border': '#F59E0B',    // Warning border (orange)
  
  'medless-danger-bg': '#FEE2E2',         // Danger background (red tint)
  'medless-danger-text': '#991B1B',       // Danger text (dark red)
  'medless-danger-border': '#DC2626',     // Danger border (red)
  
  'medless-info-bg': '#F0F9FF',           // Info background (blue tint)
  'medless-info-text': '#1e40af',         // Info text (dark blue)
  'medless-info-border': '#0284C7',       // Info border (blue)
  
  // Neutral Grays (Report Tables)
  'medless-gray-50': '#f9fafb',           // Ultra light gray (table bg)
  'medless-gray-100': '#f3f4f6',          // Very light gray (alternate row)
  'medless-gray-200': '#e5e7eb',          // Light gray (table border)
  'medless-gray-300': '#d1d5db',          // Medium gray (strong border)
  'medless-gray-400': '#9ca3af',          // Gray (muted text)
  'medless-gray-500': '#6b7280',          // Medium dark gray (secondary text)
  'medless-gray-600': '#4b5563',          // Dark gray (body text)
  'medless-gray-700': '#374151',          // Very dark gray (headings)
  'medless-gray-800': '#1f2937',          // Almost black (strong headings)
  'medless-gray-900': '#111827',          // Pure black (main headings)
};

// ==================
// TYPOGRAPHY
// ==================
const fontSize = {
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
};

// ==================
// SPACING
// ==================
const spacing = {
  '18': '4.5rem',   // 72px
  '22': '5.5rem',   // 88px
  '26': '6.5rem',   // 104px
  '30': '7.5rem',   // 120px
  '34': '8.5rem',   // 136px
};

// ==================
// BORDER-RADIUS
// ==================
const borderRadius = {
  'medless-sm': '12px',
  'medless-md': '14px',
  'medless-lg': '16px',
  'medless-xl': '20px',
  'medless-button': '24px',
};

// ==================
// BOX-SHADOWS
// ==================
const boxShadow = {
  'medless-card': '0 2px 8px rgba(0, 0, 0, 0.04)',
  'medless-card-hover': '0 8px 20px rgba(47, 181, 133, 0.12)',
  'medless-button': '0 2px 8px rgba(47, 181, 133, 0.1)',
  'medless-button-hover': '0 4px 16px rgba(47, 181, 133, 0.25)',
  'medless-header': '0 1px 3px rgba(0, 0, 0, 0.03)',
};

// ==================
// CONTAINER MAX-WIDTHS
// ==================
const maxWidth = {
  'article': '800px',
  'container': '1200px',
};

// ==================
// TRANSITIONS
// ==================
const transitionDuration = {
  'medless': '250ms',
};

const transitionTimingFunction = {
  'medless': 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// ==================
// EXPORTS
// ==================
module.exports = {
  colors,
  fontSize,
  spacing,
  borderRadius,
  boxShadow,
  maxWidth,
  transitionDuration,
  transitionTimingFunction,
};
