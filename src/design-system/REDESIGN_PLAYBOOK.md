# REDESIGN PLAYBOOK

## Konkrete Token-Änderungen bei neuem Design

### 🎯 TOKENS DIE ZUERST GEÄNDERT WERDEN (Priorität 1-3)

#### **PRIORITÄT 1: Brand Identity (3 Tokens)**

Diese Tokens definieren die visuelle Markenidentität. Änderung hat größte visuelle Wirkung.

```typescript
// tokens.cjs - BEFORE
'medless-primary': '#2FB585',           // Aktuelles Türkis-Grün
'medless-primary-dark': '#1B9C6E',      // Dunklere Variante
'medless-primary-light': '#36C48C',     // Hellere Variante

// tokens.cjs - AFTER (Beispiel: Blau-Ton)
'medless-primary': '#0066CC',           // Neues Corporate Blau
'medless-primary-dark': '#004C99',      // Dunklere Variante
'medless-primary-light': '#3385D6',     // Hellere Variante
```

**Betroffene UI-Elemente:**
- Alle Buttons (CTAs)
- Links und Hover-States
- Progress-Indikatoren
- Brand-Highlights

**Risiko:** 🟢 NIEDRIG - Klare Semantik, überall konsistent verwendet

---

#### **PRIORITÄT 2: Backgrounds (4 Tokens)**

Hintergrundfarben definieren die Tonalität der Oberfläche.

```typescript
// tokens.cjs - BEFORE
'medless-bg-ultra-light': '#FAFEFB',    // Ultra-helles Mint
'medless-bg-light': '#F4FBF7',          // Helles Mint
'medless-bg-card': '#E7F8EF',           // Card-Hintergrund (Mint-Tint)
'medless-bg-card-hover': '#D4F1E3',     // Card Hover (stärkerer Mint)

// tokens.cjs - AFTER (Beispiel: Warme Neutrals)
'medless-bg-ultra-light': '#FAFAF9',    // Warmes Off-White
'medless-bg-light': '#F5F5F4',          // Helles Warm-Gray
'medless-bg-card': '#FAFAFA',           // Neutral Card-BG
'medless-bg-card-hover': '#F0F0F0',     // Card Hover (Gray-Tint)
```

**Betroffene UI-Elemente:**
- Page Background
- Card/Box Backgrounds
- Hover-States
- Section-Dividers

**Risiko:** 🟡 MITTEL - Tonalität ändert sich drastisch, muss mit Text-Farben harmonieren

---

#### **PRIORITÄT 3: Text Colors (3 Tokens)**

Textfarben müssen WCAG-Kontrast zu allen Backgrounds erfüllen.

```typescript
// tokens.cjs - BEFORE
'medless-text-primary': '#1B2A36',      // Dunkelblau
'medless-text-secondary': '#5E6A71',    // Mittelgrau
'medless-text-tertiary': '#94A3B8',     // Hellgrau

// tokens.cjs - AFTER (Beispiel: Wärmere Töne)
'medless-text-primary': '#1A1A1A',      // Fast-Schwarz
'medless-text-secondary': '#525252',    // Warm-Gray
'medless-text-tertiary': '#A3A3A3',     // Hellgrau
```

**Betroffene UI-Elemente:**
- Alle Texte (Headings, Body, Labels)
- Icons (nutzen meist text colors)
- Placeholder-Texte

**Risiko:** 🔴 HOCH - Kontrast-Ratios müssen geprüft werden (WCAG AA: 4.5:1)

---

### 🎨 TOKENS DIE WAHRSCHEINLICH GEÄNDERT WERDEN (Priorität 4-5)

#### **PRIORITÄT 4: Neutral Grays (10 Tokens)**

Gray-Scale für Borders, Dividers, Tables, Muted Elements.

```typescript
// tokens.cjs - BEFORE (Kühlere Grays)
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

// tokens.cjs - AFTER (Wärmere Grays)
'medless-gray-50': '#fafaf9',
'medless-gray-100': '#f5f5f4',
'medless-gray-200': '#e7e5e4',
'medless-gray-300': '#d6d3d1',
'medless-gray-400': '#a8a29e',
'medless-gray-500': '#78716c',
'medless-gray-600': '#57534e',
'medless-gray-700': '#44403c',
'medless-gray-800': '#292524',
'medless-gray-900': '#1c1917',
```

