# 🎨 MEDLESS "FRESH & FINE" LAYOUT - CSS SETUP

## ⚠️ KRITISCHE REGELN
- **NO TOUCH LOGIC**: Keine `<script>` Tags ändern
- **NO TOUCH IDS**: Input-IDs, Names, Form-Tags bleiben unverändert
- **H1-H4 STRIKT**: Exakte Typografie-Hierarchie einhalten

---

## 📊 NEUE CSS-VARIABLEN (Fresh & Fine Style)

Ersetze die `getSharedStyles()` Funktion in `/home/user/webapp/src/index.tsx` (Zeile 7479) mit:

```typescript
function getSharedStyles() {
  return `
    :root {
      /* ===== SPACING SYSTEM ===== */
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 20px;
      --space-6: 24px;
      --space-7: 32px;
      --space-8: 48px;
      --space-9: 64px;
      --space-10: 80px;
      
      /* ===== COLORS: Fresh Mint & Clinical White ===== */
      /* Primary Mint Green (Main Brand Color) */
      --primary-mint: #10b981;           /* Emerald 500 */
      --primary-mint-hover: #059669;     /* Emerald 600 */
      --primary-mint-light: #d1fae5;     /* Emerald 100 */
      --primary-mint-ultra-light: #ecfdf5; /* Emerald 50 */
      
      /* Dark Green (Text & Headers) */
      --primary-dark-green: #064e3b;     /* Emerald 900 */
      --primary-dark-green-hover: #065f46; /* Emerald 800 */
      
      /* Accent Teal (für Highlights) */
      --accent-teal: #14b8a6;            /* Teal 500 */
      --accent-teal-light: #5eead4;      /* Teal 300 */
      
      /* Gray Scale (Cleaner, Lighter) */
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-400: #9ca3af;
      --gray-500: #6b7280;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
      --gray-900: #111827;
      
      /* Backgrounds */
      --background-white: #ffffff;
      --background-ultra-light: #f9fafb;
      --background-mint-subtle: #f0fdf4; /* Green 50 */
      
      /* Text Colors */
      --text-primary: #111827;           /* Gray 900 - Headers */
      --text-body: #374151;              /* Gray 700 - Body */
      --text-muted: #6b7280;             /* Gray 500 - Muted */
      --text-light: #9ca3af;             /* Gray 400 - Very Muted */
      
      /* Borders */
      --border-light: #e5e7eb;           /* Gray 200 */
      --border-medium: #d1d5db;          /* Gray 300 */
      --border-dark: #9ca3af;            /* Gray 400 */
      
      /* Shadows (Softer, Clinical) */
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      
      /* Border Radius */
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --radius-xl: 16px;
      --radius-full: 9999px;
      
      /* Typography */
      --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    
    /* ===== GLOBAL RESETS ===== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html {
      scroll-behavior: smooth;
    }
    
    body {
      font-family: var(--font-family);
      font-size: 16px;
      line-height: 1.6;
      color: var(--text-body);
      background: var(--background-white);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* ===== TYPOGRAPHY HIERARCHY (H1-H4 STRIKT) ===== */
    h1 {
      font-size: 2.5rem;           /* 40px */
      font-weight: 300;            /* Light */
      line-height: 1.2;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: var(--space-6);
    }
    
    h2 {
      font-size: 2rem;             /* 32px */
      font-weight: 300;            /* Light */
      line-height: 1.3;
      color: var(--text-primary);
      letter-spacing: -0.015em;
      margin-bottom: var(--space-5);
    }
    
    h3 {
      font-size: 1.5rem;           /* 24px */
      font-weight: 500;            /* Medium */
      line-height: 1.4;
      color: var(--text-primary);
      margin-bottom: var(--space-4);
    }
    
    h4 {
      font-size: 1.25rem;          /* 20px */
      font-weight: 500;            /* Medium */
      line-height: 1.4;
      color: var(--text-body);
      margin-bottom: var(--space-3);
    }
    
    p {
      font-size: 1rem;             /* 16px */
      line-height: 1.6;
      color: var(--text-body);
      margin-bottom: var(--space-4);
    }
    
    .lead {
      font-size: 1.125rem;         /* 18px */
      line-height: 1.7;
      color: var(--text-muted);
    }
    
    .caption {
      font-size: 0.875rem;         /* 14px */
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-light);
    }
    
    /* ===== LINKS ===== */
    a {
      color: var(--primary-mint);
      text-decoration: none;
      transition: color 0.2s ease;
    }
    
    a:hover {
      color: var(--primary-mint-hover);
      text-decoration: underline;
    }
    
    /* ===== BUTTONS (Fresh & Fine Style) ===== */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 24px;
      font-family: var(--font-family);
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.5;
      text-decoration: none;
      border-radius: var(--radius-md);
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
      white-space: nowrap;
    }
    
    .btn-primary {
      background: var(--primary-mint);
      color: white;
    }
    
    .btn-primary:hover {
      background: var(--primary-mint-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
      text-decoration: none;
    }
    
    .btn-secondary {
      background: white;
      color: var(--primary-mint);
      border: 1.5px solid var(--primary-mint);
    }
    
    .btn-secondary:hover {
      background: var(--primary-mint-ultra-light);
      text-decoration: none;
    }
    
    .btn-ghost {
      background: transparent;
      color: var(--primary-mint);
    }
    
    .btn-ghost:hover {
      background: var(--primary-mint-ultra-light);
      text-decoration: none;
    }
    
    /* ===== PROGRESS STEPPER (wie auf Screenshots) ===== */
    .stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin: var(--space-8) 0;
      padding: 0 var(--space-6);
    }
    
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex: 1;
      max-width: 120px;
      text-align: center;
    }
    
    .step-circle {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      background: var(--gray-100);
      color: var(--gray-400);
      border: 2px solid var(--border-light);
      transition: all 0.3s ease;
    }
    
    .step.active .step-circle {
      background: var(--primary-mint);
      color: white;
      border-color: var(--primary-mint);
      box-shadow: 0 0 0 4px var(--primary-mint-light);
    }
    
    .step.completed .step-circle {
      background: var(--primary-mint);
      color: white;
      border-color: var(--primary-mint);
    }
    
    .step-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .step.active .step-label {
      color: var(--primary-mint);
      font-weight: 600;
    }
    
    /* ===== FORM INPUTS (Fresh & Fine Style) ===== */
    input[type="text"],
    input[type="email"],
    input[type="number"],
    textarea,
    select {
      width: 100%;
      padding: 12px 16px;
      font-family: var(--font-family);
      font-size: 1rem;
      line-height: 1.5;
      color: var(--text-primary);
      background: var(--background-white);
      border: 1.5px solid var(--border-light);
      border-radius: var(--radius-md);
      outline: none;
      transition: all 0.2s ease;
    }
    
    input:focus,
    textarea:focus,
    select:focus {
      border-color: var(--primary-mint);
      box-shadow: 0 0 0 3px var(--primary-mint-light);
    }
    
    input::placeholder,
    textarea::placeholder {
      color: var(--text-light);
    }
    
    /* ===== CARDS (Fresh & Fine Style) ===== */
    .card {
      background: var(--background-white);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: var(--space-7);
      box-shadow: var(--shadow-sm);
      transition: all 0.3s ease;
    }
    
    .card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    
    /* ===== CONTAINER & LAYOUT ===== */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-6);
    }
    
    .section {
      padding: var(--space-9) 0;
    }
    
    /* ===== UTILITY CLASSES ===== */
    .text-center {
      text-align: center;
    }
    
    .text-muted {
      color: var(--text-muted);
    }
    
    .mb-0 { margin-bottom: 0; }
    .mb-1 { margin-bottom: var(--space-1); }
    .mb-2 { margin-bottom: var(--space-2); }
    .mb-3 { margin-bottom: var(--space-3); }
    .mb-4 { margin-bottom: var(--space-4); }
    .mb-5 { margin-bottom: var(--space-5); }
    .mb-6 { margin-bottom: var(--space-6); }
    .mb-7 { margin-bottom: var(--space-7); }
    .mb-8 { margin-bottom: var(--space-8); }
    
    .mt-0 { margin-top: 0; }
    .mt-1 { margin-top: var(--space-1); }
    .mt-2 { margin-top: var(--space-2); }
    .mt-3 { margin-top: var(--space-3); }
    .mt-4 { margin-top: var(--space-4); }
    .mt-5 { margin-top: var(--space-5); }
    .mt-6 { margin-top: var(--space-6); }
    .mt-7 { margin-top: var(--space-7); }
    .mt-8 { margin-top: var(--space-8); }
  `;
}
```

