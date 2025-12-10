# MEDLESS UNIFIED DESIGN SYSTEM

## 📐 TYPOGRAPHY SCALE

### Headlines
- **H1:** `text-4xl md:text-5xl` (36px → 48px) | `font-light` (300) | `text-slate-900` | `leading-tight`
- **H2:** `text-3xl md:text-4xl` (30px → 36px) | `font-light` (300) | `text-slate-900` | `leading-tight`
- **H3:** `text-xl md:text-2xl` (20px → 24px) | `font-normal` (400) | `text-slate-800` | `leading-snug`
- **H4:** `text-lg md:text-xl` (18px → 20px) | `font-medium` (500) | `text-slate-800` | `leading-snug`

### Body Text
- **Lead/Subtitle:** `text-lg` (18px) | `font-normal` (400) | `text-slate-600` | `leading-relaxed`
- **Body:** `text-base` (16px) | `font-normal` (400) | `text-slate-600` | `leading-relaxed`
- **Small:** `text-sm` (14px) | `font-normal` (400) | `text-slate-500` | `leading-relaxed`
- **Caption:** `text-xs` (12px) | `font-medium` (500) | `text-slate-400` | `uppercase tracking-wider`

## 🎨 COLOR PALETTE

### Text Colors
- **Primary Headlines:** `#0f172a` (slate-900)
- **Secondary Headlines:** `#1e293b` (slate-800)
- **Body Text:** `#475569` (slate-600)
- **Muted Text:** `#64748b` (slate-500)
- **Subtle Text:** `#94a3b8` (slate-400)

### Accent Colors
- **Primary Accent:** `#10b981` (Mint Green)
- **Primary Hover:** `#059669` (Darker Mint)

### ❌ NEVER USE
- `#0F5A46` (Dark Green - OLD, DEPRECATED)
- `font-weight: 700` or `800` (Too bold)
- `gray-*` classes (use `slate-*` instead)

## 📏 SPACING SCALE

### Section Padding
- **Hero Sections:** `py-24` (Desktop), `py-16` (Mobile)
- **Standard Sections:** `py-20` (Desktop), `py-12` (Mobile)
- **Compact Sections:** `py-12` (Desktop), `py-8` (Mobile)

### Grid Gaps
- **Large Grids:** `gap-12` (3rem)
- **Standard Grids:** `gap-8` (2rem)
- **Compact Grids:** `gap-6` (1.5rem)

### Element Spacing
- **Card Padding:** `p-8` (2rem)
- **Button Padding:** `px-6 py-3` (24px x 12px)

## 🔘 COMPONENTS

### Buttons
**Primary:**
```html
<button class="bg-[#10b981] text-white px-6 py-3 rounded-full text-base font-medium hover:bg-emerald-600 transition-colors duration-200">
```

**Secondary:**
```html
<button class="border border-slate-300 text-slate-700 px-6 py-3 rounded-full text-base font-medium hover:border-[#10b981] hover:text-[#10b981] transition-colors duration-200">
```

### Cards
```html
<div class="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm transition-transform hover:scale-105 hover:shadow-md">
```

## 📋 CONSISTENCY RULES

1. ✅ **ALWAYS** use `font-light` (300) for H1/H2
2. ✅ **ALWAYS** use `font-normal` (400) for H3/Body
3. ✅ **ALWAYS** use `slate-*` colors (NEVER `gray-*`)
4. ✅ **ALWAYS** use `#10b981` for accents (NEVER `#0F5A46`)
5. ❌ **NEVER** use `font-weight: 700` or `800`
6. ❌ **NEVER** use inline `style=""` (prefer Tailwind classes)
