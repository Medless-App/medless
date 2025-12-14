# TOKEN GOVERNANCE

## Regeln für Token-Management

### 1. WANN EIN NEUER TOKEN ANGELEGT WERDEN DARF

✅ **Erlaubt:**
- **Neue semantische Bedeutung**: Token repräsentiert einen neuen Use Case (z.B. `medless-critical-bg` für kritische Alarme)
- **Neue Brand-Variante**: Offizielle Designvorgabe erfordert neue Farbe (z.B. `medless-secondary` als zweite Markenfarbe)
- **Neue funktionale Kategorie**: Komplett neue Komponenten-Familie (z.B. `medless-chart-*` für Datenvisualisierung)
- **Scale-Erweiterung**: Bestehende Scale braucht mehr Abstufungen (z.B. `medless-gray-950` zwischen `gray-900` und pure black)

### 2. WANN KEIN NEUER TOKEN ANGELEGT WERDEN DARF

❌ **Verboten:**
- **Duplikat-Semantik**: `medless-text-body` wenn `medless-text-primary` bereits denselben Zweck erfüllt
- **Use-Case-spezifisch**: `medless-button-primary-hover-active-disabled` → Nutze Modifier-Pattern oder State-Logik
- **One-off-Farben**: Einmalige Hex-Werte ohne Wiederverwendung → Nutze vorhandenen Token oder evaluiere echten Bedarf
- **Component-spezifisch**: `medless-navbar-link-color` → Nutze `medless-text-secondary` oder generische Tokens
- **Layout-spezifisch**: `medless-padding-form-input` → Nutze generische Spacing-Scale (`spacing.4`, `spacing.6`)

### 3. TOKEN-KATEGORIEN

#### **A) BRAND TOKENS** (markenspezifisch, ändern sich bei Redesign)
```typescript
medless-primary              // Hauptmarkenfarbe
medless-primary-dark         // Dunklere Variante
medless-primary-light        // Hellere Variante
medless-bg-ultra-light       // Brand-spezifischer Background
medless-bg-light             // Brand-spezifischer Background
medless-bg-card              // Card-Background (brand-tint)
medless-text-primary         // Haupttextfarbe (brand-aligned)
medless-border-primary       // Primärer Border (brand-color)
```

**Charakteristik:**
- Ändern sich komplett bei Rebrand
- Definieren visuelle Identität
- Sollten in Anzahl limitiert sein (max. 10-15 Brand Tokens)

#### **B) SEMANTIC TOKENS** (funktional, semantisch stabil)
```typescript
medless-success-bg           // Erfolg-Hintergrund (grün)
medless-success-text         // Erfolg-Text (dunkelgrün)
medless-success-border       // Erfolg-Border (hellgrün)

medless-warning-bg           // Warnung-Hintergrund (gelb)
medless-warning-text         // Warnung-Text (braun)
medless-warning-border       // Warnung-Border (orange)

medless-danger-bg            // Fehler-Hintergrund (rot)
medless-danger-text          // Fehler-Text (dunkelrot)
medless-danger-border        // Fehler-Border (rot)

medless-info-bg              // Info-Hintergrund (blau)
medless-info-text            // Info-Text (dunkelblau)
medless-info-border          // Info-Border (hellblau)
```

**Charakteristik:**
- Namen bleiben stabil (Semantik ändert sich nicht)
- Hex-Werte ändern sich bei Redesign (andere Farbtöne)
- Immer in Gruppen (bg, text, border)
- Folgen konsistentem Naming-Pattern

#### **C) UTILITY/NEUTRAL TOKENS** (funktional, technisch)
```typescript
medless-gray-50              // Ultra light gray (backgrounds)
medless-gray-100             // Very light gray (alternating rows)
medless-gray-200             // Light gray (borders)
medless-gray-300             // Medium light gray (dividers)
medless-gray-400             // Gray (muted text)
medless-gray-500             // Medium gray (secondary text)
medless-gray-600             // Dark gray (body text)
medless-gray-700             // Very dark gray (headings)
medless-gray-800             // Almost black (strong headings)
medless-gray-900             // Pure black (emphasis)

medless-text-secondary       // Sekundärtext (nicht brand-gefärbt)
medless-text-tertiary        // Tertiärtext (deemphasized)
medless-border-light         // Standard-Border (neutral)
```

**Charakteristik:**
- Technisch/funktional, nicht semantisch
- Gray-Scale sollte 10 Abstufungen nicht überschreiten
- Ändern sich wahrscheinlich bei Redesign (andere Tonalität)

### 4. NAMING CONVENTIONS

**Pattern:**
```
{prefix}-{category}-{variant}
```

**Beispiele:**
```typescript
medless-success-bg          // ✅ Korrekt
medless-successBackground   // ❌ Falsch (kein camelCase)
success-bg                  // ❌ Falsch (prefix fehlt)
medless-green-light         // ❌ Falsch (Farbe statt Semantik)
```

**Scale-Naming (Neutral Tokens):**
```
{prefix}-{category}-{number}
```

