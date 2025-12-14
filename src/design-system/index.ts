/**
 * MEDLESS DESIGN SYSTEM
 * TypeScript-friendly export of design tokens
 * 
 * Usage:
 * import { designTokens } from './design-system';
 * const primary = designTokens.colors['medless-primary'];
 */

// Import CommonJS tokens (for Tailwind compatibility)
const tokensModule = require('./tokens.cjs');

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

export const designTokens: DesignTokens = {
  colors: tokensModule.colors,
  fontSize: tokensModule.fontSize,
  spacing: tokensModule.spacing,
  borderRadius: tokensModule.borderRadius,
  boxShadow: tokensModule.boxShadow,
  maxWidth: tokensModule.maxWidth,
  transitionDuration: tokensModule.transitionDuration,
  transitionTimingFunction: tokensModule.transitionTimingFunction,
};

// Export individual token categories for convenience
export const { colors, fontSize, spacing, borderRadius, boxShadow } = designTokens;
