/**
 * MEDLESS DESIGN SYSTEM
 * TypeScript-friendly export of design tokens
 * 
 * Usage:
 * import { designTokens } from './design-system';
 * const primary = designTokens.colors['medless-primary'];
 * 
 * NOTE: This is a pure TypeScript export that duplicates tokens.cjs values
 * to avoid runtime require() issues in Cloudflare Workers.
 * The tokens.cjs file is ONLY used by tailwind.config.js at build time.
 */

export interface DesignTokens {
  colors: Record<string, string>;
  fontSize: Record<string, [string, any]>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  boxShadow: Record<string, string>;
  maxWidth: Record<string, string>;
  transitionDuration: Record<string, string>;
  transitionTimingFunction: Record<string, string>;
}

// ==================
// COLORS
// ==================
const colors: Record<string, string> = {
  // Primary Brand Colors
  'medless-primary': '#2FB585',
  'medless-primary-dark': '#1B9C6E',
  'medless-primary-light': '#36C48C',
  
  // Backgrounds
  'medless-bg-ultra-light': '#FAFEFB',
  'medless-bg-light': '#F4FBF7',
  'medless-bg-card': '#E7F8EF',
  'medless-bg-card-hover': '#D4F1E3',
  
  // Text Colors
  'medless-text-primary': '#1B2A36',
  'medless-text-secondary': '#5E6A71',
  'medless-text-tertiary': '#94A3B8',
  
  // Borders & Dividers
  'medless-border-light': '#E9ECEF',
  'medless-border-primary': 'rgba(47, 181, 133, 0.2)',
  'medless-border-primary-hover': 'rgba(47, 181, 133, 0.3)',
  
  // Semantic Colors for Reports
  'medless-success-bg': '#D1FAE5',
  'medless-success-text': '#065F46',
  'medless-success-border': '#00C39A',
  
  'medless-warning-bg': '#FEF3C7',
  'medless-warning-text': '#92400E',
  'medless-warning-border': '#F59E0B',
  
  'medless-danger-bg': '#FEE2E2',
  'medless-danger-text': '#991B1B',
  'medless-danger-border': '#DC2626',
  
  'medless-info-bg': '#F0F9FF',
  'medless-info-text': '#1e40af',
  'medless-info-border': '#0284C7',
  
  // Neutral Grays (Report Tables)
  'medless-gray-50': '#f9fafb',
  'medless-gray-100': '#f3f4f6',
  'medless-gray-200': '#e5e7eb',
  'medless-gray-300': '#d1d5db',
  'medless-gray-400': '#9ca3af',
  'medless-gray-500': '#6b7280',
  'medless-gray-600': '#4b5563',
  'medless-gray-700': '#374151',
  'medless-gray-800': '#1f2937',
  'medless-gray-900': '#111827',
};

// ==================
// TYPOGRAPHY
// ==================
const fontSize: Record<string, [string, any]> = {
  'article-hero': ['42px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '300' }],
  'article-subtitle': ['20px', { lineHeight: '1.5', fontWeight: '400' }],
  'article-body': ['18px', { lineHeight: '1.75', fontWeight: '400' }],
  'article-h2': ['32px', { lineHeight: '1.3', fontWeight: '500' }],
  'article-h3': ['24px', { lineHeight: '1.4', fontWeight: '500' }],
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
const spacing: Record<string, string> = {
  '18': '4.5rem',
  '22': '5.5rem',
  '26': '6.5rem',
  '30': '7.5rem',
  '34': '8.5rem',
};

// ==================
// BORDER-RADIUS
// ==================
const borderRadius: Record<string, string> = {
  'medless-sm': '12px',
  'medless-md': '14px',
  'medless-lg': '16px',
  'medless-xl': '20px',
  'medless-button': '24px',
};

// ==================
// BOX-SHADOWS
// ==================
const boxShadow: Record<string, string> = {
  'medless-card': '0 2px 8px rgba(0, 0, 0, 0.04)',
  'medless-card-hover': '0 8px 20px rgba(47, 181, 133, 0.12)',
  'medless-button': '0 2px 8px rgba(47, 181, 133, 0.1)',
  'medless-button-hover': '0 4px 16px rgba(47, 181, 133, 0.25)',
  'medless-header': '0 1px 3px rgba(0, 0, 0, 0.03)',
};

// ==================
// CONTAINER MAX-WIDTHS
// ==================
const maxWidth: Record<string, string> = {
  'article': '800px',
  'container': '1200px',
};

// ==================
// TRANSITIONS
// ==================
const transitionDuration: Record<string, string> = {
  'medless': '250ms',
};

const transitionTimingFunction: Record<string, string> = {
  'medless': 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// ==================
// EXPORTS
// ==================
export const designTokens: DesignTokens = {
  colors,
  fontSize,
  spacing,
  borderRadius,
  boxShadow,
  maxWidth,
  transitionDuration,
  transitionTimingFunction,
};

// Export individual token categories for convenience
export { colors, fontSize, spacing, borderRadius, boxShadow };
