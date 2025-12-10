# 🎨 MEDLESS Design System - Typography & Layout

## 📋 Übersicht

Dieses Dokument definiert die **einheitliche Typografie-Struktur** für alle Seiten der MEDLESS-Website.

---

## 🎯 Aktuelle Layout-Probleme

### ❌ **Inkonsistenzen gefunden:**

1. **Wizard-Steps (App):**
   - `<h3 class="text-2xl md:text-3xl font-light">` (48px Desktop, 30px Mobile)
   - Style: font-light (300)

2. **Magazin-Section:**
   - `<h1 style="font-weight: 800;">` (Inline CSS, sehr fett)
   - Article Cards: `<h3 style="font-weight: 700; color: #0F5A46;">` (sehr fett)

3. **Artikel-Seiten:**
   - `<h1 class="article-title">` (CSS definiert)
   - `<h2>` ohne Classes (CSS definiert: 2.25rem = 36px)
   - `<h3>` teilweise mit Inline-Styles

4. **Homepage:**
   - Hero: Inline-Styles gemischt mit Tailwind
   - Verschiedene Font-Weights durcheinander

---

## ✅ **NEUE Einheitliche Typografie-Standards**

### **Hierarchie & Font Sizes:**

| Level | Element | Size Desktop | Size Mobile | Font Weight | Usage |
|-------|---------|-------------|------------|-------------|-------|
| **H1** | Page Title | `3rem` (48px) | `2.25rem` (36px) | `300` (Light) | Hauptüberschrift jeder Seite |
| **H2** | Section Title | `2.25rem` (36px) | `1.875rem` (30px) | `300` (Light) | Große Abschnitts-Überschriften |
| **H3** | Subsection Title | `1.875rem` (30px) | `1.5rem` (24px) | `400` (Normal) | Unter-Abschnitte |
| **H4** | Card/Component Title | `1.25rem` (20px) | `1.125rem` (18px) | `500` (Medium) | Karten-Titel, kleine Überschriften |
| **Body Large** | Intro Text | `1.125rem` (18px) | `1rem` (16px) | `300` (Light) | Einleitungstexte, wichtige Absätze |
| **Body** | Normal Text | `1rem` (16px) | `0.9375rem` (15px) | `400` (Normal) | Standard Fließtext |
| **Body Small** | Helper Text | `0.875rem` (14px) | `0.8125rem` (13px) | `400` (Normal) | Labels, Hints, Footer |
| **Caption** | Meta Info | `0.75rem` (12px) | `0.6875rem` (11px) | `400` (Normal) | Timestamps, kleine Infos |

---

## 🎨 **Font Weights - Einheitliche Verwendung:**

```css
/* Font Weights */
--font-extralight: 200;  /* Nur für sehr große Headlines (Hero) */
--font-light: 300;       /* H1, H2, Intro-Texte */
--font-normal: 400;      /* Body Text, H3 */
--font-medium: 500;      /* H4, Buttons, Labels */
--font-semibold: 600;    /* Emphasis, Strong */
--font-bold: 700;        /* Akzente (sparsam nutzen) */
--font-extrabold: 800;   /* NICHT VERWENDEN (zu fett) */
```

---

## 📐 **Tailwind CSS Classes - Standardisiert:**

### **Headlines:**
```html
<!-- H1 - Page Title -->
<h1 class="text-3xl md:text-5xl font-light text-slate-900 mb-4">
  Hauptüberschrift
</h1>

<!-- H2 - Section Title -->
<h2 class="text-2xl md:text-4xl font-light text-slate-900 mb-3">
  Abschnitts-Überschrift
</h2>

<!-- H3 - Subsection Title -->
<h3 class="text-xl md:text-2xl font-normal text-slate-900 mb-2">
  Unter-Abschnitts-Überschrift
</h3>

<!-- H4 - Card/Component Title -->
<h4 class="text-lg md:text-xl font-medium text-slate-900 mb-2">
  Karten-Titel
</h4>
```

### **Body Text:**
```html
<!-- Body Large (Intro) -->
<p class="text-lg md:text-xl font-light text-slate-600 mb-4">
  Einleitungstext
</p>

<!-- Body Normal -->
<p class="text-base font-normal text-slate-700 mb-3">
  Standard Fließtext
</p>

<!-- Body Small -->
<p class="text-sm font-normal text-slate-500 mb-2">
  Helper Text, Labels
</p>

<!-- Caption -->
<p class="text-xs font-normal text-slate-400">
  Meta Info, Timestamps
</p>
```

---

## 🎨 **Farben - Text:**

