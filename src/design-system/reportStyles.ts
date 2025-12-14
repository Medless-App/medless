/**
 * REPORT STYLES UTILITY
 * Provides color mappings for PDF report templates
 * 
 * All colors sourced from design tokens (single source of truth)
 * NO hardcoded hex values allowed!
 */

import { designTokens } from './index';

export interface ReportStyles {
  // Brand Colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Text Colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  
  // Background Colors
  bgUltraLight: string;
  bgLight: string;
  bgCard: string;
  
  // Border Colors
  borderLight: string;
  borderPrimary: string;
  
  // Semantic Colors - Success
  successBg: string;
  successText: string;
  successBorder: string;
  
  // Semantic Colors - Warning
  warningBg: string;
  warningText: string;
  warningBorder: string;
  
  // Semantic Colors - Danger
  dangerBg: string;
  dangerText: string;
  dangerBorder: string;
  
  // Semantic Colors - Info
  infoBg: string;
  infoText: string;
  infoBorder: string;
  
  // Neutral Grays (Tables)
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
}

/**
 * Get all report styles mapped to design tokens
 * 
 * @returns ReportStyles object with all color mappings
 */
export function getReportStyles(): ReportStyles {
  const { colors } = designTokens;
  
  return {
    // Brand Colors
    primary: colors['medless-primary'],
    primaryDark: colors['medless-primary-dark'],
    primaryLight: colors['medless-primary-light'],
    
    // Text Colors
    textPrimary: colors['medless-text-primary'],
    textSecondary: colors['medless-text-secondary'],
    textTertiary: colors['medless-text-tertiary'],
    
    // Background Colors
    bgUltraLight: colors['medless-bg-ultra-light'],
    bgLight: colors['medless-bg-light'],
    bgCard: colors['medless-bg-card'],
    
    // Border Colors
    borderLight: colors['medless-border-light'],
    borderPrimary: colors['medless-border-primary'],
    
    // Semantic Colors - Success
    successBg: colors['medless-success-bg'],
    successText: colors['medless-success-text'],
    successBorder: colors['medless-success-border'],
    
    // Semantic Colors - Warning
    warningBg: colors['medless-warning-bg'],
    warningText: colors['medless-warning-text'],
    warningBorder: colors['medless-warning-border'],
    
    // Semantic Colors - Danger
    dangerBg: colors['medless-danger-bg'],
    dangerText: colors['medless-danger-text'],
    dangerBorder: colors['medless-danger-border'],
    
    // Semantic Colors - Info
    infoBg: colors['medless-info-bg'],
    infoText: colors['medless-info-text'],
    infoBorder: colors['medless-info-border'],
    
    // Neutral Grays (Tables)
    gray50: colors['medless-gray-50'],
    gray100: colors['medless-gray-100'],
    gray200: colors['medless-gray-200'],
    gray300: colors['medless-gray-300'],
    gray400: colors['medless-gray-400'],
    gray500: colors['medless-gray-500'],
    gray600: colors['medless-gray-600'],
    gray700: colors['medless-gray-700'],
    gray800: colors['medless-gray-800'],
    gray900: colors['medless-gray-900'],
  };
}

/**
 * Helper: Generate inline style string for color
 * 
 * @param property CSS property name (e.g., 'color', 'background')
 * @param value Color value from ReportStyles
 * @returns Inline style string
 * 
 * @example
 * styleColor('color', S.textPrimary) // "color: #1B2A36;"
 */
export function styleColor(property: string, value: string): string {
  return `${property}: ${value};`;
}

/**
 * Helper: Generate multiple inline styles
 * 
 * @param styles Object mapping CSS properties to values
 * @returns Inline style string
 * 
 * @example
 * styleMultiple({ color: S.textPrimary, background: S.bgLight })
 * // "color: #1B2A36; background: #F4FBF7;"
 */
export function styleMultiple(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([prop, value]) => `${prop}: ${value}`)
    .join('; ') + ';';
}