**Betroffene UI-Elemente:**
- Table Borders & Rows
- Form Input Borders
- Divider Lines
- Disabled States
- Muted Text

**Risiko:** 🔴 HOCH - Gray-Scale komplett neu → Visuelle Konsistenz schwer zu bewahren

**⚠️ EMPFEHLUNG:** Gray-Scale nur ändern wenn absolut nötig. Besser: Nur 2-3 Shades anpassen.

---

#### **PRIORITÄT 5: Semantic Colors (12 Tokens)**

Funktionale Farben für Success/Warning/Danger/Info.

```typescript
// tokens.cjs - BEFORE
'medless-success-bg': '#D1FAE5',        // Helles Grün
'medless-success-text': '#065F46',      // Dunkelgrün
'medless-success-border': '#00C39A',    // Bright Green

'medless-warning-bg': '#FEF3C7',        // Helles Gelb
'medless-warning-text': '#92400E',      // Dunkelbraun
'medless-warning-border': '#F59E0B',    // Orange

'medless-danger-bg': '#FEE2E2',         // Helles Rot
'medless-danger-text': '#991B1B',       // Dunkelrot
'medless-danger-border': '#DC2626',     // Rot

'medless-info-bg': '#F0F9FF',           // Helles Blau
'medless-info-text': '#1e40af',         // Dunkelblau
'medless-info-border': '#0284C7',       // Blau

// tokens.cjs - AFTER (Beispiel: Gedämpftere Töne)
'medless-success-bg': '#DCFCE7',        // Softer Green
'medless-success-text': '#166534',      // Dark Green
'medless-success-border': '#22C55E',    // Green

'medless-warning-bg': '#FEF9C3',        // Softer Yellow
'medless-warning-text': '#854D0E',      // Dark Brown
'medless-warning-border': '#EAB308',    // Yellow

'medless-danger-bg': '#FECACA',         // Softer Red
'medless-danger-text': '#991B1B',       // Dark Red
'medless-danger-border': '#EF4444',     // Red

'medless-info-bg': '#DBEAFE',           // Softer Blue
'medless-info-text': '#1E40AF',         // Dark Blue
'medless-info-border': '#3B82F6',       // Blue
```

**Betroffene UI-Elemente:**
- Alert-Boxen (Reports)
- Form Validation
- Toasts/Notifications
- Status-Badges

**Risiko:** 🟡 MITTEL - Semantik muss klar bleiben (Rot = Danger, Grün = Success)

**⚠️ EMPFEHLUNG:** Nur Sättigung/Helligkeit ändern, nicht den Farbton (Hue)

---

### 🔒 TOKENS DIE NICHT GEÄNDERT WERDEN SOLLTEN (Semantisch Stabil)

Diese Token-**Namen** sind semantisch stabil. Hex-Werte können sich ändern, aber Namen bleiben.

#### **Semantic Token Names (12)**
```typescript
// ✅ Namen bleiben IMMER
medless-success-bg
medless-success-text
medless-success-border

medless-warning-bg
medless-warning-text
medless-warning-border

medless-danger-bg
medless-danger-text
medless-danger-border

medless-info-bg
medless-info-text
medless-info-border
```

**Grund:** Diese Namen sind im Code fest verdrahtet via `getReportStyles()`. Umbenennung bricht Reports.

#### **Gray-Scale Numbers (10)**
```typescript
// ✅ Namen bleiben IMMER (50-900 Scale)
medless-gray-50
medless-gray-100
medless-gray-200
medless-gray-300
medless-gray-400
medless-gray-500
medless-gray-600
medless-gray-700
medless-gray-800
medless-gray-900
```

**Grund:** Numerische Scale ist Standard (Tailwind, Material). Umbenennung verwirrt Developer.

---

### ⚠️ ÄNDERUNGEN MIT HOHEM RISIKO

#### **1. Gray-Scale komplett neu definieren**

**Risiko:** 🔴 SEHR HOCH

**Warum:**
- 10 Tokens ändern sich gleichzeitig
- Borders, Tables, Dividers nutzen alle diese Tokens
- Kontrast-Verhältnisse zwischen Shades müssen stimmen
- PDF-Reports nutzen Grays extensiv

**Empfehlung:**
- Nur wenn unvermeidbar (z.B. Rebrand von Cool → Warm Grays)
- Vorher Kontrast-Matrix erstellen (Gray-200 zu Gray-800, etc.)
- Inkrementell testen (erst 2-3 Shades, dann Rest)