---

## 📝 IMPLEMENTIERUNGS-HINWEISE

### 1. **Schriftart Inter**
Bereits vorhanden in allen Seiten via:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 2. **Hauptfarbe #10b981 (Mint Green)**
- Buttons: `var(--primary-mint)`
- Hover States: `var(--primary-mint-hover)`
- Light Backgrounds: `var(--primary-mint-light)`
- Ultra-Light: `var(--primary-mint-ultra-light)`

### 3. **Typografie-Hierarchie (STRIKT)**
- **H1**: 40px, Light (300), für Haupt-Headlines
- **H2**: 32px, Light (300), für Sektions-Überschriften
- **H3**: 24px, Medium (500), für Card-Titel
- **H4**: 20px, Medium (500), für Unter-Überschriften

### 4. **Progress Stepper**
Bereits vordefiniert in `.stepper`, `.step`, `.step-circle`, `.step-label`
- Aktiver Step: Grüner Kreis mit Shadow
- Completed: Grüner Kreis mit Checkmark
- Inactive: Grauer Kreis

### 5. **Form Inputs**
- Border: 1.5px solid (statt 1px für mehr Klarheit)
- Focus: Mint green border + light shadow
- Padding: 12px 16px (statt 10px 14px)

---

## ✅ NÄCHSTER SCHRITT

**Jetzt kannst du mir sagen, welche spezifische Seite du anpassen möchtest:**
- Landing Page (`/app` Route)
- Körperdaten-Seite (Step 2)
- Medikation-Seite (Step 3)
- Einstellung-Seite (Step 4)
- Abschluss-Seite (Step 5)

Ich werde dann **NUR das HTML** dieser Seite anpassen (keine Logic/IDs ändern).