```css
/* Text Colors */
--text-primary: #0F172A;    /* slate-900 - Headlines */
--text-secondary: #334155;  /* slate-700 - Body Text */
--text-muted: #64748B;      /* slate-500 - Helper Text */
--text-light: #94A3B8;      /* slate-400 - Captions */
--text-accent: #10b981;     /* emerald-500 - Mint Green (Akzente) */
--text-dark-green: #0F5A46; /* Dark Green (Aktuell in Magazin - ERSETZEN) */
```

**Neue Regel:**
- **Headlines:** `text-slate-900` (dunkelgrau, nicht schwarz)
- **Body Text:** `text-slate-700` (mittel-dunkelgrau)
- **Helper/Labels:** `text-slate-500` (hellgrau)
- **Meta/Captions:** `text-slate-400` (sehr hellgrau)
- **Akzente:** `text-[#10b981]` (Mint Green)

---

## 📝 **Spacing - Konsistente Abstände:**

```css
/* Margins Bottom (mb-X) */
--space-h1-bottom: mb-4;      /* 1rem = 16px */
--space-h2-bottom: mb-3;      /* 0.75rem = 12px */
--space-h3-bottom: mb-2;      /* 0.5rem = 8px */
--space-body-bottom: mb-3;    /* 0.75rem = 12px */
--space-section-bottom: mb-8; /* 2rem = 32px */
```

---

## 🔧 **Aktuelle Probleme & Fixes:**

### **Problem 1: Magazin Headlines zu fett**
```html
<!-- ❌ AKTUELL (zu fett) -->
<h1 style="font-weight: 800;">MEDLESS Magazin</h1>
<h3 style="font-weight: 700; color: #0F5A46;">Artikel-Titel</h3>

<!-- ✅ NEU (einheitlich) -->
<h1 class="text-3xl md:text-5xl font-light text-slate-900 mb-4">
  MEDLESS Magazin
</h1>
<h3 class="text-xl md:text-2xl font-normal text-slate-900 mb-2">
  Artikel-Titel
</h3>
```

### **Problem 2: Wizard Steps inkonsistent**
```html
<!-- ✅ AKTUELL (bereits gut) -->
<h3 class="text-2xl md:text-3xl font-light text-slate-900 mb-2">
  Schritt 1: Persönliche Angaben
</h3>
<p class="text-slate-500 font-light text-sm mb-6">
  Damit wir Sie persönlich ansprechen können.
</p>
```

### **Problem 3: Artikel-Seiten mit CSS-Overrides**
```html
<!-- ❌ AKTUELL (CSS definiert) -->
<h1 class="article-title">Artikel Headline</h1>
<h2>Section Headline</h2>

<!-- ✅ NEU (Tailwind Classes) -->
<h1 class="text-3xl md:text-5xl font-light text-slate-900 mb-4">
  Artikel Headline
</h1>
<h2 class="text-2xl md:text-4xl font-light text-slate-900 mb-3">
  Section Headline
</h2>
```

---

## 🎯 **Seiten-Mapping - Wo was verwendet wird:**

### **Homepage (`/`)**
- **Hero H1:** `text-3xl md:text-5xl font-extralight` (sehr groß, sehr leicht)
- **Section H2:** `text-2xl md:text-4xl font-light`
- **USP H3:** `text-xl md:text-2xl font-normal`

### **App Wizard (`/app`)**
- **Page H1:** `text-2xl md:text-3xl font-extralight` (Haupttitel oben)
- **Step H3:** `text-2xl md:text-3xl font-light` (Schritt-Überschriften)
- **Body Text:** `text-slate-500 font-light text-sm`

### **Magazin (`/magazin`)**
- **Page H1:** `text-3xl md:text-5xl font-light` (MEDLESS Magazin)
- **Card H3:** `text-xl md:text-2xl font-normal` (Artikel-Titel)
- **Body Text:** `text-base font-normal text-slate-700`

### **Artikel (`/artikel/*`)**
- **Article H1:** `text-3xl md:text-5xl font-light` (Artikel-Titel)
- **Section H2:** `text-2xl md:text-4xl font-light` (Abschnitte)
- **Subsection H3:** `text-xl md:text-2xl font-normal` (Unter-Abschnitte)
- **Body Text:** `text-base font-normal text-slate-700`

### **ECS-Seite (`/ecs`)**
- **Hero H1:** `text-3xl md:text-5xl font-extralight`
- **Section H2:** `text-2xl md:text-4xl font-light`
- **Body Text:** `text-lg md:text-xl font-light text-slate-600`

### **Über Uns (`/ueber-uns`)**
- **Page H1:** `text-3xl md:text-5xl font-light`
- **Section H2:** `text-2xl md:text-4xl font-light`

---

## 🚀 **Migration Plan - Was muss geändert werden:**