---

#### **2. Text-Primary Farbe drastisch ändern**

**Risiko:** 🔴 HOCH

**Warum:**
- Betrifft ALLE Texte im System
- WCAG-Kontrast zu allen Backgrounds muss neu geprüft werden
- Kann unleserlich werden wenn zu hell oder zu farbig

**Empfehlung:**
- Text-Primary sollte immer dunkel sein (Lightness < 20%)
- Kontrast zu `medless-bg-ultra-light` muss mindestens 7:1 sein (AAA)
- Tool: https://contrast-ratio.com

---

#### **3. Semantic Colors umbenennen**

**Risiko:** 🔴 KRITISCH - NICHT TUN!

**Warum:**
- Report-Templates nutzen feste Namen (`S.successBg`, `S.dangerText`)
- Umbenennung bricht PDF-Generierung
- Code-Suche nach alten Namen findet nichts mehr

**Empfehlung:**
- **NIEMALS umbenennen**
- Nur Hex-Werte ändern

---

### 📋 REDESIGN-CHECKLIST

#### **PHASE 1: Vorbereitung**
- [ ] Neues Design als Hex-Werte dokumentieren
- [ ] Kontrast-Matrix erstellen (Text zu Background)
- [ ] Gray-Scale Abstufungen visuell prüfen
- [ ] Semantic Colors auf Semantik prüfen (Rot = Danger?)

#### **PHASE 2: Token-Änderungen**
- [ ] `medless-primary` (3 Tokens)
- [ ] `medless-bg-*` (4 Tokens)
- [ ] `medless-text-*` (3 Tokens)
- [ ] `medless-gray-*` (10 Tokens) - Optional
- [ ] Semantic Colors (12 Tokens) - Optional

#### **PHASE 3: Synchronisation**
- [ ] `tokens.cjs` aktualisiert
- [ ] `index.ts` mit identischen Werten aktualisiert
- [ ] Kommentare überprüft (Zweck, nicht Hex)

#### **PHASE 4: Testing**
- [ ] `npm run build` erfolgreich
- [ ] Wizard UI visuell prüfen
- [ ] Patient PDF generieren
- [ ] Doctor PDF generieren
- [ ] Kontrast-Ratios messen (WCAG AA)

#### **PHASE 5: Deployment**
- [ ] Git Commit
- [ ] Git Push
- [ ] `npx wrangler pages deploy dist --project-name medless`
- [ ] Production URL testen

---

### 🎓 REDESIGN-SIMULATION (Trockenlauf)

**Szenario:** Medless bekommt neues Design mit wärmeren Tönen.

**Änderungen:**

1. **Brand Identity (3 Tokens):**
   - Primary: `#2FB585` → `#0066CC` (Blau statt Grün)
   
2. **Backgrounds (4 Tokens):**
   - Ultra-Light: `#FAFEFB` → `#FAFAF9` (Warmes Off-White)
   - Light: `#F4FBF7` → `#F5F5F4` (Warm Gray)
   - Card: `#E7F8EF` → `#FAFAFA` (Neutral White)
   - Card-Hover: `#D4F1E3` → `#F0F0F0` (Light Gray)

3. **Text Colors (3 Tokens):**
   - Primary: `#1B2A36` → `#1A1A1A` (Neutrales Schwarz)
   - Secondary: `#5E6A71` → `#525252` (Warm Gray)
   - Tertiary: `#94A3B8` → `#A3A3A3` (Light Warm Gray)

4. **Grays (10 Tokens):**
   - Komplett auf Warm-Grays umstellen (Tailwind Stone Scale)

5. **Semantic Colors (12 Tokens):**
   - Nur Sättigung reduzieren (softer Tones)

**Geschätzter Aufwand:**
- Token-Änderungen: 30 Minuten
- TypeScript-Sync: 10 Minuten
- Testing: 20 Minuten
- **Total: ~60 Minuten**

**Risiken:**
- Gray-Scale Änderung: Table-Borders könnten zu hell/dunkel werden
- Text-Primary Änderung: Kontrast muss geprüft werden
- Semantic Colors: Danger-Rot muss erkennbar rot bleiben

**Mitigation:**
- Kontrast-Tool nutzen
- Schrittweise testen (erst 5 Tokens, dann Rest)
- Rollback-Plan (Git Revert)

---

**Last Updated:** 2025-12-14  
**Owner:** Design System Team
