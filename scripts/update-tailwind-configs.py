#!/usr/bin/env python3
"""
Update all inline tailwind.config blocks in src/index.tsx to match canonical config
"""

CANONICAL_CONFIG = """    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'medless': {
              primary: '#2FB585',
              'primary-hover': '#1B9C6E',
              'primary-light': '#36C48C',
              'bg-ultra-light': '#FAFEFB',
              'bg-light': '#F4FBF7',
              'bg-card': '#E7F8EF',
              'text-primary': '#1B2A36',
              'text-secondary': '#5E6A71',
              'text-tertiary': '#94A3B8',
              'border-primary': 'rgba(47, 181, 133, 0.2)',
              'border-light': '#E9ECEF'
            }
          },
          fontSize: {
            'article-hero': ['2.625rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '300' }],
            'article-subtitle': ['1.25rem', { lineHeight: '1.5', fontWeight: '400' }],
            'article-body': ['1.125rem', { lineHeight: '1.75', fontWeight: '400' }],
            'article-h2': ['2rem', { lineHeight: '1.3', fontWeight: '500' }],
            'article-h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }],
            'section-title': ['2.5rem', { lineHeight: '1.2', fontWeight: '300' }],
            'card-title': ['1.3125rem', { lineHeight: '1.4', fontWeight: '500' }],
            'card-description': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }]
          },
          borderRadius: {
            'medless-lg': '16px',
            'medless-md': '12px',
            'medless-button': '24px'
          },
          boxShadow: {
            'medless-card': '0 2px 8px rgba(0, 0, 0, 0.04)',
            'medless-card-hover': '0 8px 20px rgba(47, 181, 133, 0.12)'
          },
          maxWidth: {
            'article': '800px',
            'container': '1200px'
          },
          transitionDuration: {
            'medless': '250ms'
          }
        }
      }
    }"""

print("Canonical config prepared for magazin/article routes")
print(CANONICAL_CONFIG[:200] + "...")