### **Phase 1: CSS Cleanup (Priority HIGH)**
1. ✅ Entfernen: `h1, h2, h3 { font-weight: 300; }` (globale CSS-Rules)
2. ✅ Entfernen: `.article-title` Custom Class
3. ✅ Standardisieren: Alle `<h1>` auf Tailwind umstellen

### **Phase 2: Magazin Section (Priority HIGH)**
1. ⚠️ `<h1>` Magazin-Titel: `font-weight: 800` → `font-light` (300)
2. ⚠️ `<h3>` Article Cards: `font-weight: 700` → `font-normal` (400)
3. ⚠️ `color: #0F5A46` → `text-slate-900` (einheitliche Farbe)

### **Phase 3: Artikel-Seiten (Priority MEDIUM)**
1. ⚠️ `<h1 class="article-title">` → Tailwind Classes
2. ⚠️ `<h2>` ohne Classes → Tailwind Classes
3. ⚠️ Inline-Styles in `<h3>` entfernen

### **Phase 4: Weitere Seiten (Priority LOW)**
1. ✅ Homepage Hero überprüfen
2. ✅ Über Uns überprüfen
3. ✅ Footer überprüfen

---

## 📊 **Aktuelle Inkonsistenzen - Übersicht:**

| Seite | Element | Aktuell | Soll | Status |
|-------|---------|---------|------|--------|
| **Magazin** | H1 Titel | `font-weight: 800` | `font-light` (300) | ⚠️ FIX NEEDED |
| **Magazin** | H3 Cards | `font-weight: 700` | `font-normal` (400) | ⚠️ FIX NEEDED |
| **Magazin** | H3 Color | `#0F5A46` | `text-slate-900` | ⚠️ FIX NEEDED |
| **Artikel** | H1 | `class="article-title"` | Tailwind | ⚠️ FIX NEEDED |
| **Artikel** | H2 | CSS-defined | Tailwind | ⚠️ FIX NEEDED |
| **Artikel** | H3 | Inline Styles | Tailwind | ⚠️ FIX NEEDED |
| **App** | H3 Steps | `font-light` | ✅ CORRECT | ✅ OK |
| **App** | Body Text | `font-light` | ✅ CORRECT | ✅ OK |

---

## 🎨 **Design Tokens - Für Entwickler:**

```javascript
// typography.config.js
export const typography = {
  fontFamily: {
    primary: "'Inter', sans-serif",
  },
  
  fontSize: {
    h1: {
      mobile: '2.25rem',   // 36px
      desktop: '3rem',     // 48px
    },
    h2: {
      mobile: '1.875rem',  // 30px
      desktop: '2.25rem',  // 36px
    },
    h3: {
      mobile: '1.5rem',    // 24px
      desktop: '1.875rem', // 30px
    },
    h4: {
      mobile: '1.125rem',  // 18px
      desktop: '1.25rem',  // 20px
    },
    body: {
      large: '1.125rem',   // 18px
      normal: '1rem',      // 16px
      small: '0.875rem',   // 14px
      caption: '0.75rem',  // 12px
    },
  },
  
  fontWeight: {
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,  // Sparsam nutzen
  },
  
  colors: {
    text: {
      primary: '#0F172A',   // slate-900
      secondary: '#334155', // slate-700
      muted: '#64748B',     // slate-500
      light: '#94A3B8',     // slate-400
      accent: '#10b981',    // emerald-500
    },
  },
};
```

---

## 📝 **Best Practices:**

### **DO ✅:**
- Verwende Tailwind CSS Classes statt Inline-Styles
- Nutze `font-light` (300) für H1 & H2
- Nutze `font-normal` (400) für H3 & Body
- Halte Farben einheitlich (`text-slate-900` für Headlines)
- Verwende responsive Breakpoints (`md:`, `lg:`)

### **DON'T ❌:**
- Keine Inline-Styles (`style="font-weight: 800;"`)
- Kein `font-bold` (700) oder `font-extrabold` (800) für Headlines
- Keine Custom CSS Classes für Typography (außer notwendig)
- Keine gemischten Farben (`#0F5A46` vs `text-slate-900`)
- Keine festen Pixel-Werte ohne Responsive-Varianten

---

## 🔄 **Nächste Schritte:**

1. **Claude:** Magazin Section überarbeiten (H1, H3, Colors)
2. **Claude:** Artikel-Seiten standardisieren (H1, H2, H3)
3. **Claude:** CSS Cleanup (globale Rules entfernen)
4. **User:** Design Review & Freigabe
5. **Claude:** Final Deployment

---

*Dokumentiert am: 2025-12-10*  
*Version: 1.0*  
*Status: In Arbeit 🔄*