**Beispiele:**
```typescript
medless-gray-50            // ✅ Korrekt (50-900 Scale)
medless-spacing-4          // ✅ Korrekt (numerische Scale)
medless-gray-light         // ❌ Falsch (keine numerische Scale)
```

### 5. TOKEN-SPRAWL PREVENTION

**Warnsignale für Token-Sprawl:**
- Mehr als 50 Color-Tokens
- Mehr als 3 Tokens für denselben visuellen Zweck
- Token mit Use-Case im Namen (`button-`, `navbar-`, `form-`)
- Semantisch unklare Namen (`medless-color-1`, `medless-blue-ish`)

**Gegen-Maßnahmen:**
1. **Review bei Token-Creation**: Dokumentiere Zweck in TOKEN_GOVERNANCE.md
2. **Quarterly Cleanup**: Ungenutzte Tokens identifizieren und entfernen
3. **Alias-Pattern**: Statt neuem Token, aliasiere vorhandenen (`const buttonBg = tokens.colors['medless-primary']`)

### 6. ALIAS vs. NEW TOKEN

**Verwende Alias (kein neuer Token):**
```typescript
// In Component-Code (nicht in tokens.cjs)
const buttonPrimaryBg = S.primary;
const buttonSecondaryBg = S.gray700;
```

**Erstelle neuen Token:**
```typescript
// In tokens.cjs
'medless-accent': '#FF6B35'  // Neue offizielle Akzentfarbe
```

**Regel:** Wenn Farbe in mehr als 3 Komponenten identisch genutzt wird UND semantisch eigenständig ist → Neuer Token. Sonst Alias.

### 7. DEPRECATED TOKENS

Bei Token-Cleanup:
```typescript
// tokens.cjs
const colors = {
  // @deprecated Use medless-text-primary instead
  'medless-heading-text': '#1B2A36',  // TODO: Remove in v2.0
  
  'medless-text-primary': '#1B2A36',  // ✅ Preferred
};
```

Migration-Pfad dokumentieren, dann Token in nächster Major-Version entfernen.

### 8. DOCUMENTATION REQUIREMENT

**Jeder neue Token erfordert:**
```typescript
// tokens.cjs
const colors = {
  // Primary action backgrounds, CTAs, brand highlights
  'medless-primary': '#2FB585',
  
  // Success states in forms, reports, notifications
  'medless-success-bg': '#D1FAE5',
};
```

Kommentar erklärt: **Zweck** (nicht Aussehen).

### 9. REDESIGN-IMMUTABLE TOKENS

**Diese Token-Namen dürfen NIEMALS umbenannt werden:**
- Alle Semantic Tokens (`success-*`, `warning-*`, `danger-*`, `info-*`)
- Gray-Scale (`gray-50` bis `gray-900`)
- Core Utility (`text-secondary`, `text-tertiary`, `border-light`)

**Nur Hex-Werte ändern, Namen bleiben!**

### 10. TOKEN APPROVAL PROCESS

**Vor Token-Creation:**
1. Check: Existiert bereits ein Token für diesen Zweck?
2. Check: Ist das ein echtes Pattern (3+ Nutzungen)?
3. Check: Passt der Name zum Schema?
4. Check: Ist die Semantik klar und stabil?

**Wenn alle 4 Checks ✅ → Token erstellen**  
**Wenn 1+ Checks ❌ → Nutze vorhandenen Token oder Inline-Value**

---

## PRAKTISCHE BEISPIELE

### ❌ SCHLECHTE TOKEN-ENTSCHEIDUNGEN

```typescript
// ❌ Zu spezifisch
'medless-navbar-link-hover-underline-color': '#2FB585',

// ❌ Duplikat
'medless-body-text': '#1B2A36',  // Wenn medless-text-primary existiert

// ❌ One-off
'medless-promo-banner-bg': '#FFE5E5',  // Nur für 1 Promotion

// ❌ Layout-spezifisch
'medless-form-input-padding': '12px',  // Nutze spacing-3
```

### ✅ GUTE TOKEN-ENTSCHEIDUNGEN

```typescript
// ✅ Semantisch klar
'medless-success-bg': '#D1FAE5',

// ✅ Wiederverwendbar
'medless-primary': '#2FB585',

// ✅ Scale-basiert
'medless-gray-300': '#d1d5db',

// ✅ Funktional
'medless-text-tertiary': '#94A3B8',
```

---

## CHECKLISTE: NEUER TOKEN

- [ ] Token wird in 3+ Komponenten genutzt
- [ ] Semantik ist klar und dokumentiert
- [ ] Name folgt Naming Convention
- [ ] Keine Duplikate vorhanden
- [ ] Kategorie (Brand/Semantic/Utility) definiert
- [ ] Kommentar mit Zweck-Beschreibung
- [ ] Bei Semantic: Vollständige Gruppe (bg, text, border)
- [ ] Eintrag in dieser Governance-Datei

---

**Last Updated:** 2025-12-14  
**Owner:** Design System Team
